import { useAuth } from '@/contexts/AuthContext';
import FieldOfficerDashboard from './FieldOfficerDashboard';
import CSEDashboard from './CSEDashboard';
import LoanOfficerDashboard from './LoanOfficerDashboard';
import BranchManagerDashboard from './BranchManagerDashboard';

// Main Dashboard component that renders role-specific dashboards
export default function Dashboard() {
  const { user } = useAuth();

  // Render role-specific dashboard based on user's role
  switch (user?.role) {
    case 'field_officer':
      return <FieldOfficerDashboard />;
    case 'customer_service_executive':
      return <CSEDashboard />;
    case 'loan_officer':
      return <LoanOfficerDashboard />;
    case 'branch_manager':
      return <BranchManagerDashboard />;
    default:
      return <FieldOfficerDashboard />;
  }
}
