import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ── When your backend is ready, replace these URLs ────────────
const API_FOOD_URL = "http://localhost:8000/api/donors/food";
const API_CASH_URL = "http://localhost:8000/api/donors/cash";

// Fallback data — used until API is connected
const FALLBACK_FOOD = [
  "Alaska Corp.",
  "All Day Supermarket",
  "Allegro Beverage Corp",
  "Anchor Milk",
  "Amici Pasta",
  "Andre Kahn Vegetables",
  "Arla Milk",
  "Bizu",
  "Caramia Cakes",
  "Century Pacific Inc.",
  "Colgate-Palmolive Phils.",
  "Concept Foods",
  "Delbros",
  "Del Monte Phils., Inc.",
  "Dole Philippines",
  "Dunkin Donuts",
  "Energen",
  "Gardenia Bakeries",
  "Grab",
  "Green Cross",
  "Holly's Milk",
  "Jollibee",
  "Krispy Kreme",
  "Makati Sports Club",
  "Mama Sita's",
  "Mary Grace",
  "Meadow Fresh Milk",
  "Monde Nissin Corp.",
  "Nutri-Asia",
  "Pan De Manila",
  "Pick Up Coffee",
  "Procter & Gamble",
  "RFM Corporation",
  "Shakey's Pizza",
  "Starbucks",
  "Subway",
  "Toscana Farms",
  "Unilever Philippines",
  "URC",
];

const FALLBACK_CASH = [
  "Aguila, Andy",
  "Atienza, Veredigno",
  "Bendaña, Ed & Rory",
  "Casabuena, Ric & Fe",
  "Castillo, Mannix & Precy",
  "Castro, Gerardo & Merche",
  "Cinco, Jovie & Alice",
  "Cuisia, Jose L. Jr",
  "De Ocampo, Restie & Chit",
  "Diversified Holdings, Inc",
  "Garcia, Sid & Tessa",
  "Gonzales, Noel & Ditas",
  "Gustilo, Eric & MaryAnne",
  "Ladao, Jimmy",
  "Limcaoco, Antonio & Karina",
  "Lozano Jr., Alfredo & Boots",
  "Mañosa, Gelo & Katrina",
  "Ostrea, Tony",
  "Parungao, Fred & Milagros",
  "Pascual, Jing & Christine",
  "Penaflor, Rolly",
  "Pizarro, Danny & Lou",
  "Pleno, Mercedes",
  "Ragragio, Junio & Tita",
  "Sandejas, Manu",
  "Sandejas, Paco & Christine",
  "Santa Maria, Jess & Bengget",
  "Sebastian, Francisco",
  "Tagud, Sulficio",
  "Williams, Jeffrey & Rosanne",
  "Wolbert, Dan & Ana",
];

// Helper — splits a flat array into two roughly equal columns
function splitColumns(arr) {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

// Reusable donor section component
function DonorSection({ title, subtitle, donors, loading }) {
  const [left, right] = splitColumns(donors);

  return (
    <section className="donor-section">
      <h2 className="donor-section-title">{title}</h2>
      <p className="donor-section-sub">{subtitle}</p>
      <hr className="donor-divider" />

      {loading ? (
        <p className="donor-loading">Loading donors...</p>
      ) : (
        <div className="donor-columns">
          <ul className="donor-list">
            {left.map((name, i) => <li key={i}>{name}</li>)}
          </ul>
          <ul className="donor-list">
            {right.map((name, i) => <li key={i}>{name}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function Partners() {
  const [foodDonors, setFoodDonors] = useState(FALLBACK_FOOD);
  const [cashDonors, setCashDonors] = useState(FALLBACK_CASH);
  const [loadingFood, setLoadingFood] = useState(true);
  const [loadingCash, setLoadingCash] = useState(true);

  useEffect(() => {
    // Fetch food donors
    const fetchFood = async () => {
      try {
        const res = await fetch(API_FOOD_URL);
        if (!res.ok) throw new Error("API not ready");
        const json = await res.json();
        // Expects: { success: true, data: [{ id, name }, ...] }
        if (json.success && Array.isArray(json.data)) {
          setFoodDonors(json.data.map((d) => d.name));
        }
      } catch {
        // Keep fallback
      } finally {
        setLoadingFood(false);
      }
    };

    // Fetch cash donors
    const fetchCash = async () => {
      try {
        const res = await fetch(API_CASH_URL);
        if (!res.ok) throw new Error("API not ready");
        const json = await res.json();
        // Expects: { success: true, data: [{ id, name }, ...] }
        if (json.success && Array.isArray(json.data)) {
          setCashDonors(json.data.map((d) => d.name));
        }
      } catch {
        // Keep fallback
      } finally {
        setLoadingCash(false);
      }
    };

    fetchFood();
    fetchCash();
  }, []);

  return (
    <div>

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <div className="hero partners-hero">
        <div className="hero-overlay center">
          <h1 className="about-title">OUR DONORS</h1>
        </div>
      </div>

      {/* FOOD AND HOUSEHOLD ESSENTIALS */}
      <DonorSection
        title="Food and Household Essentials"
        subtitle="With heartfelt gratitude for your generous support"
        donors={foodDonors}
        loading={loadingFood}
      />

      {/* CASH DONATION */}
      <DonorSection
        title="Cash Donation"
        subtitle="With heartfelt gratitude for your generous support"
        donors={cashDonors}
        loading={loadingCash}
      />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
