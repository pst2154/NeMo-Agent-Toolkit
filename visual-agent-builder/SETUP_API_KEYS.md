# Setting Up API Keys for Real LLM Execution

The Visual Agent Builder can now **execute workflows with real LLM calls**! Follow these steps to set it up.

## Prerequisites

1. **NeMo Agent Toolkit (NAT) installed**
   ```bash
   pip install nvidia-nat
   ```

2. **API Keys** - Get keys for the LLM providers you want to use:
   - **NVIDIA NIM**: https://build.nvidia.com/ (free tier available)
   - **OpenAI**: https://platform.openai.com/api-keys (paid)

## Setup Steps

### 1. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env  # If example exists
# Or create manually:
nano .env
```

Add your API keys:

```env
# NVIDIA API Key (for NIM models)
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API Key (optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Other settings
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
DATABASE_URL=sqlite:///./workflows.db
FRONTEND_URL=http://localhost:3000
```

### 2. Set Environment Variable for NAT

Make the API key available to NAT CLI:

```bash
export NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Or add to your ~/.bashrc or ~/.zshrc
```

### 3. Restart the Backend

```bash
cd backend
source venv/bin/activate  # If using venv
python main.py
```

## How to Use Real Execution

### 1. Build Your Workflow

1. Open **http://localhost:3000**
2. Click **"Launch Builder"**
3. Drag components onto the canvas:
   - Add an **LLM** component (for example, NIM LLM)
   - Add **Function** components (for example, Calculator Multiply, Calculator Add)
   - Add an **Agent** component (ReAct Agent)

### 2. Configure Components

Click on each component to configure:

#### LLM Configuration
- **Provider**: Select "nim" for NVIDIA or "openai" for OpenAI
- **Model Name**: For example, `meta/llama-3.1-8b-instruct` or `gpt-4`
- **API Key**: Use `${NVIDIA_API_KEY}` (reads from environment)
- **Temperature**: 0.0 for deterministic, higher for creative
- **Max Tokens**: 1024 or higher

#### Function Configuration  
- Most math functions work out of the box
- No configuration needed for basic calculator functions

#### Agent Configuration
- **Agent Type**: Select "react" for ReAct agent
- **System Prompt**: "You are a helpful AI assistant that can perform calculations."
- **Max Iterations**: 10 (how many reasoning steps)

### 3. Test Your Workflow

1. Click the **Play button** (▶) in the toolbar
2. Enter your test input, for example:
   - "What is 5 times 3?"
   - "Calculate 25 + 17"
   - "Multiply 8 by 7, then add 5"
3. Click **"Run Test"**
4. Wait for the **real LLM execution** to complete!

### 4. View Real Results

You'll see:
- ✅ **Actual LLM response** (not mocked!)
- ⏱️ **Real execution time**
- 📊 **Intermediate steps** (coming soon - requires NAT verbose output parsing)
- 💰 **Token usage** (if available from the LLM API)

### 5. Export and Run Separately

You can also:
1. Click **Download button** to export YAML
2. Run with NAT CLI:
   ```bash
   nat run --config your_workflow.yml --input "What is 5 times 3?"
   ```

## Example Workflow

Here's a complete example workflow configuration:

### Components:
1. **NIM LLM**
   - Model: `meta/llama-3.1-8b-instruct`
   - API Key: `${NVIDIA_API_KEY}`

2. **Calculator Functions**
   - Calculator Multiply
   - Calculator Add
   - Calculator Subtract
   - Calculator Divide

3. **ReAct Agent**
   - Tools: All calculator functions
   - LLM: NIM LLM
   - System Prompt: "You are a helpful calculator assistant."

### Test Queries:
- "What is 15 * 7?"
- "Calculate (100 + 50) / 3"
- "If I have 8 apples and buy 5 more, then eat 3, how many do I have?"

## Troubleshooting

### Error: "NAT CLI not found"
**Solution**: Install NAT
```bash
pip install nvidia-nat
# Verify installation:
which nat
nat --version
```

### Error: "API key not found"  
**Solution**: Set environment variable
```bash
export NVIDIA_API_KEY=your-key-here
# Add to ~/.bashrc or ~/.zshrc for persistence
```

### Error: "Authentication failed"
**Solution**: Check your API key is valid
- NVIDIA: https://build.nvidia.com/ → API Keys
- OpenAI: https://platform.openai.com/api-keys

### Workflow execution hangs
**Solution**: Check your configuration
- Model name is correct
- API endpoint is accessible
- You have sufficient API credits

### Getting rate limited
**Solution**: 
- Wait a few moments between tests
- Upgrade your API tier
- Use a different model

## Cost Considerations

### NVIDIA NIM (Free Tier)
- ✅ Free for development and testing
- 💰 Very generous limits
- 🚀 Fast inference

### OpenAI
- 💰 Paid per token
- 📊 Check pricing: https://openai.com/pricing
- 💡 Use GPT-3.5-turbo for cheaper costs

## Advanced: Using Local Models

You can also use locally hosted models:

1. **Set up Ollama or vLLM**
2. **Configure LLM component**:
   - Provider: "local"
   - Base URL: "http://localhost:11434/v1" (Ollama)
   - Model Name: "llama3.1"
3. **No API key needed!**

## Next Steps

- ✅ Build complex multi-step workflows
- ✅ Test with real LLM calls
- ✅ Export to production
- ✅ Monitor token usage and costs
- ✅ Iterate and improve your agents

Happy building! 🚀




