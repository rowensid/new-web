'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Database, 
  Table as TableIcon, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Settings,
  Key,
  Calendar,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isUnique: boolean;
  defaultValue: string | null;
  comment: string;
}

interface TableInfo {
  tableName: string;
  tableComment: string;
  estimatedRows: number;
  columns: TableColumn[];
  sampleData: any[];
  error?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function DatabaseManagement() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
    }
  }, [selectedTable, search]);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/owner/database-tables', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTables(data.data || []);
      } else {
        toast.error('Failed to fetch database tables');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Error fetching database tables');
    }
  };

  const fetchTableData = async (page = 1) => {
    if (!selectedTable) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(search && { search })
      });

      const response = await fetch(`/api/owner/table-data/${selectedTable}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTableData(data.data || []);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch table data');
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast.error('Error fetching table data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    if (selectedTable) {
      await fetchTableData();
    }
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleCreate = () => {
    const tableInfo = tables.find(t => t.tableName === selectedTable);
    if (!tableInfo) return;

    // Initialize form with default values
    const initialData: Record<string, any> = {};
    tableInfo.columns.forEach(col => {
      if (!col.isPrimary) {
        initialData[col.name] = col.defaultValue || '';
      }
    });

    setFormData(initialData);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setFormData({ ...record });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (record: any) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/owner/table-data/${selectedTable}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Record created successfully');
        setIsCreateDialogOpen(false);
        setFormData({});
        fetchTableData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating record:', error);
      toast.error('Error creating record');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedRecord) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/owner/table-data/${selectedTable}/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Record updated successfully');
        setIsEditDialogOpen(false);
        setSelectedRecord(null);
        setFormData({});
        fetchTableData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Error updating record');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedRecord) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/owner/table-data/${selectedTable}/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Record deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedRecord(null);
        fetchTableData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Error deleting record');
    }
  };

  const getColumnTypeIcon = (type: string) => {
    if (type.includes('int') || type.includes('decimal') || type.includes('float')) {
      return <Hash className="w-4 h-4 text-blue-500" />;
    }
    if (type.includes('varchar') || type.includes('text') || type.includes('char')) {
      return <Settings className="w-4 h-4 text-green-500" />;
    }
    if (type.includes('date') || type.includes('time')) {
      return <Calendar className="w-4 h-4 text-purple-500" />;
    }
    if (type.includes('bool') || type.includes('tinyint(1)')) {
      return <CheckCircle className="w-4 h-4 text-orange-500" />;
    }
    return <Database className="w-4 h-4 text-gray-500" />;
  };

  const selectedTableInfo = tables.find(t => t.tableName === selectedTable);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Database Management</h2>
          <p className="text-gray-400">Manage your database tables and records</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card
            key={table.tableName}
            className={`bg-gray-800 border-gray-700 cursor-pointer transition-all duration-200 hover:border-violet-500 ${
              selectedTable === table.tableName ? 'border-violet-500 ring-2 ring-violet-500/20' : ''
            }`}
            onClick={() => setSelectedTable(table.tableName)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-violet-400" />
                  <CardTitle className="text-lg text-white">{table.tableName}</CardTitle>
                </div>
                <Badge variant="outline" className="text-violet-400 border-violet-400">
                  {table.estimatedRows} rows
                </Badge>
              </div>
              {table.tableComment && (
                <p className="text-sm text-gray-400">{table.tableComment}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {table.columns.slice(0, 3).map((col) => (
                  <div key={col.name} className="flex items-center gap-1 text-xs text-gray-400">
                    {getColumnTypeIcon(col.type)}
                    <span>{col.name}</span>
                    {col.isPrimary && <Key className="w-3 h-3 text-yellow-500" />}
                  </div>
                ))}
                {table.columns.length > 3 && (
                  <span className="text-xs text-gray-500">+{table.columns.length - 3} more</span>
                )}
              </div>
              {table.error && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>{table.error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Data */}
      {selectedTable && selectedTableInfo && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white">{selectedTable}</CardTitle>
                <p className="text-gray-400">
                  {pagination?.total || 0} total records
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search records..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Record
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                <span className="ml-2 text-gray-400">Loading...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Data Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        {selectedTableInfo.columns.map((col) => (
                          <TableHead key={col.name} className="text-gray-300">
                            <div className="flex items-center gap-2">
                              {getColumnTypeIcon(col.type)}
                              <span>{col.name}</span>
                              {col.isPrimary && <Key className="w-3 h-3 text-yellow-500" />}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((record, index) => (
                        <TableRow key={record.id || index} className="border-gray-700">
                          {selectedTableInfo.columns.map((col) => (
                            <TableCell key={col.name} className="text-gray-300">
                              {col.type.includes('bool') || col.type.includes('tinyint(1)') ? (
                                record[col.name] ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <div className="w-4 h-4 border border-gray-500 rounded" />
                                )
                              ) : col.type.includes('date') || col.type.includes('time') ? (
                                record[col.name] ? new Date(record[col.name]).toLocaleString() : '-'
                              ) : (
                                String(record[col.name] || '-')
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(record)}
                                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(record)}
                                className="border-red-500 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-gray-400">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} records
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchTableData(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-300">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchTableData(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTableInfo?.columns
              .filter(col => !col.isPrimary)
              .map((col) => (
                <div key={col.name}>
                  <Label htmlFor={col.name} className="text-gray-300">
                    {col.name}
                    {col.nullable && <span className="text-gray-500 text-xs ml-1">(optional)</span>}
                  </Label>
                  <Input
                    id={col.name}
                    type={col.type.includes('date') ? 'datetime-local' : 'text'}
                    value={formData[col.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder={`Enter ${col.name}`}
                  />
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} className="bg-green-600 hover:bg-green-700">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTableInfo?.columns
              .filter(col => !col.isPrimary)
              .map((col) => (
                <div key={col.name}>
                  <Label htmlFor={col.name} className="text-gray-300">
                    {col.name}
                    {col.nullable && <span className="text-gray-500 text-xs ml-1">(optional)</span>}
                  </Label>
                  <Input
                    id={col.name}
                    type={col.type.includes('date') ? 'datetime-local' : 'text'}
                    value={formData[col.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [col.name]: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder={`Enter ${col.name}`}
                  />
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} className="bg-blue-600 hover:bg-blue-700">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            {selectedRecord && (
              <div className="bg-gray-700 p-3 rounded">
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(selectedRecord, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteSubmit} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}