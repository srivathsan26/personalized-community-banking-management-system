import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Landmark, Wallet } from 'lucide-react';
import { getAccount, getTransactionsByAccount } from '@/services/localDB';
import { Account, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      if (!accountId) {
        setIsLoading(false);
        return;
      }

      try {
        const [accountData, accountTransactions] = await Promise.all([
          getAccount(accountId),
          getTransactionsByAccount(accountId),
        ]);
        setAccount(accountData || null);
        setTransactions(accountTransactions);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccount();
  }, [accountId]);

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading account details...</div>;
  }

  if (!account) {
    return <div className="py-10 text-center text-muted-foreground">Account not found.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Account Details</h1>
          <p className="page-subtitle">View account information and transaction history</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/accounts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            {account.customerName}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Account Number</p>
            <p className="font-semibold">{account.accountNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-semibold capitalize">{account.accountType.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="font-semibold">Rs.{account.balance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>{account.status}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No transactions recorded for this account.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.id} • {new Date(transaction.transactionDate).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rs.{transaction.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Balance after: Rs.{transaction.balance.toLocaleString()}</p>
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
