// LoadingPage.jsx
import { useState, useEffect } from "react";

export default function LoadingPage({ progress = 0 }) {
  const [fillProgress, setFillProgress] = useState(0);

  useEffect(() => {
    // Animate the fill progress smoothly
    const timer = setTimeout(() => {
      setFillProgress(progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="loading-main-bg">
      <div className="loading-container">
        <div className="loading-logo-wrapper">
          <img
            src="/images/logobrown.png"
            alt="FoodBank Logo"
            className="loading-logo"
          />
          {/* Progressive opacity overlay - fills from left to right */}
          <div
            className="loading-logo-overlay"
            style={{
              clipPath: `inset(0 ${100 - fillProgress}% 0 0)`,
            }}
          >
            <img
              src="/images/logobrown.png"
              alt="FoodBank Logo"
              className="loading-logo loading-logo-highlight"
            />
          </div>
        </div>

        <div className="loading-progress-container">
          <div className="loading-progress-bar-wrapper">
            <div
              className="loading-progress-fill"
              style={{ width: `${fillProgress}%` }}
            />
          </div>
          <div className="loading-percentage">{Math.round(fillProgress)}%</div>
        </div>

        <p className="loading-text">Loading your experience...</p>
      </div>
    </div>
  );
}