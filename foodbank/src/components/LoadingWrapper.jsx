// components/LoadingWrapper.jsx
import { useState, useEffect } from "react";
import LoadingPage from "./LoadingPage";

export default function LoadingWrapper({ children }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const minLoadTime = 1500;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const increment = Math.random() * (prev < 50 ? 15 : 5);
        return Math.min(prev + increment, 95);
      });
    }, 100);

    const handleLoad = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => setLoading(false), 300);
      }, remaining);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }

    return () => clearInterval(progressInterval);
  }, []);

  if (loading) {
    return <LoadingPage progress={progress} />;
  }

  return children;
}