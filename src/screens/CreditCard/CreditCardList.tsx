import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { approveCreditCard, getAllCreditCards, rejectCreditCard } from '@/services/localDB';
import { CreditCard as CreditCardType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Lock,
  Unlock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatCardNumber(cardNumber: string) {
  return `XXXX XXXX XXXX ${cardNumber.slice(-4)}`;
}

function getCardTypeStyle(type: string) {
  switch (type) {
    case 'platinum':
      return 'bg-gradient-to-br from-slate-700 to-slate-900';
    case 'gold':
      return 'bg-gradient-to-br from-amber-500 to-amber-700';
    default:
      return 'bg-gradient-to-br from-primary to-teal-700';
  }
}

export default function CreditCardList() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processingCardId, setProcessingCardId] = useState<string | null>(null);

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    setIsLoading(true);
    try {
      const creditCards = await getAllCreditCards();
      setCards(
        creditCards.sort(
          (a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesSearch =
        !query ||
        card.customerName.toLowerCase().includes(query) ||
        card.cardNumber.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cards, searchQuery, statusFilter]);

  async function handleApprove(card: CreditCardType) {
    if (!user) {
      return;
    }

    setProcessingCardId(card.id);
    try {
      await approveCreditCard(card.id);
      toast.success('Credit card approved.');
      await loadCards();
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve credit card.');
    } finally {
      setProcessingCardId(null);
    }
  }

  async function handleReject(card: CreditCardType) {
    if (!user) {
      return;
    }

    const reason = window.prompt('Enter rejection reason', card.rejectionReason || '');
    if (reason === null) {
      return;
    }

    setProcessingCardId(card.id);
    try {
      await rejectCreditCard(card.id, reason.trim() || 'Rejected during card review');
      toast.success('Credit card rejected.');
      await loadCards();
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject credit card.');
    } finally {
      setProcessingCardId(null);
    }
  }

  const getStatusBadge = (status: CreditCardType['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="status-approved">Active</Badge>;
      case 'pending_review':
        return <Badge className="status-pending">Pending Review</Badge>;
      case 'blocked':
        return <Badge className="status-rejected">Blocked</Badge>;
      case 'inactive':
        return <Badge className="bg-warning/10 text-warning">Inactive</Badge>;
      case 'rejected':
        return <Badge className="status-rejected">Rejected</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalCreditLimit = cards
    .filter((card) => card.status === 'active')
    .reduce((sum, card) => sum + card.creditLimit, 0);
  const totalOutstanding = cards.reduce((sum, card) => sum + card.outstandingBalance, 0);
  const activeCards = cards.filter((card) => card.status === 'active').length;
  const pendingReviews = cards.filter((card) => card.status === 'pending_review').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Credit Cards</h1>
          <p className="page-subtitle">Review card applications, assign limits, and monitor statements</p>
        </div>

        {(user?.role === 'branch_manager' || user?.role === 'customer_service_executive') && (
          <Button asChild className="btn-accent">
            <Link to="/cards/new">
              <Plus className="w-4 h-4 mr-2" />
              New Card Application
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="stat-label">Active Cards</p>
                <p className="stat-value">{activeCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <ShieldCheck className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="stat-label">Pending Review</p>
                <p className="stat-value">{pendingReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Unlock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="stat-label">Total Credit Limit</p>
                <p className="stat-value">Rs.{totalCreditLimit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="stat-label">Outstanding Balance</p>
                <p className="stat-value text-warning">Rs.{totalOutstanding.toLocaleString()}</p>
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
                placeholder="Search by customer name or card number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-banking"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filteredCards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">No credit cards found</p>
            <p className="text-sm text-muted-foreground">Create a new application to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const isProcessing = processingCardId === card.id;
            return (
              <div key={card.id} className="space-y-4">
                <div className={`credit-card ${getCardTypeStyle(card.cardType)}`}>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-xs opacity-80 uppercase tracking-wider">Community Bank</p>
                        <p className="text-sm font-semibold capitalize">{card.cardType} Card</p>
                      </div>
                      <CreditCard className="w-8 h-8 opacity-80" />
                    </div>

                    <p className="text-lg font-mono tracking-widest mb-4">
                      {formatCardNumber(card.cardNumber)}
                    </p>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-60 uppercase">Card Holder</p>
                        <p className="font-semibold text-sm">{card.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-60 uppercase">Expires</p>
                        <p className="font-mono text-sm">
                          {new Date(card.expiryDate).toLocaleDateString('en-US', {
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(card.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Credit Limit</span>
                      <span className="font-semibold">Rs.{card.creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Available Credit</span>
                      <span className="font-semibold text-success">Rs.{card.availableCredit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Outstanding</span>
                      <span className="font-semibold text-warning">Rs.{card.outstandingBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Statement Date</span>
                      <span className="text-sm">
                        {card.lastStatementDate
                          ? new Date(card.lastStatementDate).toLocaleDateString('en-IN')
                          : 'Not generated'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Reminder Date</span>
                      <span className="text-sm">
                        {card.paymentReminderDate
                          ? new Date(card.paymentReminderDate).toLocaleDateString('en-IN')
                          : 'Pending approval'}
                      </span>
                    </div>
                    {card.rejectionReason && (
                      <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
                        {card.rejectionReason}
                      </div>
                    )}

                    <Button asChild variant="ghost" className="w-full">
                      <Link to={`/cards/${card.id}`}>View Details</Link>
                    </Button>

                    {user?.role === 'branch_manager' && card.status === 'pending_review' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button className="flex-1" size="sm" disabled={isProcessing} onClick={() => handleApprove(card)}>
                          <ShieldCheck className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button variant="outline" className="flex-1" size="sm" disabled={isProcessing} onClick={() => handleReject(card)}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
