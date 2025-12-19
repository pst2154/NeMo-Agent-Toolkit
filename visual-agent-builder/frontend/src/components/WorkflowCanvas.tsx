import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  FitScreen as FitScreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { nodeTypes } from './nodes';
import { NodeData } from '../types/workflow';
import ConfigurationDialog from './ConfigurationDialog';

const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge[] = [];

interface WorkflowCanvasProps {
  onWorkflowChange?: (nodes: Node<NodeData>[], edges: Edge[]) => void;
  externalNodes?: Node<NodeData>[];
  externalEdges?: Edge[];
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ onWorkflowChange, externalNodes, externalEdges }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(externalNodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(externalEdges || initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Update nodes and edges when external props change
  React.useEffect(() => {
    if (externalNodes && externalNodes.length > 0) {
      setNodes(externalNodes);
      setTimeout(() => fitView({ duration: 300 }), 100);
    }
  }, [externalNodes, setNodes, fitView]);

  React.useEffect(() => {
    if (externalEdges && externalEdges.length > 0) {
      setEdges(externalEdges);
    }
  }, [externalEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(
        {
          ...params,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#1976d2', strokeWidth: 2 },
        },
        edges
      );
      setEdges(newEdges);
      onWorkflowChange?.(nodes, newEdges);
      setSnackbar({ open: true, message: 'Components connected', severity: 'success' });
    },
    [edges, nodes, onWorkflowChange, setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
    setConfigDialogOpen(true);
  }, []);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
    setConfigDialogOpen(true);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const data = event.dataTransfer.getData('application/reactflow');

      if (typeof data === 'undefined' || !data || !reactFlowBounds) {
        return;
      }

      try {
        const componentData = JSON.parse(data);
        
        // Smart positioning based on component type and existing nodes
        let position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 50,
        };

        // If this is the first node, center it nicely
        if (nodes.length === 0) {
          position = {
            x: (reactFlowBounds.width / 2) - 100,
            y: 100,
          };
        } else {
          // Auto-layout based on component type
          const componentType = componentData.type;
          const existingNodesOfType = nodes.filter(n => n.data.componentType === componentType);
          
          // Create a nice vertical layout with horizontal spacing for different types
          const baseX = componentType === 'llm' ? 50 : 
                       componentType === 'function' ? 300 : 
                       componentType === 'agent' ? 550 : 
                       300;
          const baseY = 100;
          const verticalSpacing = 150;
          
          // Stack components of same type vertically
          position = {
            x: baseX,
            y: baseY + (existingNodesOfType.length * verticalSpacing),
          };
        }

        const newNode: Node<NodeData> = {
          id: `${componentData.id}-${Date.now()}`,
          type: 'custom',
          position,
          data: {
            name: componentData.id, // Use the component ID (actual function name) not display name
            label: componentData.name, // Display name for UI
            componentType: componentData.type,
            category: componentData.category,
            description: componentData.description,
            config: {},
            isConfigured: false,
          },
        };

        const newNodes = nodes.concat(newNode);
        setNodes(newNodes);
        onWorkflowChange?.(newNodes, edges);
        setSnackbar({ open: true, message: `Added ${componentData.name}`, severity: 'success' });
        
        // Auto-fit view after adding component
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 300 });
        }, 50);
      } catch (error) {
        console.error('Error parsing dropped component:', error);
        setSnackbar({ open: true, message: 'Error adding component', severity: 'error' });
      }
    },
    [nodes, edges, onWorkflowChange, setNodes, fitView]
  );

  const handleConfigSave = useCallback(
    (config: any) => {
      if (selectedNode) {
        const updatedNodes = nodes.map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  config,
                  isConfigured: true,
                },
              }
            : node
        );
        setNodes(updatedNodes);
        onWorkflowChange?.(updatedNodes, edges);
        setConfigDialogOpen(false);
        setSnackbar({ open: true, message: 'Configuration saved', severity: 'success' });
      }
    },
    [selectedNode, nodes, edges, onWorkflowChange, setNodes]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedNode) {
      const updatedNodes = nodes.filter((node) => node.id !== selectedNode.id);
      const updatedEdges = edges.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      );
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      onWorkflowChange?.(updatedNodes, updatedEdges);
      setSelectedNode(null);
      setSnackbar({ open: true, message: 'Component deleted', severity: 'success' });
    }
  }, [selectedNode, nodes, edges, onWorkflowChange, setNodes, setEdges]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <Paper elevation={3} sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
            p: 1.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Workflow Canvas
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {nodes.length} component{nodes.length !== 1 ? 's' : ''} • {edges.length} connection
            {edges.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Floating Controls */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            display: 'flex',
            gap: 1,
          }}
        >
          <Tooltip title="Fit View">
            <IconButton
              onClick={handleFitView}
              sx={{
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { background: '#f5f5f5' },
              }}
            >
              <FitScreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton
              onClick={handleZoomIn}
              sx={{
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { background: '#f5f5f5' },
              }}
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton
              onClick={handleZoomOut}
              sx={{
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { background: '#f5f5f5' },
              }}
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          {selectedNode && (
            <Tooltip title="Delete Selected">
              <IconButton
                onClick={handleDeleteSelected}
                sx={{
                  background: 'white',
                  color: '#f44336',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { background: '#ffebee' },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ height: '100%', width: '100%' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls showInteractive={false} />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e0e0e0" />
            <MiniMap
              nodeColor={(node) => {
                const colorMap: Record<string, string> = {
                  function: '#4caf50',
                  llm: '#2196f3',
                  memory: '#ff9800',
                  retriever: '#9c27b0',
                  tool: '#00bcd4',
                  router: '#e91e63',
                  agent: '#f44336',
                };
                const nodeData = node.data as NodeData;
                return colorMap[nodeData.componentType] || '#757575';
              }}
              maskColor="rgba(0, 0, 0, 0.05)"
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: 8,
              }}
            />
          </ReactFlow>
        </Box>
      </Paper>

      {/* Configuration Dialog */}
      <ConfigurationDialog
        open={configDialogOpen}
        node={selectedNode}
        onClose={() => setConfigDialogOpen(false)}
        onSave={handleConfigSave}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Wrap with ReactFlowProvider for drag-and-drop functionality
const WorkflowCanvasWrapper: React.FC<WorkflowCanvasProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowCanvas {...props} />
  </ReactFlowProvider>
);

export default WorkflowCanvasWrapper;
