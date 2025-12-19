# Visual Agent Builder - Quick Start Guide

Get started with the Visual Agent Builder in minutes!

## Prerequisites

- Node.js 18 or higher
- Python 3.9 or higher
- NeMo Agent toolkit installed (optional, for full functionality)

## Quick Start (Development Mode)

### Option 1: Automated Setup

Run the setup script to install everything automatically:

```bash
./setup.sh
```

This will:
1. Install backend dependencies
2. Install frontend dependencies
3. Initialize the database
4. Start both servers

### Option 2: Manual Setup

#### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend API will be available at `http://localhost:8000`

#### 2. Start the Frontend

In a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`

### Option 3: Docker Compose

For a containerized setup:

```bash
docker-compose up
```

This starts:
- Backend API at `http://localhost:8000`
- Frontend at `http://localhost:3000`
- Redis for caching
- PostgreSQL (production profile)

## First Steps

1. **Open the Application**
   - Navigate to `http://localhost:3000`
   - Click "Launch Builder" to start creating workflows

2. **Create Your First Workflow**
   - Click the "New Workflow" button (+ icon)
   - Give your workflow a name and description
   - Select a workflow type (ReAct, Tool Calling, or ReWOO)

3. **Add Components**
   - Browse the Component Library on the left
   - Drag components onto the canvas
   - Connect components by dragging from one to another

4. **Configure Components**
   - Click on any component to configure it
   - Fill in required fields (marked with *)
   - Save your configuration

5. **Test Your Workflow**
   - Click the Play button (▶) in the toolbar
   - Enter test input
   - View the results

6. **Export Your Workflow**
   - Click the Download button to export as YAML
   - Use the exported file with `nat run` or `nat serve`

## Example Workflow

Here's a simple calculator agent workflow:

1. Add a "NIM LLM" component
   - Configure with your model (for example, `meta/llama-3.1-8b-instruct`)
   - Set temperature to 0.0 for deterministic results

2. Add "Calculator Multiply" and "Calculator Add" functions
   - These work out of the box, no configuration needed

3. Add a "ReAct Agent" component
   - Connect the functions and LLM to the agent
   - Configure the agent with a system prompt

4. Test with: "What is 5 times 3 plus 2?"

## Troubleshooting

### Backend Won't Start

- Check that port 8000 is not in use
- Verify Python version: `python --version` (should be 3.9+)
- Try: `pip install --upgrade -r requirements.txt`

### Frontend Won't Start

- Check that port 3000 is not in use
- Verify Node.js version: `node --version` (should be 18+)
- Try: `rm -rf node_modules && npm install`

### Components Not Loading

- Ensure the backend is running
- Check browser console for errors
- Verify API connection at `http://localhost:8000/health`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the [API Documentation](http://localhost:8000/docs)
- Explore example workflows in the `examples/` directory
- Learn about [NeMo Agent toolkit](https://github.com/NVIDIA/NeMo-Agent-Toolkit)

## Getting Help

- **Issues**: Report bugs on GitHub
- **Documentation**: See the main README
- **Community**: Join discussions on the NeMo Agent toolkit forums

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Backend Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# Database
DATABASE_URL=sqlite:///./workflows.db

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# NeMo Agent Toolkit (optional)
NEMO_AGENT_TOOLKIT_PATH=/path/to/nemo-agent-toolkit

# Security (change in production)
SECRET_KEY=your-secret-key-here
```

## Production Deployment

For production deployment:

1. Set `DEBUG=false` in environment
2. Use PostgreSQL instead of SQLite
3. Set up proper authentication
4. Use HTTPS with SSL certificates
5. Enable monitoring and logging

See the main README for detailed production deployment instructions.




