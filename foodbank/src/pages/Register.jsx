import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="reg-main-bg">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <img src="/images/logobrown.png" alt="Logo" style={{ height: "40px" }} />
        </div>
        <div className="nav-links">
          <a href="/home">Home</a>
          <a href="/about">About</a>
          <a href="/partners">Partners</a>
          <a href="/media">Media</a>
          <a href="/contact">Contact</a>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="reg-main-content fade-in">
        <h1 className="reg-main-title">
          CHOOSE YOUR <span className="reg-main-title-accent">ROLE</span>
        </h1>
        <p className="reg-main-subtitle">
          Select how you want to use SAVR. This helps us customize your experience.
        </p>

        <div className="reg-main-cards">
          {/* DONOR CARD */}
          <button
            className="reg-role-card"
            onClick={() => navigate("/register/donor")}
          >
            <div className="reg-role-card-inner">
              <img
                src="/images/Glass_Donor.png"
                alt="Donor"
                className="reg-role-icon"
              />
              <div className="reg-role-info">
                <h2 className="reg-role-title">DONOR</h2>
                <p className="reg-role-desc">
                  Donate food to individuals or communities in need
                </p>
              </div>
            </div>
          </button>

          {/* BENEFICIARY CARD */}
          <button
            className="reg-role-card"
            onClick={() => navigate("/register/beneficiary")}
          >
            <div className="reg-role-card-inner">
              <img
                src="/images/Glass_Beneficiary.png"
                alt="Beneficiary"
                className="reg-role-icon"
              />
              <div className="reg-role-info">
                <h2 className="reg-role-title">BENEFICIARY</h2>
                <p className="reg-role-desc">
                  Request food assistance for yourself or your community
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
