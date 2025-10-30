export interface PterodactylServer {
  object: 'server';
  attributes: {
    id: string;
    external_id: string | null;
    uuid: string;
    identifier: string;
    name: string;
    description: string;
    status: string;
    suspended: boolean;
    limits: {
      memory: number;
      swap: number;
      disk: number;
      io: number;
      cpu: number;
    };
    feature_limits: {
      databases: number;
      allocations: number;
      backups: number;
    };
    user: number;
    node: number;
    allocation: number;
    nest: number;
    egg: number;
    pack: number | null;
    container: {
      startup_command: string;
      image: string;
      installed: boolean;
      environment: Record<string, string>;
    };
    created_at: string;
    updated_at: string;
  };
}

export interface PterodactylNode {
  object: 'node';
  attributes: {
    id: number;
    uuid: string;
    public: boolean;
    name: string;
    description: string;
    location_id: number;
    fqdn: string;
    scheme: string;
    behind_proxy: boolean;
    daemon_base: string;
    daemon_sftp: number;
    daemon_listen: number;
    memory: number;
    memory_overallocate: number;
    disk: number;
    disk_overallocate: number;
    upload_size: number;
    daemon_key: string;
    created_at: string;
    updated_at: string;
  };
}

export interface PterodactylResourceUsage {
  object: 'stats';
  attributes: {
    state: string;
    resources: {
      memory_bytes: number;
      cpu_absolute: number;
      network_rx_bytes: number;
      network_tx_bytes: number;
      disk_bytes: number;
    };
  };
}

class PterodactylAPI {
  private baseURL: string;
  private apiKey: string;
  private applicationKey: string;
  private demoMode: boolean;

  constructor() {
    this.baseURL = 'https://panel.androwproject.cloud';
    this.apiKey = '';
    this.applicationKey = 'ptla_oaieo4yp4BQP3VXosTCjRkE8QaX1zGvLevxca1ncDx5';
    this.demoMode = false; // Start with real mode
  }

