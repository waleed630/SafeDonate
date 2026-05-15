import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DiscoverSidebar } from './DiscoverSidebar';
import { MobileHeader } from './MobileHeader';

export function DiscoverLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden min-h-screen w-full flex flex-col">
      <DiscoverSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div id="main-content" className="ml-0 lg:ml-72 flex-1 flex flex-col min-h-0 pl-[max(0px,env(safe-area-inset-left))] pr-[max(0px,env(safe-area-inset-right))]">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto discover-scrollbar bg-slate-50 relative pb-[env(safe-area-inset-bottom)]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
