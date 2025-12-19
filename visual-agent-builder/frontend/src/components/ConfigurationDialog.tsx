import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Node } from '@xyflow/react';
import { NodeData, ComponentConfig } from '../types/workflow';

interface ConfigurationDialogProps {
  open: boolean;
  node: Node<NodeData> | null;
  onClose: () => void;
  onSave: (config: ComponentConfig) => void;
}

const ConfigurationDialog: React.FC<ConfigurationDialogProps> = ({ open, node, onClose, onSave }) => {
  const [config, setConfig] = useState<ComponentConfig>({});
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (node) {
      // Default values for NIM LLM
      const defaultConfig: ComponentConfig = {};
      
      // Check if it's a nim_llm by name or label
      const isNimLLM = node.data.componentType === 'llm' && 
                       (node.data.name === 'nim_llm' || 
                        node.data.label?.toLowerCase().includes('nim'));
      
      if (isNimLLM) {
        defaultConfig.provider = 'nim';
        defaultConfig.base_url = 'https://integrate.api.nvidia.com/v1';
        defaultConfig.api_key = '${NVIDIA_API_KEY}';
        defaultConfig.model = 'nvidia/nemotron-3-nano-30b-a3b';
        defaultConfig.temperature = 0.7;
        defaultConfig.top_p = 1;
        defaultConfig.max_tokens = 16384;
        defaultConfig.stream = true;
        defaultConfig.enable_thinking = false;  // Changed to false - thinking doesn't work well with ReAct agents
        defaultConfig.frequency_penalty = 0;
        defaultConfig.presence_penalty = 0;
      }
      
      // Merge defaults with existing config (existing config takes precedence)
      setConfig({ ...defaultConfig, ...node.data.config });
      setLabel(node.data.label);
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    const finalConfig = { ...config, label };
    onSave(finalConfig);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: ComponentConfig) => ({ ...prev, [key]: value }));
  };

  const renderLLMConfig = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Model Provider</InputLabel>
        <Select
          value={config.provider || 'nim'}
          onChange={(e) => handleConfigChange('provider', e.target.value)}
          label="Model Provider"
        >
          <MenuItem value="nim">NVIDIA NIM</MenuItem>
          <MenuItem value="openai">OpenAI</MenuItem>
          <MenuItem value="local">Local (Ollama/vLLM)</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Model Name"
        value={config.model || ''}
        onChange={(e) => handleConfigChange('model', e.target.value)}
        placeholder="nvidia/nemotron-3-nano-30b-a3b"
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="API Base URL"
        value={config.base_url || ''}
        onChange={(e) => handleConfigChange('base_url', e.target.value)}
        placeholder="https://integrate.api.nvidia.com/v1"
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="API Key"
        type="password"
        value={config.api_key || ''}
        onChange={(e) => handleConfigChange('api_key', e.target.value)}
        placeholder="Your API key"
        sx={{ mb: 2 }}
      />

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            label="Temperature"
            type="number"
            inputProps={{ min: 0, max: 2, step: 0.1 }}
            value={config.temperature || 0.7}
            onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
            sx={{ mb: 2 }}
            helperText="Controls randomness. 0 = deterministic, higher = more creative"
          />
          <TextField
            fullWidth
            label="Max Tokens"
            type="number"
            value={config.max_tokens || 1024}
            onChange={(e) => handleConfigChange('max_tokens', parseInt(e.target.value))}
            sx={{ mb: 2 }}
            helperText="Maximum number of tokens to generate (up to 16384 for some models)"
          />
          <TextField
            fullWidth
            label="Top P"
            type="number"
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            value={config.top_p || 1.0}
            onChange={(e) => handleConfigChange('top_p', parseFloat(e.target.value))}
            sx={{ mb: 2 }}
            helperText="Nucleus sampling threshold"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.stream || false}
                onChange={(e) => handleConfigChange('stream', e.target.checked)}
              />
            }
            label="Enable Streaming"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.enable_thinking || false}
                onChange={(e) => handleConfigChange('enable_thinking', e.target.checked)}
              />
            }
            label="Enable Thinking (Nemotron models)"
            sx={{ mb: 2 }}
          />
          {config.enable_thinking && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, ml: 4 }}>
              ℹ️ Thinking tokens allow the model to reason before responding. Supported by Nemotron models.
            </Typography>
          )}
          <TextField
            fullWidth
            label="Frequency Penalty"
            type="number"
            inputProps={{ min: -2, max: 2, step: 0.1 }}
            value={config.frequency_penalty || 0}
            onChange={(e) => handleConfigChange('frequency_penalty', parseFloat(e.target.value))}
            sx={{ mb: 2 }}
            helperText="Penalize repeated tokens (-2.0 to 2.0)"
          />
          <TextField
            fullWidth
            label="Presence Penalty"
            type="number"
            inputProps={{ min: -2, max: 2, step: 0.1 }}
            value={config.presence_penalty || 0}
            onChange={(e) => handleConfigChange('presence_penalty', parseFloat(e.target.value))}
            helperText="Penalize tokens based on presence (-2.0 to 2.0)"
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const renderFunctionConfig = () => (
    <Box>
      <TextField
        fullWidth
        label="Function Description"
        multiline
        rows={3}
        value={config.description || ''}
        onChange={(e) => handleConfigChange('description', e.target.value)}
        placeholder="Describe what this function does"
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={config.required || false}
            onChange={(e) => handleConfigChange('required', e.target.checked)}
          />
        }
        label="Required Function"
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Parameter Schema (JSON)"
        multiline
        rows={6}
        value={config.parameters || ''}
        onChange={(e) => handleConfigChange('parameters', e.target.value)}
        placeholder='{"type": "object", "properties": {...}}'
        sx={{ mb: 2 }}
      />
    </Box>
  );

  const renderMemoryConfig = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Memory Type</InputLabel>
        <Select
          value={config.memory_type || 'conversation'}
          onChange={(e) => handleConfigChange('memory_type', e.target.value)}
          label="Memory Type"
        >
          <MenuItem value="conversation">Conversation Buffer</MenuItem>
          <MenuItem value="summary">Summary Memory</MenuItem>
          <MenuItem value="vector">Vector Store</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Max Messages"
        type="number"
        value={config.max_messages || 10}
        onChange={(e) => handleConfigChange('max_messages', parseInt(e.target.value))}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={config.return_messages || false}
            onChange={(e) => handleConfigChange('return_messages', e.target.checked)}
          />
        }
        label="Return Messages"
      />
    </Box>
  );

  const renderRetrieverConfig = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Retriever Type</InputLabel>
        <Select
          value={config.retriever_type || 'vector'}
          onChange={(e) => handleConfigChange('retriever_type', e.target.value)}
          label="Retriever Type"
        >
          <MenuItem value="vector">Vector Similarity</MenuItem>
          <MenuItem value="bm25">BM25</MenuItem>
          <MenuItem value="hybrid">Hybrid</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Collection Name"
        value={config.collection_name || ''}
        onChange={(e) => handleConfigChange('collection_name', e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Top K Results"
        type="number"
        value={config.top_k || 5}
        onChange={(e) => handleConfigChange('top_k', parseInt(e.target.value))}
        sx={{ mb: 2 }}
      />
    </Box>
  );

  const renderAgentConfig = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Agent Type</InputLabel>
        <Select
          value={config.agent_type || 'react'}
          onChange={(e) => handleConfigChange('agent_type', e.target.value)}
          label="Agent Type"
        >
          <MenuItem value="react">ReAct Agent</MenuItem>
          <MenuItem value="tool_calling">Tool Calling Agent</MenuItem>
          <MenuItem value="rewoo">ReWOO Agent</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="System Prompt"
        multiline
        rows={4}
        value={config.system_prompt || ''}
        onChange={(e) => handleConfigChange('system_prompt', e.target.value)}
        placeholder="You are a helpful AI assistant..."
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Max Iterations"
        type="number"
        value={config.max_iterations || 10}
        onChange={(e) => handleConfigChange('max_iterations', parseInt(e.target.value))}
      />
    </Box>
  );

  const renderToolConfig = () => (
    <Box>
      <TextField
        fullWidth
        label="Tool Name"
        value={config.tool_name || ''}
        onChange={(e) => handleConfigChange('tool_name', e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Tool Description"
        multiline
        rows={3}
        value={config.tool_description || ''}
        onChange={(e) => handleConfigChange('tool_description', e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Configuration (JSON)"
        multiline
        rows={6}
        value={config.tool_config || ''}
        onChange={(e) => handleConfigChange('tool_config', e.target.value)}
        placeholder='{"param1": "value1", "param2": "value2"}'
      />
    </Box>
  );

  const renderRouterConfig = () => (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Router Type</InputLabel>
        <Select
          value={config.router_type || 'conditional'}
          onChange={(e) => handleConfigChange('router_type', e.target.value)}
          label="Router Type"
        >
          <MenuItem value="conditional">Conditional</MenuItem>
          <MenuItem value="semantic">Semantic</MenuItem>
          <MenuItem value="llm">LLM-based</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Routing Logic"
        multiline
        rows={4}
        value={config.routing_logic || ''}
        onChange={(e) => handleConfigChange('routing_logic', e.target.value)}
        placeholder="Define routing conditions or logic"
      />
    </Box>
  );

  const renderConfigForm = () => {
    switch (node.data.componentType) {
      case 'llm':
        return renderLLMConfig();
      case 'function':
        return renderFunctionConfig();
      case 'memory':
        return renderMemoryConfig();
      case 'retriever':
        return renderRetrieverConfig();
      case 'agent':
        return renderAgentConfig();
      case 'tool':
        return renderToolConfig();
      case 'router':
        return renderRouterConfig();
      default:
        return (
          <Typography color="text.secondary">
            No configuration options available for this component type.
          </Typography>
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Configure Component</Typography>
          <Chip label={node.data.componentType} size="small" color="primary" />
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Component Name"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Component Settings
          </Typography>

          {renderConfigForm()}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigurationDialog;

