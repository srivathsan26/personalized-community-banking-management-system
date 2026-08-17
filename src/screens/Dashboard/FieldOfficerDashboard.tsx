import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { getAllCustomers, getAllVisits, getSyncQueueCount } from '@/services/localDB';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Customer, FieldVisit } from '@/types';

export default function FieldOfficerDashboard() {
  const { user } = useAuth();
  const { syncQueueCount } = useApp();
  const [assignedCustomers, setAssignedCustomers] = useState<Customer[]>([]);
  const [todaysVisits, setTodaysVisits] = useState<FieldVisit[]>([]);
  const [pendingVisits, setPendingVisits] = useState<FieldVisit[]>([]);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    async function loadData() {
      const customers = await getAllCustomers();
      // Field officer sees only assigned customers (for demo, show all)
      setAssignedCustomers(customers.slice(-10));

      const visits = await getAllVisits();
      const today = new Date().toDateString();
      
      setTodaysVisits(visits.filter(v => 
        new Date(v.scheduledDate).toDateString() === today
      ));
      
      setPendingVisits(visits.filter(v => v.status === 'scheduled' || v.status === 'postponed').slice(0, 5));
      
      setCompletedToday(visits.filter(v => 
        v.status === 'visited' && 
        new Date(v.completedDate || '').toDateString() === today
      ).length);
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayProgress = todaysVisits.length > 0 
    ? (completedToday / todaysVisits.length) * 100 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            <Badge variant="secondary" className="mr-2">Field Officer</Badge>
            {user?.branchName}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/visits/new">
              <MapPin className="w-4 h-4 mr-2" />
              Schedule Visit
            </Link>
          </Button>
          <Button asChild className="btn-accent">
            <Link to="/kyc/new">
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Today's Progress */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Today's Progress</h3>
              <p className="text-sm text-muted-foreground">
                {completedToday} of {todaysVisits.length} visits completed
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">
              {Math.round(todayProgress)}%
            </div>
          </div>
          <Progress value={todayProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignedCustomers.length}</p>
                <p className="text-xs text-muted-foreground">Assigned Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingVisits.length}</p>
                <p className="text-xs text-muted-foreground">Pending Visits</p>
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
                <p className="text-2xl font-bold">{completedToday}</p>
                <p className="text-xs text-muted-foreground">Visited Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${syncQueueCount > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                <RefreshCw className={`w-5 h-5 ${syncQueueCount > 0 ? 'text-warning' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncQueueCount}</p>
                <p className="text-xs text-muted-foreground">Pending Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Visits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Scheduled Visits</CardTitle>
              <CardDescription>Your upcoming field visits</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/visits" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No scheduled visits</p>
                <Button asChild variant="link" className="mt-2">
                  <Link to="/visits/new">Schedule a visit</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{visit.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(visit.scheduledDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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

        {/* Recent Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Recent Customers & Balances</CardTitle>
              <CardDescription>Recently onboarded customers with their balances</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/kyc" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {assignedCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No customers assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedCustomers.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                      <p className="text-sm text-muted-foreground">{customer.village}, {customer.district}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">
                        ₹{(customer.accountBalance || 0).toLocaleString()}
                      </p>
                      <Badge variant={customer.status === 'verified' ? 'default' : 'secondary'} className="text-xs">
                        {customer.status === 'verified' ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Verified</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                    </div>
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
                <span className="text-sm">New KYC</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/visits/new">
                <MapPin className="w-5 h-5 mb-2" />
                <span className="text-sm">Schedule Visit</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/kyc">
                <TrendingUp className="w-5 h-5 mb-2" />
                <span className="text-sm">View Customers</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col">
              <Link to="/visits">
                <Clock className="w-5 h-5 mb-2" />
                <span className="text-sm">View Visits</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
