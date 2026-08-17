// Role Permissions Matrix - Strict RBAC Implementation
export const ROLE_PERMISSIONS = {
  field_officer: {
    canCreateCustomer: true,
    canEditCustomerBasicInfo: false,
    canViewCustomer: true,
    canUploadKYC: true,
    canViewKYC: true,
    canCreateLoan: false,
    canApproveLoan: false,
    canViewLoanDetails: false,
    canCalculateEMI: false,
    canCreateFieldVisit: true,
    canViewFieldVisits: true,
    canRecordCashCollection: false,
    canViewBranchAnalytics: false,
    canViewAuditLogs: false,
    canViewEmployeePerformance: false,
    canOverrideFlags: false,
    canSync: true,
    viewOnlyAssignedCustomers: true,
  },

  customer_service_executive: {
    canCreateCustomer: true,
    canEditCustomerBasicInfo: true,
    canViewCustomer: true,
    canUploadKYC: true,
    canViewKYC: true,
    canCreateLoan: false,
    canApproveLoan: false,
    canViewLoanDetails: true,
    canCalculateEMI: false,
    canCreateFieldVisit: false,
    canViewFieldVisits: false,
    canRecordCashCollection: false,
    canViewBranchAnalytics: false,
    canViewAuditLogs: false,
    canViewEmployeePerformance: false,
    canOverrideFlags: false,
    canSync: true,
    viewOnlyAssignedCustomers: false,
  },

  loan_officer: {
    canCreateCustomer: false,
    canEditCustomerBasicInfo: false,
    canViewCustomer: true,
    canUploadKYC: false,
    canViewKYC: true,
    canCreateLoan: true,
    canApproveLoan: false,
    canViewLoanDetails: true,
    canCalculateEMI: true,
    canCreateFieldVisit: false,
    canViewFieldVisits: true,
    canRecordCashCollection: false,
    canViewBranchAnalytics: false,
    canViewAuditLogs: false,
    canViewEmployeePerformance: false,
    canOverrideFlags: false,
    canSync: true,
    viewOnlyAssignedCustomers: false,
  },

  branch_manager: {
    canCreateCustomer: false,
    canEditCustomerBasicInfo: false,
    canViewCustomer: true,
    canUploadKYC: false,
    canViewKYC: true,
    canCreateLoan: false,
    canApproveLoan: true,
    canViewLoanDetails: true,
    canCalculateEMI: true,
    canCreateFieldVisit: false,
    canViewFieldVisits: true,
    canRecordCashCollection: false,
    canViewBranchAnalytics: true,
    canViewAuditLogs: true,
    canViewEmployeePerformance: true,
    canOverrideFlags: true,
    canSync: false,
    viewOnlyAssignedCustomers: false,
  },
};

// Role Display Labels
export const ROLE_LABELS = {
  field_officer: 'Field Officer',
  customer_service_executive: 'Customer Service Executive',
  loan_officer: 'Loan Officer',
  branch_manager: 'Branch Manager',
};

// Role-specific Dashboard Routes
export const ROLE_DASHBOARDS = {
  field_officer: '/dashboard/field-officer',
  customer_service_executive: '/dashboard/cse',
  loan_officer: '/dashboard/loan-officer',
  branch_manager: '/dashboard/manager',
};

// Loan Types with Interest Rates
export const LOAN_TYPES = [
  { value: 'agriculture', label: 'Agriculture Loan', interestRate: 7.0, maxAmount: 500000 },
  { value: 'livestock', label: 'Livestock Loan', interestRate: 8.5, maxAmount: 200000 },
  { value: 'business', label: 'Micro Business Loan', interestRate: 10.0, maxAmount: 300000 },
  { value: 'personal', label: 'Personal Loan', interestRate: 12.0, maxAmount: 100000 },
  { value: 'housing', label: 'Rural Housing Loan', interestRate: 8.0, maxAmount: 1000000 },
];

// Credit Card Types
export const CREDIT_CARD_TYPES = [
  { value: 'classic', label: 'Classic Card', limit: 25000 },
  { value: 'gold', label: 'Gold Card', limit: 50000 },
  { value: 'platinum', label: 'Platinum Card', limit: 100000 },
];

// Transaction Types
export const TRANSACTION_TYPES = [
  { value: 'deposit', label: 'Deposit', icon: 'ArrowDownLeft' },
  { value: 'withdrawal', label: 'Withdrawal', icon: 'ArrowUpRight' },
  { value: 'transfer', label: 'Fund Transfer', icon: 'ArrowLeftRight' },
];

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

// Occupations
export const OCCUPATIONS = [
  'Farmer',
  'Agricultural Laborer',
  'Dairy Farming',
  'Poultry Farming',
  'Fisherman',
  'Artisan',
  'Weaver',
  'Small Shop Owner',
  'Street Vendor',
  'Carpenter',
  'Blacksmith',
  'Potter',
  'Daily Wage Worker',
  'Domestic Helper',
  'Self-Employed',
  'Government Employee',
  'Private Employee',
  'Retired',
  'Homemaker',
  'Student',
  'Other',
];

// Visit Types
export const VISIT_TYPES = [
  { value: 'pre_sanction', label: 'Pre-Sanction Verification' },
  { value: 'post_sanction', label: 'Post-Sanction Inspection' },
  { value: 'recovery', label: 'Recovery Visit' },
  { value: 'verification', label: 'Document Verification' },
];

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

// Complaint Categories
export const COMPLAINT_CATEGORIES = [
  { value: 'account', label: 'Account Related' },
  { value: 'loan', label: 'Loan Related' },
  { value: 'service', label: 'Service Quality' },
  { value: 'document', label: 'Document Issues' },
  { value: 'other', label: 'Other' },
];

// IndexedDB Configuration
export const DB_CONFIG = {
  name: 'CommunityBankDB',
  version: 5,
  stores: {
    staffUsers: 'id, username, role, isActive, employeeId',
    customers: 'id, aadhaarNumber, phone, status, syncStatus, createdAt, accountNumber, assignedTo',
    accounts: 'id, customerId, accountNumber, status, syncStatus, openedAt',
    kycDocuments: 'id, customerId, type, status, syncStatus',
    loans: 'id, customerId, status, syncStatus, applicationDate',
    visits: 'id, customerId, loanId, status, syncStatus, scheduledDate, createdBy',
    auditLogs: 'id, action, entityType, syncStatus, performedAt, performedBy',
    syncQueue: 'id, entityType, status, createdAt',
    transactions: 'id, customerId, accountId, accountNumber, type, syncStatus, transactionDate',
    creditCards: 'id, customerId, cardNumber, status, syncStatus',
    complaints: 'id, customerId, status, syncStatus, createdAt',
  },
};

// API Configuration (for future backend integration)
export const API_CONFIG = {
  baseUrl: '/api',
  timeout: 30000,
};
