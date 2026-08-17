import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addAccount, generateAccountNumber, getAllCustomers } from '@/services/localDB';
import { Account, Customer } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function AccountForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [accountType, setAccountType] = useState<Account['accountType']>('savings');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      const allCustomers = await getAllCustomers();
      setCustomers(allCustomers.filter((customer) => customer.status === 'verified'));
    }

    loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Select a verified customer');
      return;
    }

    const balance = Number(openingBalance || '0');
    if (Number.isNaN(balance) || balance < 0) {
      toast.error('Enter a valid opening balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const account: Account = {
        id: `acc_${Date.now()}`,
        customerId: selectedCustomer.id,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        accountNumber: await generateAccountNumber(),
        accountType,
        balance,
        status: 'active',
        openedAt: new Date().toISOString(),
        openedBy: user?.id || 'system',
        approvedBy: user?.id || 'system',
        approvedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      await addAccount(account);
      toast.success(`Account ${account.accountNumber} created successfully`);
      navigate('/accounts');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="page-title">Open New Account</h1>
          <p className="page-subtitle">Create a bank account for a verified customer</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Verify the customer and choose the account type</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select
                value={selectedCustomer?.id || ''}
                onValueChange={(value) => setSelectedCustomer(customers.find((customer) => customer.id === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select verified customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} • {customer.village}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select value={accountType} onValueChange={(value) => setAccountType(value as Account['accountType'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <Input type="number" min="0" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/accounts')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
