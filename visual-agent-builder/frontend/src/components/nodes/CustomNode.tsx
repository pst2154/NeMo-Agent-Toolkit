import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Typography, Chip } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Functions as FunctionsIcon,
  SmartToy as LLMIcon,
  Storage as MemoryIcon,
  Search as RetrieverIcon,
  Engineering as ToolIcon,
  Hub as RouterIcon,
  AutoAwesome as AgentIcon,
} from '@mui/icons-material';
import { NodeData } from '../../types/workflow';

const iconMap: Record<string, React.ElementType> = {
  function: FunctionsIcon,
  llm: LLMIcon,
  memory: MemoryIcon,
  retriever: RetrieverIcon,
  tool: ToolIcon,
  router: RouterIcon,
  agent: AgentIcon,
};

const colorMap: Record<string, string> = {
  function: '#4caf50',
  llm: '#2196f3',
  memory: '#ff9800',
  retriever: '#9c27b0',
  tool: '#00bcd4',
  router: '#e91e63',
  agent: '#f44336',
};

export const CustomNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const nodeData = data as NodeData;
  const IconComponent = iconMap[nodeData.componentType] || FunctionsIcon;
  const borderColor = colorMap[nodeData.componentType] || '#757575';
  const isConfigured = nodeData.isConfigured ?? false;

  return (
    <Box
      sx={{
        minWidth: 200,
        background: 'white',
        border: `2px solid ${selected ? borderColor : '#e0e0e0'}`,
        borderRadius: 2,
        boxShadow: selected ? `0 0 0 2px ${borderColor}40` : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Input Handle */}
      {nodeData.componentType !== 'agent' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: borderColor,
            width: 12,
            height: 12,
            border: '2px solid white',
          }}
        />
      )}

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1.5,
          borderBottom: '1px solid #e0e0e0',
          background: `${borderColor}10`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 1,
            background: borderColor,
            color: 'white',
          }}
        >
          <IconComponent fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {nodeData.label}
          </Typography>
          <Chip
            label={nodeData.category}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.7rem',
              mt: 0.5,
              background: `${borderColor}20`,
              color: borderColor,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isConfigured ? (
            <CheckIcon sx={{ fontSize: 16, color: '#4caf50' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 16, color: '#ff9800' }} />
          )}
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {nodeData.description || 'No description'}
        </Typography>
        
        {nodeData.config && Object.keys(nodeData.config).length > 0 && (
          <Box sx={{ mt: 1 }}>
            {Object.entries(nodeData.config).slice(0, 2).map(([key, value]) => (
              <Typography key={key} variant="caption" sx={{ display: 'block', color: '#666' }}>
                <strong>{key}:</strong> {String(value).substring(0, 30)}
                {String(value).length > 30 ? '...' : ''}
              </Typography>
            ))}
            {Object.keys(nodeData.config).length > 2 && (
              <Typography variant="caption" sx={{ color: '#999', fontStyle: 'italic' }}>
                +{Object.keys(nodeData.config).length - 2} more...
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Output Handle */}
      {nodeData.componentType !== 'tool' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: borderColor,
            width: 12,
            height: 12,
            border: '2px solid white',
          }}
        />
      )}
    </Box>
  );
};

