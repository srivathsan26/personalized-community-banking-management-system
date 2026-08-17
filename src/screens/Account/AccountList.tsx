import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllAccounts, getTransactionsByAccount } from '@/services/localDB';
import { Account } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Wallet } from 'lucide-react';

type AccountWithStats = Account & { transactionCount: number; lastTransaction?: string };

export default function AccountList() {
  const [accounts, setAccounts] = useState<AccountWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAccounts() {
      const allAccounts = await getAllAccounts();
      const enriched = await Promise.all(
        allAccounts.map(async (account) => {
          const transactions = await getTransactionsByAccount(account.id);
          const latest = [...transactions].sort(
            (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
          )[0];
          return {
            ...account,
            transactionCount: transactions.length,
            lastTransaction: latest?.transactionDate,
          };
        })
      );
      setAccounts(enriched);
      setIsLoading(false);
    }

    loadAccounts();
  }, []);

  const filtered = accounts.filter((account) => {
    const query = searchQuery.toLowerCase();
    return (
      account.customerName.toLowerCase().includes(query) ||
      account.accountNumber.toLowerCase().includes(query) ||
      account.accountType.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Account Management</h1>
          <p className="page-subtitle">Create and manage customer bank accounts</p>
        </div>
        <Button asChild className="btn-primary">
          <Link to="/accounts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer or account number..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="stat-label">Total Accounts</p>
            <p className="stat-value">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="stat-label">Active Accounts</p>
            <p className="stat-value text-success">{accounts.filter((account) => account.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="stat-label">Total Deposits Held</p>
            <p className="stat-value">Rs.{accounts.reduce((sum, account) => sum + account.balance, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>{filtered.length} account records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Wallet className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No accounts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((account) => (
                <div key={account.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{account.customerName}</p>
                    <Link to={`/accounts/${account.id}`} className="text-sm text-muted-foreground hover:text-primary">
                      {account.accountNumber} • {account.accountType.replace('_', ' ')}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">Rs.{account.balance.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{account.transactionCount} transactions</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/accounts/${account.id}`}>View</Link>
                    </Button>
                    <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>{account.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
