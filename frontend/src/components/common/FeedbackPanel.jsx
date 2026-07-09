import LottieAnimation from "./LottieAnimation";

const toneToAnimation = {
  success: "success",
  saved: "success-saved",
  error: "error",
  sync: "sync-drive",
  import: "import-csv",
};

const FeedbackPanel = ({ animation, message, tone = "success", title }) => {
  const resolvedAnimation = animation || toneToAnimation[tone] || "success";

  return (
    <div className={`inline-message inline-message--visual inline-message--${tone}`}>
      <LottieAnimation
        fallback={<div className="spinner" />}
        height={96}
        name={resolvedAnimation}
        width={96}
      />
      <div className="inline-message__content">
        {title ? <strong>{title}</strong> : null}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default FeedbackPanel;
