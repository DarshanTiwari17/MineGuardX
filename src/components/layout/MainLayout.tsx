import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { aiAnalysisNotification, dismissAIAnalysisNotification } = useAppContext();

  return (
    <div className="app-layout">
      <div className="shell-chrome">
        <Header />
        <Sidebar />
      </div>
      {aiAnalysisNotification && (
        <aside className="ai-analysis-notice" role="alert" aria-live="assertive">
          <AlertTriangle size={20} aria-hidden="true" />
          <div className="ai-analysis-notice-content">
            <strong>{aiAnalysisNotification.message}</strong>
            <Link to="/ai-detection" onClick={dismissAIAnalysisNotification}>
              Check AI Analysis
            </Link>
          </div>
          <button
            type="button"
            className="ai-analysis-notice-dismiss"
            onClick={dismissAIAnalysisNotification}
            aria-label="Dismiss danger notification"
          >
            <X size={16} />
          </button>
        </aside>
      )}
      <main className="page-content" id="main-content" role="main">
        <div className="page-shell">
          {children}
        </div>
      </main>
    </div>
  );
}
