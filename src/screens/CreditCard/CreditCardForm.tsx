import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { addCreditCard, createAuditLog, generateId, getAllCustomers } from '@/services/localDB';
import { Customer } from '@/types';
import { CREDIT_CARD_TYPES } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function generateCardNumber() {
  const prefix = '4532';
  let number = prefix;
  for (let i = 0; i < 12; i += 1) {
    number += Math.floor(Math.random() * 10);
  }
  return number;
}

function getEligibleCardLimit(customer: Customer) {
  return Math.max(15000, Math.round(customer.annualIncome * 0.2));
}

export default function CreditCardForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cardType, setCardType] = useState<'' | 'classic' | 'gold' | 'platinum'>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      const allCustomers = await getAllCustomers();
      setCustomers(
        allCustomers.filter((customer) => customer.status === 'verified' && customer.primaryAccountId)
      );
    }

    loadCustomers();
  }, []);

  const selectedProduct = useMemo(
    () => CREDIT_CARD_TYPES.find((item) => item.value === cardType),
    [cardType]
  );
  const eligibleLimit = selectedCustomer ? getEligibleCardLimit(selectedCustomer) : 0;
  const recommendedLimit = selectedProduct ? Math.min(selectedProduct.limit, eligibleLimit) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer || !cardType || !selectedProduct || !user) {
      setError('Please choose a customer and card type.');
      return;
    }

    if (!selectedCustomer.primaryAccountId) {
      setError('Customer needs an active account before card application.');
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 30);
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);

      const creditCard = {
        id: generateId('card'),
        customerId: selectedCustomer.id,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        cardNumber: generateCardNumber(),
        cardType,
        creditLimit: recommendedLimit,
        availableCredit: recommendedLimit,
        outstandingBalance: 0,
        minimumPayment: 0,
        dueDate: dueDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'pending_review' as const,
        issuedDate: now.toISOString(),
        createdBy: user.id,
        syncStatus: 'pending' as const,
      };

      await addCreditCard(creditCard);
      await createAuditLog(
        'card_issued',
        'credit_card',
        creditCard.id,
        user.name,
        `${selectedProduct.label} application submitted for ${creditCard.customerName}`,
        user.role
      );

      toast.success('Card application submitted for manager review.');
      navigate('/cards');
    } catch (submitError) {
      console.error('Card issue error:', submitError);
      setError('Failed to submit card application.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCardTypeStyle = (type: string) => {
    switch (type) {
      case 'platinum':
        return 'bg-gradient-to-br from-slate-700 to-slate-900';
      case 'gold':
        return 'bg-gradient-to-br from-amber-500 to-amber-700';
      default:
        return 'bg-gradient-to-br from-primary to-teal-700';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cards')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="page-title">New Credit Card Application</h1>
          <p className="page-subtitle">Create reviewed card requests with eligibility-based limits</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="card-banking">
        <CardHeader>
          <CardTitle>Card Details</CardTitle>
          <CardDescription>Only verified customers with active accounts can apply</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="label-banking">Select Customer *</Label>
              <Select
                value={selectedCustomer?.id || ''}
                onValueChange={(customerId) => {
                  const customer = customers.find((item) => item.id === customerId) || null;
                  setSelectedCustomer(customer);
                }}
              >
                <SelectTrigger className="input-banking">
                  <SelectValue placeholder="Choose a verified customer with account" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} - {customer.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomer && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Annual Income</p>
                      <p className="font-semibold">Rs.{selectedCustomer.annualIncome.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-semibold">{selectedCustomer.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Eligible Card Limit</p>
                      <p className="font-semibold">Rs.{eligibleLimit.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Label className="label-banking">Card Type *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CREDIT_CARD_TYPES.map((type) => {
                  const limit = selectedCustomer ? Math.min(type.limit, eligibleLimit) : type.limit;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setCardType(type.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        cardType === type.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-full h-20 rounded-lg ${getCardTypeStyle(type.value)} mb-3 flex items-center justify-center`}>
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                      <p className="font-semibold text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Approved limit up to Rs.{limit.toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedCustomer && selectedProduct && (
              <Card className="border-success/20 bg-success/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    Review Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Selected Product</p>
                    <p className="font-semibold">{selectedProduct.label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recommended Limit</p>
                    <p className="font-semibold">Rs.{recommendedLimit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Workflow</p>
                    <p className="font-semibold">Pending manager approval</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCustomer && cardType && (
              <div className="pt-4">
                <Label className="label-banking mb-3">Card Preview</Label>
                <div className={`credit-card ${getCardTypeStyle(cardType)}`}>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-xs opacity-80 uppercase tracking-wider">Community Bank</p>
                        <p className="text-sm font-semibold capitalize">{cardType} Card</p>
                      </div>
                      <CreditCard className="w-8 h-8 opacity-80" />
                    </div>

                    <p className="text-lg font-mono tracking-widest mb-4">
                      XXXX XXXX XXXX XXXX
                    </p>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-60 uppercase">Card Holder</p>
                        <p className="font-semibold text-sm">
                          {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-60 uppercase">Approved Limit</p>
                        <p className="font-mono text-sm">Rs.{recommendedLimit.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/cards')}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 btn-accent"
                disabled={isLoading || !selectedCustomer || !cardType}
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
