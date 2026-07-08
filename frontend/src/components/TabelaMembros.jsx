import PowerBiTable from "./PowerBiTable";
import {
  formatBooleanStatus,
  formatColegiadoDisplayName,
} from "../services/formatters";

const buildColumns = (extraColumns = []) => [
  { key: "nome_membro", label: "Nome", width: "220px" },
  {
    key: "sigla_colegiado",
    label: "Colegiado",
    width: "160px",
    render: (membro) => formatColegiadoDisplayName(membro.sigla_colegiado),
  },
  { key: "tipo_vinculo", label: "Tipo de Vinculo", width: "170px" },
  { key: "papel", label: "Papel", width: "160px" },
  {
    key: "detalhamento_papel",
    label: "Detalhamento do Papel",
    className: "cell-wrap",
    width: "280px",
  },
  { key: "inicio_vigencia", label: "Inicio", width: "120px" },
  { key: "fim_vigencia", label: "Fim", width: "120px" },
  {
    key: "ativo",
    label: "Status",
    width: "120px",
    render: (membro) => (
      <span className={`badge ${membro.ativo === "Sim" ? "success" : "danger"}`}>
        {formatBooleanStatus(membro.ativo)}
      </span>
    ),
  },
  ...extraColumns,
];

const TabelaMembros = ({ membros, extraColumns = [] }) => (
  <PowerBiTable
    columns={buildColumns(extraColumns)}
    emptyMessage="Nenhum integrante encontrado para os filtros selecionados."
    rowsPerPageOptions={[10, 25, 50]}
    rows={membros}
    sortable={false}
  />
);

export default TabelaMembros;
