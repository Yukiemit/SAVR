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
import RegisterOrg from "./pages/RegisterOrg";

import StaffDashboard from "./pages/Staff/Staff_Dashboard";
import StaffDonataionRequest from "./pages/Staff/Staff_DonationRequest";
import Staff_DonationDrive from "./pages/Staff/Staff_DonationDrive";
import DonorDashboard from "./pages/Donor/Donor_Dashboard";

import AdminDashboard from "./pages/Admin/Admin_Dashboard";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/mediapg" element={<MediaPg />} />
        <Route path="/about" element={<About />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/media" element={<Media />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/donor" element={<RegisterDonor />} />
        <Route path="/register/org" element={<RegisterOrg />} />

        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/donations/request" element={<StaffDonataionRequest />} />
        <Route path="/staff/donations/drive" element={<Staff_DonationDrive />} />


        <Route path="/donor/dashboard" element={<DonorDashboard />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;