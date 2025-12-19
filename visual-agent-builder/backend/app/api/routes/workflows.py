"""Workflows API routes."""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter()


@router.get("/")
async def get_workflows() -> List[Dict[str, Any]]:
    """Get all workflows."""
    # Return empty list - no saved workflows yet
    return []


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str) -> Dict[str, Any]:
    """Get a specific workflow."""
    # No saved workflows - always return 404
    raise HTTPException(status_code=404, detail="Workflow not found")


@router.post("/")
async def create_workflow(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new workflow."""
    return {
        "id": "new-workflow-1",
        "name": workflow.get("name", "New Workflow"),
        "description": workflow.get("description", ""),
        "workflow_type": workflow.get("workflow_type", "react_agent"),
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z"
    }


@router.put("/{workflow_id}")
async def update_workflow(workflow_id: str, workflow: Dict[str, Any]) -> Dict[str, Any]:
    """Update a workflow."""
    return {
        "id": workflow_id,
        "name": workflow.get("name", "Updated Workflow"),
        "description": workflow.get("description", ""),
        "workflow_type": workflow.get("workflow_type", "react_agent"),
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z"
    }


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str) -> Dict[str, str]:
    """Delete a workflow."""
    return {"message": f"Workflow {workflow_id} deleted successfully"}
