import { useState } from "react";
import api from "../services/api";

export default function RegisterDonor() {
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    gender: "",
    dob: "",
    house: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    zip: "",
    contact: "",
    email: "",
    password: "",
    confirm: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
  try {
    await api.post("/register", {
      ...form,
      name: form.first_name + " " + form.last_name,
      role: "donor"
    });

    alert("Registered Successfully!");
  } catch (err) {
    console.error("FULL ERROR:", err.response?.data);

    alert(
      JSON.stringify(
        err.response?.data?.errors || err.response?.data?.message
      )
    );
  }


    // ✅ PASSWORD MATCH CHECK
    if (form.password !== form.password_confirmation) {
    console.log("Passwords do not match");
    return;
}

    try {
      await api.post("/register", {
        ...form,
        name: form.first_name + " " + form.last_name,
        role: "donor"
      });

      alert("Registered Successfully!");

      // ✅ RESET FORM AFTER SUCCESS
      setForm({
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        gender: "",
        dob: "",
        house: "",
        street: "",
        barangay: "",
        city: "",
        province: "",
        zip: "",
        contact: "",
        email: "",
        password: "",
        password_confirm: ""
      });

    } catch (err) {
  const errors = err.response?.data?.errors;

  if (errors?.email) {
    alert("This email is already registered. Try another one.");
  } else {
    alert("Registration failed");
  }
}
  };

  return (
    <div className="bg-foodbank">
        
      <div className="form-card fade-in">
        {/* ✅ LOGO (TOP CENTER) */}
        <img
          src="/images/logobrown.png"
          alt="FoodBank Logo"
          className="w-48 mx-auto mb-2"
        />
        <h2 className="form-title">Register as Donor!</h2>
        <p className="form-subtitle">Please enter your details</p>

        <div className="input-group">
          <input name="first_name" value={form.first_name} placeholder="First Name" className="input" onChange={handleChange}/>
          <input name="last_name" value={form.last_name} placeholder="Last Name" className="input" onChange={handleChange}/>
        </div>

        <div className="input-group">
          <input name="middle_name" value={form.middle_name} placeholder="Middle Name" className="input" onChange={handleChange}/>
          <input name="suffix" value={form.suffix} placeholder="Suffix" className="input" onChange={handleChange}/>
        </div>

        <div className="input-group">
          <input type="date" name="dob" value={form.dob} className="input" onChange={handleChange}/>
          <select name="gender" value={form.gender} className="input" onChange={handleChange}>
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        <div className="input-group">
          <input name="house" value={form.house} placeholder="House #" className="input" onChange={handleChange}/>
          <input name="street" value={form.street} placeholder="Street" className="input" onChange={handleChange}/>
        </div>

        <div className="input-group">
          <input name="barangay" value={form.barangay} placeholder="Barangay" className="input" onChange={handleChange}/>
          <input name="city" value={form.city} placeholder="City" className="input" onChange={handleChange}/>
        </div>

        <div className="input-group">
          <input name="province" value={form.province} placeholder="Province" className="input" onChange={handleChange}/>
          <input name="zip" value={form.zip} placeholder="ZIP Code" className="input" onChange={handleChange}/>
        </div>

        <div className="input-group">
          <input name="contact" value={form.contact} placeholder="Contact Number" className="input" onChange={handleChange}/>
          <input name="email" value={form.email} placeholder="Email" className="input" onChange={handleChange}/>
        </div>

        <div className="input-group">
  {/* PASSWORD */}
        <div className="relative w-full">
            <input
            type="password"
            name="password"
            placeholder="Password"
            className="input w-full pr-10"
            onChange={handleChange}
        />
            <span className="absolute right-2 top-2 cursor-pointer">👁️</span>
        </div>

  {/* CONFIRM PASSWORD */}
        <div className="relative w-full">
            <input
            type="password"
            name="password_confirmation"
            placeholder="Confirm Password"
            className="input w-full pr-10"
            onChange={handleChange}
        />
        <span className="absolute right-2 top-2 cursor-pointer">👁️</span>
        </div>
        </div>

        <button onClick={handleSubmit} className="btn-register">
          Register
        </button>
      </div>
    </div>
  );
}