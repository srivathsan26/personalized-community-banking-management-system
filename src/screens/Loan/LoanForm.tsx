import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import {
  addLoan,
  calculateLoanEligibility,
  generateId,
  generateRepaymentSchedule,
  getAllCustomers,
} from '@/services/localDB';
import { LOAN_TYPES } from '@/constants';
import { Customer, Loan } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Wallet,
  User,
  Calculator,
  ArrowLeft,
  Save,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';

function calculateEmi(principal: number, annualRate: number, months: number) {
  const rate = annualRate / 12 / 100;
  if (!principal || !months || !rate) {
    return 0;
  }

  return Math.round(
    (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
  );
}

export default function LoanForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSyncCount } = useApp();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loanType, setLoanType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tenure, setTenure] = useState<string>('12');
  const [purpose, setPurpose] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      const allCustomers = await getAllCustomers();
      setCustomers(allCustomers.filter((customer) => customer.status === 'verified'));
    }

    loadCustomers();
  }, []);

  const selectedLoanType = useMemo(
    () => LOAN_TYPES.find((item) => item.value === loanType),
    [loanType]
  );
  const amountNumber = Number(amount || 0);
  const tenureNumber = Number(tenure || 0);
  const emi = selectedLoanType ? calculateEmi(amountNumber, selectedLoanType.interestRate, tenureNumber) : 0;
  const totalPayable = emi * tenureNumber;
  const eligibility = selectedCustomer && amountNumber > 0
    ? calculateLoanEligibility(selectedCustomer, amountNumber)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Please select a verified customer.');
      return;
    }

    if (!selectedLoanType) {
      setError('Please select a loan type.');
      return;
    }

    if (!purpose.trim()) {
      setError('Please capture the purpose of the loan.');
      return;
    }

    if (!amountNumber || amountNumber <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }

    if (amountNumber > selectedLoanType.maxAmount) {
      setError(
        `Maximum amount for ${selectedLoanType.label} is Rs.${selectedLoanType.maxAmount.toLocaleString()}.`
      );
      return;
    }

    if (!eligibility?.eligible) {
      setError(
        `Requested amount exceeds the eligibility limit of Rs.${eligibility?.maxEligibleAmount.toLocaleString()}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationDate = new Date().toISOString();
      const firstRepaymentDate = new Date();
      firstRepaymentDate.setMonth(firstRepaymentDate.getMonth() + 1);

      const loan: Loan = {
        id: generateId('loan'),
        customerId: selectedCustomer.id,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        loanType: selectedLoanType.value as Loan['loanType'],
        amount: amountNumber,
        interestRate: selectedLoanType.interestRate,
        tenure: tenureNumber,
        emiAmount: emi,
        status: 'pending',
        applicationDate,
        purpose: purpose.trim(),
        riskScore: eligibility.riskScore,
        repaymentSchedule: generateRepaymentSchedule(
          amountNumber,
          selectedLoanType.interestRate,
          tenureNumber,
          firstRepaymentDate.toISOString()
        ),
        createdBy: user?.id || 'system',
        syncStatus: 'pending',
      };

      await addLoan(loan);
      await refreshSyncCount();
      toast.success('Loan application submitted for manager review.');
      navigate('/loans');
    } catch (err) {
      console.error('Error creating loan:', err);
      setError('Failed to create loan application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/loans')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="page-title">New Loan Application</h1>
          <p className="page-subtitle">Create a reviewed loan proposal with eligibility checks</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Select Customer
            </CardTitle>
            <CardDescription>Only verified customers are eligible for loan processing</CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No verified customers available.</p>
                <Button variant="outline" onClick={() => navigate('/kyc/new')}>
                  Add Customer First
                </Button>
              </div>
            ) : (
              <Select
                value={selectedCustomer?.id || ''}
                onValueChange={(value) => {
                  const customer = customers.find((item) => item.id === value);
                  setSelectedCustomer(customer || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} - {customer.village}, {customer.district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedCustomer && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Occupation:</span>
                    <span className="ml-2 font-medium">{selectedCustomer.occupation}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Annual Income:</span>
                    <span className="ml-2 font-medium">
                      Rs.{selectedCustomer.annualIncome.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Primary Account:</span>
                    <span className="ml-2 font-medium">
                      {selectedCustomer.accountNumber || 'Account needs to be opened'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2 font-medium">{selectedCustomer.phone}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Loan Details
            </CardTitle>
            <CardDescription>Capture product, amount, tenure, and purpose</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Loan Type *</Label>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label} - {item.interestRate}% p.a. - Max Rs.{item.maxAmount.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Loan Amount *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="pl-10"
                    min="1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tenure (Months) *</Label>
                <Select value={tenure} onValueChange={setTenure}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 12, 18, 24, 36, 48, 60].map((months) => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} months
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose of Loan *</Label>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe how the loan will be used"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {selectedCustomer && eligibility && (
          <Card className={eligibility.eligible ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Eligibility Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-background p-4">
                <p className="text-xs text-muted-foreground">Eligible Limit</p>
                <p className="text-2xl font-bold">Rs.{eligibility.maxEligibleAmount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold">{eligibility.riskScore}/100</p>
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="text-xs text-muted-foreground">Decision</p>
                <p className={`text-2xl font-bold ${eligibility.eligible ? 'text-success' : 'text-destructive'}`}>
                  {eligibility.eligible ? 'Eligible' : 'Needs Review'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {emi > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                EMI Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-background">
                  <p className="text-2xl font-bold text-primary">Rs.{emi.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Monthly EMI</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background">
                  <p className="text-2xl font-bold">{selectedLoanType?.interestRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background">
                  <p className="text-2xl font-bold">Rs.{totalPayable.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Payable</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background">
                  <p className="text-2xl font-bold">
                    Rs.{Math.max(0, totalPayable - amountNumber).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Interest</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/loans')}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || !selectedCustomer || !selectedCustomer.accountNumber}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
