import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCustomers, getAllLoans } from '@/services/localDB';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  UserCog
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Customer, Loan } from '@/types';

export default function CSEDashboard() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pendingDocs, setPendingDocs] = useState<Customer[]>([]);
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);

  useEffect(() => {
    async function loadData() {
      const allCustomers = await getAllCustomers();
      setCustomers(allCustomers);
      setPendingDocs(allCustomers.filter(c => c.status === 'pending').slice(0, 5));

      const loans = await getAllLoans();
      setRecentLoans(loans.slice(-5).reverse());
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const verifiedCount = customers.filter(c => c.status === 'verified').length;
  const pendingCount = customers.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            <Badge variant="secondary" className="mr-2">Customer Service Executive</Badge>
            {user?.branchName}
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link to="/kyc/new">
            <Users className="w-4 h-4 mr-2" />
            New Customer
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-xs text-muted-foreground">Total Customers</p>
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
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Verified KYC</p>
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
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Open Complaints</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Pending Document Review
              </CardTitle>
              <CardDescription>Customers awaiting KYC verification</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/kyc" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingDocs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No pending documents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDocs.map((customer) => (
                  <Link 
                    key={customer.id} 
                    to={`/kyc/${customer.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      <Clock className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Loan Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Recent Loan Applications</CardTitle>
              <CardDescription>Latest loan activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/loans" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLoans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No loan applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{loan.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{loan.amount.toLocaleString()} • {loan.loanType}
                      </p>
                    </div>
                    <Badge 
                      variant={loan.status === 'approved' ? 'default' : loan.status === 'rejected' ? 'destructive' : 'secondary'}
                    >
                      {loan.status}
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
              <Link to="/kyc/new">
                <Users className="w-5 h-5 mb-2" />
                <span className="text-sm">New Customer</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/loans">
                <FileText className="w-5 h-5 mb-2" />
                <span className="text-sm">Loan Details</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/transactions">
                <UserCog className="w-5 h-5 mb-2" />
                <span className="text-sm">Transactions</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col" disabled>
              <span>
                <MessageSquare className="w-5 h-5 mb-2" />
                <span className="text-sm">Complaints</span>
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
