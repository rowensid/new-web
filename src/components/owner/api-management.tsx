'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Shield,
  Server,
  Globe,
  Database,
  Zap,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiConfiguration {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApiManagement() {
  const [configs, setConfigs] = useState<ApiConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ApiConfiguration | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    description: ''
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/owner/api-config');
      if (!response.ok) throw new Error('Failed to fetch API configurations');
      
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to fetch API configurations:', error);
      toast.error('Failed to load API configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/owner/api-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save API configuration');
      }

      toast.success('API configuration saved successfully');
      setShowForm(false);
      setEditingConfig(null);
      setFormData({ name: '', apiUrl: '', apiKey: '', description: '' });
      fetchConfigs();
    } catch (error) {
      console.error('Failed to save API configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save API configuration');
    }
  };

  const handleEdit = (config: ApiConfiguration) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      description: config.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (name: string) => {
    if (!confirm('Are you sure you want to delete this API configuration?')) return;

    try {
      const response = await fetch(`/api/owner/api-config?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete API configuration');

      toast.success('API configuration deleted successfully');
      fetchConfigs();
    } catch (error) {
      console.error('Failed to delete API configuration:', error);
      toast.error('Failed to delete API configuration');
    }
  };

  const handleToggleActive = async (name: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/owner/api-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isActive }),
      });

      if (!response.ok) throw new Error('Failed to update API configuration');

      toast.success(`API configuration ${isActive ? 'activated' : 'deactivated'}`);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to update API configuration:', error);
      toast.error('Failed to update API configuration');
    }
  };

  const testConnection = async (config: ApiConfiguration) => {
    try {
      // Test Pterodactyl connection
      if (config.name.toLowerCase().includes('pterodactyl')) {
        toast.loading('Testing Pterodactyl API connection...', { id: 'test-connection' });
        
        // First test the API key directly
        const testResponse = await fetch(config.apiUrl + '/api/client', {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (testResponse.ok) {
          const data = await testResponse.json();
          const serverCount = data.data?.length || 0;
          toast.success(`Pterodactyl API connection successful! Found ${serverCount} servers`, { id: 'test-connection' });
        } else {
          const errorText = await testResponse.text();
          toast.error(`Pterodactyl API connection failed: ${testResponse.status} ${testResponse.statusText}`, { id: 'test-connection' });
          console.error('API Error Response:', errorText);
        }
      } else {
        toast.info('Connection test not implemented for this API type', { id: 'test-connection' });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed: Network error', { id: 'test-connection' });
    }
  };

  const getApiIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pterodactyl')) return <Server className="w-5 h-5" />;
    if (lowerName.includes('database') || lowerName.includes('db')) return <Database className="w-5 h-5" />;
    if (lowerName.includes('payment') || lowerName.includes('stripe')) return <Zap className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  const getApiColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pterodactyl')) return 'from-cyan-600 to-blue-600';
    if (lowerName.includes('database') || lowerName.includes('db')) return 'from-green-600 to-emerald-600';
    if (lowerName.includes('payment') || lowerName.includes('stripe')) return 'from-purple-600 to-pink-600';
    return 'from-gray-600 to-slate-600';
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
          <h2 className="text-2xl font-bold text-white">API Management</h2>
          <p className="text-gray-400">Manage your API keys and external service integrations</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add API Key
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="bg-gray-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-violet-400" />
              {editingConfig ? 'Edit API Configuration' : 'Add New API Configuration'}
            </CardTitle>
            <CardDescription className="text-purple-300">
              Configure your external API connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">Configuration Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Pterodactyl API"
                    className="bg-gray-800 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apiUrl" className="text-white">API URL</Label>
                  <Input
                    id="apiUrl"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                    placeholder="https://panel.example.com"
                    className="bg-gray-800 border-white/20 text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="apiKey" className="text-white">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                  className="bg-gray-800 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this API is used for..."
                  className="bg-gray-800 border-white/20 text-white"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {editingConfig ? 'Update Configuration' : 'Save Configuration'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingConfig(null);
                    setFormData({ name: '', apiUrl: '', apiKey: '', description: '' });
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* API Configurations List */}
      {configs.length === 0 ? (
        <Card className="bg-gray-900/50 border-white/10">
          <CardContent className="p-12 text-center">
            <Key className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No API Configurations</h3>
            <p className="text-gray-400 mb-6">
              Add your first API configuration to integrate external services
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add API Configuration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {configs.map((config) => (
            <Card key={config.id} className="bg-gray-900/50 border-white/10 hover:border-pink-500/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getApiColor(config.name)} flex items-center justify-center`}>
                      {getApiIcon(config.name)}
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        {config.name}
                        <Badge variant={config.isActive ? "default" : "secondary"} className={config.isActive ? "bg-green-600" : "bg-gray-600"}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-purple-300">
                        {config.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      onClick={() => testConnection(config)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 hover:bg-white/10"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDelete(config.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-400 text-sm">API URL</Label>
                    <p className="text-white font-mono text-sm">{config.apiUrl}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">API Key</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-sm">
                        {showApiKeys[config.id] ? config.apiKey : `${config.apiKey.substring(0, 8)}...`}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-white/10"
                        onClick={() => setShowApiKeys(prev => ({ 
                          ...prev, 
                          [config.id]: !prev[config.id] 
                        }))}
                      >
                        {showApiKeys[config.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(config.createdAt).toLocaleDateString()} • 
                      Updated: {new Date(config.updatedAt).toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(config.name, !config.isActive)}
                      className={config.isActive 
                        ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        : "border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      }
                    >
                      {config.isActive ? <X className="w-4 h-4 mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                      {config.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}