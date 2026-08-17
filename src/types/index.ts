// User & Authentication Types
export type UserRole = 'field_officer' | 'customer_service_executive' | 'loan_officer' | 'branch_manager';

export interface StaffUser {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  name: string;
  role: UserRole;
  branchCode: string;
  branchName: string;
  employeeId: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  assignedCustomers?: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  branchCode: string;
  branchName: string;
  employeeId: string;
  assignedCustomers?: string[]; // For field officers - assigned customer IDs
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

// RBAC Permission Types
export interface RolePermissions {
  // Customer/KYC permissions
  canCreateCustomer: boolean;
  canEditCustomerBasicInfo: boolean;
  canViewCustomer: boolean;
  canUploadKYC: boolean;
  canViewKYC: boolean;
  
  // Loan permissions
  canCreateLoan: boolean;
  canApproveLoan: boolean;
  canViewLoanDetails: boolean;
  canCalculateEMI: boolean;
  
  // Field Visit permissions
  canCreateFieldVisit: boolean;
  canViewFieldVisits: boolean;
  
  // Transaction permissions
  canRecordCashCollection: boolean;
  
  // Analytics & Audit permissions
  canViewBranchAnalytics: boolean;
  canViewAuditLogs: boolean;
  canViewEmployeePerformance: boolean;
  canOverrideFlags: boolean;
  
  // Sync permissions
  canSync: boolean;
  
  // Special access
  viewOnlyAssignedCustomers: boolean;
}

// Customer & KYC Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  aadhaarNumber: string;
  address: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  occupation: string;
  annualIncome: number;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  createdAt: string;
  createdBy: string;
  assignedTo?: string; // Field officer ID
  status: 'pending' | 'verified' | 'rejected';
  syncStatus: 'pending' | 'synced' | 'failed';
  primaryAccountId?: string;
  accountNumber?: string;
  accountBalance?: number;
}

export interface Account {
  id: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'fixed_deposit';
  balance: number;
  status: 'pending' | 'active' | 'inactive' | 'closed';
  openedAt: string;
  openedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface KYCDocument {
  id: string;
  customerId: string;
  type: 'aadhaar_front' | 'aadhaar_back' | 'selfie' | 'signature';
  fileName: string;
  fileData: string; // Base64 encoded
  uploadedAt: string;
  uploadedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  syncStatus: 'pending' | 'synced' | 'failed';
}

// Transaction Types
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  customerId: string;
  customerName: string;
  accountNumber: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  referenceId?: string;
  toAccountNumber?: string;
  transactionDate: string;
  createdBy: string;
  status: 'success' | 'pending' | 'failed';
  syncStatus: 'pending' | 'synced' | 'failed';
}

// Loan Types
export interface Loan {
  id: string;
  customerId: string;
  customerName: string;
  loanType: 'agriculture' | 'livestock' | 'business' | 'personal' | 'housing';
  amount: number;
  interestRate: number;
  tenure: number; // months
  emiAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'disbursed' | 'closed' | 'rejected';
  applicationDate: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  purpose?: string;
  repaymentSchedule?: LoanRepaymentInstallment[];
  repaymentHistory?: LoanRepaymentEntry[];
  repaidAmount?: number;
  lastPaymentDate?: string;
  riskScore?: number;
  createdBy: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface LoanRepaymentInstallment {
  installmentNumber: number;
  dueDate: string;
  principalComponent: number;
  interestComponent: number;
  amount: number;
  status: 'upcoming' | 'paid' | 'overdue';
}

export interface LoanRepaymentEntry {
  paidAt: string;
  amount: number;
  accountNumber: string;
  recordedBy: string;
}

// Credit Card Types
export type CreditCardStatus = 'pending_review' | 'active' | 'inactive' | 'blocked' | 'expired' | 'rejected';

export interface CreditCard {
  id: string;
  customerId: string;
  customerName: string;
  cardNumber: string;
  cardType: 'classic' | 'gold' | 'platinum';
  creditLimit: number;
  availableCredit: number;
  outstandingBalance: number;
  minimumPayment: number;
  dueDate: string;
  expiryDate: string;
  status: CreditCardStatus;
  issuedDate: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  lastStatementDate?: string;
  paymentReminderDate?: string;
  transactions?: CreditCardTransaction[];
  statementHistory?: CreditCardStatement[];
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface CreditCardTransaction {
  id: string;
  cardId: string;
  amount: number;
  merchant: string;
  category: string;
  transactionDate: string;
  status: 'completed' | 'pending' | 'reversed';
}

export interface CreditCardStatement {
  statementDate: string;
  dueDate: string;
  outstandingBalance: number;
  minimumPayment: number;
  availableCredit: number;
}

// Field Visit Types
export interface FieldVisit {
  id: string;
  customerId: string;
  customerName: string;
  loanId?: string;
  visitType: 'pre_sanction' | 'post_sanction' | 'recovery' | 'verification';
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'visited' | 'postponed';
  gpsLatitude?: number;
  gpsLongitude?: number;
  notes: string;
  photos: string[]; // Base64 encoded
  cashCollected?: number;
  createdBy: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

// Audit Log Types
export type AuditAction = 
  | 'customer_created' 
  | 'customer_updated'
  | 'customer_verified'
  | 'customer_rejected'
  | 'kyc_uploaded' 
  | 'kyc_reupload'
  | 'loan_created' 
  | 'loan_approved' 
  | 'loan_rejected'
  | 'visit_completed' 
  | 'sync_performed' 
  | 'transaction_completed' 
  | 'card_issued'
  | 'loan_repayment_recorded'
  | 'card_transaction_recorded'
  | 'card_payment_recorded'
  | 'card_statement_generated'
  | 'authentication_success'
  | 'authentication_failed'
  | 'authentication_logout'
  | 'password_reset'
  | 'manager_override'
  | 'flag_override';

export interface AuditLog {
  id: string;
  action: AuditAction | 'account_created' | 'account_approved' | 'user_created' | 'card_approved' | 'card_rejected';
  entityType: 'customer' | 'kyc' | 'loan' | 'visit' | 'transaction' | 'credit_card' | 'override' | 'account' | 'staff_user' | 'auth';
  entityId: string;
  performedBy: string;
  performedByRole: UserRole;
  performedAt: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

// Sync Queue Types
export interface SyncQueueItem {
  id: string;
  entityType: 'customer' | 'kyc_document' | 'loan' | 'visit' | 'audit_log' | 'transaction' | 'credit_card' | 'account' | 'staff_user';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: string; // JSON stringified
  createdAt: string;
  attempts: number;
  lastAttempt?: string;
  status: 'pending' | 'processing' | 'failed';
  errorMessage?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalCustomers: number;
  totalAccounts: number;
  pendingKYC: number;
  activeLoans: number;
  pendingLoans: number;
  scheduledVisits: number;
  syncQueueCount: number;
  todayCollections: number;
  monthlyDisbursements: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeCards: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Complaint Types (for Customer Service Executive)
export interface Complaint {
  id: string;
  customerId: string;
  customerName: string;
  category: 'account' | 'loan' | 'service' | 'document' | 'other';
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}
