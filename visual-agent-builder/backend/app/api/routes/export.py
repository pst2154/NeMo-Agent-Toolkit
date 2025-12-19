"""Export API routes."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
import yaml

router = APIRouter()


@router.post("/generate")
async def generate_workflow_yaml(workflow_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate YAML from workflow data.
    
    Args:
        workflow_data: Workflow data from the canvas (nodes and edges)
        
    Returns:
        Generated YAML content
        
    Raises:
        HTTPException: If workflow data is invalid
    """
    try:
        nodes = workflow_data.get("nodes", [])
        edges = workflow_data.get("edges", [])
        workflow_name = workflow_data.get("name", "Untitled Workflow")
        
        if not nodes:
            raise HTTPException(
                status_code=400,
                detail="Workflow must contain at least one component"
            )
        
        # Debug: Log what we received
        print(f"DEBUG: Received {len(nodes)} nodes")
        for node in nodes:
            node_data = node.get("data", {})
            print(f"  Node: {node.get('id')} - Type: {node_data.get('componentType')} - Name: {node_data.get('name')} - Label: {node_data.get('label')}")
        
        # Build configuration from nodes
        config = {
            "general": {
                "use_uvloop": True
            }
        }
        
        # Separate nodes by type
        functions = {}
        llms = {}
        agents = {}
        
        for node in nodes:
            node_data = node.get("data", {})
            component_type = node_data.get("componentType")
            node_config = node_data.get("config", {})
            node_id = node.get("id")
            
            if component_type == "function":
                # Get the actual component name (should match NAT function names)
                func_name = node_data.get("name") or node_data.get("label", "").lower().replace(" ", "_")
                if not func_name:
                    func_name = node_id
                
                # Validate that it's a known NAT function
                valid_functions = [
                    "current_datetime", 
                    "code_execution",
                    "tavily_internet_search",
                    "wiki_search"
                ]
                if func_name not in valid_functions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid function '{func_name}'. Valid functions are: {', '.join(valid_functions)}"
                    )
                
                # Use the function name as the _type (NAT will resolve it)
                func_cfg = {
                    "_type": func_name,
                    **node_config
                }
                
                # Special handling for code_execution - use local sandbox (requires Docker)
                if func_name == "code_execution":
                    func_cfg["sandbox_type"] = "local"
                
                functions[func_name] = func_cfg
                
            elif component_type == "llm":
                llm_name = node_data.get("label", "").lower().replace(" ", "_")
                if not llm_name:
                    llm_name = "llm"
                    
                llm_type = node_config.get("provider", "nim")
                
                # Workaround: Use 'openai' type for NIM since it's OpenAI-compatible
                # and has better LangChain support in NAT
                if llm_type == "nim":
                    llm_type = "openai"
                
                # Build LLM configuration
                llm_cfg = {
                    "_type": llm_type,
                    "model_name": node_config.get("model", "nvidia/nemotron-3-nano-30b-a3b"),
                    "base_url": node_config.get("base_url", "https://integrate.api.nvidia.com/v1"),
                    "api_key": node_config.get("api_key", "${NVIDIA_API_KEY}"),
                    "temperature": float(node_config.get("temperature", 0.7)),
                    "max_tokens": int(node_config.get("max_tokens", 1024)),
                    "top_p": float(node_config.get("top_p", 1.0)),
                }
                
                # Add optional parameters if set
                if node_config.get("stream"):
                    llm_cfg["stream"] = True
                    
                if node_config.get("frequency_penalty") != 0:
                    llm_cfg["frequency_penalty"] = float(node_config.get("frequency_penalty", 0))
                    
                if node_config.get("presence_penalty") != 0:
                    llm_cfg["presence_penalty"] = float(node_config.get("presence_penalty", 0))
                
                # NOTE: chat_template_kwargs is not supported by NVIDIA's OpenAI-compatible API
                # Thinking mode cannot be controlled through this interface
                # The model will use its default behavior
                
                llms[llm_name] = llm_cfg
                
            elif component_type == "agent":
                agent_name = "workflow"
                agent_type = node_config.get("agent_type", "react")
                
                # Get tool names from connected function nodes
                tool_names = []
                for func_name in functions.keys():
                    tool_names.append(func_name)
                
                # Get LLM name
                llm_name = list(llms.keys())[0] if llms else "llm"
                
                # Get or create default system prompt based on agent type
                default_prompt = node_config.get("system_prompt")
                if not default_prompt:
                    if agent_type == "react":
                        default_prompt = """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format EXACTLY (do NOT use <think> tags):

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, must be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

IMPORTANT: 
- Always use a tool to answer questions. Do not answer directly without using tools.
- Do NOT use <think> tags or any XML-style tags in your response.
- Follow the Thought/Action/Action Input format exactly.

Begin!"""
                    else:
                        default_prompt = "You are a helpful AI assistant."
                
                agents[agent_name] = {
                    "_type": f"{agent_type}_agent",
                    "tool_names": tool_names,
                    "llm_name": llm_name,
                    "system_prompt": default_prompt,
                    "verbose": True,
                    "max_iterations": int(node_config.get("max_iterations", 10)),
                    "parse_agent_response_max_retries": 3
                }
        
        # Add to config
        if functions:
            config["functions"] = functions
        if llms:
            config["llms"] = llms
        
        # Handle workflow structure
        if agents:
            # Use agent as workflow
            config["workflow"] = agents.get("workflow", {})
        elif llms and not functions:
            # LLM-only workflow - use chat_completion (simple inference, no agents/tools)
            llm_name = list(llms.keys())[0]
            config["workflow"] = {
                "_type": "chat_completion",
                "llm_name": llm_name
            }
        elif llms and functions:
            # LLM + functions but no agent - create default react agent
            llm_name = list(llms.keys())[0]
            tool_names = list(functions.keys())
            config["workflow"] = {
                "_type": "react_agent",
                "llm_name": llm_name,
                "tool_names": tool_names,
                "system_prompt": """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format EXACTLY (do NOT use <think> tags):

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, must be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

IMPORTANT: 
- Always use a tool to answer questions. Do not answer directly without using tools.
- Do NOT use <think> tags or any XML-style tags in your response.
- Follow the Thought/Action/Action Input format exactly.

Begin!""",
                "verbose": True,
                "max_iterations": 10,
                "parse_agent_response_max_retries": 3
            }
        else:
            # Need at least an LLM
            raise HTTPException(
                status_code=400,
                detail="Workflow must contain at least one LLM component."
            )
    
        # Generate YAML
        yaml_content = _generate_yaml_with_header(config, workflow_name)
        
        return {
            "content": yaml_content,
            "format": "yaml",
            "filename": f"{workflow_name.replace(' ', '_')}.yml"
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any other errors and return a helpful message
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate workflow YAML: {str(e)}"
        )


