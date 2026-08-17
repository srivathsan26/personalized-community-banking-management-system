import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Wallet } from 'lucide-react';
import { getLoan, repayLoan } from '@/services/localDB';
import { Loan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoanDetail() {
  const { loanId } = useParams<{ loanId: string }>();
  const { user } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadLoan() {
      if (!loanId) {
        setIsLoading(false);
        return;
      }

      try {
        setLoan(await getLoan(loanId));
      } finally {
        setIsLoading(false);
      }
    }

    loadLoan();
  }, [loanId]);

  async function handleRepayment(e: React.FormEvent) {
    e.preventDefault();
    if (!loan) {
      return;
    }

    const amount = Number(repaymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid repayment amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedLoan = await repayLoan(loan.id, amount);
      setLoan(updatedLoan);
      setRepaymentAmount('');
      toast.success('Loan repayment recorded.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to record repayment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading loan details...</div>;
  }

  if (!loan) {
    return <div className="py-10 text-center text-muted-foreground">Loan record not found.</div>;
  }

  const canRecordRepayment = user?.role === 'customer_service_executive' || user?.role === 'branch_manager';
  const remainingAmount = Math.max(0, loan.amount - (loan.repaidAmount || 0));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Loan Details</h1>
          <p className="page-subtitle">Track repayment progress and installment schedule</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/loans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Loans
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{loan.customerName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Loan ID</p>
            <p className="font-semibold">{loan.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-semibold">Rs.{loan.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Repaid</p>
            <p className="font-semibold">Rs.{(loan.repaidAmount || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="font-semibold">Rs.{remainingAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">EMI</p>
            <p className="font-semibold">Rs.{loan.emiAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tenure</p>
            <p className="font-semibold">{loan.tenure} months</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Risk Score</p>
            <p className="font-semibold">{loan.riskScore || 0}/100</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={loan.status === 'closed' || loan.status === 'disbursed' ? 'default' : 'secondary'}>
              {loan.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {canRecordRepayment ? (
        <Card>
          <CardHeader>
            <CardTitle>Record Repayment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRepayment} className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Repayment Amount</label>
                <Input value={repaymentAmount} onChange={(e) => setRepaymentAmount(e.target.value)} placeholder="Enter amount" />
              </div>
              <Button type="submit" disabled={isSubmitting || remainingAmount === 0}>
                {isSubmitting ? 'Recording...' : 'Record Repayment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Repayment Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(loan.repaymentSchedule || []).map((installment) => (
              <div key={installment.installmentNumber} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">Installment {installment.installmentNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Due {new Date(installment.dueDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Rs.{installment.amount.toLocaleString()}</p>
                  <Badge variant={installment.status === 'paid' ? 'default' : 'secondary'}>{installment.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Repayment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(loan.repaymentHistory || []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No repayments recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {loan.repaymentHistory?.map((entry, index) => (
                <div key={`${entry.paidAt}-${index}`} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">Rs.{entry.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.accountNumber} • {new Date(entry.paidAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">Recorded by {entry.recordedBy}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
