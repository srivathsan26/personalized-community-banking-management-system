import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, IdCard, UserCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStaffUser, resetStaffPassword, updateStaffUser } from '@/services/localDB';
import { StaffUser, UserRole } from '@/types';
import { AUTH_REFRESH_EVENT, useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const roles: Array<{ value: UserRole; label: string }> = [
  { value: 'field_officer', label: 'Field Officer' },
  { value: 'customer_service_executive', label: 'Customer Service Executive' },
  { value: 'loan_officer', label: 'Loan Officer' },
  { value: 'branch_manager', label: 'Branch Manager' },
];

export default function StaffDetail() {
  const { user } = useAuth();
  const { staffId } = useParams();
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'field_officer' as UserRole,
    branchCode: '',
    branchName: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [passwordResetValue, setPasswordResetValue] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    async function loadStaffDetail() {
      if (!staffId) {
        setIsLoading(false);
        return;
      }

      try {
        const loadedStaff = await getStaffUser(staffId);
        setStaff(loadedStaff);
        setFormData({
          name: loadedStaff.name,
          role: loadedStaff.role,
          branchCode: loadedStaff.branchCode,
          branchName: loadedStaff.branchName,
        });
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Failed to load staff details');
      } finally {
        setIsLoading(false);
      }
    }

    loadStaffDetail();
  }, [staffId]);

  if (user?.role !== 'branch_manager') {
    return <Navigate to="/access-denied" replace />;
  }

  const isSelf = user?.id === staff?.id;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) {
      return;
    }
    if (isSelf && formData.role !== 'branch_manager') {
      toast.error('Your own manager role cannot be changed from this screen.');
      return;
    }

    try {
      setIsSaving(true);
      const updatedStaff: StaffUser = {
        ...staff,
        name: formData.name,
        role: formData.role,
        branchCode: formData.branchCode,
        branchName: formData.branchName,
      };
      console.log('Saving staff', updatedStaff);
      const savedStaff = await updateStaffUser(updatedStaff);
      setStaff(savedStaff);
      setFormData({
        name: savedStaff.name,
        role: savedStaff.role,
        branchCode: savedStaff.branchCode,
        branchName: savedStaff.branchName,
      });
      if (isSelf) {
        window.dispatchEvent(new Event(AUTH_REFRESH_EVENT));
      }
      toast.success('Staff details updated');
    } catch (error) {
      console.error('Save error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update staff details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus: boolean) => {
    if (!staff) {
      return;
    }
    if (isSelf && !nextStatus) {
      toast.error('You cannot deactivate your own manager account.');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const updatedStaff: StaffUser = {
        ...staff,
        isActive: nextStatus,
      };
      const savedStaff = await updateStaffUser(updatedStaff);
      setStaff(savedStaff);
      if (isSelf) {
        window.dispatchEvent(new Event(AUTH_REFRESH_EVENT));
      }
      toast.success(nextStatus ? 'Staff account activated' : 'Staff account deactivated');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to update staff status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) {
      return;
    }
    if (isSelf) {
      toast.error('Use a separate profile flow to change your own password.');
      return;
    }
    if (passwordResetValue.trim().length < 6) {
      toast.error('Temporary password must be at least 6 characters long.');
      return;
    }

    try {
      setIsResettingPassword(true);
      await resetStaffPassword(staff.id, passwordResetValue.trim());
      setPasswordResetValue('');
      toast.success('Staff password reset successfully');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading staff details...</div>;
  }

  if (!staff) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Staff record not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Staff Details</h1>
          <p className="page-subtitle">Review, edit, and manage employee access</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Staff
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{staff.name}</CardTitle>
                <p className="text-sm text-muted-foreground">@{staff.username}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{staff.role.replace(/_/g, ' ')}</Badge>
              <Badge variant={staff.isActive ? 'default' : 'secondary'}>
                {staff.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <IdCard className="h-4 w-4" />
              Employee ID
            </div>
            <p className="text-lg font-semibold">{staff.employeeId}</p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserCircle2 className="h-4 w-4" />
              Account Status
            </div>
            <p className="text-lg font-semibold">{staff.isActive ? 'Enabled' : 'Disabled'}</p>
            <p className="text-sm text-muted-foreground">
              Created {new Date(staff.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Edit Staff Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value as UserRole }))}
                  disabled={isSelf}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Branch Code</Label>
                  <Input
                    value={formData.branchCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, branchCode: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch Name</Label>
                  <Input
                    value={formData.branchName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, branchName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Username and employee ID stay fixed so audit history remains traceable.
              </div>

              {isSelf ? (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Your own branch manager role stays locked here so you do not lose admin access by mistake.
                </div>
              ) : null}

              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Access Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-medium">Branch Assignment</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {staff.branchName} ({staff.branchCode})
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-medium">Current Role</p>
              <p className="mt-1 text-sm text-muted-foreground">{staff.role.replace(/_/g, ' ')}</p>
            </div>

            <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              Deactivating a staff member blocks future authenticated requests for that user.
            </div>

            <Button
              type="button"
              variant={staff.isActive ? 'destructive' : 'default'}
              className="w-full"
              disabled={isUpdatingStatus || (isSelf && staff.isActive)}
              onClick={() => handleStatusChange(!staff.isActive)}
            >
              {isUpdatingStatus
                ? 'Updating...'
                : staff.isActive
                  ? 'Deactivate Staff'
                  : 'Reactivate Staff'}
            </Button>

            {isSelf ? (
              <p className="text-xs text-muted-foreground">
                Your own manager account cannot be deactivated from this page.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manager Password Reset</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input
                type="password"
                value={passwordResetValue}
                onChange={(e) => setPasswordResetValue(e.target.value)}
                placeholder="Enter a new temporary password"
                disabled={isSelf}
              />
              <p className="text-xs text-muted-foreground">
                Only the branch manager can reset forgotten staff passwords.
              </p>
            </div>
            <Button type="submit" disabled={isResettingPassword || isSelf}>
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
