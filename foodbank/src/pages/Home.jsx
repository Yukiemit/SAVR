import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="font-sans">

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <div className="hero">
        <div className="hero-overlay">
          <div className="hero-content fade-hero">

            <img src="/public/images/logoo.png" alt="FoodBank" className="hero-logo" />

            <p className="hero-text">
              Through strategic partnerships, the foundation secures surplus food products
              from various sources and redistributes them to marginalized communities.
            </p>

          </div>
        </div>
      </div>

      {/* INITIATIVES */}
      <section className="section">
        <h2 className="section-title">Our Initiatives</h2>

        <div className="card-container">
          <div className="initiative-card">
            <img src="/images/1Home_FoodRescue.png" alt="Food Rescue" />
            <h3>Food Rescue</h3>
          </div>
          <div className="initiative-card">
            <img src="/images/1Home_ComDistribution.png" alt="Community Distribution" />
            <h3>Community Distribution</h3>
          </div>
          <div className="initiative-card">
            <img src="/images/1Home_EduNAdvo.png" alt="Education & Advocacy" />
            <h3>Education & Advocacy</h3>
          </div>
        </div>
      </section>

      {/* GOALS */}
      <section className="goals">
        <div>
          <h2 className="goals-title">OUR MAIN GOALS</h2>

          <ul>
            <li>✔ Hunger Relief</li>
            <li>by distributing surplus food to religious orphanages, schools, parishes and other charitable institutions in communities in need.Relief</li>
            <li>✔ Food Waste Reduction</li>
            <li>through collaborating with food business to minimize excess and waste added to landfill.</li>
            <li>✔ Promote Learning Abilities</li>
            <li>by providing nourishment to avoid brain damage especially for young children from newly born to 2 years old.</li>
            <li>✔ Community Empowerment</li>
            <li>by providing nutritional education and supporting local hunger-fighting initiatives.</li>
          </ul>
        </div>

        <div className="goals-img"></div>
      </section>

      {/* PARTNERS */}
      <section className="partners">
        <h2>OUR PARTNERS</h2>

        <div className="partners-wrapper">
    <div className="partners-track">

      {/* FIRST SET */}
      {[1,2,3,4,5].map((num, i) => (
        <div className="Partners" key={"a"+i}>
          <img src={`/images/Partners${num}.png`} />
        </div>
      ))}

      {/* DUPLICATE SET (IMPORTANT) */}
      {[1,2,3,4,5].map((num, i) => (
        <div className="Partners" key={"b"+i}>
          <img src={`/images/Partners${num}.png`} />
        </div>
      ))}

    </div>
  </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}