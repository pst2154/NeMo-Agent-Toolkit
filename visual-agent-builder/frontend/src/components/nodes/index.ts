import { CustomNode } from './CustomNode';
import type { NodeTypes } from '@xyflow/react';

export const nodeTypes: NodeTypes = {
  custom: CustomNode as any,
};

export { CustomNode };

