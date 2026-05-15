import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { MobileHeader } from './MobileHeader';

interface LayoutProps {
  showFooter?: boolean;
  mainClassName?: string;
}

export function Layout({ showFooter = true, mainClassName = '' }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden min-h-screen w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-h-screen min-w-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" className={`flex-1 overflow-y-auto scroll-smooth pl-[max(0px,env(safe-area-inset-left))] pr-[max(0px,env(safe-area-inset-right))] [&::-webkit-scrollbar]:thin [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full ${mainClassName}`} style={{ scrollbarWidth: 'thin' }}>
          <Outlet />
        </main>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}
