import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import NavBar_Admin from "../../components/NavBar_Admin";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, Title, Tooltip, Legend, Filler
);

// ── STAT CARDS — swap icon src as needed ──────────────────────────────────────
const STAT_CARDS = [
  {
    key:    "total_donations",
    label:  "TOTAL DONATIONS MADE",
    icon:   "/images/Admin_Donation.png",   // ← swap me
    prefix: "₱",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key:    "meals_served",
    label:  "MEALS SERVED",
    icon:   "/images/Admin_MealServed.png", // ← swap me
    prefix: "",
    format: (v) => Number(v).toLocaleString(),
  },
  {
    key:    "active_drives",
    label:  "ACTIVE FOOD DRIVES",
    icon:   "/images/Admin_Drives.png",     // ← swap me
    prefix: "",
    format: (v) => v,
  },
];

export default function Admin_Dashboard() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [stats, setStats]         = useState({ total_donations: 0, meals_served: 0, active_drives: 0 });
  const [adminName, setAdminName] = useState("Administrator");
  const [drives, setDrives]       = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedDrive, setSelectedDrive] = useState(null);

  const [trendData,       setTrendData]       = useState({ labels: [], values: [] });
  const [typeData,        setTypeData]        = useState({ labels: [], values: [] });
  const [beneficiaryData, setBeneficiaryData] = useState({ labels: [], values: [] });
  const [regionData,      setRegionData]      = useState({ labels: [], values: [] });

  const [loading,       setLoading]       = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [
          statsRes, drivesRes, profileRes,
          trendRes, typeRes, beneficiaryRes, regionRes,
        ] = await Promise.all([
          api.get("/admin/dashboard/stats"),
          api.get("/admin/drives"),
          api.get("/admin/profile"),
          api.get("/admin/charts/donation-trends"),
          api.get("/admin/charts/donation-types"),
          api.get("/admin/charts/beneficiary-types"),
          api.get("/admin/charts/distribution-by-region"),
        ]);
        setStats(statsRes.data);
        setDrives(drivesRes.data);
        setAdminName(profileRes.data.name ?? "Administrator");
        setTrendData(trendRes.data);
        setTypeData(typeRes.data);
        setBeneficiaryData(beneficiaryRes.data);
        setRegionData(regionRes.data);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Carousel ───────────────────────────────────────────────────────────────
  const VISIBLE      = 3;
  const canPrev      = carouselIndex > 0;
  const canNext      = carouselIndex + VISIBLE < drives.length;
  const visibleDrives = drives.slice(carouselIndex, carouselIndex + VISIBLE);

  // ── Export PDF ─────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const res  = await api.get("/admin/dashboard/export-pdf", { responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", "admin_dashboard_report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExportLoading(false);
    }
  };

  // ── Chart configs ──────────────────────────────────────────────────────────
  const lineChartData = {
    labels: trendData.labels,
    datasets: [{
      label:              "Donation Amount (₱)",
      data:               trendData.values,
      borderColor:        "#2e7d32",
      backgroundColor:    "rgba(46,125,50,0.08)",
      pointBackgroundColor: "#2e7d32",
      pointRadius:        5,
      tension:            0.4,
      fill:               true,
    }],
  };
  const lineChartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" }, title: { display: false } },
    scales:  { y: { beginAtZero: true, ticks: { callback: (v) => `₱${Number(v).toLocaleString()}` } } },
  };

  const doughnutColors = ["#2e7d32", "#66bb6a", "#f4b942", "#c96a2e"];
  const typeChartData = {
    labels: typeData.labels,
    datasets: [{ data: typeData.values, backgroundColor: doughnutColors, borderWidth: 2, borderColor: "white" }],
  };
  const beneficiaryChartData = {
    labels: beneficiaryData.labels,
    datasets: [{ data: beneficiaryData.values, backgroundColor: ["#2e7d32","#66bb6a","#a5d6a7","#f4b942","#c96a2e"], borderWidth: 2, borderColor: "white" }],
  };
  const doughnutOptions = { responsive: true, plugins: { legend: { position: "right" } }, cutout: "60%" };

  const barChartData = {
    labels: regionData.labels,
    datasets: [
      { label: "Financial", data: regionData.financial ?? [], backgroundColor: "#2e7d32" },
      { label: "Food",      data: regionData.food      ?? [], backgroundColor: "#66bb6a" },
      { label: "Other",     data: regionData.other     ?? [], backgroundColor: "#c8e6c9" },
    ],
  };
  const barChartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales:  { x: { stacked: false }, y: { beginAtZero: true } },
  };

  return (
    <div className="sd-wrapper">
      <NavBar_Admin />

      <div className="sd-layout">
        <main className="sd-main">

          {/* ── HERO BANNER ── */}
          <div className="sd-banner">
            <img src="/images/Background2.png" alt="banner" className="sd-banner-bg" />
            <div className="sd-banner-overlay" />
            <div className="sd-banner-content">
              <p className="sd-banner-greeting">Good Day!</p>
              <h1 className="sd-banner-name">{adminName}</h1>
              <p className="sd-banner-meta">Administrative Dashboard</p>
              <p className="sd-banner-sub">
                Here's your system overview — keep driving the mission forward.
              </p>
            </div>
          </div>

          {/* ── STAT CARDS — glass style matching Staff ── */}
          <div className="sd-cards" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "40px" }}>
            {STAT_CARDS.map((card) => (
              <div className="sd-glass-card" key={card.key}>
                <img src={card.icon} alt={card.label} className="sd-glass-card-icon" />
                <div className="sd-glass-card-info">
                  <p className="sd-glass-card-value">
                    {loading ? "—" : `${card.prefix}${card.prefix ? " " : ""}${card.format(stats[card.key])}`}
                  </p>
                  <p className="sd-glass-card-label">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── ONGOING FOOD DRIVES ── */}
          <div className="adm-drives-section">
            <h2 className="adm-drives-heading">Ongoing Food Drives</h2>
            <div className="adm-carousel">
              <button
                className="adm-carousel-arrow"
                onClick={() => setCarouselIndex((i) => i - 1)}
                disabled={!canPrev}
              >
                <span className="material-symbols-rounded">chevron_left</span>
              </button>

              <div className="adm-carousel-track">
                {loading ? (
                  <p className="adm-drives-loading">Loading drives…</p>
                ) : drives.length === 0 ? (
                  <p className="adm-drives-loading">No active drives.</p>
                ) : (
                  visibleDrives.map((drive) => (
                    <div className="adm-drive-card" key={drive.id}>
                      <span className="adm-drive-status">ACTIVE</span>
                      <h3 className="adm-drive-title">{drive.title}</h3>
                      <p className="adm-drive-desc">{drive.description}</p>
                      <div className="adm-drive-progress-wrap">
                        <div
                          className="adm-drive-progress-fill"
                          style={{ width: `${Math.min((drive.current / drive.goal) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="adm-drive-progress-labels">
                        <span>₱{Number(drive.current).toLocaleString()}</span>
                        <span>₱{Number(drive.goal).toLocaleString()}</span>
                      </div>
                      <button className="adm-drive-btn" onClick={() => setSelectedDrive(drive)}>
                        View Details
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                className="adm-carousel-arrow"
                onClick={() => setCarouselIndex((i) => i + 1)}
                disabled={!canNext}
              >
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
          </div>

          {/* ── DRIVE DETAILS MODAL ── */}
          {selectedDrive && (
            <div className="adm-modal-overlay" onClick={() => setSelectedDrive(null)}>
              <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                <button className="adm-modal-close" onClick={() => setSelectedDrive(null)}>
                  <span className="material-symbols-rounded">close</span>
                </button>
                <table className="adm-modal-table">
                  <tbody>
                    <tr><td>Drive Title</td>    <td><strong>{selectedDrive.title}</strong></td></tr>
                    <tr><td>Type</td>           <td><strong>{selectedDrive.type}</strong></td></tr>
                    <tr><td>Goal</td>           <td><strong>{selectedDrive.goal_label ?? `₱${Number(selectedDrive.goal).toLocaleString()}`}</strong></td></tr>
                    <tr><td>Duration Date</td>  <td><strong>{selectedDrive.start_date} | {selectedDrive.end_date}</strong></td></tr>
                    <tr><td>Address</td>        <td><strong>{selectedDrive.address}</strong></td></tr>
                    <tr><td>Contact Person</td> <td><strong>{selectedDrive.contact_person}</strong></td></tr>
                    <tr><td>Number</td>         <td><strong>{selectedDrive.contact_number}</strong></td></tr>
                    <tr><td>Email</td>          <td><strong>{selectedDrive.contact_email}</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DONATION TRENDS ── */}
          <div className="adm-chart-card">
            <h2 className="adm-chart-title">
              Donation Trends <span style={{ fontWeight: 400, fontSize: 18 }}>(Last 30 Days)</span>
            </h2>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>

          {/* ── PIE CHARTS ── */}
          <div className="adm-charts-row">
            <div className="adm-chart-card adm-chart-half">
              <h2 className="adm-chart-title">Donation Types Distribution</h2>
              <Doughnut data={typeChartData} options={doughnutOptions} />
            </div>
            <div className="adm-chart-card adm-chart-half">
              <h2 className="adm-chart-title">Beneficiary Types</h2>
              <Doughnut data={beneficiaryChartData} options={doughnutOptions} />
            </div>
          </div>

          {/* ── BAR CHART ── */}
          <div className="adm-chart-card">
            <h2 className="adm-chart-title">Distribution by Region</h2>
            <Bar data={barChartData} options={barChartOptions} />
          </div>

          {/* ── EXPORT PDF ── */}
          <div className="dd-export-row">
            <button className="dd-export-btn" onClick={handleExportPDF} disabled={exportLoading}>
              <span className="material-symbols-rounded">download</span>
              {exportLoading ? "Exporting…" : "Export to PDF"}
            </button>
          </div>

        </main>

        <Sidebar apiEndpoint="/admin/notifications" />
      </div>
    </div>
  );
}
