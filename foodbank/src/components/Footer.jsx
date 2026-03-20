import React from "react";

export default function Footer() {
  return (
    <footer className="footer">

      {/* LOGO */}
      <img src="/public/images/logoo.png" alt="FoodBank Logo" className="footer-logo" />

      {/* DESCRIPTION */}
      <p className="footer-text">
        The Philippine FoodBank Foundation is dedicated to combating hunger 
        and reducing food waste in the Philippines
      </p>

      {/* COPYRIGHT */}
      <p className="footer-copy">
        Copyright 2026. Philippine Food Bank. Designed and Developed by Whitewall Design Studio
      </p>

    </footer>
  );
}