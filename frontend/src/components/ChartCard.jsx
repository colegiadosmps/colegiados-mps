const ChartCard = ({ actions, children, interactive = false, onBodyClick, title }) => (
  <article className="chart-card">
    <div className="chart-card__header">
      <h3>{title}</h3>
      {actions}
    </div>
    <div
      className={`chart-card__body ${interactive ? "chart-card__body--interactive" : ""}`.trim()}
      onClick={interactive ? onBodyClick : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onBodyClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  </article>
);

export default ChartCard;
