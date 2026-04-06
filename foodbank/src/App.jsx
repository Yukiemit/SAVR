import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MediaPg from "./pages/MediaPg";
import About from "./pages/About";
import Partners from "./pages/Partners";
import Contact from "./pages/Contact";

import Media from "./pages/Media";
import Login from "./pages/Login";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import RegisterDonor from "./pages/RegisterDonor";
import RegisterBeneficiary from "./pages/RegisterBeneficiary";

import StaffDashboard from "./pages/Staff/Staff_Dashboard";
import StaffDonationRequest from "./pages/Staff/Staff_DonationRequest";
import StaffDonationDrive from "./pages/Staff/Staff_DonationDrive";

import DonorDashboard from "./pages/Donor/Donor_Dashboard";
import DonorDonate from "./pages/Donor/Donor_Donate";
import DonorDonateService from "./pages/Donor/Donor_Donate_Service";
import DonorDonateFinancial from "./pages/Donor/Donor_Donate_Financial";
import DonorDonateFood from "./pages/Donor/Donor_Donate_Food";


import AdminDashboard from "./pages/Admin/Admin_Dashboard";
import AdminAccounts from "./pages/Admin/Admin_Accounts";

import BeneficiaryDashboard     from "./pages/Beneficiary/Beneficiary_Dashboard";
import BeneficiaryCreateRequest from "./pages/Beneficiary/Beneficiary_CreateRequest";
import BeneficiaryTrackRequest  from "./pages/Beneficiary/Beneficiary_TrackRequest";

function App() {
  return (
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
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/donations/request" element={<StaffDonationRequest />} />
        <Route path="/staff/donations/drive" element={<StaffDonationDrive />} />

        {/* ── DONOR ── */}
        <Route path="/donor/dashboard" element={<DonorDashboard />} />
        <Route path="/donor/donate" element={<DonorDonate />} />
        <Route path="/donor/donate/service" element={<DonorDonateService />} />
        <Route path="/donor/donate/financial" element={<DonorDonateFinancial />} />
        <Route path="/donor/donate/food" element={<DonorDonateFood />} />
        

        {/* ── ADMIN ── */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/accounts"   element={<AdminAccounts />} />

        {/* ── BENEFICIARY ── */}
        <Route path="/beneficiary/dashboard"      element={<BeneficiaryDashboard />} />
        <Route path="/beneficiary/create-request" element={<BeneficiaryCreateRequest />} />
        <Route path="/beneficiary/track-request"  element={<BeneficiaryTrackRequest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
