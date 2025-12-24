import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Optimized static background for premium feel without lag */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black z-0 pointer-events-none" />
      
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-black/40 backdrop-blur-md border border-red-600/30 p-8 rounded-xl shadow-2xl shadow-red-900/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-wider" style={{
              textShadow: '0 0 30px rgba(220, 38, 38, 0.5)'
            }}>
              KAIZEN
            </h1>
            <p className="text-red-500 font-medium tracking-[0.2em] text-sm uppercase">Admin Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black/50 border-white/10 text-white focus:border-red-500 focus:ring-red-500/20 transition-all"
                placeholder="admin@kaizen-ritp.in"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black/50 border-white/10 text-white focus:border-red-500 focus:ring-red-500/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-6 shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Dashboard'
              )}
            </Button>
          </form>
        </div>
        
        <p className="text-center text-white/30 text-xs mt-8">
          Authorized Personnel Only • KAIZEN 2026
        </p>
      </div>
    </div>
  );
}