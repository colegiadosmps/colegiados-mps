import LottieAnimation from "./LottieAnimation";

const EmptyStatePanel = ({
  animation = "empty",
  message,
  title = "Sem dados disponiveis",
}) => (
  <div className="empty-state empty-state--illustrated">
    <LottieAnimation
      fallback={<div className="spinner" />}
      height={200}
      name={animation}
      width={200}
    />
    <div className="empty-state__content">
      <strong>{title}</strong>
      {message ? <span>{message}</span> : null}
    </div>
  </div>
);

export default EmptyStatePanel;
