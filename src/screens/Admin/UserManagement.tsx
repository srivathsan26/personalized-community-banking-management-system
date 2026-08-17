import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addStaffUser, getAllStaffUsers } from '@/services/localDB';
import { StaffUser, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, UserPlus } from 'lucide-react';

const roles: Array<{ value: UserRole; label: string }> = [
  { value: 'field_officer', label: 'Field Officer' },
  { value: 'customer_service_executive', label: 'Customer Service Executive' },
  { value: 'loan_officer', label: 'Loan Officer' },
  { value: 'branch_manager', label: 'Branch Manager' },
];

export default function UserManagement() {
  const { user } = useAuth();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'field_officer' as UserRole,
    branchCode: user?.branchCode || 'CB-TN-001',
    branchName: user?.branchName || 'Chennai Main Branch',
  });

  useEffect(() => {
    async function loadStaff() {
      setStaffUsers(await getAllStaffUsers());
    }

    loadStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await addStaffUser({
        ...formData,
        isActive: true,
        createdBy: user?.id || 'system',
      });
      setStaffUsers((prev) => [created, ...prev]);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'field_officer',
        branchCode: user?.branchCode || 'CB-TN-001',
        branchName: user?.branchName || 'Chennai Main Branch',
      });
      toast.success('Staff user created');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Admin Module</h1>
        <p className="page-subtitle">Manage staff users, roles, and internal access</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create Staff User
            </CardTitle>
            <CardDescription>Add a new authenticated system user</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={formData.username} onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value as UserRole }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Employee ID will be generated automatically when this staff profile is created.
              </div>
              <Button type="submit" className="w-full">Create User</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Existing Staff
            </CardTitle>
            <CardDescription>{staffUsers.length} users configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {staffUsers.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{staff.name}</p>
                  <p className="text-sm text-muted-foreground">{staff.username} • {staff.employeeId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Badge variant="outline">{staff.role.replace(/_/g, ' ')}</Badge>
                  <Badge variant={staff.isActive ? 'default' : 'secondary'}>{staff.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/users/${staff.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
