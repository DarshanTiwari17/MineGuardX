import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Map,
  Watch,
  Wind,
  Brain,
  AlertTriangle,
  Siren,
  Route,
  Bot,
  Radio,
  Activity,
  Bell,
  ScrollText,
  BarChart2,
  FileText,
  Settings,
  Shield,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Operations
  { label: 'Command Center',      path: '/',                   icon: <LayoutDashboard size={16} />, section: 'Operations' },
  { label: 'Live Monitoring',     path: '/live-monitoring',    icon: <Video size={16} /> },
  { label: 'Mine Map',            path: '/mine-map',           icon: <Map size={16} /> },
  { label: 'Miner Wearables',     path: '/wearables',         icon: <Watch size={16} /> },
  { label: 'Environment',         path: '/environment',        icon: <Wind size={16} /> },
  // AI & Hazards
  { label: 'AI Detection',        path: '/ai-detection',       icon: <Brain size={16} />, section: 'AI & Hazards' },
  { label: 'Hazard Center',       path: '/hazard-center',      icon: <AlertTriangle size={16} /> },
  // Rescue
  { label: 'Rescue Operations',   path: '/rescue-operations',  icon: <Siren size={16} />, section: 'Rescue' },
  { label: 'Rescue Route Planner',path: '/rescue-route',       icon: <Route size={16} /> },
  { label: 'Rover Control',       path: '/rover-control',      icon: <Bot size={16} /> },
  // System
  { label: 'Communication',       path: '/communication',      icon: <Radio size={16} />, section: 'System' },
  { label: 'Rover Health',        path: '/rover-health',       icon: <Activity size={16} /> },
  { label: 'Alerts',              path: '/alerts',             icon: <Bell size={16} /> },
  // Logs & Reporting
  { label: 'Mission Logs',        path: '/mission-logs',       icon: <ScrollText size={16} />, section: 'Logs & Reports' },
  { label: 'Analytics',           path: '/analytics',          icon: <BarChart2 size={16} /> },
  { label: 'Reports',             path: '/reports',            icon: <FileText size={16} /> },
  { label: 'Settings',            path: '/settings',           icon: <Settings size={16} /> },
];

export default function Sidebar() {
  const { state } = useAppContext();
  const activeAlerts = state.alerts.activeCount;

  let lastSection = '';

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">
          <Shield size={18} color="#fff" />
        </div>
        <div>
          <div className="sidebar-brand-name">MineGuardX</div>
          <div className="sidebar-brand-sub">Rescue Control</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <React.Fragment key={item.path}>
              {showSection && (
                <div className="sidebar-section-label" style={{ marginTop: '16px', marginBottom: '4px' }}>
                  {item.section}
                </div>
              )}
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar-item${isActive ? ' active' : ''}`
                }
                title={item.label}
              >
                <span className="sidebar-item-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {/* Alerts badge on Alerts nav item */}
                {item.path === '/alerts' && activeAlerts > 0 && (
                  <span className="sidebar-item-badge" aria-label={`${activeAlerts} active alerts`}>
                    {activeAlerts}
                  </span>
                )}
              </NavLink>
            </React.Fragment>
          );
        })}
      </nav>
    </aside>
  );
}
