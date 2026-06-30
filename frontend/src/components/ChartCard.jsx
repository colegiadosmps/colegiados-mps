const ChartCard = ({ actions, children, title }) => (
  <article className="chart-card">
    <div className="chart-card__header">
      <h3>{title}</h3>
      {actions}
    </div>
    <div className="chart-card__body">{children}</div>
  </article>
);

export default ChartCard;