@router.get("/{workflow_id}")
async def export_workflow(
    workflow_id: str,
    format: str = "yaml"
) -> Dict[str, Any]:
    """Export workflow to specified format.
    
    Args:
        workflow_id: ID of the workflow to export
        format: Export format (yaml or json)
        
    Returns:
        Dictionary with exported content
    """
    # TODO: Get workflow from database
    # For now, return a sample workflow
    
    sample_workflow = {
        "functions": {
            "calculator_multiply": {
                "_type": "calculator_multiply",
                "description": "Multiply two numbers together"
            },
            "calculator_add": {
                "_type": "calculator_add",
                "description": "Add two numbers together"
            }
        },
        "llms": {
            "nim_llm": {
                "_type": "nim",
                "model_name": "meta/llama-3.1-70b-instruct",
                "base_url": "https://integrate.api.nvidia.com/v1",
                "temperature": 0.0,
                "max_tokens": 1024
            }
        },
        "workflow": {
            "_type": "react_agent",
            "tool_names": [
                "calculator_multiply",
                "calculator_add"
            ],
            "llm_name": "nim_llm",
            "verbose": True,
            "retry_parsing_errors": True,
            "max_retries": 3
        }
    }
    
    if format.lower() == "yaml":
        # Generate YAML with proper formatting
        yaml_content = _generate_yaml_with_header(sample_workflow)
        return {
            "content": yaml_content,
            "format": "yaml",
            "filename": f"workflow_{workflow_id}.yml"
        }
    elif format.lower() == "json":
        import json
        return {
            "content": json.dumps(sample_workflow, indent=2),
            "format": "json",
            "filename": f"workflow_{workflow_id}.json"
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")


def _generate_yaml_with_header(config: Dict[str, Any], workflow_name: str = "Workflow") -> str:
    """Generate YAML with proper header and formatting.
    
    Args:
        config: Configuration dictionary to convert
        
    Returns:
        Formatted YAML string with header
    """
    header = """# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Generated by NVIDIA NeMo Agent toolkit Visual Builder
# This configuration file defines an AI agent workflow

"""
    
    # Convert to YAML
    yaml_content = yaml.dump(config, default_flow_style=False, sort_keys=False, indent=2)
    
    return header + yaml_content
