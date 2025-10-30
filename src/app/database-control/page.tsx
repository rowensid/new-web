'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Database, 
  Server, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Copy,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Filter,
  Grid,
  List,
  Database as DatabaseIcon,
  Loader2,
  Clock,
  Activity,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TableData {
  columns: string[]
  rows: any[][]
  totalRows: number
  currentPage: number
  totalPages: number
}

interface DatabaseInfo {
  name: string
  host: string
  username: string
  password: string
  status: 'connected' | 'disconnected' | 'error'
  lastTested: string
}

interface TableInfo {
  name: string
  rows: number
  size: string
  engine: string
  collation: string
}

interface QueryResult {
  columns: string[]
  rows: any[][]
  affectedRows?: number
  executionTime: number
}

export default function DatabaseControl() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [servers, setServers] = useState<any[]>([])
  const [selectedServer, setSelectedServer] = useState<any>(null)
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [createTableOpen, setCreateTableOpen] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableColumns, setNewTableColumns] = useState('')
  const [editRowOpen, setEditRowOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<Record<string, any>>({})
  const [addRowOpen, setAddRowOpen] = useState(false)
  const [addFormData, setAddFormData] = useState<Record<string, any>>({})
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingRow, setDeletingRow] = useState<any>(null)
  const [tableSchema, setTableSchema] = useState<any[]>([])
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [tablePage, setTablePage] = useState(1)
  const [tableSearch, setTableSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserServers()
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserServers = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Check if user is admin or owner to fetch all servers
      const apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER') 
        ? '/api/admin/database-servers' 
        : '/api/user/servers'
        
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setServers(data.servers || [])
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    }
  }

  const fetchTableData = async (tableName: string, page: number = 1, search: string = '', sortColumn: string = '', sortDir: 'asc' | 'desc' = 'asc') => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Try local database first (our main database)
      let apiUrl = `/api/admin/local-table-data?table=${tableName}&page=${page}&search=${search}&sort=${sortColumn}&order=${sortDir}&limit=${pageSize}`
      
      if (selectedServer && selectedServer.databaseSettings) {
        // If server has database settings, use remote database
        apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
          ? `/api/admin/table-data?serverId=${selectedServer.pteroId}&table=${tableName}&page=${page}&search=${search}&sort=${sortColumn}&order=${sortDir}&limit=${pageSize}`
          : `/api/user/table-data?serverId=${selectedServer.pteroId}&table=${tableName}&page=${page}&search=${search}&sort=${sortColumn}&order=${sortDir}&limit=${pageSize}`
      }
        
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTableData(data)
        // Also fetch table schema and info
        await fetchTableSchema(tableName)
        await fetchTableInfo(tableName)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to fetch table data')
      }
    } catch (error) {
      console.error('Failed to fetch table data:', error)
      toast.error('Failed to fetch table data')
    }
  }

  const fetchTableSchema = async (tableName: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Try local database first
      let apiUrl = `/api/admin/local-table-schema?table=${tableName}`
      
      if (selectedServer && selectedServer.databaseSettings) {
        // If server has database settings, use remote database
        apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
          ? `/api/admin/table-schema?serverId=${selectedServer.pteroId}&table=${tableName}`
          : `/api/user/table-schema?serverId=${selectedServer.pteroId}&table=${tableName}`
      }
        
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTableSchema(data.schema || [])
      }
    } catch (error) {
      console.error('Failed to fetch table schema:', error)
    }
  }

  const fetchTableInfo = async (tableName: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Get table info using API
      let apiUrl = '/api/admin/local-table-info'
      
      if (selectedServer && selectedServer.databaseSettings) {
        // If server has database settings, use remote database
        apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
          ? '/api/admin/table-info'
          : '/api/user/table-info'
      }
      
      const response = await fetch(`${apiUrl}?table=${tableName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTableInfo(data.tableInfo)
      }
    } catch (error) {
      console.error('Failed to fetch table info:', error)
    }
  }

  const selectTable = (tableName: string) => {
    setSelectedTable(tableName)
    setTablePage(1)
    setTableSearch('')
    setSortBy('')
    setSortOrder('asc')
    fetchTableData(tableName)
  }

  const deleteRow = async (tableName: string, id: any) => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Try local database first
      let apiUrl = '/api/admin/local-delete-row'
      
      if (selectedServer && selectedServer.databaseSettings) {
        // If server has database settings, use remote database
        apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
          ? '/api/admin/delete-row'
          : '/api/user/delete-row'
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          table: tableName,
          id: id
        })
      })
      
      if (response.ok) {
        toast.success('Row deleted successfully')
        fetchTableData(tableName, tablePage, tableSearch, sortBy, sortOrder)
        setDeleteConfirmOpen(false)
        setDeletingRow(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete row')
      }
    } catch (error) {
      console.error('Failed to delete row:', error)
      toast.error('Failed to delete row')
    }
  }

  const addRow = async (tableName: string, data: Record<string, any>) => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Try local database first
      let apiUrl = '/api/admin/local-add-row'
      
      if (selectedServer && selectedServer.databaseSettings) {
        // If server has database settings, use remote database
        apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
          ? '/api/admin/add-row'
          : '/api/user/add-row'
      }
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          table: tableName,
          data: data
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success('Row added successfully')
        setAddRowOpen(false)
        setAddFormData({})
        fetchTableData(tableName, tablePage, tableSearch, sortBy, sortOrder)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to add row')
      }
    } catch (error) {
      console.error('Failed to add row:', error)
      toast.error('Failed to add row')
    }
  }

  const updateRow = async (tableName: string, id: any, data: Record<string, any>) => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Try local database first
      let apiUrl = '/api/admin/local-update-row'
      
      if (selectedServer && selectedServer.databaseSettings) {
        // If server has database settings, use remote database
        apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
          ? '/api/admin/update-row'
          : '/api/user/update-row'
      }
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          table: tableName,
          id: id,
          data: data
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success('Row updated successfully')
        setEditRowOpen(false)
        setEditingRow(null)
        setEditFormData({})
        fetchTableData(tableName, tablePage, tableSearch, sortBy, sortOrder)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update row')
      }
    } catch (error) {
      console.error('Failed to update row:', error)
      toast.error('Failed to update row')
    }
  }


  const openEditDialog = (row: any) => {
    setEditingRow(row)
    setEditFormData({...row})
    setEditRowOpen(true)
  }

  const openDeleteDialog = (row: any) => {
    setDeletingRow(row)
    setDeleteConfirmOpen(true)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setTablePage(1)
  }

  const handleSearch = (search: string) => {
    setTableSearch(search)
    setTablePage(1)
  }

  const handlePageChange = (page: number) => {
    setTablePage(page)
  }

  const refreshTable = () => {
    if (selectedTable) {
      fetchTableData(selectedTable, tablePage, tableSearch, sortBy, sortOrder)
    }
  }

  const selectServer = async (server: any) => {
    setSelectedServer(server)
    setDatabaseInfo(null)
    setTables([])
    setSelectedTable(null)
    setTableData(null)
    setQueryResult(null)
    
    // If server has database settings, use it. Otherwise, use local database
    if (!server.databaseSettings) {
      // Use local database (no server required)
      await fetchTables()
      return
    }
    
    // Load database info for this server
    try {
      const token = localStorage.getItem('auth_token')
      const apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
        ? `/api/admin/database-info?serverId=${server.pteroId}`
        : `/api/user/database-info?serverId=${server.pteroId}`
        
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDatabaseInfo(data.databaseInfo)
        await fetchTables()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to load database information')
      }
    } catch (error) {
      console.error('Failed to fetch database info:', error)
      toast.error('Failed to load database information')
    }
  }

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Try local database first
      let apiUrl = '/api/admin/database-tables'
      
      if (selectedServer && selectedServer.databaseSettings) {
        // If server has database settings, use remote database
        apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
          ? '/api/admin/database-tables'
          : '/api/user/database-tables'
      }
        
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTables(data.tables || [])
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to fetch database tables')
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error)
      toast.error('Failed to fetch database tables')
    }
  }

  const testConnection = async () => {
    if (!selectedServer) return
    
    setTestLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
        ? `/api/admin/test-database?serverId=${selectedServer.pteroId}`
        : `/api/user/test-database?serverId=${selectedServer.pteroId}`
        
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDatabaseInfo(prev => prev ? {
          ...prev,
          status: data.status,
          lastTested: new Date().toLocaleString()
        } : null)
        
        if (data.status === 'connected') {
          toast.success('Database connection successful!')
        } else {
          toast.error('Database connection failed')
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to test database connection')
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
      toast.error('Failed to test database connection')
    } finally {
      setTestLoading(false)
    }
  }

  const executeQuery = async () => {
    if (!query.trim() || !selectedServer) return
    
    setQueryLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
        ? '/api/admin/execute-query'
        : '/api/user/execute-query'
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serverId: selectedServer.pteroId,
          query: query.trim()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setQueryResult(data.result)
        toast.success(`Query executed in ${data.result.executionTime}ms`)
        
        // Refresh tables if query was DDL
        if (query.trim().match(/^(CREATE|DROP|ALTER|TRUNCATE)/i)) {
          await fetchTables()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Query execution failed')
      }
    } catch (error) {
      console.error('Failed to execute query:', error)
      toast.error('Failed to execute query')
    } finally {
      setQueryLoading(false)
    }
  }

  const createTable = async () => {
    if (!newTableName.trim() || !newTableColumns.trim() || !selectedServer) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const apiUrl = (user?.role === 'ADMIN' || user?.role === 'OWNER')
        ? '/api/admin/create-table'
        : '/api/user/create-table'
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serverId: selectedServer.pteroId,
          tableName: newTableName.trim(),
          columns: newTableColumns.trim()
        })
      })
      
      if (response.ok) {
        toast.success('Table created successfully!')
        setCreateTableOpen(false)
        setNewTableName('')
        setNewTableColumns('')
        await fetchTables()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create table')
      }
    } catch (error) {
      console.error('Failed to create table:', error)
      toast.error('Failed to create table')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'disconnected': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected'
      case 'disconnected': return 'Disconnected'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Database className="w-10 h-10 text-purple-400" />
              Database Control
            </h1>
            {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-sm px-3 py-1">
                {user.role}
              </Badge>
            )}
          </div>
          <p className="text-gray-300">
            {user?.role === 'ADMIN' || user?.role === 'OWNER' 
              ? 'Manage all databases across all servers' 
              : 'Manage your database for assigned servers'}
          </p>
        </div>

        {/* Server Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            {user?.role === 'ADMIN' || user?.role === 'OWNER' ? 'All Servers' : 'Your Servers'}
          </h2>
          {servers.length === 0 ? (
            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-8 text-center">
                <Server className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">No Assigned Servers</h3>
                <p className="text-gray-400">
                  {user?.role === 'ADMIN' || user?.role === 'OWNER' 
                    ? 'No servers found in the system.'
                    : 'You don\'t have any servers assigned to your account yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {servers.map((server) => (
                <Card 
                  key={server.id} 
                  className={`bg-gray-900/50 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer ${
                    selectedServer?.id === server.id ? 'border-purple-500 bg-purple-950/20' : ''
                  }`}
                  onClick={() => selectServer(server)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{server.name}</CardTitle>
                      <Server className="w-5 h-5 text-purple-400" />
                    </div>
                    <CardDescription className="text-gray-400">
                      {server.description || 'Game Server'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${server.databaseSettings ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {server.databaseSettings ? 'Database Access' : 'No Database'}
                        </Badge>
                        {server.assignedUser && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {server.assignedUser.name}
                          </Badge>
                        )}
                      </div>
                      {server.assignedUser && (user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                        <p className="text-xs text-gray-400">
                          Assigned to: {server.assignedUser.email} ({server.assignedUser.role})
                        </p>
                      )}
                      {!server.databaseSettings && (user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                        <p className="text-xs text-orange-400">
                          ⚠️ Database not configured
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {selectedServer && databaseInfo && (
          <>
            {/* Database Info */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Database Information</h2>
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        <Database className="w-6 h-6 text-purple-400" />
                        {databaseInfo.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Database connection details
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(databaseInfo.status)} text-white`}>
                        {getStatusText(databaseInfo.status)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                        onClick={testConnection}
                        disabled={testLoading}
                      >
                        {testLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-400">Host</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input 
                            value={databaseInfo.host} 
                            readOnly 
                            className="bg-gray-800 border-white/20 text-white"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 hover:bg-white/10"
                            onClick={() => copyToClipboard(databaseInfo.host)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-400">Username</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input 
                            value={databaseInfo.username} 
                            readOnly 
                            className="bg-gray-800 border-white/20 text-white"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 hover:bg-white/10"
                            onClick={() => copyToClipboard(databaseInfo.username)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-400">Password</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            value={databaseInfo.password} 
                            readOnly 
                            className="bg-gray-800 border-white/20 text-white"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 hover:bg-white/10"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 hover:bg-white/10"
                            onClick={() => copyToClipboard(databaseInfo.password)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-400">Last Tested</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-white">{databaseInfo.lastTested}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tables */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white">Tables</h2>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  onClick={() => setCreateTableOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Table
                </Button>
              </div>
              <Card className="bg-gray-900/50 border-white/10">
                <CardContent className="p-6">
                  {tables.length === 0 ? (
                    <div className="text-center py-8">
                      <Table className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Tables Found</h3>
                      <p className="text-gray-400 mb-4">
                        Create your first table to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* View Mode Toggle */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="border-white/20 hover:bg-white/10"
                          >
                            <Grid className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="border-white/20 hover:bg-white/10"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Search tables..."
                            value={tableSearch}
                            onChange={(e) => {
                              setTableSearch(e.target.value);
                              setTablePage(1);
                            }}
                            className="bg-gray-800 border-white/20 text-white placeholder-gray-500"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchTables()}
                            className="border-white/20 hover:bg-white/10"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {tables.map((table, index) => (
                            <Card 
                              key={index} 
                              className={`bg-gray-900/50 border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer ${
                                selectedTable === table.name ? 'border-emerald-500 bg-emerald-950/20' : ''
                              }`}
                              onClick={() => selectTable(table.name)}
                            >
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg text-white">{table.name}</CardTitle>
                                  <DatabaseIcon className="w-5 h-5 text-emerald-400" />
                                </div>
                                <CardDescription className="text-gray-400">
                                  Click to view table data
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Rows:</span>
                                    <span className="text-white font-medium">{table.rows.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Size:</span>
                                    <span className="text-white font-medium">{table.size}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Engine:</span>
                                    <span className="text-white font-medium">{table.engine}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-gray-400">Table Name</th>
                                <th className="text-left py-3 px-4 text-gray-400">Rows</th>
                                <th className="text-left py-3 px-4 text-gray-400">Size</th>
                                <th className="text-left py-3 px-4 text-gray-400">Engine</th>
                                <th className="text-left py-3 px-4 text-gray-400">Collation</th>
                                <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tables.map((table, index) => (
                                <tr 
                                  key={index} 
                                  className={`border-b border-white/5 hover:bg-white/5 cursor-pointer ${
                                    selectedTable === table.name ? 'bg-emerald-950/20' : ''
                                  }`}
                                  onClick={() => selectTable(table.name)}
                                >
                                  <td className="py-3 px-4 text-white font-medium">{table.name}</td>
                                  <td className="py-3 px-4 text-gray-300">{table.rows.toLocaleString()}</td>
                                  <td className="py-3 px-4 text-gray-300">{table.size}</td>
                                  <td className="py-3 px-4 text-gray-300">{table.engine}</td>
                                  <td className="py-3 px-4 text-gray-300">{table.collation}</td>
                                  <td className="py-3 px-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectTable(table.name);
                                      }}
                                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* SQL Query */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">SQL Query</h2>
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Execute SQL Query</CardTitle>
                  <CardDescription className="text-gray-400">
                    Run SQL queries on your database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter your SQL query here..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="bg-gray-800 border-white/20 text-white min-h-[120px] font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        onClick={executeQuery}
                        disabled={!query.trim() || queryLoading}
                      >
                        {queryLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Activity className="w-4 h-4 mr-2" />
                        )}
                        Execute Query
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                        onClick={() => setQuery('')}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Query Results */}
            {queryResult && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Query Results</h2>
                <Card className="bg-gray-900/50 border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">Results</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {queryResult.executionTime}ms
                        </Badge>
                        {queryResult.affectedRows && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {queryResult.affectedRows} rows affected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {queryResult.columns.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              {queryResult.columns.map((column, index) => (
                                <th key={index} className="text-left py-3 px-4 text-gray-400">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="py-3 px-4 text-gray-300">
                                    {cell === null ? (
                                      <span className="text-gray-500 italic">NULL</span>
                                    ) : (
                                      String(cell)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold text-white mb-2">Query Executed Successfully</h3>
                        <p className="text-gray-400">
                          {queryResult.affectedRows 
                            ? `${queryResult.affectedRows} rows affected`
                            : 'Query completed successfully'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Create Table Dialog */}
        <Dialog open={createTableOpen} onOpenChange={setCreateTableOpen}>
          <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create New Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Table Name</Label>
                <Input
                  placeholder="Enter table name..."
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="bg-gray-800 border-white/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Columns (SQL Definition)</Label>
                <Textarea
                  placeholder="Example:&#10;id INT PRIMARY KEY AUTO_INCREMENT,&#10;name VARCHAR(255) NOT NULL,&#10;email VARCHAR(255) UNIQUE,&#10;created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                  value={newTableColumns}
                  onChange={(e) => setNewTableColumns(e.target.value)}
                  className="bg-gray-800 border-white/20 text-white mt-1 min-h-[120px] font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-500/50 text-gray-400 hover:bg-gray-500/10 hover:text-gray-300"
                onClick={() => setCreateTableOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                onClick={createTable}
                disabled={!newTableName.trim() || !newTableColumns.trim()}
              >
                Create Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}