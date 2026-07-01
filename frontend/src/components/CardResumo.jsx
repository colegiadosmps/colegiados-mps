import MetricCard from "./MetricCard";

const CardResumo = ({ caption, icone, titulo, tone, valor }) => (
  <MetricCard caption={caption} icon={icone} label={titulo} tone={tone} value={valor} />
);

export default CardResumo;
