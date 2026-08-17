import { useState, useEffect } from 'react';
import { getAllAuditLogs } from '@/services/localDB';
import { AuditLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Shield,
  RefreshCw,
  User,
  FileCheck,
  Wallet,
  MapPin,
  Upload,
  Clock
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  // Redirect if no permission
  if (!permissions?.canViewAuditLogs) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    let result = logs;

    if (actionFilter !== 'all') {
      result = result.filter((l) => l.action === actionFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.details.toLowerCase().includes(query) ||
          l.entityId.toLowerCase().includes(query) ||
          l.performedBy.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(result);
  }, [searchQuery, actionFilter, logs]);

  async function loadLogs() {
    setIsLoading(true);
    try {
      const allLogs = await getAllAuditLogs();
      setLogs(allLogs);
      setFilteredLogs(allLogs);
    } finally {
      setIsLoading(false);
    }
  }

  const getActionIcon = (action: AuditLog['action']) => {
    const icons: Record<string, React.ReactNode> = {
      customer_created: <User className="w-4 h-4" />,
      kyc_uploaded: <Upload className="w-4 h-4" />,
      loan_created: <Wallet className="w-4 h-4" />,
      loan_approved: <FileCheck className="w-4 h-4" />,
      visit_completed: <MapPin className="w-4 h-4" />,
      sync_performed: <RefreshCw className="w-4 h-4" />,
    };
    return icons[action] || <Clock className="w-4 h-4" />;
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Audit Logs
          </h1>
          <p className="page-subtitle">Immutable record of all system activities</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <User className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter((l) => l.action === 'customer_created').length}
                </p>
                <p className="text-xs text-muted-foreground">Customers Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Upload className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter((l) => l.action === 'kyc_uploaded').length}
                </p>
                <p className="text-xs text-muted-foreground">KYC Uploads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Wallet className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter((l) => l.action === 'loan_created').length}
                </p>
                <p className="text-xs text-muted-foreground">Loans Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="customer_created">Customer Created</SelectItem>
                  <SelectItem value="kyc_uploaded">KYC Uploaded</SelectItem>
                  <SelectItem value="loan_created">Loan Created</SelectItem>
                  <SelectItem value="loan_approved">Loan Approved</SelectItem>
                  <SelectItem value="visit_completed">Visit Completed</SelectItem>
                  <SelectItem value="sync_performed">Sync Performed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="table-banking">
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <p className="text-sm">
                          {new Date(log.performedAt).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.performedAt).toLocaleTimeString('en-IN')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-muted">
                            {getActionIcon(log.action)}
                          </div>
                          <span className="text-sm font-medium">
                            {getActionLabel(log.action)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.entityType}:{log.entityId.slice(0, 12)}...
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{log.performedBy}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {log.details}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={log.syncStatus === 'synced' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {log.syncStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
