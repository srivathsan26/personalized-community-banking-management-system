import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { addVisit, generateId, getAllCustomers, getAllLoans } from '@/services/localDB';
import { VISIT_TYPES } from '@/constants';
import { Customer, Loan, FieldVisit } from '@/types';
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
  MapPin,
  User,
  Calendar,
  ArrowLeft,
  Save,
  AlertCircle,
  Navigation,
} from 'lucide-react';

export default function VisitForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSyncCount } = useApp();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<string>('');
  const [visitType, setVisitType] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const allCustomers = await getAllCustomers();
        setCustomers(allCustomers);

        if (user?.role === 'field_officer') {
          setLoans([]);
          return;
        }

        const allLoans = await getAllLoans();
        setLoans(allLoans);
      } catch (err) {
        console.error('Error loading visit form data:', err);
        setError('Failed to load customers');
      }
    }
    loadData();
  }, [user?.role]);

  const customerLoans = selectedCustomer 
    ? loans.filter((l) => l.customerId === selectedCustomer.id)
    : [];

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast.success('Location captured successfully');
        setIsGettingLocation(false);
      },
      (err) => {
        toast.error('Failed to get location: ' + err.message);
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (!visitType) {
      setError('Please select a visit type');
      return;
    }

    if (!scheduledDate) {
      setError('Please select a scheduled date');
      return;
    }

    setIsSubmitting(true);

    try {
      const visit: FieldVisit = {
        id: generateId('visit'),
        customerId: selectedCustomer.id,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        loanId: selectedLoan || undefined,
        visitType: visitType as FieldVisit['visitType'],
        scheduledDate: new Date(scheduledDate).toISOString(),
        status: 'scheduled',
        gpsLatitude: gpsLocation?.lat,
        gpsLongitude: gpsLocation?.lng,
        notes: notes.trim(),
        photos: [],
        createdBy: user?.id || '',
        syncStatus: 'pending',
      };

      await addVisit(visit);
      await refreshSyncCount();
      toast.success('Visit scheduled successfully!');
      navigate('/visits');
    } catch (err) {
      console.error('Error creating visit:', err);
      setError('Failed to schedule visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/visits')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="page-title">Schedule Field Visit</h1>
          <p className="page-subtitle">Plan a verification or recovery visit</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Select Customer
            </CardTitle>
            <CardDescription>Choose the customer for this visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedCustomer?.id || ''}
              onValueChange={(value) => {
                const customer = customers.find((c) => c.id === value);
                setSelectedCustomer(customer || null);
                setSelectedLoan('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div>
                      <span>{customer.firstName} {customer.lastName}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {customer.village}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {user?.role !== 'field_officer' && customerLoans.length > 0 && (
              <div className="space-y-2">
                <Label>Related Loan (Optional)</Label>
                <Select value={selectedLoan} onValueChange={setSelectedLoan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loan if applicable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific loan</SelectItem>
                    {customerLoans.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id}>
                        {loan.loanType} - ₹{loan.amount.toLocaleString()} ({loan.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visit Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Visit Details
            </CardTitle>
            <CardDescription>Specify visit type and schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Visit Type *</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map((vt) => (
                      <SelectItem key={vt.value} value={vt.value}>
                        {vt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Scheduled Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes / Purpose</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the purpose of this visit, items to verify, etc."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>GPS Location (Optional)</Label>
              <div className="flex gap-4 items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Capture Current Location
                    </>
                  )}
                </Button>
                {gpsLocation && (
                  <span className="text-sm text-muted-foreground">
                    {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                GPS location helps verify visit completion
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/visits')}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary" disabled={isSubmitting || !selectedCustomer}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Schedule Visit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
