import PowerBiTable from "./PowerBiTable";

const columns = [
  { key: "data_reuniao", label: "Data", width: "120px" },
  { key: "hora", label: "Horario", width: "100px" },
  { key: "sigla_colegiado", label: "Colegiado", width: "140px" },
  { key: "local", label: "Local", width: "220px", className: "cell-wrap" },
  { key: "classificacao_pauta", label: "Classificacao", width: "180px" },
  {
    key: "descricao_pauta",
    label: "Pauta",
    width: "320px",
    className: "cell-wrap",
  },
  { key: "status_reuniao", label: "Status", width: "160px" },
  { key: "quorum_registrado", label: "Quorum", width: "140px" },
];

const TabelaReunioes = ({ reunioes }) => (
  <PowerBiTable
    columns={columns}
    emptyMessage="Nenhuma reuniao encontrada para os filtros selecionados."
    rows={reunioes}
  />
);

export default TabelaReunioes;
