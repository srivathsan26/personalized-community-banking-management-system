import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ROLE_PERMISSIONS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Building2,
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  MapPin,
  FileText,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { isOnline, syncQueueCount, isSyncing, triggerSync } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    const result = await triggerSync();
    if (result.total === 0) {
      toast.info('Nothing to sync');
    } else {
      toast.success(`Synced ${result.synced} items, ${result.failed} failed`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { path: '/kyc', label: 'Customers', icon: Users, show: permissions?.canViewCustomer || permissions?.canCreateCustomer },
    { path: '/accounts', label: 'Accounts', icon: Users, show: user?.role === 'branch_manager' || user?.role === 'customer_service_executive' },
    { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight, show: user?.role === 'branch_manager' || user?.role === 'customer_service_executive' },
    { path: '/loans', label: 'Loans', icon: Wallet, show: permissions?.canViewLoanDetails || permissions?.canCreateLoan },
    { path: '/cards', label: 'Credit Cards', icon: CreditCard, show: user?.role === 'branch_manager' || user?.role === 'customer_service_executive' },
    { path: '/visits', label: 'Field Visits', icon: MapPin, show: permissions?.canCreateFieldVisit || permissions?.canViewFieldVisits },
    { path: '/reports', label: 'Reports', icon: FileText, show: permissions?.canViewAuditLogs || permissions?.canViewBranchAnalytics },
    { path: '/admin/users', label: 'Admin', icon: ShieldCheck, show: user?.role === 'branch_manager' },
  ];

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      field_officer: 'Staff',
      branch_manager: 'Admin',
      auditor: 'Auditor',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">Community Bank</h1>
                <p className="text-xs text-sidebar-foreground/60">Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.filter(item => item.show).map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/60">{getRoleLabel(user?.role || '')}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.branchName}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={isOnline ? 'sync-online' : 'sync-offline'}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {/* Sync Queue */}
            {syncQueueCount > 0 && permissions?.canSync && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSync} 
                disabled={isSyncing || !isOnline} 
                className="gap-2 border-warning/30 hover:border-warning hover:bg-warning/5"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <Badge variant="secondary" className="bg-warning/10 text-warning font-semibold">
                  {syncQueueCount}
                </Badge>
                <span className="hidden sm:inline">Sync</span>
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
