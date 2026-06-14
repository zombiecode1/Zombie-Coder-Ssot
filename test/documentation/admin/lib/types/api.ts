// API Response Types for Admin Panel

export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeModels: number;
  serverHealth: number;
  systemUptime: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdated: string;
}

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'online' | 'offline' | 'error';
  health: number;
  cpuUsage: number;
  memoryUsage: number;
  lastChecked: string;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'unavailable';
  version: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

export interface MemoryEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ApiError {
  status: number;
  message: string;
  code: string;
}
