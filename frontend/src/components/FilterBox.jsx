const FilterBox = ({ children, label }) => (
  <label className="filter-box">
    <span className="filter-box__label">{label}</span>
    {children}
  </label>
);

export default FilterBox;
