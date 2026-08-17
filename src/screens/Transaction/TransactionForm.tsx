import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllAccounts,
  processTransaction,
} from '@/services/localDB';
import { Account, TransactionType } from '@/types';
import { TRANSACTION_TYPES } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TransactionForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    type: '' as TransactionType | '',
    amount: '',
    description: '',
    toAccountNumber: '',
  });

  useEffect(() => {
    async function loadAccounts() {
      const allAccounts = await getAllAccounts();
      setAccounts(allAccounts.filter((account) => account.status === 'active'));
    }

    loadAccounts();
  }, []);

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((entry) => entry.id === accountId) || null;
    setSelectedAccount(account);
    setFormData((prev) => ({ ...prev, accountId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount || !formData.type || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = Number(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    let destinationAccount: Account | null = null;
    if (formData.type === 'transfer') {
      destinationAccount = accounts.find((account) => account.accountNumber === formData.toAccountNumber) || null;
      if (!destinationAccount) {
        toast.error('Please select a destination account');
        return;
      }
      if (destinationAccount.id === selectedAccount.id) {
        toast.error('Source and destination accounts must be different');
        return;
      }
    }

    setIsLoading(true);
    try {
      await processTransaction({
        accountId: selectedAccount.id,
        customerId: selectedAccount.customerId,
        customerName: selectedAccount.customerName,
        accountNumber: selectedAccount.accountNumber,
        type: formData.type,
        amount,
        description: formData.description || `${formData.type} transaction`,
        toAccountNumber: destinationAccount?.accountNumber,
        createdBy: user?.id || 'system',
      });

      toast.success('Transaction completed successfully');
      navigate('/transactions');
    } catch (error) {
      console.error(error);
      toast.error('Failed to process transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-success" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case 'transfer':
        return <ArrowLeftRight className="w-4 h-4 text-accent" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="page-title">New Transaction</h1>
          <p className="page-subtitle">Process deposits, withdrawals, and fund transfers</p>
        </div>
      </div>

      <Card className="card-banking">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Validate the account and complete the transaction instantly</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="label-banking">Select Account *</Label>
              <Select value={formData.accountId} onValueChange={handleAccountChange}>
                <SelectTrigger className="input-banking">
                  <SelectValue placeholder="Choose an active account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.customerName} • {account.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAccount && (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-4 flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{selectedAccount.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedAccount.accountNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedAccount.accountType.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-xl font-bold text-success">Rs.{selectedAccount.balance.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label className="label-banking">Transaction Type *</Label>
              <div className="grid grid-cols-3 gap-3">
                {TRANSACTION_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={formData.type === type.value ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                  >
                    {getTypeIcon(type.value)}
                    <span className="text-xs font-semibold">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="label-banking">Amount (Rs.) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className="input-banking text-lg font-semibold"
                placeholder="0.00"
                min="1"
                step="0.01"
              />
            </div>

            {formData.type === 'transfer' && (
              <div className="space-y-2">
                <Label className="label-banking">Transfer To *</Label>
                <Select value={formData.toAccountNumber} onValueChange={(value) => setFormData((prev) => ({ ...prev, toAccountNumber: value }))}>
                  <SelectTrigger className="input-banking">
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((account) => account.id !== selectedAccount?.id)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.accountNumber}>
                          {account.customerName} • {account.accountNumber}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="label-banking">Description / Remarks</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="input-banking min-h-20"
                placeholder="Optional transaction notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/transactions')}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 btn-primary" disabled={isLoading || !selectedAccount || !formData.type || !formData.amount}>
                {isLoading ? 'Processing...' : 'Complete Transaction'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
