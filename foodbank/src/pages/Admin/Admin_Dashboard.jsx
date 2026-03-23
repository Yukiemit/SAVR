import { useState, useEffect, useRef } from "react";
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

// ── Register Chart.js components ─────────────────────────────────────────────
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, BarElement, Title, Tooltip, Legend, Filler
);

export default function Admin_Dashboard() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total_donations: 0,
    meals_served: 0,
    active_drives: 0,
  });
  const [drives, setDrives]               = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedDrive, setSelectedDrive] = useState(null);

  const [trendData, setTrendData]         = useState({ labels: [], values: [] });
  const [typeData, setTypeData]           = useState({ labels: [], values: [] });
  const [beneficiaryData, setBeneficiaryData] = useState({ labels: [], values: [] });
  const [regionData, setRegionData]       = useState({ labels: [], values: [] });

  const [loading, setLoading]             = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // ── Fetch all data ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [
          statsRes, drivesRes,
          trendRes, typeRes, beneficiaryRes, regionRes,
        ] = await Promise.all([
          api.get("/admin/dashboard/stats"),
          api.get("/admin/drives"),
          api.get("/admin/charts/donation-trends"),
          api.get("/admin/charts/donation-types"),
          api.get("/admin/charts/beneficiary-types"),
          api.get("/admin/charts/distribution-by-region"),
        ]);
        setStats(statsRes.data);
        setDrives(drivesRes.data);
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

  // ── Carousel controls ──────────────────────────────────────────────────────
  const VISIBLE = 3;
  const canPrev = carouselIndex > 0;
  const canNext = carouselIndex + VISIBLE < drives.length;
  const visibleDrives = drives.slice(carouselIndex, carouselIndex + VISIBLE);

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const res = await api.get("/admin/dashboard/export-pdf", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
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

  // ── Chart configs ─────────────────────────────────────────────────────────
  const lineChartData = {
    labels: trendData.labels,
    datasets: [{
      label: "Donation Amount (₱)",
      data: trendData.values,
      borderColor: "#2e7d32",
      backgroundColor: "rgba(46,125,50,0.08)",
      pointBackgroundColor: "#2e7d32",
      pointRadius: 5,
      tension: 0.4,
      fill: true,
    }],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => `₱${Number(v).toLocaleString()}`,
        },
      },
    },
  };

  const doughnutColors = ["#2e7d32", "#66bb6a", "#f4b942", "#c96a2e"];

  const typeChartData = {
    labels: typeData.labels,
    datasets: [{
      data: typeData.values,
      backgroundColor: doughnutColors,
      borderWidth: 2,
      borderColor: "white",
    }],
  };

  const beneficiaryChartData = {
    labels: beneficiaryData.labels,
    datasets: [{
      data: beneficiaryData.values,
      backgroundColor: ["#2e7d32", "#66bb6a", "#a5d6a7", "#f4b942", "#c96a2e"],
      borderWidth: 2,
      borderColor: "white",
    }],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: "right" } },
    cutout: "60%",
  };

  const barChartData = {
    labels: regionData.labels,
    datasets: [
      {
        label: "Financial",
        data: regionData.financial ?? [],
        backgroundColor: "#2e7d32",
      },
      {
        label: "Food",
        data: regionData.food ?? [],
        backgroundColor: "#66bb6a",
      },
      {
        label: "Other",
        data: regionData.other ?? [],
        backgroundColor: "#c8e6c9",
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: { x: { stacked: false }, y: { beginAtZero: true } },
  };

  // ── Stat card definitions ─────────────────────────────────────────────────
  const STAT_CARDS = [
    {
      key: "total_donations",
      label: "Total Donations Made",
      icon: "/images/Admin_Donation.png",
      prefix: "₱",
      format: (v) => Number(v).toLocaleString(),
    },
    {
      key: "meals_served",
      label: "Meals Served",
      icon: "/images/Admin_MealServed.png",
      prefix: "",
      format: (v) => Number(v).toLocaleString(),
    },
    {
      key: "active_drives",
      label: "Active Food Drives",
      icon: "/images/Admin_Drives.png",
      prefix: "",
      format: (v) => v,
    },
  ];

  return (
    <div className="sd-wrapper">

      {/* ── NAVBAR ── */}
      <NavBar_Admin />

      <div className="sd-layout">

        {/* ════ MAIN CONTENT ════ */}
        <main className="sd-main">
          <h1 className="sd-heading">Administrative Dashboard</h1>

          {/* ── STAT CARDS ── */}
          <div className="sd-cards" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {STAT_CARDS.map((card) => (
              <div className="sd-card" key={card.key}>
                <img src={card.icon} alt={card.label} className="sd-card-icon" />
                <p className="sd-card-label">{card.label}</p>
                <p className="sd-card-value">
                  {loading ? "—" : `${card.prefix} ${card.format(stats[card.key])}`}
                </p>
              </div>
            ))}
          </div>

          {/* ── ONGOING FOOD DRIVES ── */}
          <div className="adm-drives-section">
            <h2 className="adm-drives-heading">Ongoing Food Drives</h2>

            <div className="adm-carousel">
              {/* LEFT ARROW */}
              <button
                className="adm-carousel-arrow"
                onClick={() => setCarouselIndex((i) => i - 1)}
                disabled={!canPrev}
              >
                <span className="material-symbols-rounded">chevron_left</span>
              </button>

              {/* DRIVE CARDS */}
              <div className="adm-carousel-track">
                {loading ? (
                  <p className="adm-drives-loading">Loading drives…</p>
                ) : drives.length === 0 ? (
                  <p className="adm-drives-loading">No active drives.</p>
                ) : (
                  visibleDrives.map((drive) => (
                    <div className="adm-drive-card" key={drive.id}>
                      {/* STATUS BADGE */}
                      <span className="adm-drive-status">ACTIVE</span>

                      <h3 className="adm-drive-title">{drive.title}</h3>
                      <p className="adm-drive-desc">{drive.description}</p>

                      {/* PROGRESS BAR */}
                      <div className="adm-drive-progress-wrap">
                        <div
                          className="adm-drive-progress-fill"
                          style={{
                            width: `${Math.min((drive.current / drive.goal) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="adm-drive-progress-labels">
                        <span>₱{Number(drive.current).toLocaleString()}</span>
                        <span>₱{Number(drive.goal).toLocaleString()}</span>
                      </div>

                      {/* VIEW DETAILS */}
                      <button
                        className="adm-drive-btn"
                        onClick={() => setSelectedDrive(drive)}
                      >
                        View Details
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* RIGHT ARROW */}
              <button
                className="adm-carousel-arrow"
                onClick={() => setCarouselIndex((i) => i + 1)}
                disabled={!canNext}
              >
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
          </div>

          {/* ── DRIVE DETAILS POPUP ── */}
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

          {/* ── DONATION TRENDS LINE CHART ── */}
          <div className="adm-chart-card">
            <h2 className="adm-chart-title">
              Donation Trends <span style={{ fontWeight: 400, fontSize: 20 }}>(Last 30 Days)</span>
            </h2>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>

          {/* ── PIE CHARTS ROW ── */}
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
            <button
              className="dd-export-btn"
              onClick={handleExportPDF}
              disabled={exportLoading}
            >
              <span className="material-symbols-rounded">download</span>
              {exportLoading ? "Exporting…" : "Export to PDF"}
            </button>
          </div>

        </main>

        {/* ════ SIDEBAR ════ */}
        <Sidebar apiEndpoint="/admin/notifications" />

      </div>
    </div>
  );
}
