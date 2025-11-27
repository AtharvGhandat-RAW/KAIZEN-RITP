import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Award,
  Settings,
  LogOut,
  Menu,
  FileText,
  X
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
    { icon: Users, label: 'Registrations', path: '/admin/registrations', roles: ['super_admin', 'event_manager', 'finance'] },
    { icon: MessageSquare, label: 'Queries', path: '/admin/queries', roles: ['super_admin', 'event_manager'] },
    { icon: Award, label: 'Sponsors', path: '/admin/sponsors', roles: ['super_admin'] },
    { icon: FileText, label: 'Reports', path: '/admin/reports', roles: ['super_admin', 'event_manager', 'finance'] },
    { icon: Settings, label: 'Settings', path: '/admin/settings', roles: ['super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role))
  );

  const SidebarContent = () => (
    <>
      {/* User Info */}
      {adminUser && (
        <div className="p-4 border-b border-red-600/30">
          <div className="text-white/90 text-sm">{adminUser.user.email}</div>
          <div className="text-red-500 text-xs uppercase mt-1">
            {adminUser.roles[0].replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                ${isActive
                  ? 'bg-red-600/20 text-red-500 border border-red-600/50'
                  : 'text-white/70 hover:bg-red-600/10 hover:text-red-400'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-red-600/30">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-white/70 hover:bg-red-600/10 hover:text-red-400"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-red-600/30 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-red-500" style={{
            textShadow: '0 0 10px rgba(255, 69, 0, 0.5)'
          }}>
            KAIZEN ADMIN
          </h2>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:bg-red-600/10"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-black/95 backdrop-blur-sm border-red-600/30 p-0">
              <div className="flex flex-col min-h-full">
                <SheetHeader className="p-4 border-b border-red-600/30">
                  <SheetTitle className="text-xl font-bold text-red-500" style={{
                    textShadow: '0 0 10px rgba(255, 69, 0, 0.5)'
                  }}>
                    KAIZEN ADMIN
                  </SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${collapsed ? 'w-20' : 'w-64'} h-screen fixed left-0 top-0 bg-black/40 backdrop-blur-sm border-r border-red-600/30 transition-all duration-300 flex-col z-40`}
      >
        {/* Header */}
        <div className="p-4 border-b border-red-600/30 flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-xl font-bold text-red-500" style={{
              textShadow: '0 0 10px rgba(255, 69, 0, 0.5)'
            }}>
              KAIZEN ADMIN
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-red-500 hover:bg-red-600/10"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info */}
        {!collapsed && adminUser && (
          <div className="p-4 border-b border-red-600/30">
            <div className="text-white/90 text-sm">{adminUser.user.email}</div>
            <div className="text-red-500 text-xs uppercase mt-1">
              {adminUser.roles[0].replace('_', ' ')}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                  ${isActive
                    ? 'bg-red-600/20 text-red-500 border border-red-600/50'
                    : 'text-white/70 hover:bg-red-600/10 hover:text-red-400'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-red-600/30">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-white/70 hover:bg-red-600/10 hover:text-red-400"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}