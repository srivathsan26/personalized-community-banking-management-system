import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ROLE_DASHBOARDS } from "@/constants";

import Login from "@/screens/Login/Login";
import Dashboard from "@/screens/Dashboard/Dashboard";
import KYCList from "@/screens/KYC/KYCList";
import KYCForm from "@/screens/KYC/KYCForm";
import KYCDetail from "@/screens/KYC/KYCDetail";
import AccountList from "@/screens/Account/AccountList";
import AccountForm from "@/screens/Account/AccountForm";
import AccountDetail from "@/screens/Account/AccountDetail";
import LoanList from "@/screens/Loan/LoanList";
import LoanForm from "@/screens/Loan/LoanForm";
import LoanDetail from "@/screens/Loan/LoanDetail";
import VisitList from "@/screens/Visit/VisitList";
import VisitForm from "@/screens/Visit/VisitForm";
import VisitDetail from "@/screens/Visit/VisitDetail";
import AuditLogs from "@/screens/Audit/AuditLogs";
import TransactionList from "@/screens/Transaction/TransactionList";
import TransactionForm from "@/screens/Transaction/TransactionForm";
import CreditCardList from "@/screens/CreditCard/CreditCardList";
import CreditCardForm from "@/screens/CreditCard/CreditCardForm";
import CreditCardDetail from "@/screens/CreditCard/CreditCardDetail";
import Reports from "@/screens/Reports/Reports";
import UserManagement from "@/screens/Admin/UserManagement";
import StaffDetail from "@/screens/Admin/StaffDetail";
import AccessDenied from "@/pages/AccessDenied";
import Layout from "@/components/Layout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={ROLE_DASHBOARDS[user?.role || ''] || '/dashboard'} replace /> : <Login />} />
      {/* Role-specific dashboard routes - all redirect to main dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/field-officer" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/cse" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/loan-officer" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/manager" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {/* Access Denied */}
      <Route path="/access-denied" element={<AccessDenied />} />
      {/* Accounts / KYC */}
      <Route path="/accounts" element={<ProtectedRoute><AccountList /></ProtectedRoute>} />
      <Route path="/accounts/new" element={<ProtectedRoute><AccountForm /></ProtectedRoute>} />
      <Route path="/accounts/:accountId" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
      <Route path="/kyc" element={<ProtectedRoute><KYCList /></ProtectedRoute>} />
      <Route path="/kyc/new" element={<ProtectedRoute><KYCForm /></ProtectedRoute>} />
      <Route path="/kyc/:customerId" element={<ProtectedRoute><KYCDetail /></ProtectedRoute>} />
      {/* Transactions */}
      <Route path="/transactions" element={<ProtectedRoute><TransactionList /></ProtectedRoute>} />
      <Route path="/transactions/new" element={<ProtectedRoute><TransactionForm /></ProtectedRoute>} />
      {/* Loans */}
      <Route path="/loans" element={<ProtectedRoute><LoanList /></ProtectedRoute>} />
      <Route path="/loans/new" element={<ProtectedRoute><LoanForm /></ProtectedRoute>} />
      <Route path="/loans/:loanId" element={<ProtectedRoute><LoanDetail /></ProtectedRoute>} />
      {/* Credit Cards */}
      <Route path="/cards" element={<ProtectedRoute><CreditCardList /></ProtectedRoute>} />
      <Route path="/cards/new" element={<ProtectedRoute><CreditCardForm /></ProtectedRoute>} />
      <Route path="/cards/:cardId" element={<ProtectedRoute><CreditCardDetail /></ProtectedRoute>} />
      {/* Field Visits */}
      <Route path="/visits" element={<ProtectedRoute><VisitList /></ProtectedRoute>} />
      <Route path="/visits/new" element={<ProtectedRoute><VisitForm /></ProtectedRoute>} />
      <Route path="/visits/:visitId" element={<ProtectedRoute><VisitDetail /></ProtectedRoute>} />
      {/* Reports & Audit */}
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/users/:staffId" element={<ProtectedRoute><StaffDetail /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster position="top-right" />
      <HashRouter>
        <AuthProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
