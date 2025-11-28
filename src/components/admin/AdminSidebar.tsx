import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  FileText,
  X,
  CalendarClock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth, AdminRole } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles: AdminRole[];
}

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { adminUser, hasRole } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', roles: ['super_admin', 'event_manager', 'finance', 'viewer'] },
    { icon: Calendar, label: 'Events', path: '/admin/events', roles: ['super_admin', 'event_manager'] },
    { icon: CalendarClock, label: 'Schedule Builder', path: '/admin/schedule-builder', roles: ['super_admin', 'event_manager'] },
    { icon: Users, label: 'Registrations', path: '/admin/registrations', roles: ['super_admin', 'event_manager', 'finance'] },
    { icon: MessageSquare, label: 'Queries', path: '/admin/queries', roles: ['super_admin', 'event_manager'] },
    { icon: FileText, label: 'Reports', path: '/admin/reports', roles: ['super_admin', 'event_manager', 'finance'] },
    { icon: Settings, label: 'Settings', path: '/admin/settings', roles: ['super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role))
  );

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b border-red-600/30 flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wider">ADMIN</span>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/60 hover:text-white hover:bg-white/5"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        )}
      </div>

      {/* User Info */}
      {(!collapsed || isMobile) && adminUser && (
        <div className="p-4 mx-4 mt-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-white font-medium text-sm truncate">{adminUser.user.email}</div>
          <div className="text-red-400 text-xs uppercase mt-1 font-semibold tracking-wider">
            {adminUser.roles[0].replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group
                ${isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }
                ${collapsed && !isMobile ? 'justify-center px-2' : ''}
              `}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110`} />
              {(!collapsed || isMobile) && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-red-600/30 bg-black/20">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className={`w-full text-white/60 hover:bg-red-600/10 hover:text-red-500 transition-colors ${collapsed && !isMobile ? 'justify-center px-2' : 'justify-start'}`}
          title={collapsed && !isMobile ? 'Logout' : undefined}
        >
          <LogOut className={`w-5 h-5 ${collapsed && !isMobile ? '' : 'mr-3'}`} />
          {(!collapsed || isMobile) && <span className="font-medium">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-red-600/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wider">ADMIN</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-black border-r border-red-600/30 p-0">
              <SidebarContent isMobile={true} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${collapsed ? 'w-20' : 'w-64'} h-screen fixed left-0 top-0 bg-black/95 border-r border-red-600/30 transition-[width] duration-300 flex-col z-40`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}