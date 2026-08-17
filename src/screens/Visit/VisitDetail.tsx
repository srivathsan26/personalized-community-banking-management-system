import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Navigation, NotebookText, User } from 'lucide-react';
import { getVisit, updateVisit } from '@/services/localDB';
import { FieldVisit } from '@/types';
import { VISIT_TYPES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function VisitDetail() {
  const { visitId } = useParams<{ visitId: string }>();
  const { user } = useAuth();
  const [visit, setVisit] = useState<FieldVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadVisit() {
      if (!visitId) {
        setIsLoading(false);
        return;
      }

      try {
        const visitData = await getVisit(visitId);
        setVisit(visitData || null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadVisit();
  }, [visitId]);

  const getVisitTypeLabel = (type: string) => {
    const visitType = VISIT_TYPES.find((item) => item.value === type);
    return visitType?.label || type.replace('_', ' ');
  };

  const getStatusBadge = (status: FieldVisit['status']) => {
    if (status === 'visited') {
      return <Badge className="bg-success/10 text-success border-0">Visited</Badge>;
    }
    if (status === 'postponed') {
      return <Badge className="bg-destructive/10 text-destructive border-0">Postponed</Badge>;
    }
    return <Badge className="bg-warning/10 text-warning border-0">Scheduled</Badge>;
  };

  async function handleStatusChange(nextStatus: FieldVisit['status']) {
    if (!visit || nextStatus === visit.status) {
      return;
    }

    const updatedVisit: FieldVisit = {
      ...visit,
      status: nextStatus,
      completedDate: nextStatus === 'visited' ? new Date().toISOString() : undefined,
    };

    try {
      setIsUpdatingStatus(true);
      await updateVisit(updatedVisit);
      setVisit(updatedVisit);
      toast.success(`Visit marked as ${nextStatus}.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update visit status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading visit details...</div>;
  }

  if (!visit) {
    return <div className="py-10 text-center text-muted-foreground">Visit not found.</div>;
  }

  const canUpdateStatus = user?.role === 'field_officer' || user?.role === 'branch_manager';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Visit Details</h1>
          <p className="page-subtitle">Review the scheduled field visit and linked customer</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/visits">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Visits
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>{visit.customerName}</span>
            {getStatusBadge(visit.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Visit ID</p>
            <p className="font-semibold">{visit.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Visit Type</p>
            <p className="font-semibold">{getVisitTypeLabel(visit.visitType)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customer ID</p>
            <p className="font-semibold">{visit.customerId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Scheduled Date</p>
            <p className="font-semibold">
              {new Date(visit.scheduledDate).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed Date</p>
            <p className="font-semibold">
              {visit.completedDate ? new Date(visit.completedDate).toLocaleString('en-IN') : 'Not completed'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Loan ID</p>
            <p className="font-semibold">{visit.loanId || 'No linked loan'}</p>
          </div>
        </CardContent>
      </Card>

      {canUpdateStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Update Visit Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="w-full max-w-xs">
              <Select
                value={visit.status}
                onValueChange={(value) => void handleStatusChange(value as FieldVisit['status'])}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="visited">Visited</SelectItem>
                  <SelectItem value="postponed">Postponed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Set the current visit outcome for field tracking.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookText className="h-5 w-5 text-primary" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {visit.notes || 'No notes added for this visit.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Location & Photos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">GPS Coordinates</p>
              <p className="font-semibold">
                {visit.gpsLatitude != null && visit.gpsLongitude != null
                  ? `${visit.gpsLatitude}, ${visit.gpsLongitude}`
                  : 'Not captured'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Photos</p>
              <p className="font-semibold">{visit.photos.length} attached</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cash Collected</p>
              <p className="font-semibold">
                {visit.cashCollected ? `Rs.${visit.cashCollected.toLocaleString()}` : 'Not recorded'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Related Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to={`/kyc/${visit.customerId}`}>
              <User className="mr-2 h-4 w-4" />
              View Customer
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/visits">
              <Calendar className="mr-2 h-4 w-4" />
              All Visits
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <MapPin className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
