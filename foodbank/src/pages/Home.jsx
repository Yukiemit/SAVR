
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const initiatives = [
  {
    label: "Food Rescue",
    icon: "volunteer_activism",
    image: "/images/1Home_FoodRescue.png",
    description:
      "We rescue surplus or near-expiry food products otherwise going to waste and redistribute them to those facing food insecurity.",
  },
  {
    label: "Community Distribution",
    icon: "diversity_3",
    image: "/images/1Home_ComDistribution.png",
    description:
      "Our network of partners enables us to reach marginalized communities across the Philippines, ensuring nutritious food reaches those who need it most.",
  },
  {
    label: "Education & Advocacy",
    icon: "campaign",
    image: "/images/1Home_EduNAdvo.png",
    description:
      "We raise awareness about food waste and hunger through educational initiatives and advocacy campaigns, empowering individuals and communities to take action.",
  },
];

const goals = [
  {
    title: "Hunger Relief",
    desc: "by distributing surplus food to religious orphanages, schools, parishes and other charitable institutions in communities in need.",
  },
  {
    title: "Food Waste Reduction",
    desc: "through collaborating with food business to minimize excess and waste added to landfill.",
  },
  {
    title: "Promote Learning Abilities",
    desc: "by providing nourishment to avoid brain damage especially for young children from newly born to 2 years old.",
  },
  {
    title: "Community Empowerment",
    desc: "by providing nutritional education and supporting local hunger-fighting initiatives.",
  },
];

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
          {initiatives.map((item) => (
            <div className="initiative-card" key={item.label}>
              {/* BG ICON WATERMARK */}
              <span className="initiative-bg-icon material-symbols-rounded">
                {item.icon}
              </span>

              {/* DEFAULT STATE: icon + label */}
              <div className="initiative-default">
                <span className="material-symbols-rounded initiative-icon">{item.icon}</span>
                <h3>{item.label}</h3>
              </div>

              {/* HOVER STATE: title + description */}
              <div className="initiative-hover">
                <p className="initiative-hover-title">{item.label.toUpperCase()}</p>
                <p className="initiative-hover-desc">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GOALS */}
      <section className="goals">
        <div className="goals-left">
          <h2 className="goals-title">OUR MAIN GOALS</h2>
          <ul className="goals-list">
            {goals.map((g) => (
              <li className="goals-item" key={g.title}>
                <span className="material-symbols-rounded goals-check">check_circle</span>
                <div className="goals-item-text">
                  <strong>{g.title}</strong>
                  <p>{g.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="goals-img"></div>
      </section>

      {/* PARTNERS */}
      <section className="partners">
        <h2>OUR PARTNERS</h2>
        <div className="partners-wrapper">
          <div className="partners-track">
            {[...Array(4)].flatMap((_, set) =>
              [1, 2, 3, 4, 5].map((num) => (
                <div className="partner" key={`${set}-${num}`}>
                  <img src={`/images/Partners${num}.png`} alt={`Partner ${num}`} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
