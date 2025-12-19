"""
NeMo-Agent-Toolkit integration service.

This module provides services for integrating with the NeMo-Agent-Toolkit,
including component discovery, configuration validation, and YAML generation.
"""

import asyncio
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml
from pydantic import BaseModel, ValidationError

from app.models.workflow import (
    ComponentInfo,
    ComponentType,
    ValidationResult,
    Workflow,
    WorkflowType,
)


class NeMoComponentDiscovery:
    """Service for discovering available components in NeMo-Agent-Toolkit."""

    def __init__(self, nemo_path: Optional[str] = None):
        """Initialize the discovery service.

        Args:
            nemo_path: Path to NeMo-Agent-Toolkit installation. If None, uses system PATH.
        """
        self.nemo_path = nemo_path
        self._components_cache: Optional[List[ComponentInfo]] = None

    async def discover_components(self) -> List[ComponentInfo]:
        """Discover all available components in NeMo-Agent-Toolkit.

        Returns:
            List of available component information.
        """
        if self._components_cache is not None:
            return self._components_cache

        try:
            # Run 'aiq info components' to get component information
            result = await self._run_aiq_command(["info", "components"])

            if result.returncode != 0:
                raise RuntimeError(f"Failed to discover components: {result.stderr}")

            # Parse the output to extract component information
            components = self._parse_component_info(result.stdout)
            self._components_cache = components
            return components

        except Exception as e:
            # Fallback to predefined component list if discovery fails
            return self._get_fallback_components()

    async def _run_aiq_command(self, args: List[str]) -> subprocess.CompletedProcess:
        """Run an AIQ command and return the result.

        Args:
            args: Command arguments to pass to 'aiq'

        Returns:
            Completed process result.
        """
        cmd = ["aiq"] + args

        if self.nemo_path:
            # If nemo_path is specified, run in that environment
            cmd = [sys.executable, "-m", "aiq"] + args
            env = {"PYTHONPATH": self.nemo_path}
        else:
            env = None

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )

        stdout, stderr = await process.communicate()

        return subprocess.CompletedProcess(
            cmd,
            process.returncode,
            stdout.decode(),
            stderr.decode()
        )

    def _parse_component_info(self, output: str) -> List[ComponentInfo]:
        """Parse the output of 'aiq info components' into ComponentInfo objects.

        Args:
            output: Raw output from the command

        Returns:
            List of parsed component information.
        """
        components = []
        lines = output.strip().split('\n')

        current_component = None
        current_section = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Look for component headers (usually in format: "Component Name: description")
            if ':' in line and not line.startswith(' '):
                parts = line.split(':', 1)
                if len(parts) == 2:
                    component_name = parts[0].strip()
                    description = parts[1].strip()

                    # Determine component type from name or description
                    component_type = self._infer_component_type(component_name, description)

                    current_component = ComponentInfo(
                        component_type=component_type,
                        component_name=component_name,
                        display_name=component_name.replace('_', ' ').title(),
                        description=description,
                        category=self._get_component_category(component_type),
                        schema={},
                        required_fields=[],
                        optional_fields=[],
                        examples=[]
                    )
                    components.append(current_component)

            # Parse configuration details
            elif current_component and line.startswith('  '):
                # This is configuration information
                self._parse_configuration_line(line, current_component)

        return components

    def _infer_component_type(self, name: str, description: str) -> ComponentType:
        """Infer the component type from name and description.

        Args:
            name: Component name
            description: Component description

        Returns:
            Inferred component type.
        """
        name_lower = name.lower()
        desc_lower = description.lower()

        # Check for LLM indicators
        if any(keyword in name_lower or keyword in desc_lower
               for keyword in ['llm', 'model', 'gpt', 'llama', 'nim', 'openai']):
            return ComponentType.LLM

        # Check for embedder indicators
        if any(keyword in name_lower or keyword in desc_lower
               for keyword in ['embed', 'embedding', 'vector']):
            return ComponentType.EMBEDDER

        # Check for memory indicators
        if any(keyword in name_lower or keyword in desc_lower
               for keyword in ['memory', 'store', 'cache']):
            return ComponentType.MEMORY

        # Check for retriever indicators
        if any(keyword in name_lower or keyword in desc_lower
               for keyword in ['retrieve', 'search', 'query']):
            return ComponentType.RETRIEVER

        # Check for workflow indicators
        if any(keyword in name_lower or keyword in desc_lower
               for keyword in ['agent', 'workflow', 'react', 'rewoo']):
            return ComponentType.WORKFLOW

        # Default to function
        return ComponentType.FUNCTION

    def _get_component_category(self, component_type: ComponentType) -> str:
        """Get the category for a component type.

        Args:
            component_type: Type of component

        Returns:
            Category string.
        """
        categories = {
            ComponentType.FUNCTION: "Tools",
            ComponentType.LLM: "Language Models",
            ComponentType.EMBEDDER: "Embeddings",
            ComponentType.MEMORY: "Memory",
            ComponentType.RETRIEVER: "Retrieval",
            ComponentType.WORKFLOW: "Workflows"
        }
        return categories.get(component_type, "Other")

    def _parse_configuration_line(self, line: str, component: ComponentInfo):
        """Parse a configuration line and update component information.

        Args:
            line: Configuration line to parse
            component: Component to update
        """
        # Remove leading spaces
        line = line.strip()

        # Look for field definitions
        if ':' in line:
            field_name, field_info = line.split(':', 1)
            field_name = field_name.strip()
            field_info = field_info.strip()

            # Determine if field is required or optional
            if 'required' in field_info.lower() or 'mandatory' in field_info.lower():
                component.required_fields.append(field_name)
            else:
                component.optional_fields.append(field_name)

    def _get_fallback_components(self) -> List[ComponentInfo]:
        """Get a fallback list of components if discovery fails.

        Returns:
            List of basic component information.
        """
        return [
            ComponentInfo(
                component_type=ComponentType.FUNCTION,
                component_name="calculator_multiply",
                display_name="Calculator Multiply",
                description="Multiply two numbers",
                category="Tools",
                required_fields=["a", "b"],
                optional_fields=[]
            ),
            ComponentInfo(
                component_type=ComponentType.FUNCTION,
                component_name="current_datetime",
                display_name="Current DateTime",
                description="Get current date and time",
                category="Tools",
                required_fields=[],
                optional_fields=[]
            ),
            ComponentInfo(
                component_type=ComponentType.LLM,
                component_name="nim_llm",
                display_name="NIM LLM",
                description="NVIDIA NIM hosted language model",
                category="Language Models",
                required_fields=["model_name"],
                optional_fields=["temperature", "max_tokens"]
            ),
            ComponentInfo(
                component_type=ComponentType.WORKFLOW,
                component_name="react_agent",
                display_name="ReAct Agent",
                description="Reasoning and Acting agent",
                category="Workflows",
                required_fields=["tool_names", "llm_name"],
                optional_fields=["verbose", "retry_parsing_errors", "max_retries"]
            )
        ]


