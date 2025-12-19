import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FolderOpen as OpenIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { Node, Edge } from '@xyflow/react';
import WorkflowCanvas from '../components/WorkflowCanvas';
import ComponentPanel from '../components/ComponentPanel';
import { Workflow, WorkflowComponent, ComponentConnection, NodeData } from '../types/workflow';
import { apiClient } from '../utils/api';

const VisualBuilder: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow>({
    name: 'Untitled Workflow',
    description: '',
    workflowType: 'react',
    components: [],
    connections: [],
  });
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [newWorkflowDialog, setNewWorkflowDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    output?: string;
    error?: string;
    execution_time?: number;
    intermediate_steps?: Array<{
      step: number;
      type: string;
      content?: string;
      thought?: string;
      action?: string;
      action_input?: string;
      observation?: string;
      timestamp?: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleWorkflowChange = useCallback((newNodes: Node<NodeData>[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const handleNewWorkflow = () => {
    setNewWorkflowDialog(true);
  };

  const handleCreateWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setNewWorkflowDialog(false);
    // Clear any cached workflow data
    localStorage.removeItem('workflow');
    localStorage.removeItem('workflowNodes');
    localStorage.removeItem('workflowEdges');
    setSnackbar({ open: true, message: 'New workflow created', severity: 'success' });
  };

  const handleOpenWorkflow = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getWorkflows();
      if (result.error) {
        setSnackbar({ open: true, message: `Error: ${result.error}`, severity: 'error' });
      } else {
        setSavedWorkflows(result.data || []);
        setOpenDialog(true);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load workflows', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadWorkflow = async (workflowId: string) => {
    setLoading(true);
    try {
      const result = await apiClient.getWorkflow(workflowId);
      if (result.error) {
        setSnackbar({ open: true, message: `Error: ${result.error}`, severity: 'error' });
      } else {
        const workflowData = result.data;
        setWorkflow({
          id: workflowData.id,
          name: workflowData.name,
          description: workflowData.description || '',
          workflowType: (workflowData.workflow_type || workflowData.workflowType || 'react') as 'react' | 'tool_calling' | 'rewoo' | 'custom',
          components: [],
          connections: [],
        });
        
        // Reconstruct nodes from components
        const loadedNodes = (workflowData.components || []).map((comp: WorkflowComponent) => ({
          id: comp.id || `${comp.name}-${Date.now()}`,
          type: 'custom',
          position: comp.position || { x: 100, y: 100 },
          data: {
            label: comp.name,
            componentType: comp.type,
            category: comp.category || comp.type,
            description: comp.description || '',
            config: comp.config || {},
            isConfigured: true,
          },
        }));
        
        // Reconstruct edges from connections
        const loadedEdges = (workflowData.connections || []).map((conn: ComponentConnection) => ({
          id: conn.id,
          source: conn.source,
          target: conn.target,
          type: 'smoothstep',
          animated: true,
        }));
        
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setOpenDialog(false);
        setSnackbar({ open: true, message: 'Workflow loaded successfully', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load workflow', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const workflowData = {
        ...workflow,
        components: nodes.map((node) => ({
          id: node.id,
          name: node.data.label,
          type: node.data.componentType,
          category: node.data.category,
          description: node.data.description,
          config: node.data.config,
          position: node.position,
        })),
        connections: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      };

      const result = workflow.id
        ? await apiClient.updateWorkflow(workflow.id, workflowData)
        : await apiClient.createWorkflow(workflowData);

      if (result.error) {
        setSnackbar({ open: true, message: `Error: ${result.error}`, severity: 'error' });
      } else {
        setWorkflow({ ...workflow, id: result.data?.id });
        setSnackbar({ open: true, message: 'Workflow saved successfully', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save workflow', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!workflow.id) {
      setSnackbar({
        open: true,
        message: 'Please save the workflow first',
        severity: 'info',
      });
      return;
    }
    setTestDialog(true);
  };

  const handleRunTest = async () => {
    setLoading(true);
    try {
      // Generate YAML from current workflow
      const workflowData = {
        name: workflow.name,
        nodes: nodes,
        edges: edges,
      };
      
      const yamlResult = await apiClient.generateWorkflowYAML(workflowData);
      if (yamlResult.error) {
        setSnackbar({ open: true, message: `Failed to generate workflow: ${yamlResult.error}`, severity: 'error' });
        return;
      }
      
      // Test with generated YAML
      const testData = {
        message: testInput,
        workflow_yaml: yamlResult.data?.content || '',
      };
      
      const result = await apiClient.testWorkflow('temp', testData);
      if (result.error) {
        setSnackbar({ open: true, message: `Test error: ${result.error}`, severity: 'error' });
      } else {
        setTestResult(result.data);
        setSnackbar({ open: true, message: 'Test completed successfully!', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Test failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Generate YAML from current workflow
      const workflowData = {
        name: workflow.name,
        nodes: nodes,
        edges: edges,
      };
      
      const result = await apiClient.generateWorkflowYAML(workflowData);
      if (result.error) {
        setSnackbar({ open: true, message: `Export error: ${result.error}`, severity: 'error' });
      } else {
        // Download the YAML file
        const blob = new Blob([result.data.content || ''], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename || `${workflow.name.replace(/\s+/g, '_')}.yml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: 'Workflow exported successfully!', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yml,.yaml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        // Parse YAML and convert to nodes
        const lines = text.split('\n');
        const newNodes: Node<NodeData>[] = [];
        const newEdges: Edge[] = [];
        
        let yPosition = 100;
        let nodeId = 1;
        
        // Parse functions
        const functionsMatch = text.match(/functions:\s*([\s\S]*?)(?=\nllms:|$)/);
        if (functionsMatch) {
          const functionsText = functionsMatch[1];
          const functionNames = functionsText.match(/^\s+(\w+):/gm);
          if (functionNames) {
            functionNames.forEach((match) => {
              const name = match.trim().replace(':', '');
              newNodes.push({
                id: `node-${nodeId++}`,
                type: 'custom',
                position: { x: 400, y: yPosition },
                data: {
                  componentType: 'function',
                  name: name,
                  label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  category: 'utilities',
                  config: {}
                }
              });
              yPosition += 150;
            });
          }
        }
        
        // Parse LLMs
        const llmsMatch = text.match(/llms:\s*([\s\S]*?)(?=\nworkflow:|$)/);
        if (llmsMatch) {
          const llmsText = llmsMatch[1];
          const llmNames = llmsText.match(/^\s+(\w+):/gm);
          if (llmNames) {
            llmNames.forEach((match) => {
              const name = match.trim().replace(':', '');
              // Extract config
              const llmConfig: any = {};
              const modelMatch = llmsText.match(new RegExp(`${name}:[\\s\\S]*?model_name:\\s*([^\\n]+)`));
              const tempMatch = llmsText.match(new RegExp(`${name}:[\\s\\S]*?temperature:\\s*([\\d.]+)`));
              const maxTokensMatch = llmsText.match(new RegExp(`${name}:[\\s\\S]*?max_tokens:\\s*(\\d+)`));
              
              if (modelMatch) llmConfig.model = modelMatch[1].trim();
              if (tempMatch) llmConfig.temperature = parseFloat(tempMatch[1]);
              if (maxTokensMatch) llmConfig.max_tokens = parseInt(maxTokensMatch[1]);
              
              newNodes.push({
                id: `node-${nodeId++}`,
                type: 'custom',
                position: { x: 100, y: 100 },
                data: {
                  componentType: 'llm',
                  name: 'nim_llm',
                  label: 'NIM LLM',
                  category: 'language_models',
                  config: llmConfig
                }
              });
            });
          }
        }
        
        // Parse workflow/agent
        const workflowMatch = text.match(/workflow:\s*([\s\S]*?)(?=\n\S|$)/);
        if (workflowMatch) {
          const workflowText = workflowMatch[1];
          const typeMatch = workflowText.match(/_type:\s*(\w+)/);
          if (typeMatch) {
            const agentType = typeMatch[1];
            newNodes.push({
              id: `node-${nodeId++}`,
              type: 'custom',
              position: { x: 700, y: 200 },
              data: {
                componentType: 'agent',
                name: agentType,
                label: agentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: 'agents',
                config: { agent_type: agentType.replace('_agent', '') }
              }
            });
          }
        }
        
        setNodes(newNodes);
        setEdges(newEdges);
        setWorkflow({ ...workflow, name: file.name.replace(/\.ya?ml$/, '') });
        setSnackbar({ open: true, message: `Imported ${newNodes.length} components from ${file.name}`, severity: 'success' });
      } catch (error) {
        console.error('Import error:', error);
        setSnackbar({ open: true, message: 'Failed to import workflow. Make sure it\'s a valid YAML file.', severity: 'error' });
      }
    };
    input.click();
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <IconButton edge="start" color="inherit" href="/">
            <BackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, ml: 2 }}>
            <Typography variant="h6">{workflow.name}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {workflow.workflowType.toUpperCase()} • {nodes.length} components
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="New Workflow">
              <IconButton color="inherit" onClick={handleNewWorkflow}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open Workflow">
              <IconButton color="inherit" onClick={handleOpenWorkflow}>
                <OpenIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save Workflow">
              <IconButton color="inherit" onClick={handleSave} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Test Workflow">
              <IconButton color="inherit" onClick={handleTest}>
                <PlayIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to YAML">
              <IconButton color="inherit" onClick={handleExport}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import from YAML">
              <IconButton color="inherit" onClick={handleImport}>
                <UploadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Component Panel */}
          <Grid item xs={12} md={3} sx={{ height: '100%', borderRight: '1px solid #e0e0e0' }}>
            <ComponentPanel />
          </Grid>

          {/* Workflow Canvas */}
          <Grid item xs={12} md={9} sx={{ height: '100%' }}>
            <WorkflowCanvas 
              onWorkflowChange={handleWorkflowChange} 
              externalNodes={nodes}
              externalEdges={edges}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Status Bar */}
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={workflow.id ? 'Saved' : 'Unsaved'}
            size="small"
            color={workflow.id ? 'success' : 'warning'}
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            {nodes.length} component{nodes.length !== 1 ? 's' : ''} • {edges.length} connection
            {edges.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          NeMo Agent Toolkit Visual Builder v1.0
        </Typography>
      </Paper>

      {/* New Workflow Dialog */}
      <Dialog open={newWorkflowDialog} onClose={() => setNewWorkflowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={workflow.name}
              onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={workflow.description}
              onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Workflow Type</InputLabel>
              <Select
                value={workflow.workflowType}
                onChange={(e) =>
                  setWorkflow({ 
                    ...workflow, 
                    workflowType: e.target.value as 'react' | 'tool_calling' | 'rewoo' | 'custom' 
                  })
                }
                label="Workflow Type"
              >
                <MenuItem value="react">ReAct Agent</MenuItem>
                <MenuItem value="tool_calling">Tool Calling Agent</MenuItem>
                <MenuItem value="rewoo">ReWOO Agent</MenuItem>
                <MenuItem value="custom">Custom Workflow</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewWorkflowDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateWorkflow} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Test Input"
              multiline
              rows={4}
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter your test message here..."
              sx={{ mb: 2 }}
            />
            {testResult && (
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  {testResult.success ? '✅ Test Result:' : '❌ Test Failed:'}
                </Typography>
                
                {/* Intermediate Steps */}
                {testResult.intermediate_steps && testResult.intermediate_steps.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                      Execution Steps:
                    </Typography>
                    {testResult.intermediate_steps.map((step, idx) => (
                      <Paper key={idx} sx={{ p: 1.5, mb: 1, backgroundColor: 'white', border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Chip 
                            label={`Step ${step.step}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          {step.timestamp && (
                            <Typography variant="caption" color="text.secondary">
                              {step.timestamp}
                            </Typography>
                          )}
                        </Box>
                        
                        {step.type === 'input' && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Input:</strong> {step.content}
                          </Typography>
                        )}
                        
                        {step.thought && (
                          <Typography variant="body2" sx={{ mt: 1, color: '#1976d2' }}>
                            <strong>Thought:</strong> {step.thought}
                          </Typography>
                        )}
                        
                        {step.action && (
                          <Typography variant="body2" sx={{ mt: 1, color: '#2e7d32' }}>
                            <strong>Action:</strong> {step.action}
                          </Typography>
                        )}
                        
                        {step.action_input && (
                          <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            <strong>Input:</strong> {step.action_input}
                          </Typography>
                        )}
                        
                        {step.observation && (
                          <Typography variant="body2" sx={{ mt: 1, color: '#ed6c02' }}>
                            <strong>Observation:</strong> {step.observation}
                          </Typography>
                        )}
                        
                        {step.type === 'final_answer' && (
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: '#2e7d32' }}>
                            <strong>Final Answer:</strong> {step.content}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
                
                {/* Final Output */}
                {testResult.output && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Final Result:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1, p: 1.5, backgroundColor: '#e8f5e9', borderRadius: 1, border: '1px solid #4caf50' }}>
                      {testResult.output}
                    </Typography>
                  </Box>
                )}
                
                {testResult.error && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="error">
                      Error:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1, p: 1, backgroundColor: '#ffebee', borderRadius: 1, color: 'error.main' }}>
                      {testResult.error}
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Execution Time: {testResult.execution_time?.toFixed(2)}s
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)}>Close</Button>
          <Button onClick={handleRunTest} variant="contained" disabled={loading || !testInput}>
            {loading ? <CircularProgress size={24} /> : 'Run Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Open Workflow Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Open Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {savedWorkflows.length === 0 ? (
              <Typography color="text.secondary">No saved workflows found.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {savedWorkflows.map((wf) => (
                  <Paper
                    key={wf.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: '#1976d2',
                      },
                    }}
                    onClick={() => wf.id && handleLoadWorkflow(wf.id)}
                  >
                    <Typography variant="h6">{wf.name}</Typography>
                    {wf.description && (
                      <Typography variant="body2" color="text.secondary">
                        {wf.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip label={wf.workflowType} size="small" />
                      {wf.updatedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Updated: {new Date(wf.updatedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VisualBuilder;
