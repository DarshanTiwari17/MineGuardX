import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import MainLayout from './components/layout/MainLayout';

// Page components
import CommandCenter from './pages/CommandCenter';
import LiveMonitoring from './pages/LiveMonitoring';
import MineMapPage from './pages/MineMapPage';
import MinerWearables from './pages/MinerWearables';
import { MobileWearable } from './pages/MobileWearable';
import Environment from './pages/Environment';
import AIDetection from './pages/AIDetection';
import HazardCenter from './pages/HazardCenter';
import RescueOperations from './pages/RescueOperations';
import RescueRoutePlanner from './pages/RescueRoutePlanner';
import RoverControl from './pages/RoverControl';
import Communication from './pages/Communication';
import RoverHealth from './pages/RoverHealth';
import Alerts from './pages/Alerts';
import MissionLogs from './pages/MissionLogs';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Mobile client rendered standalone without desktop sidebar/header */}
          <Route path="/mobile-wearable" element={<MobileWearable />} />

          {/* Desktop Dashboard routes wrapped inside MainLayout */}
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<CommandCenter />} />
                  <Route path="/live-monitoring" element={<LiveMonitoring />} />
                  <Route path="/mine-map" element={<MineMapPage />} />
                  <Route path="/map" element={<Navigate to="/mine-map" replace />} />
                  <Route path="/wearables" element={<MinerWearables />} />
                  <Route path="/environment" element={<Environment />} />
                  <Route path="/ai-detection" element={<AIDetection />} />
                  <Route path="/hazard-center" element={<HazardCenter />} />
                  <Route path="/rescue-operations" element={<RescueOperations />} />
                  <Route path="/rescue-route" element={<RescueRoutePlanner />} />
                  <Route path="/rover-control" element={<RoverControl />} />
                  <Route path="/communication" element={<Communication />} />
                  <Route path="/rover-health" element={<RoverHealth />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/mission-logs" element={<MissionLogs />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
