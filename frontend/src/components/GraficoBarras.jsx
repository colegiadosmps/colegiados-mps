import HorizontalBarChart from "./HorizontalBarChart";

const GraficoBarras = ({ data, title, color = "#0b5f8f" }) => (
  <HorizontalBarChart color={color} data={data} title={title} />
);

export default GraficoBarras;
