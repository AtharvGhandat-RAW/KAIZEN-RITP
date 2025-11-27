import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MaintenancePage } from './MaintenancePage';

export const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    useEffect(() => {
        checkMaintenanceStatus();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('maintenance-mode')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'settings',
                    filter: 'key=eq.maintenance_mode'
                },
                (payload) => {
                    if (payload.new && 'value' in payload.new) {
                        const newValue = (payload.new as Record<string, unknown>).value;
                        setIsMaintenanceMode(newValue === true || newValue === 'true');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const checkMaintenanceStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single();

            if (error) {
                console.error('Error checking maintenance mode:', error);
                setIsMaintenanceMode(false);
                return;
            }

            if (data) {
                // Handle both boolean and string 'true'/'false'
                const value = data.value;
                setIsMaintenanceMode(value === true || value === 'true');
            } else {
                setIsMaintenanceMode(false);
            }
        } catch (e) {
            console.error('Failed to check maintenance mode', e);
            setIsMaintenanceMode(false);
        }
    };

    // While checking, show a full-screen loader to prevent flicker
    if (isMaintenanceMode === null) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            </div>
        );
    }

    // If maintenance mode is on, and it's NOT an admin route, show maintenance page
    if (isMaintenanceMode && !isAdminRoute) {
        return <MaintenancePage />;
    }

    return <>{children}</>;
};
