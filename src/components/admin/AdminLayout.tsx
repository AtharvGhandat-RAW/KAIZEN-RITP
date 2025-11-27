import { ReactNode, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      <AtmosphericBackground />
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main 
        className={`min-h-screen pt-20 lg:pt-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden transition-all duration-300`}
      >
        {children}
      </main>
    </div>
  );
}