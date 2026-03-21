import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const boardMembers = [
  { img: "/images/2AboutUs_Chairman.png", role: "CHAIRMAN",        name: "Dr. Bernie Villegas" },
  { img: "/images/2AboutUs_President.png", role: "PRESIDENT",       name: "Mr. Itong Torres" },
  { img: "/images/2AboutUs_CorpSec.png", role: "CORP. SECRETARY", name: "Mr. Danny Navarro" },
  { img: "/images/2AboutUs_CorpTre.png", role: "CORP. TREASURER", name: "Mr. Chito Perez" },
  { img: "/images/2AboutUs_Director1.png", role: "DIRECTOR",        name: "Dr. Lito Sandejas" },
  { img: "/images/2AboutUs_Director2.png", role: "DIRECTOR",        name: "Mr. Quintin Pastrana" },
  { img: "/images/2AboutUs_Director3.png", role: "DIRECTOR",        name: "Mr. Mike Torres" },
];

// ── When your backend is ready, replace this URL ──────────────
const API_URL = "http://localhost:8000/api/beneficiaries";

// Fallback list shown while loading or if the API is not yet connected
const FALLBACK_BENEFICIARIES = [
  "Elsie Gaches Village, Muntinlupa",
  "Casa Miani San José, Home for Boys by the Somascan Fathers",
  "Haven for Women, Muntinlupa",
  "Marilac Hills for Abused Girls & Women",
  "Haven for Children, Home for Juvenile Boys, Muntinlupa",
  "Muntinlupa Bilibid Prison",
  "Las Pinas City Jail",
  "Reception Action Center, Manila (RAC)",
  "St. Josemaria Daycare Center, Barrio Langgam, Laguna",
  "Daughters of Virgin Mary Immaculate Outreach, Muntinlupa",
  "Anawim Community Center, Las Pinas",
  "Congregation of the Sisters of St John the Baptist, Paranaque",
  "Rogate Seminary Outreach, Paranaque",
  "Missionary Sisters of Charity, Tondo",
  "World Day of the Poor, Nov 18, 2018",
];

export default function About() {
  const [beneficiaries, setBeneficiaries] = useState(FALLBACK_BENEFICIARIES);
  const [showAll, setShowAll]             = useState(false);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("API not ready");

        const json = await res.json();

        // Expects: { success: true, data: [{ id, name, is_active, order }, ...] }
        if (json.success && Array.isArray(json.data)) {
          setBeneficiaries(json.data.map((b) => b.name));
        }
      } catch {
        // API not connected yet — fallback list stays
      } finally {
        setLoading(false);
      }
    };

    fetchBeneficiaries();
  }, []);

  const PREVIEW_COUNT  = 8;
  const visibleList    = showAll ? beneficiaries : beneficiaries.slice(0, PREVIEW_COUNT);
  const hiddenCount    = beneficiaries.length - PREVIEW_COUNT;

  return (
    <div>

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <div className="hero about-hero">
        <div className="hero-overlay center">
          <h1 className="about-title">ABOUT US</h1>
          <p className="about-sub">
            Welcome to the Philippine FoodBank Foundation, Inc., where our mission is to combat food insecurity while
            fostering sustainability and social responsibility
          </p>
        </div>
      </div>

      {/* WHO WE ARE */}
      <section className="about-section">
        <div className="about-grid">

          <div className="about-text-block">
            <h2 className="orange-title">WHO WE ARE</h2>
            <p className="about-text">
              The Philippine FoodBank Foundation, Inc. is a non-profit organization dedicated to alleviating hunger
              and reducing food waste in the Philippines. Founded in 2017 by Dr. Bernie Villegas, Dr. Lito Sandejas,
              Jimmy Ladao, Danny Navarro and Itong Torres and joined shortly after by Quintin Pastrana, Chito Perez
              and Mike Torres, we have been at the forefront of food rescue efforts, collecting surplus or near-expiry
              food products from generous donors such as food producers and retailers. These rescued food items are
              then distributed to marginalized communities, including orphanages, schools, parishes, and beyond.
            </p>
          </div>
          <img src="/images/2AboutUs_Img1.png" alt="About 1" className="about-img1" />
        </div>
      </section>

      {/* BOARD OF TRUSTEES */}
      <section className="board">
        <h2 className="about-section-title-light center">BOARD OF TRUSTEES</h2>

        <div className="board-grid">
          {boardMembers.slice(0, 4).map((m, i) => (
            <div className="board-card" key={i}>
              <img src={m.img} alt={m.name} />
              <p className="board-role">{m.role}</p>
              <p className="board-name">{m.name}</p>
            </div>
          ))}
        </div>

        <div className="board-grid board-grid-center">
          {boardMembers.slice(4).map((m, i) => (
            <div className="board-card" key={i}>
              <img src={m.img} alt={m.name} />
              <p className="board-role">{m.role}</p>
              <p className="board-name">{m.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OUR MISSION */}
      <section className="mission">
        <h2 className="about-section-title center">OUR MISSION</h2>
        <p className="mission-text">
          Welcome to the Philippine FoodBank Foundation, Inc., where our mission is to combat food insecurity while
          fostering sustainability and social responsibility
        </p>
      </section>

      {/* LIST OF BENEFICIARIES */}
      <section className="about-section">
        <div className="about-grid">
            <img src="/images/2AboutUs_Img2.png" alt="Beneficiary 1" className="benefit-images" />

          <div className="benefit-text">
            <h2 className="orange-title">LIST OF BENEFICIARIES</h2>

            {loading ? (
              <p className="beneficiary-loading">Loading beneficiaries...</p>
            ) : (
              <>
                <ul className="beneficiary-list">
                  {visibleList.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>

                {hiddenCount > 0 && (
                  <p className="see-more">
                    <button
                      className="see-more-btn"
                      onClick={() => setShowAll((prev) => !prev)}
                    >
                      {showAll ? "… see less" : `… see more (${hiddenCount} more)`}
                    </button>
                  </p>
                )}
              </>
            )}
          </div>

        </div>
      </section>

      {/* GET INVOLVED */}
      <section className="about-section">
        <div className="about-grid">

          <div className="about-text-block">
            <h2 className="green-title get-involved-title">GET INVOLVED</h2>
            <p className="about-text">
              Join us in our mission to fight hunger and promote sustainability! Whether you're interested in
              volunteering, making a donation, or partnering with us, there are many ways to get involved and make
              a difference.
            </p>
            <p className="about-text">
              Together, we can build a future where everyone has access to nutritious food and where sustainability
              is at the forefront of our efforts.
            </p>
            <p className="about-text">
              Thank you for visiting the Philippine FoodBank Foundation, Inc. website. Together, let's make a
              meaningful impact in the lives of others and in the world around us.
            </p>
          </div>

          <div className="involve-img-wrap">
            <img src="/images/2AboutUs_Img3.png" alt="Get Involved" className="involve-img" />
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
