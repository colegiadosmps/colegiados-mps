import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
  HiOutlineFolderOpen,
  HiOutlineXMark,
  HiOutlineUsers,
} from "react-icons/hi2";
import Loading from "../components/Loading";
import FilterBox from "../components/FilterBox";
import FilterDropdown from "../components/FilterDropdown";
import InstanciasColegiadasSection from "../components/InstanciasColegiadasSection";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import {
  formatBooleanStatus,
  formatColegiadoDisplayName,
  formatDate,
  formatTime,
} from "../services/formatters";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions } from "../services/filterUtils";

const membrosColumns = [
  { key: "nome_membro", label: "Nome", width: "220px" },
  { key: "papel", label: "Papel", width: "160px" },
  { key: "detalhamento_papel", label: "Detalhamento do Papel", width: "260px", className: "cell-wrap" },
  { key: "tipo_vinculo", label: "Vinculo", width: "140px" },
  { key: "sigla_colegiado_pai", label: "Unidade", width: "140px" },
];

const calendarioColumns = [
  {
    key: "id_reuniao",
    label: "Reuniao",
    width: "220px",
    className: "cell-wrap",
    render: (row) => row.id_reuniao || row.descricao_pauta || "-",
  },
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

const statItems = (colegiado, instanciasCount) =>
  [
    colegiado.tipo ? { label: "Tipo", value: colegiado.tipo } : null,
    { label: "Status", value: formatBooleanStatus(colegiado.ativo) },
    instanciasCount > 0
      ? {
          label: "Instancias colegiadas",
          value: `${instanciasCount} instancias colegiadas`,
        }
      : { label: "Membros", value: `${colegiado.membros?.length || 0} membros` },
    { label: "Reunioes", value: `${colegiado.reunioes?.length || 0} reunioes` },
  ].filter(Boolean);

const ModalSection = ({ children, onClose, title }) => (
  <>
    <button className="status-panel-backdrop" onClick={onClose} type="button" />
    <section className="app-modal">
      <div className="app-modal__header">
        <h3>{title}</h3>
        <button className="app-modal__close" onClick={onClose} type="button">
          <HiOutlineXMark />
        </button>
      </div>
      <div className="app-modal__body">{children}</div>
      <div className="app-modal__footer">
        <button className="text-button" onClick={onClose} type="button">
          Fechar
        </button>
      </div>
    </section>
  </>
);

const ConsultaColegiado = () => {
  const { sigla } = useParams();
  const [colegiado, setColegiado] = useState(null);
  const [instanciasCount, setInstanciasCount] = useState(0);
  const [error, setError] = useState("");
  const [activeModal, setActiveModal] = useState("");
  const [memberFilters, setMemberFilters] = useState({
    search: "",
    papel: ALL_VALUE,
    vinculo: ALL_VALUE,
    status: ALL_VALUE,
  });
  const [calendarFilters, setCalendarFilters] = useState({
    reuniao: "",
    local: "",
    data: "",
    horario: "",
    status: "",
  });

  useEffect(() => {
    api
      .get(`/api/colegiados/${sigla}`)
      .then(setColegiado)
      .catch((requestError) => setError(requestError.message));
  }, [sigla]);

  useEffect(() => {
    setInstanciasCount(0);

    api
      .get(`/api/colegiados/${sigla}/instancias`)
      .then((payload) => setInstanciasCount(payload?.total || 0))
      .catch(() => setInstanciasCount(0));
  }, [sigla]);

  const stats = useMemo(
    () => (colegiado ? statItems(colegiado, instanciasCount) : []),
    [colegiado, instanciasCount],
  );
  const resumoGeral = useMemo(() => {
    if (!colegiado) {
      return [];
    }

    return [
      ["Data de Instituicao", formatDate(colegiado.data_instituicao)],
      ["Data de Termino", formatDate(colegiado.data_termino)],
      ["Quantidade minima de reunioes anuais", colegiado.qtd_min_reunioes_anuais],
      ["Regra de Quorum", colegiado.regra_quorum],
      ["Colegiado Pai", formatColegiadoDisplayName(colegiado.sigla_colegiado_pai)],
      ["Unidade", colegiado.unidade],
      ["Observacoes", colegiado.observacoes],
    ].filter(([, value]) => value && value !== "-" && value !== "Nao informado");
  }, [colegiado]);
  const filteredMembers = useMemo(() => {
    if (!colegiado?.membros) {
      return [];
    }

    const search = memberFilters.search.toLowerCase();
    return colegiado.membros.filter((item) => {
      const matchesSearch =
        !search ||
        [item.nome_membro, item.papel, item.detalhamento_papel, item.sigla_colegiado_pai]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      const matchesPapel = memberFilters.papel === ALL_VALUE || item.papel === memberFilters.papel;
      const matchesVinculo =
        memberFilters.vinculo === ALL_VALUE || item.tipo_vinculo === memberFilters.vinculo;
      const matchesStatus =
        memberFilters.status === ALL_VALUE ||
        formatBooleanStatus(item.ativo) === memberFilters.status;
      return matchesSearch && matchesPapel && matchesVinculo && matchesStatus;
    });
  }, [colegiado?.membros, memberFilters]);
  const filteredCalendar = useMemo(() => {
    if (!colegiado?.reunioes) {
      return [];
    }

    const reuniaoSearch = calendarFilters.reuniao.trim().toLowerCase();
    const localSearch = calendarFilters.local.trim().toLowerCase();
    const dataSearch = calendarFilters.data.trim().toLowerCase();
    const horarioSearch = calendarFilters.horario.trim().toLowerCase();
    const statusSearch = calendarFilters.status.trim().toLowerCase();

    return colegiado.reunioes.filter((item) => {
      const reuniaoValue = String(item.id_reuniao || item.descricao_pauta || "-").toLowerCase();
      const localValue = String(item.local || "-").toLowerCase();
      const dataValue = String(formatDate(item.data_reuniao) || "-").toLowerCase();
      const horarioValue = String(formatTime(item.hora) || "-").toLowerCase();
      const statusValue = String(item.status_reuniao || "-").toLowerCase();

      const matchesReuniao = !reuniaoSearch || reuniaoValue.includes(reuniaoSearch);
      const matchesLocal = !localSearch || localValue.includes(localSearch);
      const matchesData = !dataSearch || dataValue.includes(dataSearch);
      const matchesHorario = !horarioSearch || horarioValue.includes(horarioSearch);
      const matchesStatus = !statusSearch || statusValue.includes(statusSearch);

      return (
        matchesReuniao &&
        matchesLocal &&
        matchesData &&
        matchesHorario &&
        matchesStatus
      );
    });
  }, [calendarFilters, colegiado?.reunioes]);

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
        subtitle={
          colegiado.nome &&
          colegiado.nome !== colegiado.sigla &&
          colegiado.nome !== colegiado.sigla_exibicao
            ? colegiado.nome
            : "Detalhamento estrutural do colegiado selecionado."
        }
        title={formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}
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

      <section className="detail-grid">
        <article className="detail-panel detail-panel--wide">
          <h3>Competencias</h3>
          <div className="detail-value">
            {colegiado.competencia || "Competencias nao cadastradas na base."}
          </div>
        </article>
        <article className="detail-panel detail-panel--wide">
          <h3>Ato de Criacao</h3>
          <div className="detail-value">
            {colegiado.ato_criacao || "Ato de criacao nao cadastrado na base."}
          </div>
        </article>
        <article className="detail-panel detail-panel--wide">
          <h3>Resumo Geral</h3>
          {resumoGeral.length ? (
            <div className="status-panel__list">
              {resumoGeral.map(([label, value]) => (
                <p key={label}>
                  <strong>{label}:</strong> {value}
                </p>
              ))}
            </div>
          ) : (
            <div className="detail-value">Resumo geral nao cadastrado na base.</div>
          )}
        </article>
      </section>

      <section className="cards-list">
        <button className="action-tile" onClick={() => setActiveModal("membros")} type="button">
          <HiOutlineUsers />
          <strong>Membros</strong>
          <span>Listar apenas integrantes vinculados a este colegiado.</span>
          <em>Abrir lista de membros</em>
        </button>
        <button className="action-tile" onClick={() => setActiveModal("calendario")} type="button">
          <HiOutlineCalendarDays />
          <strong>Calendario de Reunioes</strong>
          <span>Consultar local, data, horario e status das reunioes.</span>
          <em>Abrir calendario</em>
        </button>
        <button className="action-tile" onClick={() => setActiveModal("publicacoes")} type="button">
          <HiOutlineFolderOpen />
          <strong>Publicacoes</strong>
          <span>Listar arquivos e pastas de publicacoes do colegiado.</span>
          <em>Abrir publicacoes</em>
        </button>
      </section>

      <InstanciasColegiadasSection sigla={colegiado.sigla} />

      {activeModal === "membros" ? (
        <ModalSection
          onClose={() => setActiveModal("")}
          title={`Membros de ${formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}`}
        >
          <div className="modal-filters">
            <FilterBox label="Busca">
              <input
                onChange={(event) =>
                  setMemberFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Buscar por nome, papel ou unidade"
                value={memberFilters.search}
              />
            </FilterBox>
            <FilterDropdown
              label="Papel"
              onChange={(value) => setMemberFilters((current) => ({ ...current, papel: value }))}
              options={buildOptions((colegiado.membros || []).map((item) => item.papel))}
              value={memberFilters.papel}
            />
            <FilterDropdown
              label="Vinculo"
              onChange={(value) =>
                setMemberFilters((current) => ({ ...current, vinculo: value }))
              }
              options={buildOptions((colegiado.membros || []).map((item) => item.tipo_vinculo))}
              value={memberFilters.vinculo}
            />
            <FilterDropdown
              label="Status"
              onChange={(value) => setMemberFilters((current) => ({ ...current, status: value }))}
              options={buildOptions((colegiado.membros || []).map((item) => formatBooleanStatus(item.ativo)))}
              value={memberFilters.status}
            />
            <button
              className="clear-filters-button"
              onClick={() =>
                setMemberFilters({
                  search: "",
                  papel: ALL_VALUE,
                  vinculo: ALL_VALUE,
                  status: ALL_VALUE,
                })
              }
              type="button"
            >
              Limpar filtros
            </button>
          </div>
          <PowerBiTable
            columns={[
              ...membrosColumns,
              {
                key: "ativo",
                label: "Status",
                width: "120px",
                render: (row) => (
                  <span className={`badge ${row.ativo === "Sim" ? "success" : "danger"}`}>
                    {formatBooleanStatus(row.ativo)}
                  </span>
                ),
              },
            ]}
            emptyMessage="Nenhum membro encontrado para este colegiado."
            rows={filteredMembers}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </ModalSection>
      ) : null}

      {activeModal === "calendario" ? (
        <ModalSection
          onClose={() => setActiveModal("")}
          title={`Calendario de Reunioes de ${formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}`}
        >
          <div className="modal-filters">
            <FilterBox label="Reuniao">
              <input
                onChange={(event) =>
                  setCalendarFilters((current) => ({ ...current, reuniao: event.target.value }))
                }
                placeholder="Buscar reuniao"
                value={calendarFilters.reuniao}
              />
            </FilterBox>
            <FilterBox label="Local">
              <input
                onChange={(event) =>
                  setCalendarFilters((current) => ({ ...current, local: event.target.value }))
                }
                placeholder="Buscar local"
                value={calendarFilters.local}
              />
            </FilterBox>
            <FilterBox label="Data">
              <input
                onChange={(event) =>
                  setCalendarFilters((current) => ({ ...current, data: event.target.value }))
                }
                placeholder="dd/mm/aaaa"
                value={calendarFilters.data}
              />
            </FilterBox>
            <FilterBox label="Horario">
              <input
                onChange={(event) =>
                  setCalendarFilters((current) => ({ ...current, horario: event.target.value }))
                }
                placeholder="hh:mm"
                value={calendarFilters.horario}
              />
            </FilterBox>
            <FilterBox label="Status">
              <input
                onChange={(event) =>
                  setCalendarFilters((current) => ({ ...current, status: event.target.value }))
                }
                placeholder="Buscar status"
                value={calendarFilters.status}
              />
            </FilterBox>
            <button
              className="clear-filters-button"
              onClick={() =>
                setCalendarFilters({
                  reuniao: "",
                  local: "",
                  data: "",
                  horario: "",
                  status: "",
                })
              }
              type="button"
            >
              Limpar
            </button>
          </div>
          <PowerBiTable
            columns={calendarioColumns}
            emptyMessage="Nenhuma reuniao encontrada para este colegiado."
            rows={filteredCalendar}
            sortable={false}
          />
        </ModalSection>
      ) : null}

      {activeModal === "publicacoes" ? (
        <ModalSection
          onClose={() => setActiveModal("")}
          title={`Publicacoes de ${formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}`}
        >
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
