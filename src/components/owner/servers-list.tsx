'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Server, 
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  RefreshCw,
  BarChart3,
  Settings,
  Database,
  ExternalLink,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PterodactylServer {
  object: 'server';
  attributes: {
    id: string;
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
    node: number;
    allocation: number;
    nest: number;
    egg: number;
    created_at: string;
    updated_at: string;
  };
}

interface ServerResources {
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

export default function ServersList() {
  const [servers, setServers] = useState<PterodactylServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [serverResources, setServerResources] = useState<Record<string, ServerResources>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [settingsServer, setSettingsServer] = useState<string | null>(null);
  const [serverSettings, setServerSettings] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [dbConnectionStatus, setDbConnectionStatus] = useState<Record<string, 'connected' | 'failed' | 'testing' | null>>({});
  const [dbConnectionError, setDbConnectionError] = useState<Record<string, string>>({});
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    details?: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
    details: ''
  });

  useEffect(() => {
    fetchServers();
    fetchUsers();
    // Auto refresh servers and resources every 5 seconds
    const interval = setInterval(() => {
      fetchServers(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Load settings for all servers when servers are loaded
  useEffect(() => {
    if (servers.length > 0) {
      servers.forEach(server => {
        if (!serverSettings[server.attributes.id]) {
          loadServerSettings(server.attributes.id);
        }
      });
    }
  }, [servers]);

  const loadServerSettings = async (serverId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/owner/servers/${serverId}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          // Convert empty string to "none" for Select component
          const normalizedSettings = {
            ...data.settings,
            assignedUserId: data.settings.assignedUserId || "none"
          };
          setServerSettings(prev => ({
            ...prev,
            [serverId]: normalizedSettings
          }));
        } else {
          // Set default settings if none exist
          setServerSettings(prev => ({
            ...prev,
            [serverId]: {
              assignedUserId: 'none',
              panelUrl: '',
              txadminUrl: '',
              databaseHost: '',
              databasePort: 3306,
              databaseName: '',
              databaseUser: '',
              databasePassword: ''
            }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch server settings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/owner/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const openSettings = async (serverId: string) => {
    setSettingsServer(serverId);
    
    // Load existing settings for this server
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/owner/servers/${serverId}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          // Convert empty string to "none" for Select component
          const normalizedSettings = {
            ...data.settings,
            assignedUserId: data.settings.assignedUserId || "none"
          };
          setServerSettings(prev => ({
            ...prev,
            [serverId]: normalizedSettings
          }));
        } else {
          // Set default settings if none exist
          setServerSettings(prev => ({
            ...prev,
            [serverId]: {
              assignedUserId: 'none',
              panelUrl: '',
              txadminUrl: '',
              databaseHost: '',
              databasePort: 3306,
              databaseName: '',
              databaseUser: '',
              databasePassword: ''
            }
          }));
        }
      } else {
        // Set default settings if error
        setServerSettings(prev => ({
          ...prev,
          [serverId]: {
            assignedUserId: '',
            panelUrl: '',
            txadminUrl: '',
            databaseHost: '',
            databasePort: 3306,
            databaseName: '',
            databaseUser: '',
            databasePassword: ''
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch server settings:', error);
      setServerSettings(prev => ({
        ...prev,
        [serverId]: {
          assignedUserId: '',
          panelUrl: '',
          txadminUrl: '',
          databaseHost: '',
          databasePort: 3306,
          databaseName: '',
          databaseUser: '',
          databasePassword: ''
        }
      }));
    }
  };

  const saveSettings = async () => {
    console.log('🔍 Save settings for server:', settingsServer);
    
    try {
      setSavingSettings(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        toast.error('Please login to save settings');
        return;
      }

      const currentSettings = serverSettings[settingsServer] || {};
      // Convert "none" back to empty string for database storage
      const cleanSettings = {
        ...currentSettings,
        assignedUserId: currentSettings.assignedUserId === "none" ? "" : currentSettings.assignedUserId
      };
      const payload = { 
        settings: cleanSettings
      };
      console.log('🔍 Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/owner/servers/${settingsServer}/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('🔍 Response:', response.status, responseData);

      if (response.ok) {
        // Show detailed success alert
        setAlertDialog({
          open: true,
          type: 'success',
          title: '✅ Server Settings Berhasil Disimpan!',
          message: 'Semua konfigurasi server telah berhasil disimpan ke database.',
          details: responseData.message || 'Settings berhasil diupdate untuk server ID: ' + settingsServer
        });
        
        // Update local state with response data
        if (responseData.settings) {
          // Convert empty string to "none" for Select component
          const normalizedSettings = {
            ...responseData.settings,
            assignedUserId: responseData.settings.assignedUserId || "none"
          };
          setServerSettings(prev => ({
            ...prev,
            [settingsServer]: normalizedSettings
          }));
        }
        
        // Test database connection if database settings are provided
        const settings = serverSettings[settingsServer];
        if (settings?.databaseHost && settings?.databaseName && settings?.databaseUser) {
          await testDatabaseConnection(settingsServer, settings);
        }
        
        setSettingsServer(null);
      } else {
        // Show detailed error alert
        let errorMessage = responseData.error || 'Unknown error occurred. Status: ' + response.status;
        let errorDetails = responseData.details || '';
        
        // If server not found, provide helpful solution
        if (responseData.error && responseData.error.includes('tidak ditemukan di database')) {
          errorMessage = '❌ Server Tidak Ditemukan!';
          errorDetails = `Server dengan ID '${settingsServer}' tidak ada di database lokal.\n\n🔧 SOLUSI:\n1. Refresh halaman ini (F5) untuk clear cache\n2. Klik tombol "Sync Servers" di atas untuk sinkronisasi data dari Pterodactyl panel\n3. Tunggu hingga proses sync selesai\n4. Coba konfigurasi ulang server settings\n\nJika masalah berlanjut, pastikan server ada di Pterodactyl panel dan API credentials sudah benar.`;
        }
        
        setAlertDialog({
          open: true,
          type: 'error',
          title: '❌ Gagal Menyimpan Server Settings!',
          message: errorMessage,
          details: errorDetails
        });
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setAlertDialog({
        open: true,
        type: 'error',
        title: '❌ Error Saat Menyimpan Settings!',
        message: 'Terjadi error tak terduga saat mencoba menyimpan konfigurasi.',
        details: error.message || 'Network error atau server tidak merespon. Silakan coba lagi.'
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const testDatabaseConnection = async (serverId: string, settings: any) => {
    try {
      setDbConnectionStatus(prev => ({ ...prev, [serverId]: 'testing' }));
      setDbConnectionError(prev => ({ ...prev, [serverId]: '' }));
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/owner/test-database-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          host: settings.databaseHost,
          port: settings.databasePort || 3306,
          database: settings.databaseName,
          username: settings.databaseUser,
          password: settings.databasePassword
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setDbConnectionStatus(prev => ({ ...prev, [serverId]: 'connected' }));
        toast.success('Database connection successful!');
      } else {
        setDbConnectionStatus(prev => ({ ...prev, [serverId]: 'failed' }));
        setDbConnectionError(prev => ({ ...prev, [serverId]: result.error || 'Connection failed' }));
        toast.error(`Database connection failed: ${result.error || 'Unknown error'}`);
        
        // Show detailed error alert for database connection
        setAlertDialog({
          open: true,
          type: 'error',
          title: '❌ Database Connection Failed!',
          message: 'Tidak dapat terhubung ke database dengan konfigurasi yang diberikan.',
          details: `Error: ${result.error || 'Unknown error'}\n\nHost: ${settings.databaseHost}\nPort: ${settings.databasePort || 3306}\nDatabase: ${settings.databaseName}\nUsername: ${settings.databaseUser}`
        });
      }
    } catch (error) {
      setDbConnectionStatus(prev => ({ ...prev, [serverId]: 'failed' }));
      setDbConnectionError(prev => ({ ...prev, [serverId]: 'Connection test failed' }));
      toast.error('Database connection test failed');
    }
  };

  const createTestServer = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/owner/create-test-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Test server created successfully!');
        fetchServers(false); // Refresh server list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create test server');
      }
    } catch (error) {
      console.error('Failed to create test server:', error);
      toast.error('Failed to create test server');
    }
  };

  const syncServers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/owner/sync-servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        setAlertDialog({
          open: true,
          type: 'success',
          title: '✅ Server Sync Berhasil!',
          message: result.message,
          details: result.details || `Total servers dari Pterodactyl: ${result.totalServers}\nServer baru: ${result.newServers}\nServer diupdate: ${result.updatedServers}\n📝 Server settings tetap aman!`
        });
        // Clear cache and refresh server list
        setServers([]);
        setServerSettings({});
        setServerResources({});
        fetchServers(false); // Refresh server list
      } else {
        setAlertDialog({
          open: true,
          type: 'error',
          title: '❌ Server Sync Gagal!',
          message: result.error || 'Gagal sync servers dari Pterodactyl',
          details: result.details || 'Silakan periksa konfigurasi Pterodactyl API'
        });
      }
    } catch (error: any) {
      console.error('Failed to sync servers:', error);
      setAlertDialog({
        open: true,
        type: 'error',
        title: '❌ Server Sync Error!',
        message: 'Terjadi error saat sync servers',
        details: error.message || 'Network error atau server tidak merespon'
      });
    }
  };

  const fetchServers = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
        // Clear cache when manually refreshing
        setServers([]);
        setServerSettings({});
        setServerResources({});
      }
      
      const token = localStorage.getItem('auth_token');
      let response = await fetch('/api/owner/local-servers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let data;
      let isLocalServers = false;
      
      // If local servers API fails, try Pterodactyl API
      if (!response.ok) {
        console.log('Local servers API failed, trying Pterodactyl API...');
        response = await fetch('/api/owner/servers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          data = await response.json();
          isLocalServers = false;
        } else {
          throw new Error('Failed to fetch both local and Pterodactyl servers');
        }
      } else {
        data = await response.json();
        isLocalServers = true;
      }
      
      setServers(data.data || []);
      setLastUpdated(new Date());
      setIsDemoMode(isLocalServers);
      
      // Fetch initial resources for all servers
      if (data.data && data.data.length > 0) {
        fetchAllResources();
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      if (!isAutoRefresh) {
        toast.error('Failed to load servers');
      }
    } finally {
      if (isAutoRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchAllResources = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const resourcePromises = servers.map(async (server) => {
        const response = await fetch(`/api/owner/servers?serverId=${server.attributes.id}&action=resources`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          return { serverId: server.attributes.id, resources: data };
        }
        return null;
      });

      const results = await Promise.all(resourcePromises);
      const newResources: Record<string, ServerResources> = {};
      
      results.forEach(result => {
        if (result) {
          newResources[result.serverId] = result.resources;
        }
      });
      
      setServerResources(newResources);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const getStatusColor = (status: string, suspended: boolean, resources?: ServerResources) => {
    if (suspended) return 'bg-orange-500'; // Suspended status
    
    // Get real-time status from resources if available
    if (resources?.attributes?.state) {
      status = resources.attributes.state;
    }
    
    if (!status) return 'bg-gray-500'; // Default color for null/undefined status
    
    switch (status.toLowerCase()) {
      case 'running':
      case 'on':
        return 'bg-green-500';
      case 'stopped':
      case 'off':
        return 'bg-red-500';
      case 'starting':
        return 'bg-yellow-500';
      case 'stopping':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string, suspended: boolean, resources?: ServerResources) => {
    if (suspended) return 'SUSPENDED';
    
    // Get real-time status from resources if available
    if (resources?.attributes?.state) {
      status = resources.attributes.state;
    }
    
    if (!status) return 'UNKNOWN';
    
    switch (status.toLowerCase()) {
      case 'running':
      case 'on':
        return 'ONLINE';
      case 'stopped':
      case 'off':
        return 'OFFLINE';
      case 'starting':
        return 'STARTING';
      case 'stopping':
        return 'STOPPING';
      default:
        return status.toUpperCase();
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) {
      return (mb / 1024).toFixed(1) + ' GB';
    }
    return mb + ' MB';
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gray-900/50 border-white/10">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Service Management</h2>
          <p className="text-gray-400">Manage your game servers and services</p>
          {isDemoMode && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Local Mode
              </Badge>
              <span className="text-sm text-blue-400">
                Using local database servers - Configure Pterodactyl API to sync live servers
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Last updated: {formatLastUpdated(lastUpdated)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 hover:bg-white/10"
            onClick={() => fetchServers(false)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            onClick={syncServers}
          >
            <Database className="w-4 h-4 mr-2" />
            Sync Servers
          </Button>
          <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
            <Server className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {servers.length === 0 ? (
        <Card className="bg-gray-900/50 border-white/10">
          <CardContent className="p-12 text-center">
            <Server className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No Servers Found</h3>
            <p className="text-gray-400 mb-6">
              No servers available. Configure Pterodactyl panel to sync servers or create local servers for testing.
            </p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                Configure Pterodactyl
              </Button>
              <Button 
                variant="outline"
                className="border-white/20 hover:bg-white/10"
                onClick={() => {
                  // Create a test server
                  createTestServer();
                }}
              >
                Create Test Server
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {servers.map((server) => {
            const resources = serverResources[server.attributes.id];
            
            return (
              <Card key={server.attributes.id} className="bg-gray-900/50 border-white/10 hover:border-pink-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-white">
                          {server.attributes.name}
                        </CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(server.attributes.status, server.attributes.suspended, resources)} text-white font-semibold`}
                        >
                          {getStatusText(server.attributes.status, server.attributes.suspended, resources)}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">
                        {server.attributes.description || 'No description'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        ID: {server.attributes.identifier} • UUID: {server.attributes.uuid}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                        onClick={() => window.open(`/database-control`, '_blank')}
                      >
                        <Database className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                        onClick={() => setSelectedServer(
                          selectedServer === server.attributes.id ? null : server.attributes.id
                        )}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                        onClick={() => openSettings(server.attributes.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-400">Memory</p>
                        <p className="text-sm text-white">
                          {resources 
                            ? formatBytes(resources.attributes.resources.memory_bytes)
                            : formatMemory(server.attributes.limits.memory)
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-400">CPU</p>
                        <p className="text-sm text-white">
                          {resources 
                            ? `${resources.attributes.resources.cpu_absolute.toFixed(1)}%`
                            : `${server.attributes.limits.cpu}%`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-yellow-400" />
                      <div>
                        <p className="text-xs text-gray-400">Disk</p>
                        <p className="text-sm text-white">
                          {resources 
                            ? formatBytes(resources.attributes.resources.disk_bytes)
                            : formatMemory(server.attributes.limits.disk)
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Network</p>
                        <p className="text-sm text-white">
                          {resources 
                            ? `${formatBytes(resources.attributes.resources.network_rx_bytes + resources.attributes.resources.network_tx_bytes)}/s`
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Node: {server.attributes.node} • Allocation: {server.attributes.allocation}
                    </div>
                  </div>

                  {/* Quick Access Buttons */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Quick Access</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"
                        onClick={() => {
                          const settings = serverSettings[server.attributes.id];
                          if (settings?.panelUrl) {
                            window.open(settings.panelUrl, '_blank');
                          } else {
                            toast.error('Panel URL not configured. Please set it in server settings.');
                          }
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Panel
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                        onClick={() => {
                          const settings = serverSettings[server.attributes.id];
                          if (settings?.txadminUrl) {
                            window.open(settings.txadminUrl, '_blank');
                          } else {
                            toast.error('TXAdmin URL not configured. Please set it in server settings.');
                          }
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        TXAdmin
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 ${
                          dbConnectionStatus[server.attributes.id] === 'testing' ? 'animate-pulse' : ''
                        }`}
                        onClick={() => {
                          const settings = serverSettings[server.attributes.id];
                          if (settings?.databaseHost) {
                            testDatabaseConnection(server.attributes.id, settings);
                          } else {
                            toast.error('Database not configured. Please set it in server settings.');
                          }
                        }}
                      >
                        <Database className="w-3 h-3 mr-1" />
                        Database
                        {dbConnectionStatus[server.attributes.id] === 'testing' && (
                          <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Database Connection Status */}
                  {serverSettings[server.attributes.id]?.databaseHost && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Database Status:</span>
                        {dbConnectionStatus[server.attributes.id] === 'connected' && (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                        )}
                        {dbConnectionStatus[server.attributes.id] === 'failed' && (
                          <div className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Failed</span>
                            {dbConnectionError[server.attributes.id] && (
                              <span className="text-xs text-red-300 ml-1">
                                ({dbConnectionError[server.attributes.id]})
                              </span>
                            )}
                          </div>
                        )}
                        {dbConnectionStatus[server.attributes.id] === 'testing' && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Testing...</span>
                          </div>
                        )}
                        {!dbConnectionStatus[server.attributes.id] && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">Not tested</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedServer === server.attributes.id && resources && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-4">Resource Usage</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Memory Usage</p>
                          <div className="mt-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min((resources.attributes.resources.memory_bytes / (server.attributes.limits.memory * 1024 * 1024)) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">CPU Usage</p>
                          <div className="mt-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(resources.attributes.resources.cpu_absolute, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Disk Usage</p>
                          <div className="mt-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min((resources.attributes.resources.disk_bytes / (server.attributes.limits.disk * 1024 * 1024)) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Network I/O</p>
                          <div className="mt-1 bg-gray-700 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full w-1/3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Settings Dialog */}
      <Dialog open={!!settingsServer} onOpenChange={() => setSettingsServer(null)}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Server Settings - {servers.find(s => s.attributes.id === settingsServer)?.attributes.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Assign User */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Assign to User
              </Label>
              <Select
                value={serverSettings[settingsServer]?.assignedUser || "none"}
                onValueChange={(value) => setServerSettings(prev => ({ 
                  ...prev, 
                  [settingsServer]: {
                    ...prev[settingsServer],
                    assignedUser: value === "none" ? "" : value 
                  }
                }))}
              >
                <SelectTrigger className="bg-gray-800 border-white/20">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/20">
                  <SelectItem value="none">-- No User Assigned --</SelectItem>
                  {users.filter(user => user.id && user.id !== '').map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Links Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Quick Access
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 justify-start"
                  onClick={() => serverSettings[settingsServer]?.panelUrl && window.open(serverSettings[settingsServer].panelUrl, '_blank')}
                  disabled={!serverSettings[settingsServer]?.panelUrl}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Panel
                </Button>
                
                <Button
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 justify-start"
                  onClick={() => serverSettings[settingsServer]?.txadminUrl && window.open(serverSettings[settingsServer].txadminUrl, '_blank')}
                  disabled={!serverSettings[settingsServer]?.txadminUrl}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  TXAdmin
                </Button>
                
                <Button
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 justify-start"
                  disabled={!serverSettings[settingsServer]?.databaseHost}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Database
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="panelLink">Panel URL</Label>
                  <Input
                    id="panelLink"
                    type="url"
                    placeholder="https://panel.example.com/server/123"
                    value={serverSettings[settingsServer]?.panelUrl || ''}
                    onChange={(e) => setServerSettings(prev => ({ 
                      ...prev, 
                      [settingsServer]: {
                        ...prev[settingsServer],
                        panelUrl: e.target.value 
                      }
                    }))}
                    className="bg-gray-800 border-white/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="txadminLink">TXAdmin URL</Label>
                  <Input
                    id="txadminLink"
                    type="url"
                    placeholder="https://server.example.com:40120"
                    value={serverSettings[settingsServer]?.txadminUrl || ''}
                    onChange={(e) => setServerSettings(prev => ({ 
                      ...prev, 
                      [settingsServer]: {
                        ...prev[settingsServer],
                        txadminUrl: e.target.value 
                      }
                    }))}
                    className="bg-gray-800 border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Database Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database Configuration
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dbHost">Host/IP</Label>
                  <Input
                    id="dbHost"
                    placeholder="localhost"
                    value={serverSettings[settingsServer]?.databaseHost || ''}
                    onChange={(e) => setServerSettings(prev => ({ 
                      ...prev, 
                      [settingsServer]: {
                        ...prev[settingsServer],
                        databaseHost: e.target.value 
                      }
                    }))}
                    className="bg-gray-800 border-white/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dbName">Database Name</Label>
                  <Input
                    id="dbName"
                    placeholder="server_db"
                    value={serverSettings[settingsServer]?.databaseName || ''}
                    onChange={(e) => setServerSettings(prev => ({ 
                      ...prev, 
                      [settingsServer]: {
                        ...prev[settingsServer],
                        databaseName: e.target.value 
                      }
                    }))}
                    className="bg-gray-800 border-white/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dbPort">Port</Label>
                  <Input
                    id="dbPort"
                    type="number"
                    placeholder="3306"
                    value={serverSettings[settingsServer]?.databasePort || 3306}
                    onChange={(e) => setServerSettings(prev => ({ 
                      ...prev, 
                      [settingsServer]: {
                        ...prev[settingsServer],
                        databasePort: parseInt(e.target.value) || 3306
                      }
                    }))}
                    className="bg-gray-800 border-white/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dbUsername">Username</Label>
                  <Input
                    id="dbUsername"
                    placeholder="db_user"
                    value={serverSettings[settingsServer]?.databaseUser || ''}
                    onChange={(e) => setServerSettings(prev => ({ 
                      ...prev, 
                      [settingsServer]: {
                        ...prev[settingsServer],
                        databaseUser: e.target.value 
                      }
                    }))}
                    className="bg-gray-800 border-white/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dbPassword">Password</Label>
                  <Input
                    id="dbPassword"
                    type="password"
                    placeholder="••••••••"
                    value={serverSettings[settingsServer]?.databasePassword || ''}
                    onChange={(e) => setServerSettings(prev => ({ 
                      ...prev, 
                      [settingsServer]: {
                        ...prev[settingsServer],
                        databasePassword: e.target.value 
                      }
                    }))}
                    className="bg-gray-800 border-white/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSettingsServer(null)}
              className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10 hover:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSettings}
              disabled={savingSettings}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              {savingSettings ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Success/Error Messages */}
      <Dialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-gray-900 border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className={`text-xl font-bold ${alertDialog.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {alertDialog.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              {alertDialog.message}
            </p>
            
            {alertDialog.details && (
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                  {alertDialog.details}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setAlertDialog(prev => ({ ...prev, open: false }))}
              className={alertDialog.type === 'success' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}