/**
 * Type definitions for workflow builder components
 */

export interface Position {
  x: number;
  y: number;
}

export interface ComponentConfig extends Record<string, any> {
  [key: string]: any;
}

export interface WorkflowComponent {
  id: string;
  name: string;
  type: ComponentType;
  category: string;
  description: string;
  config?: ComponentConfig;
  position?: Position;
}

export type ComponentType = 
  | 'function'
  | 'llm'
  | 'embedder'
  | 'memory'
  | 'retriever'
  | 'agent'
  | 'tool'
  | 'router';

export interface ComponentConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id?: string;
  name: string;
  description: string;
  workflowType: 'react' | 'tool_calling' | 'rewoo' | 'custom';
  components: WorkflowComponent[];
  connections: ComponentConnection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NodeData extends Record<string, any> {
  name?: string;
  label: string;
  componentType: ComponentType;
  category: string;
  description?: string;
  config?: ComponentConfig;
  isConfigured?: boolean;
}

export interface TestResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime?: number;
}
