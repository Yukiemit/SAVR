import { useState, useEffect } from "react";
import NavBar_Admin from "../../components/NavBar_Admin";
import api from "../../services/api";

// ══════════════════════════════════════════════════════════════
//  DUMMY DATA — remove when Laravel backend is connected
// ══════════════════════════════════════════════════════════════
const DUMMY_ACCOUNTS = {
  org_donors: [
    { id: 1, name: "Community Kitchen - Tondo", no_donations: 12, industry: "Food & Beverages", type: "NGO",  email: "comkit@gmail.com" },
    { id: 2, name: "Community Kitchen - Tondo", no_donations: 12, industry: "Food & Beverages", type: "LGO",  email: "ck@gmail.com" },
    { id: 3, name: "Community Kitchen - Tondo", no_donations: 12, industry: "Food & Beverages", type: "LGO",  email: "ck2@gmail.com" },
  ],
  indiv_donors: [
    { id: 1, name: "Marcus M. Sameul",  no_donations: 10, gender: "Male",   zip: "1400", email: "marcus@gmail.com" },
    { id: 2, name: "Maria De Guzman",   no_donations: 10, gender: "Female", zip: "1400", email: "mariadg@gmail.com" },
    { id: 3, name: "Anastasia Marquez", no_donations: 10, gender: "Female", zip: "1400", email: "am@gmail.com" },
  ],
  beneficiaries: [
    { id: 1, name: "Elsie Gaches Village, Muntinlupa", emp_id: "1342", department: "IT", position: "Security", email: "elsie@gmail.com" },
    { id: 2, name: "Las Pinas City Jail",              emp_id: "1342", department: "IT", position: "Security", email: "laspinas@gov.com" },
    { id: 3, name: "Don Bosco Youth, Tondo",           emp_id: "1342", department: "IT", position: "Security", email: "dbyouth@gmail.com" },
  ],
  staff: [
    { id: 1, name: "Ping Chen",      emp_id: "1342", department: "IT", position: "Security", email: "ping@gmail.com" },
    { id: 2, name: "Kirk Tan",       emp_id: "1342", department: "IT", position: "Security", email: "kirk@gmail.com" },
    { id: 3, name: "Yuki Manansala", emp_id: "1342", department: "IT", position: "Security", email: "yuki@gmail.com" },
  ],
  partner_kitchens: [
    { id: 1, name: "Loaves and Fishes", kitchen_id: "PK-001", zip: "1400", email: "lf@gmail.com" },
  ],
};

// ══════════════════════════════════════════════════════════════
//  FILTER TABS
// ══════════════════════════════════════════════════════════════
const FILTER_TABS = ["All", "Org. Donor", "Indiv. Donor", "Beneficiaries", "Staff", "Partner Kitchen"];

// ══════════════════════════════════════════════════════════════
//  SECTION CONFIG
// ══════════════════════════════════════════════════════════════
const SECTIONS = [
  {
    key:   "org_donors",
    label: "Organization Donor",
    tab:   "Org. Donor",
    cols:  ["No. Donation", "Industry/Sector", "Organization Type", "Email"],
    row:   (r) => [r.no_donations, r.industry, r.type, r.email],
  },
  {
    key:   "indiv_donors",
    label: "Individual Donor",
    tab:   "Indiv. Donor",
    cols:  ["No. Donation", "Gender", "ZIP Code", "Email"],
    row:   (r) => [r.no_donations, r.gender, r.zip, r.email],
  },
  {
    key:   "beneficiaries",
    label: "Beneficiaries",
    tab:   "Beneficiaries",
    cols:  ["Employee ID", "Department", "Position/Role", "Email"],
    row:   (r) => [r.emp_id, r.department, r.position, r.email],
  },
  {
    key:   "staff",
    label: "Staff",
    tab:   "Staff",
    cols:  ["Employee ID", "Department", "Position/Role", "Email"],
    row:   (r) => [r.emp_id, r.department, r.position, r.email],
  },
  {
    key:   "partner_kitchens",
    label: "Partner Kitchen",
    tab:   "Partner Kitchen",
    cols:  ["Partner Kitchen ID", "Zip Code", "Email"],
    row:   (r) => [r.kitchen_id, r.zip, r.email],
  },
];

