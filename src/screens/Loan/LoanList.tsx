import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveLoan,
  disburseLoan,
  getAllLoans,
  rejectLoan,
} from '@/services/localDB';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS, LOAN_TYPES } from '@/constants';
import { Loan } from '@/types';
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
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Wallet,
  Clock,
  TrendingUp,
  Calculator,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Landmark,
} from 'lucide-react';

export default function LoanList() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoanId, setActionLoanId] = useState<string | null>(null);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  useEffect(() => {
    loadLoans();
  }, []);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        loan.customerName.toLowerCase().includes(query) ||
        loan.id.toLowerCase().includes(query) ||
        loan.loanType.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [loans, searchQuery, statusFilter]);

  async function loadLoans() {
    setIsLoading(true);
    try {
      const allLoans = await getAllLoans();
      setLoans(
        allLoans.sort(
          (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(loan: Loan) {
    if (!user) {
      return;
    }

    setActionLoanId(loan.id);
    try {
      await approveLoan(loan.id);
      toast.success('Loan approved successfully.');
      await loadLoans();
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve loan.');
    } finally {
      setActionLoanId(null);
    }
  }

  async function handleReject(loan: Loan) {
    if (!user) {
      return;
    }

    const rejectionReason = window.prompt('Enter rejection reason', loan.rejectionReason || '');
    if (rejectionReason === null) {
      return;
    }

    setActionLoanId(loan.id);
    try {
      await rejectLoan(loan.id, rejectionReason.trim() || 'Rejected during manager review');
      toast.success('Loan rejected.');
      await loadLoans();
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject loan.');
    } finally {
      setActionLoanId(null);
    }
  }

  async function handleDisburse(loan: Loan) {
    if (!user) {
      return;
    }

    setActionLoanId(loan.id);
    try {
      await disburseLoan(loan.id);
      toast.success('Loan disbursed successfully.');
      await loadLoans();
    } catch (error) {
      console.error(error);
      toast.error('Failed to disburse loan.');
    } finally {
      setActionLoanId(null);
    }
  }

  const getStatusBadge = (status: Loan['status']) => {
    const styles: Record<Loan['status'], string> = {
      draft: 'bg-muted text-muted-foreground',
      pending: 'bg-warning/10 text-warning',
      approved: 'bg-primary/10 text-primary',
      disbursed: 'bg-success/10 text-success',
      closed: 'bg-muted text-muted-foreground',
      rejected: 'bg-destructive/10 text-destructive',
    };

    return <Badge className={`${styles[status]} border-0 capitalize`}>{status}</Badge>;
  };

  const getLoanTypeLabel = (type: string) => {
    return LOAN_TYPES.find((item) => item.value === type)?.label || type;
  };

  const totalDisbursed = loans
    .filter((loan) => loan.status === 'disbursed')
    .reduce((sum, loan) => sum + loan.amount, 0);
  const totalPending = loans
    .filter((loan) => loan.status === 'pending')
    .reduce((sum, loan) => sum + loan.amount, 0);
  const approvedCount = loans.filter((loan) => loan.status === 'approved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Loan Management</h1>
          <p className="page-subtitle">Review, approve, and disburse customer loans</p>
        </div>
        {permissions?.canCreateLoan && (
          <Button asChild className="btn-accent">
            <Link to="/loans/new">
              <Plus className="w-4 h-4 mr-2" />
              New Loan Application
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loans.length}</p>
                <p className="text-xs text-muted-foreground">Total Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">Rs.{(totalDisbursed / 100000).toFixed(1)}L</p>
                <p className="text-xs text-muted-foreground">Disbursed</p>
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
                <p className="text-2xl font-bold">Rs.{(totalPending / 100000).toFixed(1)}L</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Calculator className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Ready to Disburse</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer or loan ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="disbursed">Disbursed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={loadLoans}>
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
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {loans.length === 0 ? 'No loan applications yet' : 'No matching loans found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="table-banking">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Loan Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">EMI</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => {
                    const isBusy = actionLoanId === loan.id;
                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <p className="font-medium">{loan.customerName}</p>
                          <p className="text-xs text-muted-foreground">{loan.id}</p>
                        </TableCell>
                        <TableCell>{getLoanTypeLabel(loan.loanType)}</TableCell>
                        <TableCell className="text-right font-medium">
                          Rs.{loan.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs.{loan.emiAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{loan.riskScore || 0}/100</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(loan.applicationDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/loans/${loan.id}`}>View</Link>
                            </Button>
                            {permissions?.canApproveLoan && loan.status === 'pending' && (
                              <>
                                <Button variant="outline" size="sm" disabled={isBusy} onClick={() => handleApprove(loan)}>
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button variant="outline" size="sm" disabled={isBusy} onClick={() => handleReject(loan)}>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {permissions?.canApproveLoan && loan.status === 'approved' && (
                              <Button variant="outline" size="sm" disabled={isBusy} onClick={() => handleDisburse(loan)}>
                                <Landmark className="w-4 h-4 mr-1" />
                                Disburse
                              </Button>
                            )}
                            {loan.status === 'rejected' && loan.rejectionReason && (
                              <span className="text-xs text-muted-foreground max-w-40 text-right">
                                {loan.rejectionReason}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
