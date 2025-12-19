import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Functions as FunctionsIcon,
  SmartToy as LLMIcon,
  Storage as MemoryIcon,
  Search as RetrieverIcon,
  Engineering as ToolIcon,
  Hub as RouterIcon,
  AutoAwesome as AgentIcon,
} from '@mui/icons-material';
import { ComponentType } from '../types/workflow';

interface Component {
  id: string;
  name: string;
  type: ComponentType;
  description: string;
  icon: React.ElementType;
  category: string;
}

const components: Component[] = [
  // Built-in NAT Functions
  {
    id: 'current_datetime',
    name: 'Current DateTime',
    type: 'function',
    description: 'Get the current date and time',
    icon: FunctionsIcon,
    category: 'Utilities',
  },
  {
    id: 'code_execution',
    name: 'Code Execution',
    type: 'function',
    description: 'Execute Python code - great for math, data processing, etc.',
    icon: FunctionsIcon,
    category: 'Utilities',
  },
  {
    id: 'tavily_internet_search',
    name: 'Tavily Search',
    type: 'function',
    description: 'Search the internet using Tavily API',
    icon: FunctionsIcon,
    category: 'Web Search',
  },
  {
    id: 'wiki_search',
    name: 'Wikipedia Search',
    type: 'function',
    description: 'Search Wikipedia for information',
    icon: FunctionsIcon,
    category: 'Web Search',
  },
  // LLMs
  {
    id: 'nim_llm',
    name: 'NIM LLM',
    type: 'llm',
    description: 'NVIDIA NIM hosted language model',
    icon: LLMIcon,
    category: 'Language Models',
  },
  {
    id: 'openai_llm',
    name: 'OpenAI LLM',
    type: 'llm',
    description: 'OpenAI GPT language model',
    icon: LLMIcon,
    category: 'Language Models',
  },
  {
    id: 'local_llm',
    name: 'Local LLM',
    type: 'llm',
    description: 'Locally hosted language model',
    icon: LLMIcon,
    category: 'Language Models',
  },
  // Memory
  {
    id: 'conversation_memory',
    name: 'Conversation Memory',
    type: 'memory',
    description: 'Store conversation history',
    icon: MemoryIcon,
    category: 'Memory',
  },
  {
    id: 'vector_memory',
    name: 'Vector Memory',
    type: 'memory',
    description: 'Store embeddings for RAG',
    icon: MemoryIcon,
    category: 'Memory',
  },
  // Retrievers
  {
    id: 'vector_retriever',
    name: 'Vector Retriever',
    type: 'retriever',
    description: 'Retrieve relevant documents from vector store',
    icon: RetrieverIcon,
    category: 'Retrievers',
  },
  {
    id: 'web_search',
    name: 'Web Search',
    type: 'retriever',
    description: 'Search the web for information',
    icon: RetrieverIcon,
    category: 'Retrievers',
  },
  // Agents
  {
    id: 'react_agent',
    name: 'ReAct Agent',
    type: 'agent',
    description: 'Reasoning and acting agent',
    icon: AgentIcon,
    category: 'Agents',
  },
  {
    id: 'tool_calling_agent',
    name: 'Tool Calling Agent',
    type: 'agent',
    description: 'Function calling agent',
    icon: AgentIcon,
    category: 'Agents',
  },
  // Tools
  {
    id: 'web_scraper',
    name: 'Web Scraper',
    type: 'tool',
    description: 'Scrape content from websites',
    icon: ToolIcon,
    category: 'Tools',
  },
  {
    id: 'file_reader',
    name: 'File Reader',
    type: 'tool',
    description: 'Read content from files',
    icon: ToolIcon,
    category: 'Tools',
  },
  // Router
  {
    id: 'conditional_router',
    name: 'Conditional Router',
    type: 'router',
    description: 'Route based on conditions',
    icon: RouterIcon,
    category: 'Control Flow',
  },
];

const ComponentPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Utilities', 'Language Models'])
  );

  const filteredComponents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return components.filter(
      (component) =>
        component.name.toLowerCase().includes(term) ||
        component.description.toLowerCase().includes(term) ||
        component.category.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const groupedComponents = useMemo(() => {
    return filteredComponents.reduce((acc, component) => {
      if (!acc[component.category]) {
        acc[component.category] = [];
      }
      acc[component.category].push(component);
      return acc;
    }, {} as Record<string, Component[]>);
  }, [filteredComponents]);

  const onDragStart = (event: React.DragEvent, component: Component) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryToggle = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom>
          Component Library
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} available
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {Object.entries(groupedComponents).map(([category, categoryComponents]) => (
          <Accordion
            key={category}
            expanded={expandedCategories.has(category)}
            onChange={() => handleCategoryToggle(category)}
            disableGutters
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                minHeight: 48,
                '&.Mui-expanded': { minHeight: 48 },
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {category} ({categoryComponents.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense disablePadding>
                {categoryComponents.map((component) => (
                  <Tooltip
                    key={component.id}
                    title={component.description}
                    placement="right"
                    arrow
                  >
                    <ListItem
                      draggable
                      onDragStart={(e) => onDragStart(e, component)}
                      sx={{
                        px: 2,
                        py: 1,
                        cursor: 'grab',
                        borderLeft: '3px solid transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                          borderLeftColor: '#1976d2',
                        },
                        '&:active': {
                          cursor: 'grabbing',
                          backgroundColor: '#e3f2fd',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <component.icon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {component.name}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {component.description}
                          </Typography>
                        }
                      />
                      <Chip
                        label={component.type}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                        }}
                      />
                    </ListItem>
                  </Tooltip>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
};

export default ComponentPanel;
