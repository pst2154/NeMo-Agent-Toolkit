"""Components API routes."""

from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()


@router.get("/")
async def get_components() -> List[Dict[str, Any]]:
    """Get all available components."""
    return [
        # Built-in NAT Functions (these actually exist!)
        {
            "name": "current_datetime",
            "component_type": "function",
            "description": "Get the current date and time",
            "category": "utilities",
            "configuration_schema": {
                "type": "object",
                "properties": {},
                "required": []
            }
        },
        {
            "name": "code_execution",
            "component_type": "function",
            "description": "Execute Python code securely - can be used for math, data processing, etc.",
            "category": "utilities",
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "timeout": {
                        "type": "integer",
                        "default": 30,
                        "description": "Execution timeout in seconds"
                    }
                },
                "required": []
            }
        },
        # LangChain Plugin Functions (require nvidia-nat-langchain)
        {
            "name": "tavily_internet_search",
            "component_type": "function",
            "description": "Search the internet using Tavily API (requires API key)",
            "category": "web",
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "max_results": {
                        "type": "integer",
                        "default": 5,
                        "description": "Maximum number of results"
                    }
                },
                "required": []
            }
        },
        {
            "name": "wiki_search",
            "component_type": "function",
            "description": "Search Wikipedia for information",
            "category": "web",
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "top_k_results": {
                        "type": "integer",
                        "default": 3,
                        "description": "Number of results to return"
                    }
                },
                "required": []
            }
        },
        # LLMs
        {
            "name": "nim_llm",
            "component_type": "llm",
            "description": "NVIDIA NIM hosted language model",
            "category": "language_models",
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "provider": {
                        "type": "string",
                        "default": "nim"
                    },
                    "base_url": {
                        "type": "string",
                        "default": "https://integrate.api.nvidia.com/v1"
                    },
                    "api_key": {
                        "type": "string",
                        "default": "${NVIDIA_API_KEY}"
                    },
                    "model": {
                        "type": "string",
                        "default": "nvidia/nemotron-3-nano-30b-a3b"
                    },
                    "temperature": {
                        "type": "number",
                        "default": 0.7
                    },
                    "top_p": {
                        "type": "number",
                        "default": 1
                    },
                    "max_tokens": {
                        "type": "integer",
                        "default": 16384
                    },
                    "stream": {
                        "type": "boolean",
                        "default": True
                    },
                    "enable_thinking": {
                        "type": "boolean",
                        "default": False
                    },
                    "frequency_penalty": {
                        "type": "number",
                        "default": 0
                    },
                    "presence_penalty": {
                        "type": "number",
                        "default": 0
                    }
                },
                "required": []
            }
        },
        {
            "name": "openai_llm",
            "component_type": "llm",
            "description": "OpenAI language model",
            "category": "language_models",
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "model_name": {
                        "type": "string",
                        "default": "gpt-4o-mini"
                    },
                    "temperature": {
                        "type": "number",
                        "default": 0.7
                    },
                    "max_tokens": {
                        "type": "integer",
                        "default": 2000
                    }
                },
                "required": []
            }
        },
        # Agents
        {
            "name": "react_agent",
            "component_type": "agent",
            "description": "ReAct (Reasoning + Acting) agent for tool-based tasks",
            "category": "agents",
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "agent_type": {
                        "type": "string",
                        "default": "react"
                    },
                    "max_iterations": {
                        "type": "integer",
                        "default": 10
                    }
                },
                "required": []
            }
        },
        {
            "name": "tool_calling_agent",
            "component_type": "agent",
            "description": "Tool Calling agent using native function calling",
            "category": "agents",
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "agent_type": {
                        "type": "string",
                        "default": "tool_calling"
                    }
                },
                "required": []
            }
        },
        {
            "name": "rewoo_agent",
            "component_type": "agent",
            "description": "ReWOO agent for complex reasoning workflows",
            "category": "agents",
            "configuration_schema": {
                "type": "object",
                "properties": {
                    "agent_type": {
                        "type": "string",
                        "default": "rewoo"
                    }
                },
                "required": []
            }
        }
    ]


@router.get("/categories")
async def get_component_categories() -> List[str]:
    """Get all component categories."""
    return ["utilities", "web", "language_models", "agents", "memory", "retrievers"]


@router.get("/{component_name}")
async def get_component(component_name: str) -> Dict[str, Any]:
    """Get a specific component."""
    components = await get_components()
    for component in components:
        if component["name"] == component_name:
            return component

    return {"error": "Component not found"}
