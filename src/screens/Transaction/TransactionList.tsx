import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCustomers, getAllTransactions } from '@/services/localDB';
import { Customer, Transaction } from '@/types';
import { ROLE_PERMISSIONS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Plus, Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TransactionList() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  useEffect(() => {
    async function loadData() {
      const [txns, custs] = await Promise.all([getAllTransactions(), getAllCustomers()]);
      setTransactions(
        txns.sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        )
      );
      setCustomers(custs);
      setIsLoading(false);
    }

    loadData();
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.accountNumber.includes(searchQuery) ||
      txn.id.includes(searchQuery);
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'transfer':
        return <ArrowLeftRight className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTransactionClass = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'transaction-deposit';
      case 'withdrawal':
        return 'transaction-withdrawal';
      case 'transfer':
        return 'transaction-transfer';
      default:
        return '';
    }
  };

  const getStatusBadgeClass = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'bg-success/10 text-success';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-warning/10 text-warning';
    }
  };

  const formatAmount = (type: string, amount: number) => {
    const prefix = type === 'deposit' ? '+' : '-';
    return `${prefix}Rs.${amount.toLocaleString()}`;
  };

  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Manage deposits, withdrawals, and fund transfers</p>
        </div>

        {(user?.role === 'branch_manager' || user?.role === 'customer_service_executive') && (
          <Button asChild className="btn-primary">
            <Link to="/transactions/new">
              <Plus className="w-4 h-4 mr-2" />
              New Transaction
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card bg-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <ArrowDownLeft className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="stat-label">Total Deposits</p>
                <p className="stat-value text-success">Rs.{totalDeposits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card bg-destructive/5 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ArrowUpRight className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="stat-label">Total Withdrawals</p>
                <p className="stat-value text-destructive">Rs.{totalWithdrawals.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <ArrowLeftRight className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="stat-label">Total Transactions</p>
                <p className="stat-value">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, account, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-banking"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No transactions found</p>
              <p className="text-sm">Create a new transaction to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-banking">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Account</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>
                        <span className="transaction-id">{txn.id}</span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">
                            {new Date(txn.transactionDate).toLocaleDateString('en-IN')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.transactionDate).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="font-medium">{txn.customerName}</td>
                      <td>
                        <span className="account-number">{txn.accountNumber}</span>
                      </td>
                      <td>
                        <Badge className={getTransactionClass(txn.type)}>
                          {getTransactionIcon(txn.type)}
                          <span className="ml-1 capitalize">{txn.type}</span>
                        </Badge>
                      </td>
                      <td
                        className={`font-semibold ${
                          txn.type === 'deposit'
                            ? 'text-success'
                            : 'text-destructive'
                        }`}
                      >
                        {formatAmount(txn.type, txn.amount)}
                      </td>
                      <td className="font-medium">Rs.{txn.balance.toLocaleString()}</td>
                      <td>
                        <Badge variant="secondary" className={getStatusBadgeClass(txn.status)}>
                          {txn.status === 'success' ? 'Success' : txn.status === 'failed' ? 'Failed' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
