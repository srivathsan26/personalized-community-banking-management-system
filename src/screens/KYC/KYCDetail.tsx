import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getCustomer,
  getKYCDocuments,
  getLoansByCustomer,
  getTransactionsByCustomer,
  getVisitsByCustomer,
  rejectCustomer,
  verifyCustomer,
} from '@/services/localDB';
import { Customer, KYCDocument, Loan, FieldVisit, Transaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  MapPin,
  Briefcase,
  Calendar,
  FileCheck,
  Wallet,
  MapPinned,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

export default function KYCDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const canVerify = user?.role === 'branch_manager' || user?.role === 'customer_service_executive';
  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;
  const canViewLoans = permissions?.canViewLoanDetails ?? false;
  const canViewTransactions =
    user?.role === 'customer_service_executive' || user?.role === 'branch_manager';

  useEffect(() => {
    if (customerId) {
      void loadCustomerData(customerId);
    }
  }, [customerId, canViewLoans, canViewTransactions]);

  async function loadCustomerData(id: string) {
    setIsLoading(true);
    try {
      const [customerResult, kycResult, loansResult, transactionsResult, visitsResult] =
        await Promise.allSettled([
          getCustomer(id),
          getKYCDocuments(id),
          canViewLoans ? getLoansByCustomer(id) : Promise.resolve([]),
          canViewTransactions ? getTransactionsByCustomer(id) : Promise.resolve([]),
          getVisitsByCustomer(id),
        ]);

      if (customerResult.status === 'fulfilled') {
        setCustomer(customerResult.value || null);
      } else {
        console.error('Error loading customer:', customerResult.reason);
        setCustomer(null);
      }

      if (kycResult.status === 'fulfilled') {
        setDocuments(kycResult.value);
      } else {
        console.error('Error loading KYC documents:', kycResult.reason);
        setDocuments([]);
      }

      if (loansResult.status === 'fulfilled') {
        setLoans(loansResult.value);
      } else {
        console.error('Error loading loans:', loansResult.reason);
        setLoans([]);
      }

      if (transactionsResult.status === 'fulfilled') {
        setTransactions(transactionsResult.value);
      } else {
        console.error('Error loading transactions:', transactionsResult.reason);
        setTransactions([]);
      }

      if (visitsResult.status === 'fulfilled') {
        setVisits(visitsResult.value);
      } else {
        console.error('Error loading visits:', visitsResult.reason);
        setVisits([]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(newStatus: 'verified' | 'rejected') {
    if (!customer || !user) return;

    setIsUpdating(true);
    try {
      const updatedCustomer =
        newStatus === 'verified'
          ? await verifyCustomer(customer.id)
          : await rejectCustomer(customer.id);
      setCustomer(updatedCustomer);
      toast.success(`Customer ${newStatus} successfully`);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update customer status');
    } finally {
      setIsUpdating(false);
    }
  }

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-success/10 text-success border-0">
            <CheckCircle className="w-3 h-3 mr-1" /> Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-0">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-0">
            <Clock className="w-3 h-3 mr-1" /> Pending Verification
          </Badge>
        );
    }
  };

  const getDocLabel = (type: KYCDocument['type']) => {
    const labels: Record<string, string> = {
      aadhaar_front: 'Aadhaar Front',
      aadhaar_back: 'Aadhaar Back',
      selfie: 'Customer Photo',
      signature: 'Signature',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Customer not found</p>
        <Button onClick={() => navigate('/kyc')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/kyc')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">
                {customer.firstName} {customer.lastName}
              </h1>
              {getStatusBadge(customer.status)}
            </div>
            <p className="page-subtitle">Customer ID: {customer.id}</p>
          </div>
        </div>

        {canVerify && customer.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate('verified')}
              disabled={isUpdating}
              className="bg-success hover:bg-success/90"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {isUpdating ? 'Processing...' : 'Verify Customer'}
            </Button>
            <Button
              onClick={() => handleStatusUpdate('rejected')}
              disabled={isUpdating}
              variant="destructive"
            >
              <ShieldX className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
        {customer.status === 'verified' && !customer.accountNumber && (
          <Button asChild variant="outline">
            <Link to="/accounts/new">Open Account</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <User className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileCheck className="w-4 h-4 mr-2" />
            KYC Documents ({documents.length})
          </TabsTrigger>
          {canViewLoans && (
            <TabsTrigger value="loans">
              <Wallet className="w-4 h-4 mr-2" />
              Loans ({loans.length})
            </TabsTrigger>
          )}
          {canViewTransactions && (
            <TabsTrigger value="transactions">
              <CreditCard className="w-4 h-4 mr-2" />
              Transactions ({transactions.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="visits">
            <MapPinned className="w-4 h-4 mr-2" />
            Visits ({visits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <span className="text-sm font-medium">
                    {customer.firstName} {customer.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gender</span>
                  <span className="text-sm font-medium capitalize">{customer.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date of Birth</span>
                  <span className="text-sm font-medium">
                    {new Date(customer.dateOfBirth).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Aadhaar</span>
                  <span className="text-sm font-medium font-mono">
                    .... .... {customer.aadhaarNumber.slice(-4)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Mobile</span>
                  <span className="text-sm font-medium">{customer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Village/Town</span>
                  <span className="text-sm font-medium">{customer.village}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">District</span>
                  <span className="text-sm font-medium">{customer.district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">State</span>
                  <span className="text-sm font-medium">{customer.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pincode</span>
                  <span className="text-sm font-medium">{customer.pincode}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Full Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{customer.address}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {customer.village}, {customer.district}, {customer.state} - {customer.pincode}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Occupation & Income
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Occupation</span>
                  <span className="text-sm font-medium">{customer.occupation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Annual Income</span>
                  <span className="text-sm font-medium">
                    Rs.{customer.annualIncome.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Record Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <span className="text-sm text-muted-foreground block">Created At</span>
                  <span className="text-sm font-medium">
                    {new Date(customer.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block">Created By</span>
                  <span className="text-sm font-medium">{customer.createdBy}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block">Sync Status</span>
                  <Badge variant={customer.syncStatus === 'synced' ? 'default' : 'secondary'}>
                    {customer.syncStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {canViewTransactions && (
          <TabsContent value="transactions">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No transaction history for this customer</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.accountNumber} |{' '}
                          {new Date(transaction.transactionDate).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">Rs.{transaction.amount.toLocaleString()}</p>
                        <Badge variant={transaction.status === 'success' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="documents">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No KYC documents uploaded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedImage(doc.fileData)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-muted mb-3">
                      <img
                        src={doc.fileData}
                        alt={getDocLabel(doc.type)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-foreground/0 hover:bg-foreground/10 transition-colors flex items-center justify-center">
                        <Eye className="w-6 h-6 text-background opacity-0 hover:opacity-100" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{getDocLabel(doc.type)}</span>
                      <Badge
                        variant={doc.syncStatus === 'synced' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {doc.syncStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {canViewLoans && (
          <TabsContent value="loans">
            {loans.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">No loans for this customer</p>
                  <Button asChild>
                    <Link to="/loans/new">Apply for Loan</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => (
                  <Card key={loan.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">
                            {loan.loanType.replace('_', ' ')} Loan
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Rs.{loan.amount.toLocaleString()} | {loan.tenure} months |{' '}
                            {loan.interestRate}% p.a.
                          </p>
                        </div>
                        <Badge variant={loan.status === 'disbursed' ? 'default' : 'secondary'}>
                          {loan.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="visits">
          {visits.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MapPinned className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No field visits recorded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => (
                <Card key={visit.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{visit.visitType.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {new Date(visit.scheduledDate).toLocaleDateString('en-IN')}
                        </p>
                        {visit.notes && <p className="text-sm mt-1">{visit.notes}</p>}
                      </div>
                      <Badge variant={visit.status === 'visited' ? 'default' : 'secondary'}>
                        {visit.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <img src={selectedImage} alt="Document" className="rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
