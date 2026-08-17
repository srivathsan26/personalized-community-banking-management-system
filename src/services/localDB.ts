import {
  Account,
  AuditLog,
  CreditCard,
  Customer,
  DashboardStats,
  FieldVisit,
  KYCDocument,
  Loan,
  StaffUser,
  SyncQueueItem,
  Transaction,
  User,
} from '@/types';
import { apiRequest, bootstrapBackend, loginRequest } from './api';

let initializationPromise: Promise<void> | null = null;

function randomString(length: number, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (value) => chars[value % chars.length]).join('');
}

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(camelize);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        camelize(nested),
      ])
    );
  }
  return value;
}

function snakify(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(snakify);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        snakify(nested),
      ])
    );
  }
  return value;
}

function mapStaffUser(raw: any): StaffUser {
  const value = camelize(raw) as any;
  return {
    ...value,
    passwordHash: '',
    passwordSalt: '',
  };
}

function mapCustomer(raw: any): Customer {
  return camelize(raw) as Customer;
}

function mapAccount(raw: any): Account {
  const value = camelize(raw) as any;
  return {
    ...value,
    customerId: value.customer,
  };
}

function mapKYCDocument(raw: any): KYCDocument {
  const value = camelize(raw) as any;
  return {
    ...value,
    customerId: value.customer,
  };
}

function mapLoan(raw: any): Loan {
  const value = camelize(raw) as any;
  return {
    ...value,
    customerId: value.customer,
  };
}

function mapVisit(raw: any): FieldVisit {
  const value = camelize(raw) as any;
  const normalizedStatus =
    value.status === 'completed'
      ? 'visited'
      : value.status === 'cancelled'
        ? 'postponed'
        : value.status;
  return {
    ...value,
    status: normalizedStatus,
    customerId: value.customer,
    loanId: value.loan,
  };
}

function mapAuditLog(raw: any): AuditLog {
  return camelize(raw) as AuditLog;
}

function mapTransaction(raw: any): Transaction {
  const value = camelize(raw) as any;
  return {
    ...value,
    customerId: value.customer,
    accountId: value.account,
  };
}

function mapCreditCard(raw: any): CreditCard {
  const value = camelize(raw) as any;
  return {
    ...value,
    customerId: value.customer,
  };
}

function serializeAccount(account: Account) {
  const value = snakify(account) as any;
  return {
    ...value,
    customer: account.customerId,
  };
}

function serializeCustomer(customer: Customer) {
  return snakify(customer);
}

function serializeKYCDocument(document: KYCDocument) {
  const value = snakify(document) as any;
  return {
    ...value,
    customer: document.customerId,
  };
}

function serializeLoan(loan: Loan) {
  const value = snakify(loan) as any;
  return {
    ...value,
    customer: loan.customerId,
  };
}

function serializeVisit(visit: FieldVisit) {
  const value = snakify(visit) as any;
  return {
    ...value,
    customer: visit.customerId,
    loan: visit.loanId || null,
  };
}

function serializeAuditLog(log: AuditLog) {
  return snakify(log);
}

function serializeTransaction(transaction: Transaction) {
  const value = snakify(transaction) as any;
  return {
    ...value,
    customer: transaction.customerId,
    account: transaction.accountId,
  };
}

function serializeCreditCard(card: CreditCard) {
  const value = snakify(card) as any;
  return {
    ...value,
    customer: card.customerId,
  };
}

export async function initDB(): Promise<null> {
  return null;
}

export async function initializeSystemData(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = bootstrapBackend();
  }

  await initializationPromise;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function generateCustomerId(): Promise<string> {
  return randomString(8);
}

export async function generateAccountNumber(): Promise<string> {
  return `GB${randomString(10, '0123456789')}`;
}

export function calculateLoanEligibility(customer: Customer, loanAmount: number) {
  const incomeMultiplier = customer.annualIncome * 0.6;
  const maxEligibleAmount = Math.max(25000, Math.round(incomeMultiplier));
  const riskScore = Math.max(
    30,
    Math.min(95, Math.round((customer.annualIncome / Math.max(loanAmount, 1)) * 10))
  );
  return {
    eligible: loanAmount <= maxEligibleAmount,
    maxEligibleAmount,
    riskScore,
  };
}

