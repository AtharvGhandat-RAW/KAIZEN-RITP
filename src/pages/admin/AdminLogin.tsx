import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminUser, loading: authLoading } = useAdminAuth();

  useEffect(() => {
    if (!authLoading && adminUser) {
      navigate('/admin/dashboard');
    }
  }, [adminUser, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        throw new Error('Unauthorized: Admin access required');
      }

      toast({
        title: 'Login successful',
        description: 'Welcome to KAIZEN Admin Panel',
      });
      navigate('/admin/dashboard');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'Login failed',
        description: err.message || 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AtmosphericBackground />
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-black/60 backdrop-blur-sm border-2 border-red-600/30 p-8 rounded-lg">
          <h1 className="text-3xl font-bold text-center mb-2 text-red-500" style={{
            textShadow: '0 0 20px rgba(255, 69, 0, 0.5)'
          }}>
            KAIZEN ADMIN
          </h1>
          <p className="text-center text-white/70 mb-8">Admin Portal Access</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-white/90">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 bg-black/40 border-red-600/30 text-white focus:border-red-500"
                placeholder="admin@kaizen.rit.edu"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-white/90">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 bg-black/40 border-red-600/30 text-white focus:border-red-500"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}