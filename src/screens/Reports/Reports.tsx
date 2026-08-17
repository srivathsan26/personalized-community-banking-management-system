import { useEffect, useMemo, useState } from 'react';
import {
  getAllAccounts,
  getAllAuditLogs,
  getAllCreditCards,
  getAllCustomers,
  getAllLoans,
  getAllTransactions,
} from '@/services/localDB';
import { Account, AuditLog, CreditCard, Customer, Loan, Transaction } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Users,
  Wallet,
  ArrowLeftRight,
  Shield,
  TrendingUp,
  TrendingDown,
  Download,
  Landmark,
  CreditCard as CreditCardIcon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function escapeCsv(value: string | number | undefined) {
  const normalized = `${value ?? ''}`.replace(/"/g, '""');
  return `"${normalized}"`;
}

export default function Reports() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [logs, custs, accts, lns, txns, cards] = await Promise.all([
        getAllAuditLogs(),
        getAllCustomers(),
        getAllAccounts(),
        getAllLoans(),
        getAllTransactions(),
        getAllCreditCards(),
      ]);

      setAuditLogs(logs);
      setCustomers(custs);
      setAccounts(accts);
      setLoans(lns);
      setTransactions(txns);
      setCreditCards(cards);
      setIsLoading(false);
    }

    loadData();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return auditLogs.filter((log) => {
      const matchesSearch =
        !query ||
        log.details.toLowerCase().includes(query) ||
        log.performedBy.toLowerCase().includes(query);
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  const totalDeposits = transactions
    .filter((txn) => txn.type === 'deposit')
    .reduce((sum, txn) => sum + txn.amount, 0);
  const totalWithdrawals = transactions
    .filter((txn) => txn.type === 'withdrawal')
    .reduce((sum, txn) => sum + txn.amount, 0);
  const totalLoanAmount = loans
    .filter((loan) => loan.status === 'approved' || loan.status === 'disbursed')
    .reduce((sum, loan) => sum + loan.amount, 0);
  const verifiedCustomers = customers.filter((customer) => customer.status === 'verified').length;
  const activeAccounts = accounts.filter((account) => account.status === 'active').length;
  const activeCards = creditCards.filter((card) => card.status === 'active').length;
  const performanceSeries = [
    { name: 'Deposits', value: totalDeposits },
    { name: 'Withdrawals', value: totalWithdrawals },
    { name: 'Loans', value: totalLoanAmount },
    { name: 'Cards', value: creditCards.reduce((sum, card) => sum + card.outstandingBalance, 0) },
  ];
  const portfolioMix = [
    { name: 'Accounts', value: accounts.length, color: 'hsl(var(--primary))' },
    { name: 'Loans', value: loans.length, color: 'hsl(var(--accent))' },
    { name: 'Cards', value: creditCards.length, color: 'hsl(var(--warning))' },
    { name: 'Customers', value: customers.length, color: 'hsl(var(--success))' },
  ];

  const handleExport = () => {
    const lines = [
      ['Section', 'Identifier', 'Name', 'Status', 'Amount', 'Date', 'Notes'].map(escapeCsv).join(','),
      ...accounts.map((account) =>
        [
          'Account',
          account.accountNumber,
          account.customerName,
          account.status,
          account.balance,
          account.openedAt,
          account.accountType,
        ].map(escapeCsv).join(',')
      ),
      ...transactions.map((txn) =>
        [
          'Transaction',
          txn.id,
          txn.customerName,
          txn.status,
          txn.amount,
          txn.transactionDate,
          txn.type,
        ].map(escapeCsv).join(',')
      ),
      ...loans.map((loan) =>
        [
          'Loan',
          loan.id,
          loan.customerName,
          loan.status,
          loan.amount,
          loan.applicationDate,
          loan.loanType,
        ].map(escapeCsv).join(',')
      ),
      ...creditCards.map((card) =>
        [
          'Credit Card',
          card.id,
          card.customerName,
          card.status,
          card.creditLimit,
          card.issuedDate,
          card.cardType,
        ].map(escapeCsv).join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pcbms-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully.');
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('approved') || action.includes('created')) {
      return 'status-approved';
    }
    if (action.includes('rejected') || action.includes('failed')) {
      return 'status-rejected';
    }
    return 'status-pending';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Reports & Monitoring</h1>
          <p className="page-subtitle">Generate operational reports across accounts, loans, transactions, and cards</p>
        </div>

        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Card className="stat-card h-full bg-success/5 border-success/20">
          <CardContent className="flex h-full items-center p-6">
            <div className="flex min-h-[72px] items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Deposits</p>
                <p className="stat-value text-success">Rs.{totalDeposits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card h-full bg-destructive/5 border-destructive/20">
          <CardContent className="flex h-full items-center p-6">
            <div className="flex min-h-[72px] items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Withdrawals</p>
                <p className="stat-value text-destructive">Rs.{totalWithdrawals.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card h-full bg-accent/5 border-accent/20">
          <CardContent className="flex h-full items-center p-6">
            <div className="flex min-h-[72px] items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Loans</p>
                <p className="stat-value text-accent">Rs.{totalLoanAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card h-full bg-primary/5 border-primary/20">
          <CardContent className="flex h-full items-center p-6">
            <div className="flex min-h-[72px] items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Verified Customers</p>
                <p className="stat-value">{verifiedCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card h-full">
          <CardContent className="flex h-full items-center p-6">
            <div className="flex min-h-[72px] items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Landmark className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Active Accounts</p>
                <p className="stat-value">{activeAccounts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card h-full">
          <CardContent className="flex h-full items-center p-6">
            <div className="flex min-h-[72px] items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCardIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Active Cards</p>
                <p className="stat-value">{activeCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Performance</CardTitle>
            <CardDescription>Operational totals across deposits, withdrawals, loans, and cards</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Portfolio Mix</CardTitle>
            <CardDescription>Distribution of branch records across major banking modules</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={portfolioMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {portfolioMix.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="bg-muted/50 flex flex-wrap h-auto">
          <TabsTrigger value="audit" className="gap-2">
            <Shield className="w-4 h-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-2">
            <Landmark className="w-4 h-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="loans" className="gap-2">
            <Wallet className="w-4 h-4" />
            Loans
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-2">
            <CreditCardIcon className="w-4 h-4" />
            Credit Cards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search audit logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 input-banking"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="customer_created">Customer Created</SelectItem>
                    <SelectItem value="account_created">Account Created</SelectItem>
                    <SelectItem value="loan_created">Loan Created</SelectItem>
                    <SelectItem value="loan_approved">Loan Approved</SelectItem>
                    <SelectItem value="card_approved">Card Approved</SelectItem>
                    <SelectItem value="transaction_completed">Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Trail</CardTitle>
              <CardDescription>
                {filteredLogs.length} entries supporting traceability and compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.slice(0, 50).map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionBadgeClass(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{log.entityType}</span>
                        </div>
                        <p className="text-sm">{log.details}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>By: {log.performedBy}</span>
                          <span>{new Date(log.performedAt).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Portfolio</CardTitle>
              <CardDescription>{accounts.length} accounts opened across the branch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="table-banking">
                  <thead>
                    <tr>
                      <th>Account No.</th>
                      <th>Customer Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Opened On</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.slice(0, 20).map((account) => (
                      <tr key={account.id}>
                        <td className="account-number">{account.accountNumber}</td>
                        <td className="font-medium">{account.customerName}</td>
                        <td className="capitalize">{account.accountType.replace('_', ' ')}</td>
                        <td>
                          <Badge className={account.status === 'active' ? 'status-approved' : 'status-pending'}>
                            {account.status}
                          </Badge>
                        </td>
                        <td>{new Date(account.openedAt).toLocaleDateString('en-IN')}</td>
                        <td className="font-semibold">Rs.{account.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Summary</CardTitle>
              <CardDescription>{transactions.length} total transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="table-banking">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 20).map((txn) => (
                      <tr key={txn.id}>
                        <td className="transaction-id">{txn.id}</td>
                        <td>{new Date(txn.transactionDate).toLocaleDateString('en-IN')}</td>
                        <td className="font-medium">{txn.customerName}</td>
                        <td>{txn.accountNumber}</td>
                        <td className="capitalize">{txn.type.replace('_', ' ')}</td>
                        <td className="font-semibold">Rs.{txn.amount.toLocaleString()}</td>
                        <td>
                          <Badge className={txn.status === 'success' ? 'status-approved' : 'status-pending'}>
                            {txn.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loan Portfolio Summary</CardTitle>
              <CardDescription>{loans.length} loan applications in the branch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="table-banking">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>EMI</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.slice(0, 20).map((loan) => (
                      <tr key={loan.id}>
                        <td className="transaction-id">{loan.id}</td>
                        <td className="font-medium">{loan.customerName}</td>
                        <td className="capitalize">{loan.loanType}</td>
                        <td className="font-semibold">Rs.{loan.amount.toLocaleString()}</td>
                        <td>
                          <Badge
                            className={
                              loan.status === 'approved' || loan.status === 'disbursed'
                                ? 'status-approved'
                                : loan.status === 'rejected'
                                  ? 'status-rejected'
                                  : 'status-pending'
                            }
                          >
                            {loan.status}
                          </Badge>
                        </td>
                        <td>Rs.{loan.emiAmount.toLocaleString()}</td>
                        <td>{loan.riskScore || 0}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credit Card Portfolio</CardTitle>
              <CardDescription>{creditCards.length} card applications and issued cards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="table-banking">
                  <thead>
                    <tr>
                      <th>Card ID</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Credit Limit</th>
                      <th>Outstanding</th>
                      <th>Statement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditCards.slice(0, 20).map((card) => (
                      <tr key={card.id}>
                        <td className="transaction-id">{card.id}</td>
                        <td className="font-medium">{card.customerName}</td>
                        <td className="capitalize">{card.cardType}</td>
                        <td>
                          <Badge
                            className={
                              card.status === 'active'
                                ? 'status-approved'
                                : card.status === 'rejected'
                                  ? 'status-rejected'
                                  : 'status-pending'
                            }
                          >
                            {card.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td>Rs.{card.creditLimit.toLocaleString()}</td>
                        <td>Rs.{card.outstandingBalance.toLocaleString()}</td>
                        <td>
                          {card.lastStatementDate
                            ? new Date(card.lastStatementDate).toLocaleDateString('en-IN')
                            : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
