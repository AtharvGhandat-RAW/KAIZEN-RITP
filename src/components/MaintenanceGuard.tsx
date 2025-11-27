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

    // While checking, we can just render children (or a loader, but children is better for perceived performance)
    // If we default to false, the site loads, then might snap to maintenance.
    // If we default to null, we can show a loader.
    if (isMaintenanceMode === null) {
        return <>{children}</>; // Optimistic rendering: assume live until proven otherwise to avoid flicker
    }

    // If maintenance mode is on, and it's NOT an admin route, show maintenance page
    if (isMaintenanceMode && !isAdminRoute) {
        return <MaintenancePage />;
    }

    return <>{children}</>;
};
