import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { MobileHeader } from './MobileHeader';

export function AuthLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FDFBF7] font-sans overflow-hidden min-h-screen w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div id="main-content" className="ml-0 lg:ml-64 h-screen flex flex-col relative bg-[#FDFBF7] flex-1 min-w-0 min-h-0 pl-[max(0px,env(safe-area-inset-left))] pr-[max(0px,env(safe-area-inset-right))]">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
}
