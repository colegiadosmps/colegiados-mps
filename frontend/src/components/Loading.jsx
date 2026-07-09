import { useEffect, useState } from "react";
import LottieAnimation from "./common/LottieAnimation";

const Loading = ({ label = "Carregando dados..." }) => {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLoading(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!showLoading) {
    return null;
  }

  return (
    <div className="loading-state loading-state--visual">
      <LottieAnimation
        fallback={<div className="spinner loading-state__spinner--large" />}
        height={110}
        name="loading-base"
        width={110}
      />
      <span>{label}</span>
    </div>
  );
};

export default Loading;
