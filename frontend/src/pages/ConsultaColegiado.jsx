import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlineUsers,
} from "react-icons/hi2";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import { formatDate } from "../services/formatters";
import { api } from "../services/api";

const reunioesColumns = [
  { key: "id_reuniao", label: "Reuniao", width: "160px", render: (row) => row.id_reuniao || "-" },
  { key: "data_reuniao", label: "Data", width: "120px" },
  { key: "status_reuniao", label: "Status", width: "140px" },
];

const membrosColumns = [
  { key: "nome_membro", label: "Nome", width: "220px" },
  { key: "papel", label: "Papel", width: "160px" },
  { key: "detalhamento_papel", label: "Detalhamento do Papel", width: "260px", className: "cell-wrap" },
  { key: "tipo_vinculo", label: "Vinculo", width: "140px" },
  { key: "sigla_colegiado_pai", label: "Unidade", width: "140px" },
];

const calendarioColumns = [
  { key: "id_reuniao", label: "Reuniao", width: "160px", render: (row) => row.id_reuniao || "-" },
  { key: "local", label: "Local", width: "180px", className: "cell-wrap" },
  { key: "data_reuniao", label: "Data", width: "120px" },
  { key: "hora", label: "Horario", width: "100px" },
  { key: "status_reuniao", label: "Status", width: "140px" },
];

const publicacoesColumns = [
  { key: "nome_pasta", label: "Arquivo/Pasta", width: "220px" },
  {
    key: "link_pasta",
    label: "URL_OU_CAMINHO",
    width: "340px",
    className: "cell-url cell-wrap",
    render: (row) =>
      row.link_pasta ? (
        <a href={row.link_pasta} rel="noreferrer" target="_blank">
          {row.link_pasta}
        </a>
      ) : (
        "-"
      ),
  },
];

const summaryRows = (colegiado) => [
  ["Nome", colegiado.nome || "Nao informado"],
  ["Sigla", colegiado.sigla || "Nao informado"],
  ["Tipo", colegiado.tipo || "Nao informado"],
  ["Colegiado Pai", colegiado.sigla_colegiado_pai || "Nao informado"],
  ["Unidade", colegiado.unidade || "Nao informado"],
  ["Sigla Unidade Pai", colegiado.sigla_unidade_pai || "Nao informado"],
  ["Ato de Criacao", colegiado.ato_criacao || "Nao informado"],
  ["Data de Instituicao", colegiado.data_instituicao || "Nao informado"],
  ["Data de Termino", colegiado.data_termino || "Nao informado"],
  ["Quantidade minima de reunioes anuais", colegiado.qtd_min_reunioes_anuais || "Nao informado"],
  ["Regra de Quorum", colegiado.regra_quorum || "Nao informado"],
  ["Status", colegiado.ativo || "Nao informado"],
  ["Observacoes", colegiado.observacoes || "Nao informado"],
];

const statItems = (colegiado) => [
  { label: "Sigla", value: colegiado.sigla || "Nao informado" },
  { label: "Tipo", value: colegiado.tipo || "Nao informado" },
  { label: "Status", value: colegiado.ativo || "Nao informado" },
  { label: "Membros", value: `${colegiado.membros?.length || 0} membros` },
  { label: "Reunioes", value: `${colegiado.reunioes?.length || 0} reunioes` },
];

const ModalSection = ({ children, onClose, title }) => (
  <>
    <button className="status-panel-backdrop" onClick={onClose} type="button" />
    <section className="app-modal">
      <div className="app-modal__header">
        <h3>{title}</h3>
        <button className="text-button" onClick={onClose} type="button">
          Fechar
        </button>
      </div>
      <div className="app-modal__body">{children}</div>
    </section>
  </>
);

