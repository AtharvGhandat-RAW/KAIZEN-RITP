import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth, AdminRole } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AdminRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { adminUser, loading, hasRole } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!adminUser) {
        navigate('/admin');
      } else if (requiredRoles && !requiredRoles.some(role => hasRole(role))) {
        navigate('/admin/dashboard');
      }
    }
  }, [loading, adminUser, requiredRoles, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
        <p className="text-red-500 text-xl mb-4">Admin login required</p>
        <p className="text-muted-foreground mb-6 max-w-md">
          You tried to open an admin page (registrations/reports/etc.) without logging in.
        </p>
        <Button onClick={() => navigate('/admin')} className="bg-primary">
          Go to Admin Login
        </Button>
      </div>
    );
  }

  if (requiredRoles && !requiredRoles.some(role => hasRole(role))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
        <p className="text-red-500 text-xl mb-4">Access restricted</p>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your admin account does not have permission to view this page.
        </p>
        <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}