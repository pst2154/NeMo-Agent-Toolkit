"""
Data models for the Visual Agent Builder.

This module defines the Pydantic models used for workflow management,
component configuration, and data validation.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator


class ComponentType(str, Enum):
    """Enumeration of component types supported by the Visual Agent Builder."""

    FUNCTION = "function"
    LLM = "llm"
    EMBEDDER = "embedder"
    MEMORY = "memory"
    RETRIEVER = "retriever"
    WORKFLOW = "workflow"


class ConnectionType(str, Enum):
    """Enumeration of connection types between components."""

    DATA_FLOW = "data_flow"
    CONTROL_FLOW = "control_flow"
    DEPENDENCY = "dependency"


class WorkflowType(str, Enum):
    """Enumeration of workflow types supported by NeMo-Agent-Toolkit."""

    REACT_AGENT = "react_agent"
    TOOL_CALLING_AGENT = "tool_calling_agent"
    REWOO_AGENT = "rewoo_agent"
    SEMANTIC_KERNEL = "semantic_kernel"
    CUSTOM = "custom"


class ComponentPosition(BaseModel):
    """Position of a component on the canvas."""

    x: float = Field(..., description="X coordinate on the canvas")
    y: float = Field(..., description="Y coordinate on the canvas")


class ComponentConfig(BaseModel):
    """Configuration for a component in the workflow."""

    name: str = Field(..., description="Unique name for the component")
    component_type: ComponentType = Field(..., description="Type of the component")
    component_name: str = Field(..., description="Name of the specific component implementation")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Component-specific configuration")
    position: ComponentPosition = Field(..., description="Position on the canvas")
    description: Optional[str] = Field(None, description="Human-readable description")

    @validator('name')
    def validate_name(cls, v):
        """Validate component name format."""
        if not v or not v.strip():
            raise ValueError("Component name cannot be empty")
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError("Component name must be alphanumeric with underscores or hyphens only")
        return v.strip()


class Connection(BaseModel):
    """Connection between two components in the workflow."""

    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique connection ID")
    source_component: str = Field(..., description="Name of the source component")
    target_component: str = Field(..., description="Name of the target component")
    source_port: Optional[str] = Field(None, description="Source port name")
    target_port: Optional[str] = Field(None, description="Target port name")
    connection_type: ConnectionType = Field(default=ConnectionType.DATA_FLOW, description="Type of connection")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Connection-specific configuration")

    @validator('source_component', 'target_component')
    def validate_component_names(cls, v):
        """Validate component name format."""
        if not v or not v.strip():
            raise ValueError("Component name cannot be empty")
        return v.strip()


class WorkflowMetadata(BaseModel):
    """Metadata for a workflow."""

    name: str = Field(..., description="Workflow name")
    description: Optional[str] = Field(None, description="Workflow description")
    author: Optional[str] = Field(None, description="Workflow author")
    version: str = Field(default="1.0.0", description="Workflow version")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")


class Workflow(BaseModel):
    """Complete workflow definition."""

    id: UUID = Field(default_factory=uuid4, description="Unique workflow ID")
    metadata: WorkflowMetadata = Field(..., description="Workflow metadata")
    workflow_type: WorkflowType = Field(..., description="Type of workflow")
    components: List[ComponentConfig] = Field(default_factory=list, description="List of components")
    connections: List[Connection] = Field(default_factory=list, description="List of connections")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Workflow-specific configuration")
    is_valid: bool = Field(default=False, description="Whether the workflow is valid")
    validation_errors: List[str] = Field(default_factory=list, description="Validation error messages")

    @validator('components')
    def validate_unique_component_names(cls, v):
        """Ensure component names are unique."""
        names = [comp.name for comp in v]
        if len(names) != len(set(names)):
            raise ValueError("Component names must be unique")
        return v

    @validator('connections')
    def validate_connection_components(cls, v, values):
        """Validate that connections reference existing components."""
        component_names = {comp.name for comp in values.get('components', [])}

        for connection in v:
            if connection.source_component not in component_names:
                raise ValueError(f"Source component '{connection.source_component}' not found")
            if connection.target_component not in component_names:
                raise ValueError(f"Target component '{connection.target_component}' not found")

        return v


class WorkflowCreate(BaseModel):
    """Model for creating a new workflow."""

    metadata: WorkflowMetadata
    workflow_type: WorkflowType
    components: List[ComponentConfig] = Field(default_factory=list)
    connections: List[Connection] = Field(default_factory=list)
    configuration: Dict[str, Any] = Field(default_factory=dict)


class WorkflowUpdate(BaseModel):
    """Model for updating an existing workflow."""

    metadata: Optional[WorkflowMetadata] = None
    workflow_type: Optional[WorkflowType] = None
    components: Optional[List[ComponentConfig]] = None
    connections: Optional[List[Connection]] = None
    configuration: Optional[Dict[str, Any]] = None


class WorkflowSummary(BaseModel):
    """Summary information for a workflow."""

    id: UUID
    name: str
    description: Optional[str]
    workflow_type: WorkflowType
    component_count: int
    is_valid: bool
    created_at: datetime
    updated_at: datetime


class ComponentInfo(BaseModel):
    """Information about available components."""

    component_type: ComponentType
    component_name: str
    display_name: str
    description: str
    category: str
    icon: Optional[str] = None
    schema: Dict[str, Any] = Field(default_factory=dict, description="JSON schema for configuration")
    required_fields: List[str] = Field(default_factory=list, description="Required configuration fields")
    optional_fields: List[str] = Field(default_factory=list, description="Optional configuration fields")
    examples: List[Dict[str, Any]] = Field(default_factory=list, description="Example configurations")


class ValidationResult(BaseModel):
    """Result of workflow validation."""

    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    component_errors: Dict[str, List[str]] = Field(default_factory=dict)
    connection_errors: Dict[str, List[str]] = Field(default_factory=dict)


class ExportFormat(str, Enum):
    """Supported export formats."""

    YAML = "yaml"
    JSON = "json"
    PYTHON = "python"


class ExportRequest(BaseModel):
    """Request for exporting a workflow."""

    format: ExportFormat = Field(default=ExportFormat.YAML, description="Export format")
    include_metadata: bool = Field(default=True, description="Include workflow metadata")
    include_comments: bool = Field(default=True, description="Include comments in export")


class TestRequest(BaseModel):
    """Request for testing a workflow."""

    input_message: str = Field(..., description="Input message for testing")
    use_knowledge_base: bool = Field(default=False, description="Use knowledge base")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Additional test parameters")


class TestResult(BaseModel):
    """Result of workflow testing."""

    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    intermediate_steps: List[Dict[str, Any]] = Field(default_factory=list)


class DeploymentStatus(str, Enum):
    """Status of workflow deployment."""

    PENDING = "pending"
    DEPLOYING = "deploying"
    RUNNING = "running"
    FAILED = "failed"
    STOPPED = "stopped"


class DeploymentInfo(BaseModel):
    """Information about workflow deployment."""

    workflow_id: UUID
    status: DeploymentStatus
    server_url: Optional[str] = None
    port: Optional[int] = None
    process_id: Optional[int] = None
    started_at: Optional[datetime] = None
    stopped_at: Optional[datetime] = None
    error_message: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