  async loadConfigFromDatabase() {
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/owner/api-config?name=Pterodactyl`);
      if (response.ok) {
        const config = await response.json();
        if (config && config.isActive) {
          this.baseURL = config.apiUrl;
          this.applicationKey = config.apiKey;
          this.demoMode = false;
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load Pterodactyl config from database:', error);
    }
    return false;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Demo mode - return mock data
    if (this.demoMode) {
      return this.getMockData(endpoint);
    }

    const url = `${this.baseURL}/api/application${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.applicationKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Pterodactyl-NodePanel/1.0',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pterodactyl API Error (${response.status}):`, errorText);
      throw new Error(`Pterodactyl API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private getMockData(endpoint: string) {
    // Mock server data for demo
    if (endpoint.includes('/servers')) {
      return {
        data: [
          {
            object: 'server',
            attributes: {
              id: '1',
              external_id: null,
              uuid: '123e4567-e89b-12d3-a456-426614174000',
              identifier: 'mc1',
              name: 'Minecraft Survival Server',
              description: 'Main survival world for community',
              status: 'running',
              suspended: false,
              limits: {
                memory: 2048,
                swap: 0,
                disk: 10240,
                io: 500,
                cpu: 100
              },
              feature_limits: {
                databases: 2,
                allocations: 2,
                backups: 1
              },
              user: 1,
              node: 1,
              allocation: 1,
              nest: 1,
              egg: 1,
              pack: null,
              container: {
                startup_command: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar',
                image: 'ghcr.io/pterodactyl/yolks:java_17',
                installed: true,
                environment: {
                  SERVER_JARFILE: 'server.jar',
                  VERSION: 'latest'
                }
              },
              created_at: '2024-01-15T10:30:00.000000Z',
              updated_at: '2024-01-20T15:45:00.000000Z'
            }
          },
          {
            object: 'server',
            attributes: {
              id: '2',
              external_id: null,
              uuid: '456e7890-e89b-12d3-a456-426614174111',
              identifier: 'rust1',
              name: 'Rust Vanilla Server',
              description: 'PVP focused Rust server',
              status: 'stopped',
              suspended: false,
              limits: {
                memory: 4096,
                swap: 0,
                disk: 20480,
                io: 500,
                cpu: 200
              },
              feature_limits: {
                databases: 1,
                allocations: 3,
                backups: 2
              },
              user: 1,
              node: 1,
              allocation: 2,
              nest: 2,
              egg: 2,
              pack: null,
              container: {
                startup_command: './RustDedicated -batchmode -nographics -server.port {{SERVER_PORT}}',
                image: 'ghcr.io/pterodactyl/yolks:rust',
                installed: true,
                environment: {
                  SERVER_PORT: '28015',
                  SERVER_IDENTITY: 'rust_server'
                }
              },
              created_at: '2024-01-10T08:15:00.000000Z',
              updated_at: '2024-01-18T12:30:00.000000Z'
            }
          },
          {
            object: 'server',
            attributes: {
              id: '3',
              external_id: null,
              uuid: '789e0123-e89b-12d3-a456-426614174222',
              identifier: 'fivem1',
              name: 'FiveM Roleplay Server',
              description: 'Custom FiveM roleplay experience',
              status: 'starting',
              suspended: false,
              limits: {
                memory: 3072,
                swap: 1024,
                disk: 15360,
                io: 500,
                cpu: 150
              },
              feature_limits: {
                databases: 3,
                allocations: 5,
                backups: 3
              },
              user: 1,
              node: 2,
              allocation: 3,
              nest: 3,
              egg: 3,
              pack: null,
              container: {
                startup_command: './run.sh +exec server.cfg',
                image: 'ghcr.io/pterodactyl/yolks:fivem',
                installed: true,
                environment: {
                  BUILD_TYPE: 'latest',
                  MAX_CLIENTS: '32',
                  SERVER_NAME: 'A&S Roleplay'
                }
              },
              created_at: '2024-01-05T14:20:00.000000Z',
              updated_at: '2024-01-22T09:15:00.000000Z'
            }
          }
        ]
      };
    }

    // Mock resources data
    if (endpoint.includes('/resources')) {
      return {
        data: {
          object: 'stats',
          attributes: {
            state: 'running',
            resources: {
              memory_bytes: 1073741824, // 1GB
              cpu_absolute: 45.5,
              network_rx_bytes: 52428800, // 50MB
              network_tx_bytes: 31457280, // 30MB
              disk_bytes: 2147483648 // 2GB
            }
          }
        }
      };
    }

    // Mock nodes data
    if (endpoint.includes('/nodes')) {
      return {
        data: [
          {
            object: 'node',
            attributes: {
              id: 1,
              uuid: 'node-uuid-1',
              public: true,
              name: 'Node 1 - Jakarta',
              description: 'Primary game server node',
              location_id: 1,
              fqdn: 'node1.asstudio.com',
              scheme: 'https',
              behind_proxy: false,
              daemon_base: '/var/lib/pterodactyl/volumes',
              daemon_sftp: 2022,
              daemon_listen: 8080,
              memory: 16384,
              memory_overallocate: 0,
              disk: 512000,
              disk_overallocate: 0,
              upload_size: 100,
              daemon_key: 'demo-key',
              created_at: '2024-01-01T00:00:00.000000Z',
              updated_at: '2024-01-01T00:00:00.000000Z'
            }
          }
        ]
      };
    }

    return { data: [] };
  }

  async getServers(): Promise<{ data: PterodactylServer[] }> {
    try {
      // Try to load config from database first
      await this.loadConfigFromDatabase();
      
      const response = await this.makeRequest('/servers?include=egg,node,allocations');
      return response;
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      throw error;
    }
  }

  async getServer(serverId: string): Promise<{ data: PterodactylServer }> {
    try {
      // Try to load config from database first
      await this.loadConfigFromDatabase();
      
      const response = await this.makeRequest(`/servers/${serverId}?include=egg,node,allocations`);
      return response;
    } catch (error) {
      console.error('Failed to fetch server:', error);
      throw error;
    }
  }

  async getServerResources(serverId: string): Promise<{ data: PterodactylResourceUsage }> {
    try {
      // Try to load config from database first
      await this.loadConfigFromDatabase();
      
      const response = await this.makeRequest(`/servers/${serverId}/resources`);
      return response;
    } catch (error) {
      console.error('Failed to fetch server resources:', error);
      throw error;
    }
  }

  async getNodes(): Promise<{ data: PterodactylNode[] }> {
    try {
      // Try to load config from database first
      await this.loadConfigFromDatabase();
      
      const response = await this.makeRequest('/nodes');
      return response;
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
      throw error;
    }
  }

  async powerAction(serverId: string, action: 'start' | 'stop' | 'restart' | 'kill'): Promise<void> {
    try {
      // Demo mode - just log the action
      if (this.demoMode) {
        console.log(`Demo: ${action} server ${serverId}`);
        return;
      }

      await this.makeRequest(`/servers/${serverId}/power`, {
        method: 'POST',
        body: JSON.stringify({
          signal: action,
        }),
      });
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
      throw error;
    }
  }

  async createServer(data: any): Promise<{ data: PterodactylServer }> {
    try {
      const response = await this.makeRequest('/servers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Failed to create server:', error);
      throw error;
    }
  }

  async deleteServer(serverId: string): Promise<void> {
    try {
      await this.makeRequest(`/servers/${serverId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete server:', error);
      throw error;
    }
  }

  async updateServer(serverId: string, data: any): Promise<{ data: PterodactylServer }> {
    try {
      const response = await this.makeRequest(`/servers/${serverId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Failed to update server:', error);
      throw error;
    }
  }
}

export const pterodactylAPI = new PterodactylAPI();