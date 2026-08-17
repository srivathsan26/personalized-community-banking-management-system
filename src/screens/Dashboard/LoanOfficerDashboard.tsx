import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCustomers, getAllLoans, getAllVisits } from '@/services/localDB';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Calculator,
  TrendingUp,
  XCircle,
  Plus,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Customer, Loan, FieldVisit } from '@/types';

export default function LoanOfficerDashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
  const [recentVisits, setRecentVisits] = useState<FieldVisit[]>([]);
  const [verifiedCustomers, setVerifiedCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    async function loadData() {
      const allLoans = await getAllLoans();
      setLoans(allLoans);
      setPendingLoans(allLoans.filter(l => l.status === 'pending').slice(0, 5));

      const visits = await getAllVisits();
      setRecentVisits(visits.filter(v => v.status === 'visited').slice(-5).reverse());

      const customers = await getAllCustomers();
      setVerifiedCustomers(customers.filter(c => c.status === 'verified'));
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const approvedCount = loans.filter(l => l.status === 'approved' || l.status === 'disbursed').length;
  const rejectedCount = loans.filter(l => l.status === 'rejected').length;
  const totalAmount = loans.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            <Badge variant="secondary" className="mr-2">Loan Officer</Badge>
            {user?.branchName}
          </p>
        </div>
        
        <Button asChild className="btn-accent">
          <Link to="/loans/new">
            <Plus className="w-4 h-4 mr-2" />
            New Loan Application
          </Link>
        </Button>
      </div>

      {/* Loan Portfolio Summary */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{loans.length}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">{pendingLoans.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">₹{(totalAmount / 100000).toFixed(1)}L</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loans.length}</p>
                <p className="text-xs text-muted-foreground">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingLoans.length}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
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
                <p className="text-2xl font-bold">{verifiedCustomers.length}</p>
                <p className="text-xs text-muted-foreground">Eligible Customers</p>
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
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Pending Applications</CardTitle>
              <CardDescription>Loans awaiting manager approval</CardDescription>
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
                <p>No pending applications</p>
                <Button asChild variant="link" className="mt-2">
                  <Link to="/loans/new">Create new application</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{loan.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{loan.amount.toLocaleString()} • {loan.tenure} months
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-warning/10 text-warning">
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Field Visit Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Field Visit Reports
              </CardTitle>
              <CardDescription>Recent verification visits (read-only)</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/visits" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No visited reports yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{visit.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(visit.completedDate || visit.scheduledDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {visit.visitType.replace('_', ' ')}
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
              <Link to="/loans/new">
                <Plus className="w-5 h-5 mb-2" />
                <span className="text-sm">New Loan</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/loans">
                <FileText className="w-5 h-5 mb-2" />
                <span className="text-sm">All Loans</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/kyc">
                <Eye className="w-5 h-5 mb-2" />
                <span className="text-sm">View KYC</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/visits">
                <TrendingUp className="w-5 h-5 mb-2" />
                <span className="text-sm">Visit Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
