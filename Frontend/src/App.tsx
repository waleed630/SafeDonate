import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DiscoverLayout } from './components/layout/DiscoverLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/Toaster';
import { SessionExpiredModal } from './components/SessionExpiredModal';
import { LandingPage } from './pages/LandingPage';
import { LoginRegister } from './pages/LoginRegister';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailsPage } from './pages/CampaignDetailsPage';
import { FeaturedCampaignsPage } from './pages/FeaturedCampaignsPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DonorDashboardPage } from './pages/DonorDashboardPage';
import { DonationHistoryPage } from './pages/donor/DonationHistoryPage';
import { DonorMessagesPage } from './pages/donor/DonorMessagesPage';
import { DonorNotificationsPage } from './pages/donor/DonorNotificationsPage';
import { DonorProfilePage } from './pages/donor/DonorProfilePage';
import { FundraiserDashboardPage } from './pages/FundraiserDashboardPage';
import { CreateCampaignPage } from './pages/CreateCampaignPage';
import { EditCampaignPage } from './pages/fundraiser/EditCampaignPage';
import { MyCampaignsPage } from './pages/fundraiser/MyCampaignsPage';
import { CampaignAnalyticsPage } from './pages/fundraiser/CampaignAnalyticsPage';
import { FundraiserMessagesPage } from './pages/fundraiser/FundraiserMessagesPage';
import { FundraiserNotificationsPage } from './pages/fundraiser/FundraiserNotificationsPage';
import { FundraiserProfilePage } from './pages/fundraiser/FundraiserProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ManageUsersPage } from './pages/admin/ManageUsersPage';
import { ManageCampaignsPage } from './pages/admin/ManageCampaignsPage';
import { CampaignVerificationPage } from './pages/admin/CampaignVerificationPage';
import { FraudMonitoringPage } from './pages/admin/FraudMonitoringPage';
import { PlatformAnalyticsPage } from './pages/admin/PlatformAnalyticsPage';
import { ManagePaymentsPage } from './pages/admin/ManagePaymentsPage';
import { ManageCategoriesPage } from './pages/admin/ManageCategoriesPage';
import { ManageTagsPage } from './pages/admin/ManageTagsPage';
import { DonationSuccessPage } from './pages/DonationSuccessPage';
import { DonationCancelPage } from './pages/DonationCancelPage';

function App() {
  return (
    <>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="campaigns/featured" element={<FeaturedCampaignsPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailsPage />} />
          <Route path="donation/success" element={<DonationSuccessPage />} />
          <Route path="donation/cancel" element={<DonationCancelPage />} />

          <Route path="/donor" element={<ProtectedRoute roles={['donor']}><Outlet /></ProtectedRoute>}>
            <Route path="dashboard" element={<DonorDashboardPage />} />
            <Route path="donation-history" element={<DonationHistoryPage />} />
            <Route path="messages" element={<DonorMessagesPage />} />
            <Route path="notifications" element={<DonorNotificationsPage />} />
            <Route path="profile" element={<DonorProfilePage />} />
          </Route>

          <Route path="/fundraiser" element={<ProtectedRoute roles={['fundraiser']}><Outlet /></ProtectedRoute>}>
            <Route path="dashboard" element={<FundraiserDashboardPage />} />
            <Route path="create-campaign" element={<CreateCampaignPage />} />
            <Route path="my-campaigns" element={<MyCampaignsPage />} />
            <Route path="campaigns/:id/edit" element={<EditCampaignPage />} />
            <Route path="campaigns/:id/analytics" element={<CampaignAnalyticsPage />} />
            <Route path="messages" element={<FundraiserMessagesPage />} />
            <Route path="notifications" element={<FundraiserNotificationsPage />} />
            <Route path="profile" element={<FundraiserProfilePage />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Outlet /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<ManageUsersPage />} />
            <Route path="campaigns" element={<ManageCampaignsPage />} />
            <Route path="verification" element={<CampaignVerificationPage />} />
            <Route path="fraud" element={<FraudMonitoringPage />} />
            <Route path="analytics" element={<PlatformAnalyticsPage />} />
            <Route path="payments" element={<ManagePaymentsPage />} />
            <Route path="categories" element={<ManageCategoriesPage />} />
            <Route path="tags" element={<ManageTagsPage />} />
          </Route>
        </Route>

        <Route element={<DiscoverLayout />}>
          <Route path="/campaigns" element={<CampaignsPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginRegister />} />
        </Route>

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </BrowserRouter>
      <Toaster />
      <SessionExpiredModal />
    </>
  );
}

export default App;