// ══════════════════════════════════════════════════════════════
//  ADD NEW MODAL — type chooser
// ══════════════════════════════════════════════════════════════
function AddNewModal({ onClose, onChoose }) {
  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      {/* Glassmorphism background like Register page */}
      <div className="adm-addnew-backdrop" onClick={(e) => e.stopPropagation()}>
        <h2 className="adm-addnew-title">ADD AN ACCOUNT</h2>
        <div className="adm-addnew-cards">

          {/* PARTNER KITCHEN */}
          <button className="reg-role-card adm-addnew-card" onClick={() => onChoose("kitchen")}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
              <img
                src="/images/Admin_PartnerKitchen.png"
                alt="Partner Kitchen"
                className="adm-addnew-icon"
              />
              <span className="adm-addnew-card-label">PARTNER<br />KITCHEN</span>
            </div>
          </button>

          {/* STAFF */}
          <button className="reg-role-card adm-addnew-card" onClick={() => onChoose("staff")}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
              <img
                src="/images/Admin_Staff.png"
                alt="Staff"
                className="adm-addnew-icon"
              />
              <span className="adm-addnew-card-label">STAFF</span>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  REGISTER STAFF MODAL
// ══════════════════════════════════════════════════════════════
function RegisterStaffModal({ onClose, onSuccess }) {
  const [form, setForm]   = useState({ first_name:"", last_name:"", emp_id:"", email:"", department:"", position:"", password:"", password_confirmation:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required.";
    if (!form.last_name.trim())  e.last_name  = "Required.";
    if (!form.emp_id.trim())     e.emp_id     = "Required.";
    if (!form.email.trim())      e.email      = "Required.";
    if (!form.password)          e.password   = "Required.";
    if (form.password !== form.password_confirmation) e.password_confirmation = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      // TODO (backend): POST /api/admin/accounts/staff
      // Body: { first_name, last_name, emp_id, email, department, position, password, password_confirmation, role: "staff" }
      await api.post("/admin/accounts/staff", { ...form, role: "staff" });
      onSuccess();
    } catch (err) {
      const lErr = err.response?.data?.errors;
      if (lErr) { const m = {}; for (const k in lErr) m[k] = lErr[k][0]; setErrors(m); }
      else setErrors({ general: "Registration failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-form-modal" onClick={(e) => e.stopPropagation()}>
        <button className="adm-modal-close" onClick={onClose}><span className="material-symbols-rounded">close</span></button>

        <h2 className="adm-form-modal-title">Register as Staff!</h2>
        <p className="adm-form-modal-sub">Please enter your details</p>

        {errors.general && <p style={{ color:"#c0392b", fontSize:13, textAlign:"center" }}>{errors.general}</p>}

        {/* First + Last */}
        <div className="adm-form-row">
          <div className="adm-form-field">
            <label className="adm-form-label">First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} className={`adm-form-input ${errors.first_name ? "adm-form-input-err" : ""}`} placeholder="First Name" />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} className={`adm-form-input ${errors.last_name ? "adm-form-input-err" : ""}`} placeholder="Last Name" />
          </div>
        </div>

        {/* Employee ID */}
        <div className="adm-form-field">
          <label className="adm-form-label">Employee ID</label>
          <input name="emp_id" value={form.emp_id} onChange={handleChange} className={`adm-form-input ${errors.emp_id ? "adm-form-input-err" : ""}`} placeholder="Employee ID" />
        </div>

        {/* Email */}
        <div className="adm-form-field">
          <label className="adm-form-label">Email Address</label>
          <input name="email" value={form.email} onChange={handleChange} className={`adm-form-input ${errors.email ? "adm-form-input-err" : ""}`} placeholder="Email Address" />
        </div>

        {/* Department + Position */}
        <div className="adm-form-row">
          <div className="adm-form-field">
            <label className="adm-form-label">Department</label>
            <select name="department" value={form.department} onChange={handleChange} className="adm-form-input adm-form-select">
              <option value="">Department</option>
              <option>IT</option>
              <option>Operations</option>
              <option>Finance</option>
              <option>Logistics</option>
            </select>
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Position / Role</label>
            <select name="position" value={form.position} onChange={handleChange} className="adm-form-input adm-form-select">
              <option value="">Position / Role</option>
              <option>Manager</option>
              <option>Coordinator</option>
              <option>Staff</option>
              <option>Security</option>
            </select>
          </div>
        </div>

        {/* Password */}
        <div className="adm-form-field" style={{ position:"relative" }}>
          <label className="adm-form-label">Password</label>
          <div className="reg-password-wrap">
            <input type={showPw ? "text" : "password"} name="password" value={form.password} onChange={handleChange} className={`adm-form-input ${errors.password ? "adm-form-input-err" : ""}`} placeholder="Password" />
            <span className="adm-eye" onClick={() => setShowPw(!showPw)}><span className="material-symbols-rounded">{showPw ? "visibility_off" : "visibility"}</span></span>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="adm-form-field">
          <label className="adm-form-label">Confirm Password</label>
          <div className="reg-password-wrap">
            <input type={showCf ? "text" : "password"} name="password_confirmation" value={form.password_confirmation} onChange={handleChange} className={`adm-form-input ${errors.password_confirmation ? "adm-form-input-err" : ""}`} placeholder="Confirm Password" />
            <span className="adm-eye" onClick={() => setShowCf(!showCf)}><span className="material-symbols-rounded">{showCf ? "visibility_off" : "visibility"}</span></span>
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop: 8 }}>
          <button className="reg-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Registering…" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  REGISTER PARTNER KITCHEN MODAL
// ══════════════════════════════════════════════════════════════
function RegisterKitchenModal({ onClose, onSuccess }) {
  const [form, setForm]   = useState({ kitchen_name:"", website:"", contact_person:"", position:"", email:"", contact:"", password:"", password_confirmation:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.kitchen_name.trim())  e.kitchen_name = "Required.";
    if (!form.contact_person.trim()) e.contact_person = "Required.";
    if (!form.email.trim())          e.email = "Required.";
    if (!form.contact.trim())        e.contact = "Required.";
    if (!form.password)              e.password = "Required.";
    if (form.password !== form.password_confirmation) e.password_confirmation = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      // TODO (backend): POST /api/admin/accounts/partner-kitchen
      // Body: { kitchen_name, website, contact_person, position, email, contact, password, password_confirmation, role: "partner_kitchen" }
      await api.post("/admin/accounts/partner-kitchen", { ...form, role: "partner_kitchen" });
      onSuccess();
    } catch (err) {
      const lErr = err.response?.data?.errors;
      if (lErr) { const m = {}; for (const k in lErr) m[k] = lErr[k][0]; setErrors(m); }
      else setErrors({ general: "Registration failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-form-modal" onClick={(e) => e.stopPropagation()}>
        <button className="adm-modal-close" onClick={onClose}><span className="material-symbols-rounded">close</span></button>

        <h2 className="adm-form-modal-title">Register as Partner Kitchen!</h2>
        <p className="adm-form-modal-sub">Please enter your details</p>

        {errors.general && <p style={{ color:"#c0392b", fontSize:13, textAlign:"center" }}>{errors.general}</p>}

        {/* Kitchen Name */}
        <div className="adm-form-field">
          <label className="adm-form-label">Kitchen Name</label>
          <input name="kitchen_name" value={form.kitchen_name} onChange={handleChange} className={`adm-form-input ${errors.kitchen_name ? "adm-form-input-err" : ""}`} placeholder="Kitchen Name" />
        </div>

        {/* Website */}
        <div className="adm-form-field" style={{ position:"relative" }}>
          <label className="adm-form-label">Website URL</label>
          <div style={{ position:"relative" }}>
            <input name="website" value={form.website} onChange={handleChange} className="adm-form-input" placeholder="https://example.com" style={{ paddingRight:32 }} />
            <span className="material-symbols-rounded" style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:18, color:"#aaa", pointerEvents:"none" }}>link</span>
          </div>
        </div>

        {/* Contact Person + Position */}
        <div className="adm-form-row">
          <div className="adm-form-field">
            <label className="adm-form-label">Contact Person</label>
            <input name="contact_person" value={form.contact_person} onChange={handleChange} className={`adm-form-input ${errors.contact_person ? "adm-form-input-err" : ""}`} placeholder="Contact Person" />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Position / Role</label>
            <input name="position" value={form.position} onChange={handleChange} className="adm-form-input" placeholder="Position / Role" />
          </div>
        </div>

        {/* Email + Contact */}
        <div className="adm-form-row">
          <div className="adm-form-field">
            <label className="adm-form-label">Email Address</label>
            <input name="email" value={form.email} onChange={handleChange} className={`adm-form-input ${errors.email ? "adm-form-input-err" : ""}`} placeholder="Email Address" />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Contact Number</label>
            <input name="contact" value={form.contact} onChange={handleChange} className={`adm-form-input ${errors.contact ? "adm-form-input-err" : ""}`} placeholder="Contact Number" />
          </div>
        </div>

        {/* Password */}
        <div className="adm-form-field">
          <label className="adm-form-label">Password</label>
          <div className="reg-password-wrap">
            <input type={showPw ? "text" : "password"} name="password" value={form.password} onChange={handleChange} className={`adm-form-input ${errors.password ? "adm-form-input-err" : ""}`} placeholder="Password" />
            <span className="adm-eye" onClick={() => setShowPw(!showPw)}><span className="material-symbols-rounded">{showPw ? "visibility_off" : "visibility"}</span></span>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="adm-form-field">
          <label className="adm-form-label">Confirm Password</label>
          <div className="reg-password-wrap">
            <input type={showCf ? "text" : "password"} name="password_confirmation" value={form.password_confirmation} onChange={handleChange} className={`adm-form-input ${errors.password_confirmation ? "adm-form-input-err" : ""}`} placeholder="Confirm Password" />
            <span className="adm-eye" onClick={() => setShowCf(!showCf)}><span className="material-symbols-rounded">{showCf ? "visibility_off" : "visibility"}</span></span>
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop: 8 }}>
          <button className="reg-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Registering…" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function Admin_Accounts() {
  const [accounts,    setAccounts]    = useState(DUMMY_ACCOUNTS);
  const [loading,     setLoading]     = useState(false);
  const [filterTab,   setFilterTab]   = useState("All");
  const [search,      setSearch]      = useState("");
  const [collapsed,   setCollapsed]   = useState({});
  const [modal,       setModal]       = useState(null); // null | "choose" | "staff" | "kitchen"

  // ── Backend fetch — uncomment when Laravel is ready ────────────────────────
  // useEffect(() => {
  //   const fetchAccounts = async () => {
  //     setLoading(true);
  //     try {
  //       // GET /api/admin/accounts
  //       // Returns: { org_donors, indiv_donors, beneficiaries, staff, partner_kitchens }
  //       const res = await api.get("/admin/accounts");
  //       setAccounts(res.data);
  //     } catch (err) {
  //       console.error("Accounts fetch error:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchAccounts();
  // }, []);

  // ── Delete account ──────────────────────────────────────────────────────────
  const handleDelete = async (section, id) => {
    if (!window.confirm("Delete this account?")) return;
    try {
      // TODO (backend): DELETE /api/admin/accounts/:section/:id
      await api.delete(`/admin/accounts/${section}/${id}`);
      setAccounts((prev) => ({
        ...prev,
        [section]: prev[section].filter((a) => a.id !== id),
      }));
    } catch {
      alert("Delete failed. Please try again.");
    }
  };

  // ── Filter sections ─────────────────────────────────────────────────────────
  const visibleSections = SECTIONS.filter((s) =>
    filterTab === "All" || s.tab === filterTab
  );

  const filterRows = (rows) => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q));
  };

  const handleAddSuccess = () => {
    setModal(null);
    // Re-fetch accounts from backend here when connected
    // fetchAccounts();
  };

  return (
    <div className="sd-wrapper">
      <NavBar_Admin />

      <main style={{ flex: 1, padding: "36px 50px 60px", background: "#f9f9f7" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <h1 className="adm-acct-heading">Accounts</h1>
          <button className="adm-addnew-btn" onClick={() => setModal("choose")}>
            <span className="material-symbols-rounded" style={{ fontSize:18 }}>add</span>
            Add New
          </button>
        </div>

        {/* ── FILTER + SEARCH ── */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28, flexWrap:"wrap" }}>
          <div className="adm-acct-tabs">
            {FILTER_TABS.map((t) => (
              <button
                key={t}
                className={`adm-acct-tab ${filterTab === t ? "adm-acct-tab-active" : ""}`}
                onClick={() => setFilterTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="adm-acct-search-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="adm-acct-search"
            />
            <span className="material-symbols-rounded adm-acct-search-icon">search</span>
          </div>
        </div>

        {/* ── SECTIONS ── */}
        {loading ? (
          <p style={{ color:"#aaa", fontStyle:"italic" }}>Loading…</p>
        ) : (
          visibleSections.map((section) => {
            const rows       = filterRows(accounts[section.key] ?? []);
            const isCollapsed = !!collapsed[section.key];

            return (
              <div key={section.key} className="adm-acct-section">

                {/* Section header */}
                <div className="adm-acct-section-header">
                  <h2 className="adm-acct-section-title">
                    {section.label}
                    <span className="adm-acct-section-count"> | {(accounts[section.key] ?? []).length}</span>
                  </h2>
                </div>

                {/* Rows */}
                {!isCollapsed && (
                  <div className="adm-acct-rows">
                    {/* Header row */}
                    <div className="adm-acct-row adm-acct-row-header">
                      <div className="adm-acct-avatar-placeholder" />
                      <div className="adm-acct-col adm-acct-col-name" style={{ fontWeight:800, color:"#888", fontSize:11, letterSpacing:"0.8px" }}>
                        NAME
                      </div>
                      {section.cols.map((col) => (
                        <div key={col} className="adm-acct-col" style={{ fontWeight:800, color:"#888", fontSize:11, letterSpacing:"0.8px" }}>
                          {col}
                        </div>
                      ))}
                      <div style={{ width:120 }} />
                    </div>

                    {rows.length === 0 ? (
                      <p style={{ color:"#aaa", fontSize:13, fontStyle:"italic", padding:"12px 16px" }}>No records found.</p>
                    ) : (
                      rows.map((r) => (
                        <div key={r.id} className="adm-acct-row">
                          {/* Avatar */}
                          <div className="adm-acct-avatar">
                            <span className="material-symbols-rounded" style={{ fontSize:28, color:"#bbb", fontVariationSettings:"'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>account_circle</span>
                          </div>

                          {/* Name + sub */}
                          <div className="adm-acct-col adm-acct-col-name">
                            <span className="adm-acct-name">{r.name}</span>
                          </div>

                          {/* Data cols */}
                          {section.row(r).map((val, i) => (
                            <div key={i} className="adm-acct-col">{val ?? "—"}</div>
                          ))}

                          {/* Actions */}
                          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                            {/* <button className="adm-acct-edit-btn">Edit</button> */}
                            <button className="adm-acct-delete-btn" onClick={() => handleDelete(section.key, r.id)}>Delete</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* ══ MODALS ══ */}
      {modal === "choose" && (
        <AddNewModal
          onClose={() => setModal(null)}
          onChoose={(type) => setModal(type === "staff" ? "staff" : "kitchen")}
        />
      )}
      {modal === "staff" && (
        <RegisterStaffModal onClose={() => setModal(null)} onSuccess={handleAddSuccess} />
      )}
      {modal === "kitchen" && (
        <RegisterKitchenModal onClose={() => setModal(null)} onSuccess={handleAddSuccess} />
      )}
    </div>
  );
}