class NeMoConfigurationValidator:
    """Service for validating NeMo-Agent-Toolkit configurations."""

    def __init__(self, nemo_path: Optional[str] = None):
        """Initialize the validator.

        Args:
            nemo_path: Path to NeMo-Agent-Toolkit installation.
        """
        self.nemo_path = nemo_path

    async def validate_workflow(self, workflow: Workflow) -> ValidationResult:
        """Validate a workflow configuration.

        Args:
            workflow: Workflow to validate

        Returns:
            Validation result with errors and warnings.
        """
        result = ValidationResult(is_valid=True)

        # Validate workflow structure
        self._validate_workflow_structure(workflow, result)

        # Validate components
        self._validate_components(workflow, result)

        # Validate connections
        self._validate_connections(workflow, result)

        # Validate workflow type specific rules
        self._validate_workflow_type_rules(workflow, result)

        # Try to generate YAML to catch any configuration errors
        try:
            yaml_generator = NeMoYAMLGenerator()
            yaml_content = await yaml_generator.generate_yaml(workflow)
            # If we can generate YAML, the configuration is valid
            result.is_valid = len(result.errors) == 0
        except Exception as e:
            result.errors.append(f"Configuration error: {str(e)}")
            result.is_valid = False

        return result

    def _validate_workflow_structure(self, workflow: Workflow, result: ValidationResult):
        """Validate basic workflow structure.

        Args:
            workflow: Workflow to validate
            result: Validation result to update
        """
        if not workflow.metadata.name:
            result.errors.append("Workflow name is required")

        if not workflow.components:
            result.errors.append("Workflow must have at least one component")

        # Check for duplicate component names
        component_names = [comp.name for comp in workflow.components]
        if len(component_names) != len(set(component_names)):
            result.errors.append("Component names must be unique")

    def _validate_components(self, workflow: Workflow, result: ValidationResult):
        """Validate individual components.

        Args:
            workflow: Workflow to validate
            result: Validation result to update
        """
        for component in workflow.components:
            component_errors = []

            # Validate component name
            if not component.name or not component.name.strip():
                component_errors.append("Component name is required")

            # Validate component type
            if not component.component_type:
                component_errors.append("Component type is required")

            # Validate component name (implementation)
            if not component.component_name:
                component_errors.append("Component implementation name is required")

            if component_errors:
                result.component_errors[component.name] = component_errors

    def _validate_connections(self, workflow: Workflow, result: ValidationResult):
        """Validate connections between components.

        Args:
            workflow: Workflow to validate
            result: Validation result to update
        """
        component_names = {comp.name for comp in workflow.components}

        for connection in workflow.connections:
            connection_errors = []

            # Validate source component exists
            if connection.source_component not in component_names:
                connection_errors.append(f"Source component '{connection.source_component}' not found")

            # Validate target component exists
            if connection.target_component not in component_names:
                connection_errors.append(f"Target component '{connection.target_component}' not found")

            # Check for self-connections
            if connection.source_component == connection.target_component:
                connection_errors.append("Component cannot connect to itself")

            if connection_errors:
                result.connection_errors[connection.id] = connection_errors

    def _validate_workflow_type_rules(self, workflow: Workflow, result: ValidationResult):
        """Validate workflow type specific rules.

        Args:
            workflow: Workflow to validate
            result: Validation result to update
        """
        if workflow.workflow_type == WorkflowType.REACT_AGENT:
            self._validate_react_agent_rules(workflow, result)
        elif workflow.workflow_type == WorkflowType.TOOL_CALLING_AGENT:
            self._validate_tool_calling_agent_rules(workflow, result)
        elif workflow.workflow_type == WorkflowType.REWOO_AGENT:
            self._validate_rewoo_agent_rules(workflow, result)

    def _validate_react_agent_rules(self, workflow: Workflow, result: ValidationResult):
        """Validate ReAct agent specific rules.

        Args:
            workflow: Workflow to validate
            result: Validation result to update
        """
        # ReAct agent needs at least one function and one LLM
        functions = [comp for comp in workflow.components if comp.component_type == ComponentType.FUNCTION]
        llms = [comp for comp in workflow.components if comp.component_type == ComponentType.LLM]

        if not functions:
            result.errors.append("ReAct agent requires at least one function")

        if not llms:
            result.errors.append("ReAct agent requires at least one LLM")

    def _validate_tool_calling_agent_rules(self, workflow: Workflow, result: ValidationResult):
        """Validate Tool Calling agent specific rules.

        Args:
            workflow: Workflow to validate
            result: Validation result to update
        """
        # Similar to ReAct agent
        functions = [comp for comp in workflow.components if comp.component_type == ComponentType.FUNCTION]
        llms = [comp for comp in workflow.components if comp.component_type == ComponentType.LLM]

        if not functions:
            result.errors.append("Tool Calling agent requires at least one function")

        if not llms:
            result.errors.append("Tool Calling agent requires at least one LLM")

    def _validate_rewoo_agent_rules(self, workflow: Workflow, result: ValidationResult):
        """Validate ReWOO agent specific rules.

        Args:
            workflow: Workflow to validate
            result: Validation result to update
        """
        # ReWOO agent needs at least one function and one LLM
        functions = [comp for comp in workflow.components if comp.component_type == ComponentType.FUNCTION]
        llms = [comp for comp in workflow.components if comp.component_type == ComponentType.LLM]

        if not functions:
            result.errors.append("ReWOO agent requires at least one function")

        if not llms:
            result.errors.append("ReWOO agent requires at least one LLM")


