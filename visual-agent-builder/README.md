# NeMo Agent Toolkit Visual Builder

A no-code visual interface for building, testing, and deploying AI agent workflows using NVIDIA's NeMo Agent Toolkit (NAT).

![Visual Agent Builder](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8%2B-blue)
![React](https://img.shields.io/badge/react-18.0%2B-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)

## Features

### 🎨 Visual Workflow Design
- **Drag-and-drop interface** for building agent workflows
- **Real-time component configuration** with visual dialogs
- **Auto-layout** and smart positioning of components
- **Import/Export** YAML workflows

### 🤖 AI Agent Support
- **ReAct Agents** - Reasoning and Acting with tools
- **Tool Calling Agents** - Native function calling
- **ReWOO Agents** - Complex reasoning workflows
- **Custom Workflows** - Build your own patterns

### 🔧 Built-in Components
- **LLMs**: NVIDIA NIM, OpenAI, and more
- **Tools**: Code execution, web search, Wikipedia, file operations
- **Functions**: Current datetime, memory tools, retrieval
- **Agents**: Multiple agent types with customizable prompts

### 🧪 Testing & Debugging
- **Interactive testing** directly in the browser
- **Step-by-step execution view** with timestamps
- **Thought/Action/Observation tracking** for ReAct agents
- **Real-time execution metrics** and performance monitoring

### 🔒 Security & Sandboxing
- **Docker-based code execution** sandbox
- **Environment variable management** for API keys
- **Secure credential handling** with placeholder substitution

## Architecture

```
visual-agent-builder/
├── frontend/          # React + TypeScript UI
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Main pages
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Helper functions
│   └── package.json
│
├── backend/           # FastAPI Python server
│   ├── app/
│   │   └── api/
│   │       └── routes/   # API endpoints
│   └── main.py
│
└── README.md
```

## Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Docker** (for code execution sandbox)
- **NVIDIA API Key** or OpenAI API Key

### Installation

1. **Clone the repository**
```bash
cd NeMo-Agent-Toolkit/visual-agent-builder
```

2. **Set up the backend**
```bash
cd backend
pip install -r requirements.txt
export NVIDIA_API_KEY="your-api-key-here"
```

3. **Set up the frontend**
```bash
cd ../frontend
npm install
```

4. **Start the code execution sandbox** (optional, for code execution tool)
```bash
cd ../src/nat/tool/code_execution/local_sandbox
source start_local_sandbox.sh
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd visual-agent-builder/backend
export NVIDIA_API_KEY="your-api-key"
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd visual-agent-builder/frontend
npm start
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Usage Guide

### Creating Your First Workflow

1. **Launch the Builder**
   - Navigate to http://localhost:3000
   - Click "Launch Builder" or "Create New Workflow"

2. **Add Components**
   - Drag components from the left panel onto the canvas
   - Required components for a basic agent:
     - **LLM** (e.g., NIM LLM with Nemotron)
     - **Function/Tool** (e.g., Code Execution)
     - **Agent** (e.g., ReAct Agent) - auto-created if not added

3. **Configure Components**
   - Click on any component to configure it
   - Set model parameters (temperature, max tokens, etc.)
   - Customize agent prompts and behavior

4. **Test Your Workflow**
   - Click the "Test" button (▶️)
   - Enter a test query
   - View step-by-step execution results

5. **Export to YAML**
   - Click the "Export" button (⬇️)
   - Save the YAML file
   - Use with NAT CLI: `nat run --config_file workflow.yml --input "your query"`

### Importing Existing Workflows

1. Click the "Import" button (⬆️) in the toolbar
2. Select your YAML workflow file
3. Components will automatically appear on the canvas
4. Edit and test as needed

## Example Workflows

### Simple Code Execution Agent

```yaml
functions:
  code_execution:
    _type: code_execution
    sandbox_type: local

llms:
  nim_llm:
    _type: openai
    model_name: nvidia/nemotron-3-nano-30b-a3b
    base_url: https://integrate.api.nvidia.com/v1
    api_key: ${NVIDIA_API_KEY}
    temperature: 0.7
    max_tokens: 1024

workflow:
  _type: react_agent
  llm_name: nim_llm
  tool_names:
    - code_execution
  system_prompt: "You are a helpful AI assistant with access to tools..."
  verbose: true
  max_iterations: 10
  parse_agent_response_max_retries: 3
```

### Research Assistant with Web Search

```yaml
functions:
  tavily_search:
    _type: tavily_internet_search
  wiki_search:
    _type: wiki_search

llms:
  nim_llm:
    _type: openai
    model_name: nvidia/nemotron-3-nano-30b-a3b
    base_url: https://integrate.api.nvidia.com/v1
    api_key: ${NVIDIA_API_KEY}
    temperature: 0.7

workflow:
  _type: react_agent
  llm_name: nim_llm
  tool_names:
    - tavily_search
    - wiki_search
  verbose: true
  max_iterations: 10
```

## API Reference

### Backend Endpoints

#### `GET /api/components/`
Get all available components (LLMs, functions, agents)

#### `POST /api/export/generate`
Generate YAML from workflow data
```json
{
  "name": "My Workflow",
  "nodes": [...],
  "edges": [...]
}
```

#### `POST /api/testing/{workflow_id}`
Test a workflow with input
```json
{
  "message": "What is 5*5?",
  "workflow_yaml": "..."
}
```

Returns:
```json
{
  "success": true,
  "output": "25",
  "execution_time": 10.5,
  "intermediate_steps": [
    {
      "step": 1,
      "thought": "I need to calculate 5*5",
      "action": "code_execution",
      "observation": "25"
    }
  ]
}
```

## Configuration

### Environment Variables

- `NVIDIA_API_KEY` - Your NVIDIA API key for NIM models
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI models)
- `TAVILY_API_KEY` - Tavily API key (for web search)

### Model Configuration

Default model: `nvidia/nemotron-3-nano-30b-a3b`

Supported models:
- `nvidia/nemotron-3-nano-30b-a3b` - Fast, efficient
- `nvidia/llama-3.1-nemotron-70b-instruct` - More capable
- `meta/llama-3.1-405b-instruct` - Most capable
- Any OpenAI-compatible model

### Code Execution Sandbox

Two modes available:
1. **Local** - Docker container on localhost:6000
2. **Piston** - Remote code execution service

Configure in workflow:
```yaml
functions:
  code_execution:
    _type: code_execution
    sandbox_type: local  # or 'piston'
```

## Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Backend errors
```bash
# Check Python dependencies
pip install --upgrade nvidia-nat fastapi uvicorn pyyaml

# Verify API key
echo $NVIDIA_API_KEY
```

### Code execution fails
```bash
# Check Docker is running
docker ps

# Restart sandbox
cd src/nat/tool/code_execution/local_sandbox
source start_local_sandbox.sh
```

### Agent format errors
- Ensure `parse_agent_response_max_retries: 3` is set
- Use detailed system prompts with format examples
- Consider using larger models (70B+) for complex reasoning

## Development

### Project Structure

```
frontend/src/
├── components/
│   ├── ComponentPanel.tsx      # Left sidebar with components
│   ├── WorkflowCanvas.tsx      # Main canvas with React Flow
│   ├── ConfigurationDialog.tsx # Component settings
│   └── nodes/                  # Custom node types
├── pages/
│   ├── Home.tsx               # Landing page
│   └── VisualBuilder.tsx      # Main builder interface
├── types/
│   └── workflow.ts            # TypeScript interfaces
└── utils/
    └── api.ts                 # API client

backend/app/api/routes/
├── components.py              # Component definitions
├── export.py                  # YAML generation
├── testing.py                 # Workflow testing
├── workflows.py               # Workflow CRUD (placeholder)
└── validation.py              # Input validation
```

### Adding New Components

1. **Backend** - Add to `components.py`:
```python
{
    "name": "my_function",
    "component_type": "function",
    "description": "My custom function",
    "category": "utilities",
    "configuration_schema": {
        "type": "object",
        "properties": {
            "param1": {"type": "string", "default": "value"}
        }
    }
}
```

2. **Frontend** - Component appears automatically in the panel

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Roadmap

- [ ] Multi-agent workflows with communication
- [ ] Workflow templates library
- [ ] Persistent workflow storage (database)
- [ ] Collaborative editing
- [ ] Version control integration
- [ ] Performance monitoring dashboard
- [ ] Custom function SDK
- [ ] Workflow marketplace

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

## Acknowledgments

Built with:
- [NeMo Agent Toolkit](https://github.com/NVIDIA/NeMo-Agent-Toolkit)
- [React Flow](https://reactflow.dev/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Material-UI](https://mui.com/)

## Support

- **Documentation**: [NeMo Agent Toolkit Docs](https://nvidia.github.io/NeMo-Agent-Toolkit/)
- **Issues**: [GitHub Issues](https://github.com/pst2154/visual-agent-builder/issues)
- **Community**: [NVIDIA Developer Forums](https://forums.developer.nvidia.com/)

---

**Made with ❤️ by Alex Steiner @ NVIDIA**
