import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCustomers, getAllLoans, getAllVisits, getAllAuditLogs, getAllTransactions, getAllStaffUsers } from '@/services/localDB';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle,
  ArrowRight,
  TrendingUp,
  XCircle,
  Shield,
  BarChart3,
  UserCheck,
  Wallet,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Customer, Loan, FieldVisit, AuditLog, Transaction, StaffUser } from '@/types';

export default function BranchManagerDashboard() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<StaffUser[]>([]);

  useEffect(() => {
    async function loadData() {
      const allCustomers = await getAllCustomers();
      setCustomers(allCustomers);

      const allLoans = await getAllLoans();
      setLoans(allLoans);
      setPendingLoans(allLoans.filter(l => l.status === 'pending').slice(0, 5));

      const allVisits = await getAllVisits();
      setVisits(allVisits);

      const logs = await getAllAuditLogs();
      setRecentLogs(logs.slice(0, 5));

      const txns = await getAllTransactions();
      setTransactions(txns);

      const staff = await getAllStaffUsers();
      setEmployees(staff);
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const approvedLoans = loans.filter(l => l.status === 'approved' || l.status === 'disbursed').length;
  const rejectedLoans = loans.filter(l => l.status === 'rejected').length;
  const totalLoanAmount = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalTransactionAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const completedVisits = visits.filter(v => v.status === 'visited').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            <Badge variant="default" className="mr-2 bg-primary">Branch Manager</Badge>
            {user?.branchName}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </Link>
          </Button>
            <Button asChild variant="outline">
              <Link to="/audit">
                <Shield className="w-4 h-4 mr-2" />
                Audit Logs
              </Link>
            </Button>
          <Button asChild variant="outline">
            <Link to="/admin/users">
              <UserCheck className="w-4 h-4 mr-2" />
              Admin
            </Link>
          </Button>
        </div>
      </div>

      {/* Branch Overview */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Branch Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-3xl font-bold text-primary">{customers.length}</p>
              <p className="text-sm text-muted-foreground">Total Customers</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-3xl font-bold text-foreground">{loans.length}</p>
              <p className="text-sm text-muted-foreground">Loan Applications</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-3xl font-bold text-success">{approvedLoans}</p>
              <p className="text-sm text-muted-foreground">Approved Loans</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-3xl font-bold text-foreground">₹{(totalLoanAmount / 100000).toFixed(1)}L</p>
              <p className="text-sm text-muted-foreground">Loan Portfolio</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-3xl font-bold text-foreground">{completedVisits}</p>
              <p className="text-sm text-muted-foreground">Field Visits</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingLoans.length}</p>
                <p className="text-xs text-muted-foreground">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedLoans}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedLoans}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{(totalTransactionAmount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Balances */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-success" />
              Customer Balances
            </CardTitle>
            <CardDescription>Account balances of all customers</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/kyc" className="flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No customers found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {customers.slice(0, 10).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.accountNumber || 'No account'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">
                      ₹{(customer.accountBalance || 0).toLocaleString()}
                    </p>
                    <Badge variant={customer.status === 'verified' ? 'default' : 'secondary'} className="text-xs">
                      {customer.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Loan Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-warning" />
                Pending Approvals
              </CardTitle>
              <CardDescription>Loans requiring your decision</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/loans" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingLoans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{loan.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{loan.amount.toLocaleString()} • {loan.loanType}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Employee Overview
              </CardTitle>
              <CardDescription>Staff members in your branch</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.filter(e => e.role !== 'branch_manager').map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {employee.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-success border-success/30">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions in the branch</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/audit" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.action.includes('created') ? 'bg-success' :
                        log.action.includes('approved') ? 'bg-primary' :
                        log.action.includes('rejected') ? 'bg-destructive' :
                        'bg-muted-foreground'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{log.details}</p>
                        <p className="text-xs text-muted-foreground">
                          by {log.performedBy} • {new Date(log.performedAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {log.action.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/loans">
                <FileText className="w-5 h-5 mb-2" />
                <span className="text-sm">Loan Approvals</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/reports">
                <BarChart3 className="w-5 h-5 mb-2" />
                <span className="text-sm">Branch Reports</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/audit">
                <Shield className="w-5 h-5 mb-2" />
                <span className="text-sm">Audit Logs</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/kyc">
                <Users className="w-5 h-5 mb-2" />
                <span className="text-sm">All Customers</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
