import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import ErrorMessage from './components/ErrorMessage';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages to prevent crashes
const SchedulePage = React.lazy(() => import('./pages/SchedulePage'));
const PlayerStatsPage = React.lazy(() => import('./pages/PlayerStatsPage'));
const OrgChartPage = React.lazy(() => import('./pages/OrgChartPage'));
const LeaderboardsPage = React.lazy(() => import('./pages/LeaderboardsPage'));

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Schedule', icon: '📅' },
    { path: '/player-stats', label: 'Player Stats', icon: '👤' },
    { path: '/org-chart', label: 'Org Chart', icon: '🏢' },
    { path: '/leaderboards', label: 'Leaderboards', icon: '🏆' },
  ];

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Marlins Analytics Hub</h1>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="py-6">
          <Suspense fallback={<LoadingSpinner label="Loading page..." />}>
            <Routes>
              <Route path="/" element={<SchedulePage />} />
              <Route path="/player-stats" element={<PlayerStatsPage />} />
              <Route path="/org-chart" element={<OrgChartPage />} />
              <Route path="/leaderboards" element={<LeaderboardsPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}