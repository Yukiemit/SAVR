import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import MediaPg from "./pages/MediaPg";
import About from "./pages/About";
import Partners from "./pages/Partners";
import Contact from "./pages/Contact";
import Media from "./pages/Media";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import RegisterDonor from "./pages/RegisterDonor";
import RegisterBeneficiary from "./pages/RegisterBeneficiary";
import LoadingWrapper from "./components/LoadingWrapper";

import StaffDashboard from "./pages/Staff/Staff_Dashboard";
import StaffDonationRequest from "./pages/Staff/Staff_DonationRequest";
import StaffDonationDrive from "./pages/Staff/Staff_DonationDrive";
import StaffServiceApproval from "./pages/Staff/Staff_ServiceApproval";
import StaffDonationJourneyTracker from "./pages/Staff/Staff_DonationJourneyTracker"

import DonorDashboard from "./pages/Donor/Donor_Dashboard";
import DonorProfileIndividual from "./pages/Donor/Donor_ProfileIndividual";
import DonorProfileOrganization from "./pages/Donor/Donor_ProfileOrganization";
import DonorDonate from "./pages/Donor/Donor_Donate";
import DonorDonateService from "./pages/Donor/Donor_Donate_Service";
import DonorDonateFinancial from "./pages/Donor/Donor_Donate_Financial";
import DonorDonateFood from "./pages/Donor/Donor_Donate_Food";

import AdminDashboard from "./pages/Admin/Admin_Dashboard";
import AdminAccounts from "./pages/Admin/Admin_Accounts";

import BeneficiaryDashboard from "./pages/Beneficiary/Beneficiary_Dashboard";
import BeneficiaryProfileIndividual from "./pages/Beneficiary/Beneficiary_ProfileIndividual";
import BeneficiaryProfileOrganization from "./pages/Beneficiary/Beneficiary_ProfileOrganization";
import BeneficiaryCreateRequest from "./pages/Beneficiary/Beneficiary_CreateRequest";
import BeneficiaryTrackRequest from "./pages/Beneficiary/Beneficiary_TrackRequest";

// ✅ PROTECTED ROUTE COMPONENT
function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = localStorage.getItem("role");

  if (!user || !role) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <LoadingWrapper>
      <BrowserRouter>
        <Routes>

          {/* ── PUBLIC ── */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/media" element={<Media />} />
          <Route path="/mediapg" element={<MediaPg />} />
          <Route path="/contact" element={<Contact />} />

          {/* ── AUTH ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── REGISTRATION ── */}
          <Route path="/register" element={<Register />} />
          <Route path="/register/donor" element={<RegisterDonor />} />
          <Route path="/register/beneficiary" element={<RegisterBeneficiary />} />

          {/* ── STAFF ── */}
          <Route path="/staff/dashboard" element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/staff/donations/request" element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDonationRequest />
            </ProtectedRoute>
          } />
          <Route path="/staff/donations/drive" element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDonationDrive />
            </ProtectedRoute>
          } />
          <Route path="/staff/operations/service-approval" element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffServiceApproval />
            </ProtectedRoute>
          } />
          <Route path="/staff/operations/journey-tracker" element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDonationJourneyTracker />
            </ProtectedRoute>
          } />

          {/* ── DONOR ── */}
          <Route path="/donor/dashboard" element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/donor/profile/individual" element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorProfileIndividual />
            </ProtectedRoute>
          } />
          <Route path="/donor/profile/organization" element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorProfileOrganization />
            </ProtectedRoute>
          } />
          <Route path="/donor/donate" element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorDonate />
            </ProtectedRoute>
          } />
          <Route path="/donor/donate/service" element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorDonateService />
            </ProtectedRoute>
          } />
          <Route path="/donor/donate/financial" element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorDonateFinancial />
            </ProtectedRoute>
          } />
          <Route path="/donor/donate/food" element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorDonateFood />
            </ProtectedRoute>
          } />

          {/* ── ADMIN ── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/accounts" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAccounts />
            </ProtectedRoute>
          } />

          {/* ── BENEFICIARY ── */}
          <Route path="/beneficiary/dashboard" element={
            <ProtectedRoute allowedRoles={["beneficiary"]}>
              <BeneficiaryDashboard />
            </ProtectedRoute>
          } />
          <Route path="/beneficiary/profile/individual" element={
            <ProtectedRoute allowedRoles={["beneficiary"]}>
              <BeneficiaryProfileIndividual />
            </ProtectedRoute>
          } />
          <Route path="/beneficiary/profile/organization" element={
            <ProtectedRoute allowedRoles={["beneficiary"]}>
              <BeneficiaryProfileOrganization />
            </ProtectedRoute>
          } />
          <Route path="/beneficiary/create-request" element={
            <ProtectedRoute allowedRoles={["beneficiary"]}>
              <BeneficiaryCreateRequest />
            </ProtectedRoute>
          } />
          <Route path="/beneficiary/track-request" element={
            <ProtectedRoute allowedRoles={["beneficiary"]}>
              <BeneficiaryTrackRequest />
            </ProtectedRoute>
          } />

          {/* ── CATCH ALL — redirect to login ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </LoadingWrapper>
  );
}

export default App;