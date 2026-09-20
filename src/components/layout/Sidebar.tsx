import React, { useEffect, useRef } from 'react';
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
  ScrollText,
  BarChart2,
  FileText,
  Settings,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={14} /> },
  { label: 'Live Monitoring', path: '/live-monitoring', icon: <Video size={14} /> },
  { label: 'Map', path: '/mine-map', icon: <Map size={14} /> },
  { label: 'Wearables', path: '/wearables', icon: <Watch size={14} /> },
  { label: 'Environment', path: '/environment', icon: <Wind size={14} /> },
  { label: 'AI Detection', path: '/ai-detection', icon: <Brain size={14} /> },
  { label: 'Hazards', path: '/hazard-center', icon: <AlertTriangle size={14} /> },
  { label: 'Rescue', path: '/rescue-operations', icon: <Siren size={14} /> },
  { label: 'Route', path: '/rescue-route', icon: <Route size={14} /> },
  { label: 'Rover Control', path: '/rover-control', icon: <Bot size={14} /> },
  { label: 'Comms', path: '/communication', icon: <Radio size={14} /> },
  { label: 'Rover Health', path: '/rover-health', icon: <Activity size={14} /> },
  { label: 'Logs', path: '/mission-logs', icon: <ScrollText size={14} /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChart2 size={14} /> },
  { label: 'Reports', path: '/reports', icon: <FileText size={14} /> },
  { label: 'Settings', path: '/settings', icon: <Settings size={14} /> },
];

export default function Sidebar() {
  const { state } = useAppContext();
  const activeAlerts = state.alerts.activeCount;
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <nav
      ref={navRef}
      className="top-nav"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="top-nav-track">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-pill${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
            {item.path === '/alerts' && activeAlerts > 0 && (
              <span className="sidebar-item-badge">
                {activeAlerts}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
