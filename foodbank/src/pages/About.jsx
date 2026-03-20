import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div>

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <div className="hero about-hero">
        <div className="hero-overlay center">
          <h1 className="about-title">ABOUT US</h1>
          <p className="about-sub">
            Welcome to the Philippine FoodBank Foundation, Inc., where our mission is to combat food insecurity while fostering sustainability and social responsibility
          </p>
        </div>
      </div>

      {/* WHO WE ARE */}
      <section className="about-section">
        <div className="about-grid">

          <div>
            <h2 className="orange-title">WHO WE ARE</h2>
            <p className="about-text">
              The Philippine FoodBank Foundation, Inc. is a non-profit organization dedicated to alleviating hunger and reducing food waste in the Philippines...
            </p>
          </div>

          <div className="about-images">
            <img src="/images/about1.png" />
            <img src="/images/about2.png" />
            <img src="/images/about3.png" />
          </div>

        </div>
      </section>

      {/* BOARD */}
      <section className="board">
        <h2 className="orange-title center">BOARD OF TRUSTEES</h2>

        <div className="board-grid">
          {[
            "person1.png",
            "person2.png",
            "person3.png",
            "person4.png",
            "person5.png",
            "person6.png",
            "person7.png",
          ].map((img, i) => (
            <div className="board-card" key={i}>
              <img src={`/images/${img}`} />
              <p>Member Name</p>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION */}
      <section className="mission">
        <h2 className="orange-title center">OUR MISSION</h2>
        <p className="mission-text">
          Welcome to the Philippine FoodBank Foundation, Inc., where our mission is to combat food insecurity while fostering sustainability and social responsibility
        </p>
      </section>

      {/* BENEFICIARIES */}
      <section className="beneficiaries">
        <div className="benefits-grid">

          <div className="benefit-images">
            <img src="/images/benefit1.png" />
            <img src="/images/benefit2.png" />
          </div>

          <div>
            <h2 className="orange-title">LIST OF BENEFICIARIES</h2>
            <ul>
              <li>Elsie Gaches Village</li>
              <li>Casa Milan San Jose</li>
              <li>Haven for Women</li>
              <li>Las Pinas City Jail</li>
              <li>Reception Center Manila</li>
            </ul>
          </div>

        </div>
      </section>

      {/* GET INVOLVED */}
      <section className="about-section">
        <div className="about-grid">

          <div>
            <h2 className="green-title">GET INVOLVED</h2>
            <p className="about-text">
              Join us in our mission to fight hunger and promote sustainability...
            </p>
          </div>

          <div className="about-images">
            <img src="/images/involve.png" />
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}