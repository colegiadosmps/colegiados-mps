import { LuEraser } from "react-icons/lu";

const ClearFiltersButton = ({ onClick }) => (
  <button className="clear-filters-button" onClick={onClick} type="button">
    <LuEraser />
    <span>Limpar</span>
  </button>
);

export default ClearFiltersButton;
