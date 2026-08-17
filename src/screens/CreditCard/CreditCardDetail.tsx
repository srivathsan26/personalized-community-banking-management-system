import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, ReceiptText } from 'lucide-react';
import {
  addCreditCardTransaction,
  generateCreditCardStatement,
  getCreditCard,
  recordCreditCardPayment,
} from '@/services/localDB';
import { CreditCard as CreditCardType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function CreditCardDetail() {
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const [card, setCard] = useState<CreditCardType | null>(null);
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('general');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCard() {
      if (!cardId) {
        setIsLoading(false);
        return;
      }

      try {
        setCard(await getCreditCard(cardId));
      } finally {
        setIsLoading(false);
      }
    }

    loadCard();
  }, [cardId]);

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!card) {
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedCard = await addCreditCardTransaction(card.id, Number(transactionAmount), merchant.trim(), category.trim() || 'general');
      setCard(updatedCard);
      setMerchant('');
      setCategory('general');
      setTransactionAmount('');
      toast.success('Credit card transaction recorded.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to record credit card transaction.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!card) {
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedCard = await recordCreditCardPayment(card.id, Number(paymentAmount));
      setCard(updatedCard);
      setPaymentAmount('');
      toast.success('Credit card payment recorded.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to record card payment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateStatement() {
    if (!card) {
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedCard = await generateCreditCardStatement(card.id);
      setCard(updatedCard);
      toast.success('Credit card statement generated.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate statement.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading credit card details...</div>;
  }

  if (!card) {
    return <div className="py-10 text-center text-muted-foreground">Credit card record not found.</div>;
  }

  const canManageCards = user?.role === 'customer_service_executive' || user?.role === 'branch_manager';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Credit Card Details</h1>
          <p className="page-subtitle">Track card activity, statements, and reminders</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cards
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{card.customerName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Card Number</p>
            <p className="font-semibold">XXXX XXXX XXXX {card.cardNumber.slice(-4)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>{card.status.replace('_', ' ')}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="font-semibold">Rs.{card.outstandingBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available Credit</p>
            <p className="font-semibold">Rs.{card.availableCredit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Minimum Payment</p>
            <p className="font-semibold">Rs.{card.minimumPayment.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-semibold">{new Date(card.dueDate).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Statement</p>
            <p className="font-semibold">{card.lastStatementDate ? new Date(card.lastStatementDate).toLocaleDateString('en-IN') : 'Not generated'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Reminder</p>
            <p className="font-semibold">{card.paymentReminderDate ? new Date(card.paymentReminderDate).toLocaleDateString('en-IN') : 'Pending'}</p>
          </div>
        </CardContent>
      </Card>

      {canManageCards ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Record Card Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant name" />
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
                <Input value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} placeholder="Transaction amount" />
                <Button type="submit" disabled={isSubmitting || card.status !== 'active'}>
                  {isSubmitting ? 'Saving...' : 'Add Transaction'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments & Statements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Payment amount" />
                <Button type="submit" disabled={isSubmitting || card.outstandingBalance === 0}>
                  {isSubmitting ? 'Saving...' : 'Record Payment'}
                </Button>
              </form>
              <Button variant="outline" onClick={handleGenerateStatement} disabled={isSubmitting}>
                <ReceiptText className="mr-2 h-4 w-4" />
                Generate Statement
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Card Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(card.transactions || []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No card transactions recorded.</div>
          ) : (
            <div className="space-y-3">
              {card.transactions?.map((transaction) => (
                <div key={transaction.id} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{transaction.merchant}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category} • {new Date(transaction.transactionDate).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Rs.{Math.abs(transaction.amount).toLocaleString()}</p>
                    <Badge variant={transaction.amount < 0 ? 'secondary' : 'default'}>
                      {transaction.amount < 0 ? 'Payment' : 'Transaction'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            Statement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(card.statementHistory || []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No statements generated yet.</div>
          ) : (
            <div className="space-y-3">
              {card.statementHistory?.map((statement, index) => (
                <div key={`${statement.statementDate}-${index}`} className="rounded-lg border p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Statement Date</p>
                      <p className="font-semibold">{new Date(statement.statementDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-semibold">{new Date(statement.dueDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="font-semibold">Rs.{statement.outstandingBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum Payment</p>
                      <p className="font-semibold">Rs.{statement.minimumPayment.toLocaleString()}</p>
                    </div>
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
