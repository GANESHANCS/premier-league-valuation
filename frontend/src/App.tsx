import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { PlayerDiscoveryPage } from './pages/PlayerDiscoveryPage';
import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { ComparePage } from './pages/ComparePage';
import { TransferIntelligencePage } from './pages/TransferIntelligencePage';
import { ModelAnalyticsPage } from './pages/ModelAnalyticsPage';

export const App: React.FC = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/players" element={<PlayerDiscoveryPage />} />
          <Route path="/players/:id" element={<PlayerProfilePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/transfers" element={<TransferIntelligencePage />} />
          <Route path="/model-analytics" element={<ModelAnalyticsPage />} />
        </Routes>
      </AppShell>
    </Router>
  );
};
export default App;
