import { Navigate, Route, Routes } from 'react-router-dom';
import {
  BarChart3, Coins, FileCheck2, LayoutDashboard, Link2, ListChecks, Medal, PlusCircle,
  Receipt, Settings, User, Users, Wallet, Gift,
} from 'lucide-react';
import PublicLayout from './components/PublicLayout';
import DashboardLayout from './components/DashboardLayout';
import { RedirectIfAuthed, RequireRole } from './routes/guards';
import Home from './pages/public/Home';
import { About, HowItWorks, Impact } from './pages/public/InfoPages';
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';
import Overview from './pages/citizen/Overview';
import Submit from './pages/citizen/Submit';
import Activities from './pages/citizen/Activities';
import { Leaderboard, Rewards, Transactions } from './pages/citizen/RewardPages';
import WalletPage from './pages/citizen/WalletPage';
import Profile from './pages/citizen/Profile';
import SubmissionDetail from './pages/admin/SubmissionDetail';
import {
  AdminBlockchain, AdminCitizens, AdminOverview, AdminReports, AdminSettings, AdminSubmissions, AdminTokens,
} from './pages/admin/AdminPages';
import { WalletProvider } from './context/WalletContext';

const citizenNav = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/submit', label: 'Submit Recycling', icon: PlusCircle },
  { to: '/app/activities', label: 'My Activities', icon: ListChecks },
  { to: '/app/rewards', label: 'My Rewards', icon: Gift },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: Medal },
  { to: '/app/wallet', label: 'My Wallet', icon: Wallet },
  { to: '/app/transactions', label: 'Transactions', icon: Receipt },
  { to: '/app/profile', label: 'My Profile', icon: User },
];

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/submissions', label: 'Recycling Submissions', icon: FileCheck2 },
  { to: '/admin/citizens', label: 'Manage Citizens', icon: Users },
  { to: '/admin/tokens', label: 'Token Distribution', icon: Coins },
  { to: '/admin/blockchain', label: 'Blockchain Records', icon: Link2 },
  { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function App() {
  return (
    <WalletProvider>
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/impact" element={<Impact />} />
        </Route>
        <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />

        {/* Citizen dashboard */}
        <Route element={<RequireRole role="CITIZEN" />}>
          <Route path="/app" element={<DashboardLayout nav={citizenNav} title="Citizen" showWallet />}>
            <Route index element={<Overview />} />
            <Route path="submit" element={<Submit />} />
            <Route path="activities" element={<Activities />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Administrator dashboard */}
        <Route element={<RequireRole role="ADMIN" />}>
          <Route path="/admin" element={<DashboardLayout nav={adminNav} title="Administrator" />}>
            <Route index element={<AdminOverview />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="submissions/:id" element={<SubmissionDetail />} />
            <Route path="citizens" element={<AdminCitizens />} />
            <Route path="tokens" element={<AdminTokens />} />
            <Route path="blockchain" element={<AdminBlockchain />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WalletProvider>
  );
}