export function generateRepaymentSchedule(amount: number, annualRate: number, tenure: number, startDate: string) {
  const monthlyRate = annualRate / 12 / 100;
  const emiAmount = Math.round(
    (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1)
  );
  let outstanding = amount;
  const schedule: Loan['repaymentSchedule'] = [];

  for (let i = 1; i <= tenure; i += 1) {
    const interestComponent = Math.round(outstanding * monthlyRate);
    const principalComponent = Math.max(0, emiAmount - interestComponent);
    outstanding = Math.max(0, outstanding - principalComponent);
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    schedule.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString(),
      principalComponent,
      interestComponent,
      amount: emiAmount,
      status: 'upcoming',
    });
  }

  return schedule;
}

export async function authenticateStaffUser(username: string, password: string): Promise<User | null> {
  try {
    const response = await loginRequest(username, password);
    return response.user;
  } catch {
    return null;
  }
}

export async function getAllStaffUsers(): Promise<StaffUser[]> {
  const response = await apiRequest<any[]>('/staff-users/');
  return response.map(mapStaffUser);
}

export async function getStaffUser(id: string): Promise<StaffUser> {
  const response = await apiRequest<any>(`/staff-users/${id}/`);
  return mapStaffUser(response);
}

export async function addStaffUser(
  staff: Omit<StaffUser, 'id' | 'createdAt' | 'passwordHash' | 'passwordSalt' | 'employeeId'> & {
    password: string;
    employeeId?: string;
  }
): Promise<StaffUser> {
  const payload = {
    username: staff.username.toLowerCase(),
    password: staff.password,
    name: staff.name,
    role: staff.role,
    branch_code: staff.branchCode,
    branch_name: staff.branchName,
    is_active: staff.isActive,
    created_by: staff.createdBy,
    assigned_customers: staff.assignedCustomers || [],
  };
  const response = await apiRequest<any>('/staff-users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapStaffUser(response);
}

export async function updateStaffUser(staff: StaffUser): Promise<StaffUser> {
  const response = await apiRequest<any>(`/staff-users/${staff.id}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: staff.name,
      role: staff.role,
      branch_code: staff.branchCode,
      branch_name: staff.branchName,
      employee_id: staff.employeeId,
      is_active: staff.isActive,
      assigned_customers: staff.assignedCustomers || [],
    }),
  });
  return mapStaffUser(response);
}

export async function resetStaffPassword(staffId: string, newPassword: string): Promise<StaffUser> {
  const response = await apiRequest<any>(`/staff-users/${staffId}/reset_password/`, {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword }),
  });
  return mapStaffUser(response);
}

export async function addCustomer(customer: Customer): Promise<void> {
  await apiRequest('/customers/', {
    method: 'POST',
    body: JSON.stringify(serializeCustomer(customer)),
  });
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const response = await apiRequest<any>(`/customers/${id}/`);
  return mapCustomer(response);
}

export async function getAllCustomers(): Promise<Customer[]> {
  const response = await apiRequest<any[]>('/customers/');
  return response.map(mapCustomer);
}

export async function getCustomerByAadhaar(aadhaar: string): Promise<Customer | undefined> {
  const response = await apiRequest<any[]>(`/customers/?aadhaar_number=${encodeURIComponent(aadhaar)}`);
  return response[0] ? mapCustomer(response[0]) : undefined;
}

export async function updateCustomerSyncStatus(
  _id: string,
  _status: Customer['syncStatus']
): Promise<void> {
  return;
}

export async function updateCustomer(customer: Customer): Promise<void> {
  await apiRequest(`/customers/${customer.id}/`, {
    method: 'PATCH',
    body: JSON.stringify(serializeCustomer(customer)),
  });
}

export async function verifyCustomer(customerId: string): Promise<Customer> {
  const response = await apiRequest<any>(`/customers/${customerId}/verify/`, {
    method: 'POST',
  });
  return mapCustomer(response);
}

export async function rejectCustomer(customerId: string): Promise<Customer> {
  const response = await apiRequest<any>(`/customers/${customerId}/reject/`, {
    method: 'POST',
  });
  return mapCustomer(response);
}

export async function addAccount(account: Account): Promise<void> {
  await apiRequest('/accounts/', {
    method: 'POST',
    body: JSON.stringify(serializeAccount(account)),
  });
}

export async function getAccount(id: string): Promise<Account | undefined> {
  const response = await apiRequest<any>(`/accounts/${id}/`);
  return mapAccount(response);
}

export async function getAllAccounts(): Promise<Account[]> {
  const response = await apiRequest<any[]>('/accounts/');
  return response.map(mapAccount);
}

export async function getAccountsByCustomer(customerId: string): Promise<Account[]> {
  const response = await apiRequest<any[]>(`/accounts/?customer_id=${encodeURIComponent(customerId)}`);
  return response.map(mapAccount);
}

export async function getAccountByNumber(accountNumber: string): Promise<Account | undefined> {
  const response = await apiRequest<any[]>(
    `/accounts/?account_number=${encodeURIComponent(accountNumber)}`
  );
  return response[0] ? mapAccount(response[0]) : undefined;
}

export async function updateAccount(account: Account): Promise<void> {
  await apiRequest(`/accounts/${account.id}/`, {
    method: 'PATCH',
    body: JSON.stringify(serializeAccount(account)),
  });
}

export async function addKYCDocument(doc: KYCDocument): Promise<void> {
  await apiRequest('/kyc-documents/', {
    method: 'POST',
    body: JSON.stringify(serializeKYCDocument(doc)),
  });
}

export async function getKYCDocuments(customerId: string): Promise<KYCDocument[]> {
  const response = await apiRequest<any[]>(
    `/kyc-documents/?customer_id=${encodeURIComponent(customerId)}`
  );
  return response.map(mapKYCDocument);
}

export async function updateKYCSyncStatus(
  _id: string,
  _status: KYCDocument['syncStatus']
): Promise<void> {
  return;
}

export async function addLoan(loan: Loan): Promise<void> {
  await apiRequest('/loans/', {
    method: 'POST',
    body: JSON.stringify(serializeLoan(loan)),
  });
}

export async function getAllLoans(): Promise<Loan[]> {
  const response = await apiRequest<any[]>('/loans/');
  return response.map(mapLoan);
}

export async function getLoan(id: string): Promise<Loan> {
  const response = await apiRequest<any>(`/loans/${id}/`);
  return mapLoan(response);
}

export async function getLoansByCustomer(customerId: string): Promise<Loan[]> {
  const response = await apiRequest<any[]>(`/loans/?customer_id=${encodeURIComponent(customerId)}`);
  return response.map(mapLoan);
}

export async function updateLoan(loan: Loan): Promise<void> {
  await apiRequest(`/loans/${loan.id}/`, {
    method: 'PATCH',
    body: JSON.stringify(serializeLoan(loan)),
  });
}

export async function approveLoan(loanId: string): Promise<Loan> {
  const response = await apiRequest<any>(`/loans/${loanId}/approve/`, {
    method: 'POST',
  });
  return mapLoan(response);
}

export async function rejectLoan(loanId: string, reason: string): Promise<Loan> {
  const response = await apiRequest<any>(`/loans/${loanId}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return mapLoan(response);
}

export async function disburseLoan(loanId: string): Promise<Loan> {
  const response = await apiRequest<any>(`/loans/${loanId}/disburse/`, {
    method: 'POST',
  });
  return mapLoan(response);
}

export async function repayLoan(loanId: string, amount: number): Promise<Loan> {
  const response = await apiRequest<any>(`/loans/${loanId}/repay/`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return mapLoan(response);
}

export async function addVisit(visit: FieldVisit): Promise<void> {
  await apiRequest('/visits/', {
    method: 'POST',
    body: JSON.stringify(serializeVisit(visit)),
  });
}

export async function getAllVisits(): Promise<FieldVisit[]> {
  const response = await apiRequest<any[]>('/visits/');
  return response.map(mapVisit);
}

export async function getVisit(id: string): Promise<FieldVisit | undefined> {
  const response = await apiRequest<any>(`/visits/${id}/`);
  return mapVisit(response);
}

export async function getVisitsByCustomer(customerId: string): Promise<FieldVisit[]> {
  const response = await apiRequest<any[]>(`/visits/?customer_id=${encodeURIComponent(customerId)}`);
  return response.map(mapVisit);
}

export async function updateVisit(visit: FieldVisit): Promise<void> {
  await apiRequest(`/visits/${visit.id}/`, {
    method: 'PATCH',
    body: JSON.stringify(serializeVisit(visit)),
  });
}

export async function createAuditLog(
  action: AuditLog['action'],
  entityType: AuditLog['entityType'],
  entityId: string,
  performedBy: string,
  details: string,
  performedByRole: AuditLog['performedByRole'] = 'field_officer'
): Promise<void> {
  await addAuditLog({
    id: generateId('audit'),
    action,
    entityType,
    entityId,
    performedBy,
    performedByRole,
    performedAt: new Date().toISOString(),
    details,
    syncStatus: 'synced',
  });
}

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const response = await apiRequest<any[]>('/audit-logs/');
  return response.map(mapAuditLog);
}

export async function addAuditLog(log: AuditLog): Promise<void> {
  await apiRequest('/audit-logs/', {
    method: 'POST',
    body: JSON.stringify(serializeAuditLog(log)),
  });
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  await apiRequest('/transactions/', {
    method: 'POST',
    body: JSON.stringify(serializeTransaction(transaction)),
  });
}

export async function processTransaction(transaction: Omit<Transaction, 'id' | 'balance' | 'status' | 'syncStatus' | 'transactionDate'> & {
  toAccountNumber?: string;
  description: string;
}): Promise<Transaction> {
  const response = await apiRequest<any>('/transactions/', {
    method: 'POST',
    body: JSON.stringify(serializeTransaction({
      ...transaction,
      id: '',
      balance: 0,
      transactionDate: '',
      status: 'success',
      syncStatus: 'synced',
    })),
  });
  return mapTransaction(response);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const response = await apiRequest<any[]>('/transactions/');
  return response.map(mapTransaction);
}

export async function getTransactionsByCustomer(customerId: string): Promise<Transaction[]> {
  const response = await apiRequest<any[]>(
    `/transactions/?customer_id=${encodeURIComponent(customerId)}`
  );
  return response.map(mapTransaction);
}

export async function getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  const response = await apiRequest<any[]>(
    `/transactions/?account_id=${encodeURIComponent(accountId)}`
  );
  return response.map(mapTransaction);
}

export async function addCreditCard(card: CreditCard): Promise<void> {
  await apiRequest('/credit-cards/', {
    method: 'POST',
    body: JSON.stringify(serializeCreditCard(card)),
  });
}

export async function getAllCreditCards(): Promise<CreditCard[]> {
  const response = await apiRequest<any[]>('/credit-cards/');
  return response.map(mapCreditCard);
}

export async function getCreditCard(id: string): Promise<CreditCard> {
  const response = await apiRequest<any>(`/credit-cards/${id}/`);
  return mapCreditCard(response);
}

export async function getCreditCardsByCustomer(customerId: string): Promise<CreditCard[]> {
  const response = await apiRequest<any[]>(
    `/credit-cards/?customer_id=${encodeURIComponent(customerId)}`
  );
  return response.map(mapCreditCard);
}

export async function updateCreditCard(card: CreditCard): Promise<void> {
  await apiRequest(`/credit-cards/${card.id}/`, {
    method: 'PATCH',
    body: JSON.stringify(serializeCreditCard(card)),
  });
}

export async function approveCreditCard(cardId: string): Promise<CreditCard> {
  const response = await apiRequest<any>(`/credit-cards/${cardId}/approve/`, {
    method: 'POST',
  });
  return mapCreditCard(response);
}

export async function rejectCreditCard(cardId: string, reason: string): Promise<CreditCard> {
  const response = await apiRequest<any>(`/credit-cards/${cardId}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return mapCreditCard(response);
}

export async function addCreditCardTransaction(
  cardId: string,
  amount: number,
  merchant: string,
  category: string
): Promise<CreditCard> {
  const response = await apiRequest<any>(`/credit-cards/${cardId}/add_transaction/`, {
    method: 'POST',
    body: JSON.stringify({ amount, merchant, category }),
  });
  return mapCreditCard(response);
}

export async function recordCreditCardPayment(cardId: string, amount: number): Promise<CreditCard> {
  const response = await apiRequest<any>(`/credit-cards/${cardId}/record_payment/`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return mapCreditCard(response);
}

export async function generateCreditCardStatement(cardId: string): Promise<CreditCard> {
  const response = await apiRequest<any>(`/credit-cards/${cardId}/generate_statement/`, {
    method: 'POST',
  });
  return mapCreditCard(response);
}

export async function addToSyncQueue(
  _entityType: SyncQueueItem['entityType'],
  _entityId: string,
  _action: SyncQueueItem['action'],
  _data: unknown
): Promise<void> {
  return;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return [];
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return [];
}

export async function getSyncQueueCount(): Promise<number> {
  return 0;
}

export async function updateSyncQueueItem(_item: SyncQueueItem): Promise<void> {
  return;
}

export async function removeSyncQueueItem(_id: string): Promise<void> {
  return;
}

export async function clearAllData(): Promise<void> {
  return;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiRequest<any>('/dashboard/stats/');
  return camelize(response) as DashboardStats;
}

export async function seedDemoData(): Promise<void> {
  await initializeSystemData();
}