const ConsultaColegiado = () => {
  const { sigla } = useParams();
  const [colegiado, setColegiado] = useState(null);
  const [error, setError] = useState("");
  const [activeModal, setActiveModal] = useState("");

  useEffect(() => {
    api
      .get(`/api/colegiados/${sigla}`)
      .then(setColegiado)
      .catch((requestError) => setError(requestError.message));
  }, [sigla]);

  const summary = useMemo(() => {
    if (!colegiado) {
      return [];
    }
    return summaryRows(colegiado);
  }, [colegiado]);

  const stats = useMemo(() => (colegiado ? statItems(colegiado) : []), [colegiado]);

  if (error) {
    return <div className="empty-state">{error}</div>;
  }

  if (!colegiado) {
    return <Loading label={`Carregando detalhes de ${sigla}...`} />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={null}
        icon={HiOutlineClipboardDocumentList}
        subtitle="Detalhamento estrutural do colegiado selecionado, com modais para membros, reunioes, calendario e publicacoes."
        title={colegiado.nome}
      >
        <div className="detail-hero-stats">
          {stats.map((item) => (
            <div className="detail-hero-stats__item" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </PageHeader>

      <section className="detail-grid detail-grid--summary">
        {summary.map(([label, value]) => (
          <article className="detail-panel detail-panel--info" key={label}>
            <h3>{label}</h3>
            <div className="detail-value">
              {label.includes("Data") ? formatDate(value) : value || "Nao informado"}
            </div>
          </article>
        ))}
      </section>

      <section className="detail-grid">
        <article className="detail-panel detail-panel--wide">
          <h3>Competencias</h3>
          <div className="detail-value">
            {colegiado.competencia || colegiado.descricao || "Nao informado"}
          </div>
        </article>
        <article className="detail-panel detail-panel--wide">
          <h3>Resumo Legal</h3>
          <div className="status-panel__list">
            <p><strong>Ato de Criacao:</strong> {colegiado.ato_criacao || "Nao informado"}</p>
            <p><strong>Data de Instituicao:</strong> {colegiado.data_instituicao || "Nao informado"}</p>
            <p><strong>Data de Termino:</strong> {colegiado.data_termino || "Nao informado"}</p>
            <p><strong>Quantidade minima de reunioes anuais:</strong> {colegiado.qtd_min_reunioes_anuais || "Nao informado"}</p>
            <p><strong>Regra de Quorum:</strong> {colegiado.regra_quorum || "Nao informado"}</p>
            <p><strong>Status:</strong> {colegiado.ativo || "Nao informado"}</p>
            <p><strong>Observacoes:</strong> {colegiado.observacoes || "Nao informado"}</p>
          </div>
        </article>
      </section>

      <section className="cards-list">
        <button className="action-tile" onClick={() => setActiveModal("reunioes")} type="button">
          <HiOutlineDocumentText />
          <strong>Reunioes</strong>
          <span>Visualizar reunioes vinculadas a {colegiado.sigla}.</span>
        </button>
        <button className="action-tile" onClick={() => setActiveModal("membros")} type="button">
          <HiOutlineUsers />
          <strong>Membros</strong>
          <span>Listar apenas integrantes vinculados a este colegiado.</span>
        </button>
        <button className="action-tile" onClick={() => setActiveModal("calendario")} type="button">
          <HiOutlineCalendarDays />
          <strong>Calendario de Reunioes</strong>
          <span>Consultar local, data, horario e status das reunioes.</span>
        </button>
        <button className="action-tile" onClick={() => setActiveModal("publicacoes")} type="button">
          <HiOutlineFolderOpen />
          <strong>Publicacoes</strong>
          <span>Listar arquivos e pastas de publicacoes do colegiado.</span>
        </button>
      </section>

      {activeModal === "reunioes" ? (
        <ModalSection onClose={() => setActiveModal("")} title={`Reunioes de ${colegiado.sigla}`}>
          <PowerBiTable
            columns={reunioesColumns}
            emptyMessage="Nenhuma reuniao encontrada para este colegiado."
            rows={colegiado.reunioes || []}
          />
        </ModalSection>
      ) : null}

      {activeModal === "membros" ? (
        <ModalSection onClose={() => setActiveModal("")} title={`Membros de ${colegiado.sigla}`}>
          <PowerBiTable
            columns={membrosColumns}
            emptyMessage="Nenhum membro encontrado para este colegiado."
            rows={colegiado.membros || []}
          />
        </ModalSection>
      ) : null}

      {activeModal === "calendario" ? (
        <ModalSection onClose={() => setActiveModal("")} title={`Calendario de Reunioes de ${colegiado.sigla}`}>
          <PowerBiTable
            columns={calendarioColumns}
            emptyMessage="Nenhuma reuniao encontrada para este colegiado."
            rows={colegiado.reunioes || []}
          />
        </ModalSection>
      ) : null}

      {activeModal === "publicacoes" ? (
        <ModalSection onClose={() => setActiveModal("")} title={`Publicacoes de ${colegiado.sigla}`}>
          <PowerBiTable
            columns={publicacoesColumns}
            emptyMessage="Nenhuma publicacao encontrada para este colegiado."
            rows={colegiado.publicacoes || []}
          />
        </ModalSection>
      ) : null}
    </div>
  );
};

export default ConsultaColegiado;
