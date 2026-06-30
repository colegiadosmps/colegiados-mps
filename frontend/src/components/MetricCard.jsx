const MetricCard = ({ label, value, variant = "default" }) => (
  <article className={`metric-card metric-card--${variant}`}>
    <strong>{value}</strong>
    <span>{label}</span>
  </article>
);

export default MetricCard;
