import FilterBox from "./FilterBox";

const FilterDropdown = ({ label, onChange, options, value }) => (
  <FilterBox label={label}>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </FilterBox>
);

export default FilterDropdown;
