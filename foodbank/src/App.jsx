import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MediaPg from "./pages/MediaPg";
import About from "./pages/About";
import Partners from "./pages/Partners";
import Contact from "./pages/Contact";

import Media from "./pages/Media";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterDonor from "./pages/RegisterDonor";
import RegisterOrg from "./pages/RegisterOrg";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/mediapg" element={<MediaPg />} />
        <Route path="/about" element={<About />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/media" element={<Media />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/donor" element={<RegisterDonor />} />
        <Route path="/register/org" element={<RegisterOrg />} />
        

      </Routes>
    </BrowserRouter>
  );
}

export default App;