class NeMoYAMLGenerator:
    """Service for generating NeMo-Agent-Toolkit YAML configurations."""

    async def generate_yaml(self, workflow: Workflow) -> str:
        """Generate YAML configuration from workflow.

        Args:
            workflow: Workflow to convert to YAML

        Returns:
            YAML configuration string.
        """
        config = {
            "general": {
                "use_uvloop": True
            }
        }

        # Add functions
        functions = {}
        for component in workflow.components:
            if component.component_type == ComponentType.FUNCTION:
                functions[component.name] = {
                    "_type": component.component_name,
                    **component.configuration
                }
        if functions:
            config["functions"] = functions

        # Add LLMs
        llms = {}
        for component in workflow.components:
            if component.component_type == ComponentType.LLM:
                llms[component.name] = {
                    "_type": component.component_name,
                    **component.configuration
                }
        if llms:
            config["llms"] = llms

        # Add embedders
        embedders = {}
        for component in workflow.components:
            if component.component_type == ComponentType.EMBEDDER:
                embedders[component.name] = {
                    "_type": component.component_name,
                    **component.configuration
                }
        if embedders:
            config["embedders"] = embedders

        # Add memory
        memory = {}
        for component in workflow.components:
            if component.component_type == ComponentType.MEMORY:
                memory[component.name] = {
                    "_type": component.component_name,
                    **component.configuration
                }
        if memory:
            config["memory"] = memory

        # Add retrievers
        retrievers = {}
        for component in workflow.components:
            if component.component_type == ComponentType.RETRIEVER:
                retrievers[component.name] = {
                    "_type": component.component_name,
                    **component.configuration
                }
        if retrievers:
            config["retrievers"] = retrievers

        # Add workflow configuration
        workflow_config = {
            "_type": workflow.workflow_type.value,
            **workflow.configuration
        }

        # Add tool names for agent workflows
        if workflow.workflow_type in [WorkflowType.REACT_AGENT, WorkflowType.TOOL_CALLING_AGENT, WorkflowType.REWOO_AGENT]:
            function_names = [comp.name for comp in workflow.components if comp.component_type == ComponentType.FUNCTION]
            if function_names:
                workflow_config["tool_names"] = function_names

        # Add LLM name for agent workflows
        llm_names = [comp.name for comp in workflow.components if comp.component_type == ComponentType.LLM]
        if llm_names:
            workflow_config["llm_name"] = llm_names[0]  # Use first LLM

        config["workflow"] = workflow_config

        # Generate YAML with comments
        yaml_content = self._generate_yaml_with_comments(config, workflow)

        return yaml_content

    def _generate_yaml_with_comments(self, config: Dict[str, Any], workflow: Workflow) -> str:
        """Generate YAML with helpful comments.

        Args:
            config: Configuration dictionary
            workflow: Original workflow for metadata

        Returns:
            YAML string with comments.
        """
        # Add header comment
        yaml_lines = [
            "# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.",
            "# SPDX-License-Identifier: Apache-2.0",
            "#",
            "# Licensed under the Apache License, Version 2.0 (the \"License\");",
            "# you may not use this file except in compliance with the License.",
            "# You may obtain a copy of the License at",
            "#",
            "# http://www.apache.org/licenses/LICENSE-2.0",
            "#",
            "# Unless required by applicable law or agreed to in writing, software",
            "# distributed under the License is distributed on an \"AS IS\" BASIS,",
            "# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
            "# See the License for the specific language governing permissions and",
            "# limitations under the License.",
            "",
            f"# Generated by Visual Agent Builder",
            f"# Workflow: {workflow.metadata.name}",
            f"# Description: {workflow.metadata.description or 'No description provided'}",
            f"# Created: {workflow.metadata.created_at}",
            ""
        ]

        # Convert config to YAML
        yaml_content = yaml.dump(config, default_flow_style=False, sort_keys=False, indent=2)

        # Add the YAML content
        yaml_lines.append(yaml_content)

        return "\n".join(yaml_lines)


