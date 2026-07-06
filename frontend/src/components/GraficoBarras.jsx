import HorizontalBarChart from "./HorizontalBarChart";

const GraficoBarras = ({ data, expandedData, title, color = "#0b5f8f" }) => (
  <HorizontalBarChart color={color} data={data} expandedData={expandedData} title={title} />
);

export default GraficoBarras;
