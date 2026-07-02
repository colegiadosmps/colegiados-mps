import MetricCard from "./MetricCard";

const PageHeader = ({
  actions,
  children,
  eyebrow = "Painel de consulta",
  filters,
  filtersClassName = "",
  icon: Icon,
  metricCaption,
  metricIcon,
  metricLabel,
  metricTone,
  metricValue,
  subtitle,
  title,
}) => (
  <section className="page-header">
    <div className="page-header__art" aria-hidden="true" />
    <div className="page-header__top">
      <div className="page-header__intro">
        <div className="page-header__title-block">
          <div className="page-header__glyph">
            <Icon />
          </div>
          <div className="page-header__copy">
            <p className="eyebrow eyebrow--light page-header__eyebrow">{eyebrow}</p>
            <h2 className="page-header__title">{title}</h2>
            {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
    {metricLabel || filters ? (
      <div className="page-header__toolbar">
        {metricLabel ? (
          <MetricCard
            caption={metricCaption}
            icon={metricIcon}
            label={metricLabel}
            tone={metricTone}
            value={metricValue}
          />
        ) : null}
        {filters ? (
          <div className={`page-header__filters ${filtersClassName}`.trim()}>{filters}</div>
        ) : null}
      </div>
    ) : null}
    {children ? <div className="page-header__footer">{children}</div> : null}
  </section>
);

export default PageHeader;
