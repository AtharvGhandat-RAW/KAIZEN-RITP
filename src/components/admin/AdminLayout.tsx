import { ReactNode, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-black relative">
      {/* Optimized static background - no blur for better performance */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-950/20 via-black to-black z-0 pointer-events-none" />
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={`min-h-screen pt-20 lg:pt-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden transition-[margin] duration-300 relative z-10`}
        style={{
          transform: 'translateZ(0)',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {children}
      </main>
    </div>
  );
}