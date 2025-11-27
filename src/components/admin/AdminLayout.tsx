import { ReactNode, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Optimized static background for premium feel without lag */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-background to-background z-0 pointer-events-none" />
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main 
        className={`min-h-screen pt-20 lg:pt-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden transition-all duration-300 relative z-10`}
      >
        {children}
      </main>
    </div>
  );
}