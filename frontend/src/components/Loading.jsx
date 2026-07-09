import { useEffect, useState } from "react";
import LottieAnimation from "./common/LottieAnimation";

const Loading = ({ label = "Carregando dados..." }) => {
  const [showLottie, setShowLottie] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLottie(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="loading-state loading-state--visual">
      {showLottie ? (
        <LottieAnimation
          fallback={<div className="spinner" />}
          height={110}
          name="loading-base"
          width={110}
        />
      ) : (
        <div className="spinner loading-state__spinner--large" />
      )}
      <span>{label}</span>
    </div>
  );
};

export default Loading;