class NeMoWorkflowTester:
    """Service for testing NeMo-Agent-Toolkit workflows."""

    def __init__(self, nemo_path: Optional[str] = None):
        """Initialize the tester.

        Args:
            nemo_path: Path to NeMo-Agent-Toolkit installation.
        """
        self.nemo_path = nemo_path
        self._active_deployments: Dict[str, Any] = {}

    async def test_workflow(self, workflow: Workflow, test_input: str, use_kb: bool = False) -> Dict[str, Any]:
        """Test a workflow with given input.

        Args:
            workflow: Workflow to test
            test_input: Input message for testing
            use_kb: Whether to use knowledge base

        Returns:
            Test result dictionary.
        """
        try:
            # Generate YAML configuration
            yaml_generator = NeMoYAMLGenerator()
            yaml_content = await yaml_generator.generate_yaml(workflow)

            # Save YAML to temporary file
            temp_config_path = Path(f"/tmp/workflow_{workflow.id}.yml")
            temp_config_path.write_text(yaml_content)

            # Run the workflow using aiq run
            result = await self._run_workflow_test(temp_config_path, test_input, use_kb)

            # Clean up
            temp_config_path.unlink(missing_ok=True)

            return result

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "output": None,
                "execution_time": None,
                "intermediate_steps": []
            }

    async def _run_workflow_test(self, config_path: Path, test_input: str, use_kb: bool) -> Dict[str, Any]:
        """Run a workflow test using aiq run.

        Args:
            config_path: Path to configuration file
            test_input: Input message
            use_kb: Whether to use knowledge base

        Returns:
            Test result dictionary.
        """
        import time
        start_time = time.time()

        try:
            # Prepare command
            cmd = ["aiq", "run", "--config_file", str(config_path)]

            # Add input
            input_data = {
                "input_message": test_input,
                "use_knowledge_base": use_kb
            }

            # Run the command
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            # Send input and wait for result
            stdout, stderr = await process.communicate(
                input=json.dumps(input_data).encode()
            )

            execution_time = time.time() - start_time

            if process.returncode == 0:
                # Parse output
                try:
                    output_data = json.loads(stdout.decode())
                    return {
                        "success": True,
                        "output": output_data.get("value", stdout.decode()),
                        "error": None,
                        "execution_time": execution_time,
                        "intermediate_steps": output_data.get("intermediate_steps", [])
                    }
                except json.JSONDecodeError:
                    return {
                        "success": True,
                        "output": stdout.decode(),
                        "error": None,
                        "execution_time": execution_time,
                        "intermediate_steps": []
                    }
            else:
                return {
                    "success": False,
                    "output": None,
                    "error": stderr.decode(),
                    "execution_time": execution_time,
                    "intermediate_steps": []
                }

        except Exception as e:
            return {
                "success": False,
                "output": None,
                "error": str(e),
                "execution_time": time.time() - start_time,
                "intermediate_steps": []
            }
