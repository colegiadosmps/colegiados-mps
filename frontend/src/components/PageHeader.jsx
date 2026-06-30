import MetricCard from "./MetricCard";

const PageHeader = ({
  filters,
  icon: Icon,
  metricLabel,
  metricValue,
  subtitle,
  title,
}) => (
  <section className="page-header">
    <div className="page-header__top">
      <div className="page-header__title-block">
        <div className="page-header__glyph">
          <Icon />
        </div>
        <div>
          <p className="eyebrow eyebrow--light">Painel de consulta</p>
          <h2>{title}</h2>
          {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {filters ? <div className="page-header__filters">{filters}</div> : null}
    </div>
    <div className="page-header__metric">
      <MetricCard label={metricLabel} value={metricValue} variant="hero" />
    </div>
  </section>
);

export default PageHeader;
