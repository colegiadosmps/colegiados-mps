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
      <div className="page-header__intro">
        <div className="page-header__title-block">
          <div className="page-header__glyph">
            <Icon />
          </div>
          <div className="page-header__heading">
            <p className="eyebrow eyebrow--light page-header__eyebrow">Painel de consulta</p>
          </div>
          <h2 className="page-header__title">{title}</h2>
        </div>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {filters ? <div className="page-header__filters">{filters}</div> : null}
    </div>
    {metricLabel ? (
      <div className="page-header__metric">
        <MetricCard label={metricLabel} value={metricValue} variant="hero" />
      </div>
    ) : null}
  </section>
);

export default PageHeader;
