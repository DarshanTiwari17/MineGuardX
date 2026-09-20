import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="app-layout">
      <div className="shell-chrome">
        <Header />
        <Sidebar />
      </div>
      <main className="page-content" id="main-content" role="main">
        <div className="page-shell">
          {children}
        </div>
      </main>
    </div>
  );
}
