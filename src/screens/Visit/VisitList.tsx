import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllVisits } from '@/services/localDB';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS, VISIT_TYPES } from '@/constants';
import { FieldVisit } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus, 
  Eye,
  MapPin,
  CheckCircle,
  Clock,
  Calendar,
  RefreshCw,
  MapPinned
} from 'lucide-react';

export default function VisitList() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<FieldVisit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  useEffect(() => {
    loadVisits();
  }, []);

  useEffect(() => {
    let result = visits;

    if (statusFilter !== 'all') {
      result = result.filter((v) => v.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.customerName.toLowerCase().includes(query) ||
          v.id.toLowerCase().includes(query) ||
          v.visitType.toLowerCase().includes(query)
      );
    }

    setFilteredVisits(result);
  }, [searchQuery, statusFilter, visits]);

  async function loadVisits() {
    setIsLoading(true);
    try {
      const allVisits = await getAllVisits();
      allVisits.sort((a, b) => 
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );
      setVisits(allVisits);
      setFilteredVisits(allVisits);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: FieldVisit['status']) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-warning/10 text-warning',
      visited: 'bg-success/10 text-success',
      postponed: 'bg-destructive/10 text-destructive',
    };
    const icons: Record<string, React.ReactNode> = {
      scheduled: <Clock className="w-3 h-3 mr-1" />,
      visited: <CheckCircle className="w-3 h-3 mr-1" />,
      postponed: null,
    };
    return (
      <Badge className={`${styles[status]} border-0`}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const getVisitTypeLabel = (type: string) => {
    const visitType = VISIT_TYPES.find((vt) => vt.value === type);
    return visitType?.label || type.replace('_', ' ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Field Visits</h1>
          <p className="page-subtitle">Manage field verification visits</p>
        </div>
        {permissions?.canCreateFieldVisit && (
          <Button asChild className="btn-accent">
            <Link to="/visits/new">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Visit
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visits.length}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visits.filter((v) => v.status === 'scheduled').length}
                </p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visits.filter((v) => v.status === 'visited').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MapPinned className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visits.filter((v) => 
                    v.status === 'scheduled' && 
                    new Date(v.scheduledDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">This Week</p>
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
                  placeholder="Search by customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="visited">Visited</SelectItem>
                  <SelectItem value="postponed">Postponed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={loadVisits}>
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
          ) : filteredVisits.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {visits.length === 0 ? 'No visits scheduled yet' : 'No matching visits found'}
              </p>
              {permissions?.canCreateFieldVisit && visits.length === 0 && (
                <Button asChild className="mt-4">
                  <Link to="/visits/new">Schedule First Visit</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="table-banking">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Visit Type</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <p className="font-medium">{visit.customerName}</p>
                        <p className="text-xs text-muted-foreground">{visit.id}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getVisitTypeLabel(visit.visitType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(visit.scheduledDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </TableCell>
                      <TableCell>{getStatusBadge(visit.status)}</TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {visit.notes || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/visits/${visit.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Link>
                        </Button>
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
