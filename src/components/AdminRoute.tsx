import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Route guard for admin-only areas. Verifies BOTH an authenticated session and
 * an admin/superadmin role from the user_roles table. This is defense-in-depth:
 * edge functions and RLS enforce the same rule server-side, so bypassing this
 * client guard still grants no privileged data access.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'forbidden' | 'authorized'>('loading');

  useEffect(() => {
    let active = true;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;

      if (!session?.user) {
        setStatus('unauthenticated');
        return;
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (!active) return;

      const isAdmin = !error && (roles ?? []).some(
        (r: { role: string }) => r.role === 'admin' || r.role === 'superadmin'
      );

      setStatus(isAdmin ? 'authorized' : 'forbidden');
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setStatus('loading');
      check();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/auth" replace />;
  }

  if (status === 'forbidden') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
