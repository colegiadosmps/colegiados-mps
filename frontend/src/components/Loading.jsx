import LottieAnimation from "./common/LottieAnimation";

const Loading = ({ label = "Carregando dados..." }) => (
  <div className="loading-state loading-state--visual">
    <LottieAnimation
      fallback={<div className="spinner" />}
      height={110}
      name="loading-base"
      width={110}
    />
    <span>{label}</span>
  </div>
);

export default Loading;
