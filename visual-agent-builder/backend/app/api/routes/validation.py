"""Validation API routes."""

from fastapi import APIRouter
from typing import Dict, Any, List

router = APIRouter()


@router.post("/workflow")
async def validate_workflow(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """Validate a workflow configuration.
    
    Checks:
    - At least one LLM component exists
    - All nodes have valid configuration
    - All connections are valid
    - Agent has connected LLM and functions
    """
    errors: List[str] = []
    warnings: List[str] = []
    
    nodes = workflow.get("nodes", [])
    edges = workflow.get("edges", [])
    
    if not nodes:
        errors.append("Workflow must contain at least one component")
        return {"is_valid": False, "errors": errors, "warnings": warnings}
    
    # Check for required components
    llm_nodes = [n for n in nodes if n.get("data", {}).get("componentType") == "llm"]
    agent_nodes = [n for n in nodes if n.get("data", {}).get("componentType") == "agent"]
    function_nodes = [n for n in nodes if n.get("data", {}).get("componentType") == "function"]
    
    if not llm_nodes:
        errors.append("Workflow must contain at least one LLM component")
    
    # Validate agent configuration
    if agent_nodes:
        if not llm_nodes:
            errors.append("Agent requires an LLM component")
        
        if not function_nodes and not llm_nodes:
            warnings.append("Agent has no functions or tools connected")
    
    # Validate node configurations
    for node in nodes:
        node_data = node.get("data", {})
        node_id = node.get("id", "unknown")
        component_type = node_data.get("componentType")
        config = node_data.get("config", {})
        
        # Check LLM configuration
        if component_type == "llm":
            if not config.get("model"):
                errors.append(f"LLM node '{node_id}' missing model configuration")
            if not config.get("api_key") and not config.get("base_url"):
                warnings.append(f"LLM node '{node_id}' has no API key configured")
        
        # Check agent configuration
        if component_type == "agent":
            if not config.get("agent_type"):
                errors.append(f"Agent node '{node_id}' missing agent type")
    
    # Validate connections
    node_ids = {n.get("id") for n in nodes}
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        
        if source not in node_ids:
            errors.append(f"Connection source '{source}' not found in workflow")
        if target not in node_ids:
            errors.append(f"Connection target '{target}' not found in workflow")
    
    # Check for disconnected nodes
    connected_nodes = set()
    for edge in edges:
        connected_nodes.add(edge.get("source"))
        connected_nodes.add(edge.get("target"))
    
    disconnected = node_ids - connected_nodes
    if disconnected and len(nodes) > 1:
        warnings.append(f"Found {len(disconnected)} disconnected components")
    
    is_valid = len(errors) == 0
    
    return {
        "is_valid": is_valid,
        "errors": errors,
        "warnings": warnings
    }
