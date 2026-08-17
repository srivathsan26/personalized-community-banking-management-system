import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCustomers, getKYCDocuments } from '@/services/localDB';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/constants';
import { Customer, KYCDocument } from '@/types';
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
  Search, 
  Plus, 
  Eye, 
  FileCheck, 
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  RefreshCw
} from 'lucide-react';

interface CustomerWithKYC extends Customer {
  kycDocCount: number;
}

export default function KYCList() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithKYC[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithKYC[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.firstName.toLowerCase().includes(query) ||
            c.lastName.toLowerCase().includes(query) ||
            c.phone.includes(query) ||
            c.aadhaarNumber.includes(query) ||
            c.village.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, customers]);

  async function loadCustomers() {
    setIsLoading(true);
    try {
      const allCustomers = await getAllCustomers();
      const customersWithKYC: CustomerWithKYC[] = await Promise.all(
        allCustomers.map(async (customer) => {
          const docs = await getKYCDocuments(customer.id);
          return { ...customer, kycDocCount: docs.length };
        })
      );
      // Sort by creation date, newest first
      customersWithKYC.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setCustomers(customersWithKYC);
      setFilteredCustomers(customersWithKYC);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-success/10 text-success border-0">
            <CheckCircle className="w-3 h-3 mr-1" /> Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-0">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-0">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  const getSyncBadge = (syncStatus: Customer['syncStatus']) => {
    if (syncStatus === 'synced') {
      return <Badge variant="outline" className="text-success border-success/30">Synced</Badge>;
    }
    if (syncStatus === 'failed') {
      return <Badge variant="outline" className="text-destructive border-destructive/30">Failed</Badge>;
    }
    return <Badge variant="outline" className="text-warning border-warning/30">Pending</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">KYC & Customer Management</h1>
          <p className="page-subtitle">Manage customer records and KYC documentation</p>
        </div>
        {permissions?.canCreateCustomer && (
          <Button asChild className="btn-accent">
            <Link to="/kyc/new">
              <Plus className="w-4 h-4 mr-2" />
              New Customer
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
                <FileCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-xs text-muted-foreground">Total Customers</p>
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
                  {customers.filter((c) => c.status === 'verified').length}
                </p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {customers.filter((c) => c.status === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
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
                  {customers.filter((c) => c.syncStatus === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, Aadhaar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadCustomers}>
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
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {customers.length === 0 ? 'No customers yet' : 'No matching customers found'}
              </p>
              {permissions?.canCreateCustomer && customers.length === 0 && (
                <Button asChild className="mt-4">
                  <Link to="/kyc/new">Add First Customer</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="table-banking">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>KYC Docs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            Aadhaar: •••• {customer.aadhaarNumber.slice(-4)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{customer.phone}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{customer.village}</p>
                        <p className="text-xs text-muted-foreground">{customer.district}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.kycDocCount >= 3 ? 'default' : 'secondary'}>
                          {customer.kycDocCount}/3
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>{getSyncBadge(customer.syncStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/kyc/${customer.id}`}>
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
