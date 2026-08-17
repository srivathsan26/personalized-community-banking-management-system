import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_DASHBOARDS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

/**
 * Access Denied Page
 * 
 * Displayed when a user attempts to access a route they don't have permission for.
 * Provides clear messaging and navigation options.
 */
export default function AccessDenied() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoToDashboard = () => {
    if (user) {
      const dashboardPath = ROLE_DASHBOARDS[user.role] || '/dashboard';
      navigate(dashboardPath);
    } else {
      navigate('/');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <p className="text-sm text-muted-foreground">
              Your current role: <span className="font-medium text-foreground">{ROLE_LABELS[user.role]}</span>
            </p>
          )}
          
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your branch manager or system administrator.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleGoBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleGoToDashboard}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
