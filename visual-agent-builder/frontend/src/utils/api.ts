/**
 * API client for Visual Agent Builder backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.detail || `HTTP error! status: ${response.status}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Workflows
  async getWorkflows() {
    return this.request<any[]>('/api/workflows');
  }

  async getWorkflow(id: string) {
    return this.request<any>(`/api/workflows/${id}`);
  }

  async createWorkflow(workflow: any) {
    return this.request<any>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: any) {
    return this.request<any>(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string) {
    return this.request<any>(`/api/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  // Components
  async getComponents() {
    return this.request<any[]>('/api/components');
  }

  async validateComponent(component: any) {
    return this.request<any>('/api/validation/component', {
      method: 'POST',
      body: JSON.stringify(component),
    });
  }

  // Export
  async exportWorkflow(id: string, format: 'yaml' | 'json' = 'yaml') {
    return this.request<any>(`/api/export/${id}?format=${format}`);
  }

  async generateWorkflowYAML(workflowData: any) {
    return this.request<any>('/api/export/generate', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  // Testing
  async testWorkflow(id: string, input: any) {
    return this.request<any>(`/api/testing/${id}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

