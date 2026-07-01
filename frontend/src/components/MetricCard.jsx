const MetricCard = ({
  caption,
  icon: Icon,
  label,
  tone = "blue",
  value,
  variant = "default",
}) => (
  <article className={`metric-card metric-card--${variant} metric-card--tone-${tone}`}>
    {Icon ? (
      <div className="metric-card__icon" aria-hidden="true">
        <Icon />
      </div>
    ) : null}
    <div className="metric-card__content">
      <strong>{value}</strong>
      <span>{label}</span>
      {caption ? <small>{caption}</small> : null}
    </div>
  </article>
);

export default MetricCard;
