import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
  HiOutlineFolderOpen,
  HiOutlinePauseCircle,
  HiOutlinePencilSquare,
  HiOutlinePlayCircle,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineUsers,
} from "react-icons/hi2";
import EditFormModal from "../components/EditFormModal";
import DateInputField from "../components/DateInputField";
import Loading from "../components/Loading";
import FilterBox from "../components/FilterBox";
import FilterDropdown from "../components/FilterDropdown";
import InstanciasColegiadasSection from "../components/InstanciasColegiadasSection";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import EmptyStatePanel from "../components/common/EmptyStatePanel";
import { useAuthSession } from "../context/AuthSessionContext";
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
  { key: "tipo", label: "Tipo", width: "140px" },
  { key: "numero", label: "Numero", width: "120px" },
  { key: "data_publicacao", label: "Data", width: "120px" },
  { key: "ano", label: "Ano", width: "100px" },
  {
    key: "assunto",
    label: "Assunto",
    width: "260px",
    className: "cell-wrap",
    render: (row) => row.assunto || row.nome_pasta || "-",
  },
  {
    key: "link_pasta",
    label: "Link",
    width: "280px",
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
  { key: "status", label: "Status", width: "120px" },
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

const sortByName = (items, key) =>
  [...items].sort((left, right) =>
    String(left[key] || "").localeCompare(String(right[key] || ""), "pt-BR"),
  );

const sortReunioes = (items) =>
  [...items].sort((left, right) => {
    const leftDate = String(left.data_reuniao || "");
    const rightDate = String(right.data_reuniao || "");
    if (leftDate !== rightDate) {
      return rightDate.localeCompare(leftDate);
    }
    return String(right.hora || "").localeCompare(String(left.hora || ""), "pt-BR");
  });

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
  const { canEditContent, token, user } = useAuthSession();
  const [colegiado, setColegiado] = useState(null);
  const [instanciasCount, setInstanciasCount] = useState(0);
  const [instanciasRefreshKey, setInstanciasRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [activeModal, setActiveModal] = useState("");
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [contentEditor, setContentEditor] = useState({ type: "", record: null });
  const [contentEditorError, setContentEditorError] = useState("");
  const [contentSaving, setContentSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: "", record: null });
  const [deletingContent, setDeletingContent] = useState(false);
  const [deletingColegiado, setDeletingColegiado] = useState(false);
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
  const [publicationFilters, setPublicationFilters] = useState({
    tipo: "",
    numero: "",
    data: "",
    ano: "",
    assunto: "",
  });

  const loadColegiado = () =>
    api
      .get(`/api/colegiados/${sigla}`)
      .then(setColegiado)
      .catch((requestError) => setError(requestError.message));

  useEffect(() => {
    loadColegiado();
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
  const filteredPublicacoes = useMemo(() => {
    if (!colegiado?.publicacoes) {
      return [];
    }

    const tipoSearch = publicationFilters.tipo.trim().toLowerCase();
    const numeroSearch = publicationFilters.numero.trim().toLowerCase();
    const dataSearch = publicationFilters.data.trim().toLowerCase();
    const anoSearch = publicationFilters.ano.trim().toLowerCase();
    const assuntoSearch = publicationFilters.assunto.trim().toLowerCase();

    return colegiado.publicacoes.filter((item) => {
      const tipoValue = String(item.tipo || "-").toLowerCase();
      const numeroValue = String(item.numero || "-").toLowerCase();
      const dataValue = String(formatDate(item.data_publicacao) || "-").toLowerCase();
      const anoValue = String(item.ano || "-").toLowerCase();
      const assuntoValue = String(item.assunto || item.nome_pasta || "-").toLowerCase();

      return (
        (!tipoSearch || tipoValue.includes(tipoSearch)) &&
        (!numeroSearch || numeroValue.includes(numeroSearch)) &&
        (!dataSearch || dataValue.includes(dataSearch)) &&
        (!anoSearch || anoValue.includes(anoSearch)) &&
        (!assuntoSearch || assuntoValue.includes(assuntoSearch))
      );
    });
  }, [colegiado?.publicacoes, publicationFilters]);

  const handleDeleteContent = async (type, row) => {
    const routeMap = {
      membro: `/api/membros/${row.id}`,
      reuniao: `/api/reunioes/${row.id}`,
      publicacao: `/api/publicacoes/${row.id}`,
    };

    setDeletingContent(true);
    try {
      await api.delete(routeMap[type], {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await loadColegiado();
      setDeleteTarget({ type: "", record: null });
    } catch (requestError) {
      setContentEditorError(requestError.message);
      setContentEditor({ type, record: row });
    } finally {
      setDeletingContent(false);
    }
  };

  const memberActionColumns = useMemo(() => {
    if (!canEditContent) {
      return [];
    }

    return [
      {
        key: "acoes",
        label: "Acoes",
        width: "176px",
        render: (row) => (
          <div className="table-row-actions table-row-actions--compact">
            <button
              aria-label={`Editar membro ${row.nome_membro}`}
              className="icon-button--edit"
              onClick={() => {
                setContentEditor({ type: "membro", record: row });
                setContentEditorError("");
              }}
              type="button"
            >
              <HiOutlinePencilSquare />
            </button>
            <button
              aria-label={row.ativo === "Sim" ? `Inativar membro ${row.nome_membro}` : `Reativar membro ${row.nome_membro}`}
              className="icon-button--toggle"
              onClick={async () => {
                try {
                  await api.put(
                    `/api/membros/${row.id}`,
                    { ...row, ativo: row.ativo === "Sim" ? "Nao" : "Sim" },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  );
                  await loadColegiado();
                } catch (requestError) {
                  setContentEditorError(requestError.message);
                  setContentEditor({ type: "membro", record: row });
                }
              }}
              title={row.ativo === "Sim" ? "Inativar" : "Reativar"}
              type="button"
            >
              {row.ativo === "Sim" ? <HiOutlinePauseCircle /> : <HiOutlinePlayCircle />}
            </button>
            <button
              aria-label={`Excluir membro ${row.nome_membro}`}
              className="icon-button--delete"
              onClick={() => setDeleteTarget({ type: "membro", record: row })}
              type="button"
            >
              <HiOutlineTrash />
            </button>
          </div>
        ),
      },
    ];
  }, [canEditContent, token]);

  const meetingActionColumns = useMemo(() => {
    if (!canEditContent) {
      return [];
    }

    return [
      {
        key: "acoes",
        label: "Acoes",
        width: "176px",
        render: (row) => (
          <div className="table-row-actions table-row-actions--compact">
            <button
              aria-label={`Editar reuniao ${row.id_reuniao}`}
              className="icon-button--edit"
              onClick={() => {
                setContentEditor({ type: "reuniao", record: row });
                setContentEditorError("");
              }}
              type="button"
            >
              <HiOutlinePencilSquare />
            </button>
            <button
              aria-label={row.status_reuniao === "Cancelada" ? `Reativar reuniao ${row.id_reuniao}` : `Cancelar reuniao ${row.id_reuniao}`}
              className="icon-button--toggle"
              onClick={async () => {
                try {
                  await api.put(
                    `/api/reunioes/${row.id}`,
                    {
                      ...row,
                      status_reuniao:
                        row.status_reuniao === "Cancelada" ? "Planejada" : "Cancelada",
                    },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  );
                  await loadColegiado();
                } catch (requestError) {
                  setContentEditorError(requestError.message);
                  setContentEditor({ type: "reuniao", record: row });
                }
              }}
              title={row.status_reuniao === "Cancelada" ? "Reativar" : "Cancelar"}
              type="button"
            >
              {row.status_reuniao === "Cancelada" ? <HiOutlinePlayCircle /> : <HiOutlinePauseCircle />}
            </button>
            <button
              aria-label={`Excluir reuniao ${row.id_reuniao}`}
              className="icon-button--delete"
              onClick={() => setDeleteTarget({ type: "reuniao", record: row })}
              type="button"
            >
              <HiOutlineTrash />
            </button>
          </div>
        ),
      },
    ];
  }, [canEditContent, token]);

  const publicationActionColumns = useMemo(() => {
    if (!canEditContent) {
      return [];
    }

    return [
      {
        key: "acoes",
        label: "Acoes",
        width: "176px",
        render: (row) => (
          <div className="table-row-actions table-row-actions--compact">
            <button
              aria-label={`Editar publicacao ${row.nome_pasta}`}
              className="icon-button--edit"
              onClick={() => {
                setContentEditor({ type: "publicacao", record: row });
                setContentEditorError("");
              }}
              type="button"
            >
              <HiOutlinePencilSquare />
            </button>
            <button
              aria-label={row.status === "Inativo" ? `Reativar publicacao ${row.nome_pasta}` : `Inativar publicacao ${row.nome_pasta}`}
              className="icon-button--toggle"
              onClick={async () => {
                try {
                  await api.put(
                    `/api/publicacoes/${row.id}`,
                    { ...row, status: row.status === "Inativo" ? "Ativo" : "Inativo" },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  );
                  await loadColegiado();
                } catch (requestError) {
                  setContentEditorError(requestError.message);
                  setContentEditor({ type: "publicacao", record: row });
                }
              }}
              title={row.status === "Inativo" ? "Reativar" : "Inativar"}
              type="button"
            >
              {row.status === "Inativo" ? <HiOutlinePlayCircle /> : <HiOutlinePauseCircle />}
            </button>
            <button
              aria-label={`Excluir publicacao ${row.nome_pasta}`}
              className="icon-button--delete"
              onClick={() => setDeleteTarget({ type: "publicacao", record: row })}
              type="button"
            >
              <HiOutlineTrash />
            </button>
          </div>
        ),
      },
    ];
  }, [canEditContent, token]);

  const handleSaveContentEditor = async (event) => {
    event.preventDefault();
    setContentSaving(true);
    setContentEditorError("");

    try {
      const formData = new FormData(event.currentTarget);
      const options = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (contentEditor.type === "membro") {
        const payload = {
          nome_membro: formData.get("nome_membro"),
          sigla_colegiado: colegiado.sigla,
          unidade: formData.get("unidade"),
          tipo_vinculo: formData.get("tipo_vinculo"),
          papel: formData.get("papel"),
          detalhamento_papel: formData.get("detalhamento_papel"),
          inicio_vigencia: formData.get("inicio_vigencia"),
          fim_vigencia: formData.get("fim_vigencia"),
          email_institucional: formData.get("email_institucional"),
          telefone_institucional: formData.get("telefone_institucional"),
          ativo: formData.get("ativo"),
          observacao: formData.get("observacao"),
          sigla_colegiado_pai: colegiado.sigla_colegiado_pai || "",
        };

        const result = contentEditor.record?.id
          ? await api.put(`/api/membros/${contentEditor.record.id}`, payload, options)
          : await api.post("/api/membros", payload, options);
        const savedMembro = result?.membro;

        if (savedMembro) {
          setColegiado((current) =>
            current
              ? {
                  ...current,
                  membros: contentEditor.record?.id
                    ? sortByName(
                        current.membros.map((item) =>
                          item.id === contentEditor.record.id ? { ...item, ...savedMembro } : item,
                        ),
                        "nome_membro",
                      )
                    : sortByName([...(current.membros || []), savedMembro], "nome_membro"),
                }
              : current,
          );
        }
      }

      if (contentEditor.type === "reuniao") {
        const payload = {
          id_reuniao: formData.get("id_reuniao"),
          sigla_colegiado: colegiado.sigla,
          data_reuniao: formData.get("data_reuniao"),
          hora: formData.get("hora"),
          local: formData.get("local"),
          classificacao_pauta: formData.get("classificacao_pauta"),
          descricao_pauta: formData.get("descricao_pauta"),
          texto_ata: formData.get("texto_ata"),
          status_reuniao: formData.get("status_reuniao"),
          quorum_registrado: formData.get("quorum_registrado"),
          link_ata: formData.get("link_ata"),
          observacao: formData.get("observacao"),
        };

        const result = contentEditor.record?.id
          ? await api.put(`/api/reunioes/${contentEditor.record.id}`, payload, options)
          : await api.post("/api/reunioes", payload, options);
        const savedReuniao = result?.reuniao;

        if (savedReuniao) {
          setColegiado((current) =>
            current
              ? {
                  ...current,
                  reunioes: contentEditor.record?.id
                    ? sortReunioes(
                        current.reunioes.map((item) =>
                          item.id === contentEditor.record.id ? { ...item, ...savedReuniao } : item,
                        ),
                      )
                    : sortReunioes([...(current.reunioes || []), savedReuniao]),
                }
              : current,
          );
        }
      }

      if (contentEditor.type === "publicacao") {
        const payload = {
          sigla_colegiado: colegiado.sigla,
          nome_pasta: formData.get("nome_pasta"),
          tipo: formData.get("tipo"),
          numero: formData.get("numero"),
          data_publicacao: formData.get("data_publicacao"),
          ano: formData.get("ano"),
          assunto: formData.get("assunto"),
          link_pasta: formData.get("link_pasta"),
          status: formData.get("status"),
          observacao: formData.get("observacao"),
        };

        const result = contentEditor.record?.id
          ? await api.put(`/api/publicacoes/${contentEditor.record.id}`, payload, options)
          : await api.post("/api/publicacoes", payload, options);
        const savedPublicacao = result?.publicacao;

        if (savedPublicacao) {
          setColegiado((current) =>
            current
              ? {
                  ...current,
                  publicacoes: contentEditor.record?.id
                    ? sortByName(
                        current.publicacoes.map((item) =>
                          item.id === contentEditor.record.id ? { ...item, ...savedPublicacao } : item,
                        ),
                        "nome_pasta",
                      )
                    : sortByName([...(current.publicacoes || []), savedPublicacao], "nome_pasta"),
                }
              : current,
          );
        }
      }
      setContentEditor({ type: "", record: null });
    } catch (requestError) {
      setContentEditorError(requestError.message);
    } finally {
      setContentSaving(false);
    }
  };

  if (error) {
    return <EmptyStatePanel animation="error" message={error} title="Falha ao carregar colegiado" />;
  }

  if (!colegiado) {
    return <Loading label={`Carregando detalhes de ${sigla}...`} />;
  }

  return (
    <div className="page-content">
      <PageHeader
        actions={
          canEditContent ? (
            <div className="table-row-actions">
              <button
                aria-label="Editar"
                className="icon-button--edit"
                onClick={() => setActiveModal("editar-colegiado")}
                title="Editar"
                type="button"
              >
                <HiOutlinePencilSquare />
              </button>
              <button
                aria-label="Excluir"
                className="icon-button--delete"
                onClick={() => setDeleteTarget({ type: "colegiado", record: colegiado })}
                title="Excluir"
                type="button"
              >
                <HiOutlineTrash />
              </button>
              <button
                aria-label={colegiado.ativo === "Sim" ? "Inativar" : "Reativar"}
                className="icon-button--toggle"
                onClick={async () => {
                  try {
                    await api.put(
                      `/api/colegiados/${colegiado.sigla}`,
                      { ...colegiado, ativo: colegiado.ativo === "Sim" ? "Nao" : "Sim" },
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      },
                    );
                    await loadColegiado();
                  } catch (requestError) {
                    setEditorError(requestError.message);
                  }
                }}
                title={colegiado.ativo === "Sim" ? "Inativar" : "Reativar"}
                type="button"
              >
                {colegiado.ativo === "Sim" ? <HiOutlinePauseCircle /> : <HiOutlinePlayCircle />}
              </button>
            </div>
          ) : null
        }
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

      <InstanciasColegiadasSection
        onAddInstance={canEditContent ? () => setActiveModal("nova-instancia") : null}
        refreshKey={instanciasRefreshKey}
        sigla={colegiado.sigla}
      />

      {activeModal === "membros" ? (
        <ModalSection
          onClose={() => setActiveModal("")}
          title={`Membros de ${formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}`}
        >
          {canEditContent ? (
            <div className="section-heading">
              <div>
                <h3>Edicao de membros</h3>
                <p>O perfil autenticado pode incluir, editar e inativar membros deste colegiado.</p>
              </div>
              <button
                className="success-button"
                onClick={() => {
                  setContentEditor({ type: "membro", record: null });
                  setContentEditorError("");
                }}
                type="button"
              >
                Adicionar membro
              </button>
            </div>
          ) : null}
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
              ...memberActionColumns,
            ]}
            emptyMessage="Nenhum membro encontrado para este colegiado."
            rows={filteredMembers}
            rowsPerPageOptions={[10, 25, 50]}
            sortable={false}
          />
        </ModalSection>
      ) : null}

      {activeModal === "calendario" ? (
        <ModalSection
          onClose={() => setActiveModal("")}
          title={`Calendario de Reunioes de ${formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}`}
        >
          {canEditContent ? (
            <div className="section-heading">
              <div>
                <h3>Edicao de reunioes</h3>
                <p>O perfil autenticado pode cadastrar, editar e cancelar reunioes deste colegiado.</p>
              </div>
              <button
                className="success-button"
                onClick={() => {
                  setContentEditor({ type: "reuniao", record: null });
                  setContentEditorError("");
                }}
                type="button"
              >
                Adicionar reuniao
              </button>
            </div>
          ) : null}
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
            columns={[...calendarioColumns, ...meetingActionColumns]}
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
          {canEditContent ? (
            <div className="section-heading">
              <div>
                <h3>Edicao de publicacoes</h3>
                <p>O perfil autenticado pode incluir, editar e inativar publicacoes deste colegiado.</p>
              </div>
              <button
                className="success-button"
                onClick={() => {
                  setContentEditor({ type: "publicacao", record: null });
                  setContentEditorError("");
                }}
                type="button"
              >
                Adicionar publicacao
              </button>
            </div>
          ) : null}
          <div className="modal-filters">
            <FilterBox label="Tipo">
              <input
                onChange={(event) =>
                  setPublicationFilters((current) => ({ ...current, tipo: event.target.value }))
                }
                placeholder="Buscar tipo"
                value={publicationFilters.tipo}
              />
            </FilterBox>
            <FilterBox label="Numero">
              <input
                onChange={(event) =>
                  setPublicationFilters((current) => ({ ...current, numero: event.target.value }))
                }
                placeholder="Buscar numero"
                value={publicationFilters.numero}
              />
            </FilterBox>
            <FilterBox label="Data">
              <input
                onChange={(event) =>
                  setPublicationFilters((current) => ({ ...current, data: event.target.value }))
                }
                placeholder="dd/mm/aaaa"
                value={publicationFilters.data}
              />
            </FilterBox>
            <FilterBox label="Ano">
              <input
                onChange={(event) =>
                  setPublicationFilters((current) => ({ ...current, ano: event.target.value }))
                }
                placeholder="2026"
                value={publicationFilters.ano}
              />
            </FilterBox>
            <FilterBox label="Assunto">
              <input
                onChange={(event) =>
                  setPublicationFilters((current) => ({ ...current, assunto: event.target.value }))
                }
                placeholder="Buscar assunto"
                value={publicationFilters.assunto}
              />
            </FilterBox>
            <button
              className="clear-filters-button"
              onClick={() =>
                setPublicationFilters({
                  tipo: "",
                  numero: "",
                  data: "",
                  ano: "",
                  assunto: "",
                })
              }
              type="button"
            >
              Limpar
            </button>
          </div>
          <PowerBiTable
            columns={[
              ...publicacoesColumns,
              ...publicationActionColumns,
            ]}
            emptyMessage="Nenhuma publicacao encontrada para este colegiado."
            rows={filteredPublicacoes}
            sortable={false}
          />
        </ModalSection>
      ) : null}

      {contentEditor.type ? (
        <EditFormModal
          onClose={() => {
            setContentEditor({ type: "", record: null });
            setContentEditorError("");
          }}
          title={
            contentEditor.type === "membro"
              ? contentEditor.record
                ? "Editar membro"
                : "Adicionar membro"
              : contentEditor.type === "reuniao"
                ? contentEditor.record
                  ? "Editar reuniao"
                  : "Adicionar reuniao"
                : contentEditor.record
                  ? "Editar publicacao"
                  : "Adicionar publicacao"
          }
        >
          <form className="form-grid" onSubmit={handleSaveContentEditor}>
            {contentEditor.type === "membro" ? (
              <>
                <label>
                  <span>Nome</span>
                  <input
                    defaultValue={contentEditor.record?.nome_membro || ""}
                    name="nome_membro"
                    required
                  />
                </label>
                <label>
                  <span>Papel</span>
                  <input defaultValue={contentEditor.record?.papel || ""} name="papel" />
                </label>
                <label>
                  <span>Vinculo</span>
                  <input
                    defaultValue={contentEditor.record?.tipo_vinculo || ""}
                    name="tipo_vinculo"
                  />
                </label>
                <label>
                  <span>Unidade</span>
                  <input defaultValue={contentEditor.record?.unidade || ""} name="unidade" />
                </label>
                <DateInputField
                  defaultValue={contentEditor.record?.inicio_vigencia || ""}
                  name="inicio_vigencia"
                  span="Inicio"
                />
                <DateInputField
                  defaultValue={contentEditor.record?.fim_vigencia || ""}
                  name="fim_vigencia"
                  span="Fim"
                />
                <label>
                  <span>Email</span>
                  <input
                    defaultValue={contentEditor.record?.email_institucional || ""}
                    name="email_institucional"
                    type="email"
                  />
                </label>
                <label>
                  <span>Telefone</span>
                  <input
                    defaultValue={contentEditor.record?.telefone_institucional || ""}
                    name="telefone_institucional"
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select defaultValue={contentEditor.record?.ativo || "Sim"} name="ativo">
                    <option value="Sim">Ativo</option>
                    <option value="Nao">Inativo</option>
                  </select>
                </label>
                <label className="form-grid__full">
                  <span>Detalhamento</span>
                  <textarea
                    defaultValue={contentEditor.record?.detalhamento_papel || ""}
                    name="detalhamento_papel"
                    rows="3"
                  />
                </label>
                <label className="form-grid__full">
                  <span>Observacao</span>
                  <textarea
                    defaultValue={contentEditor.record?.observacao || ""}
                    name="observacao"
                    rows="3"
                  />
                </label>
              </>
            ) : null}

            {contentEditor.type === "reuniao" ? (
              <>
                <label>
                  <span>Reuniao</span>
                  <input
                    defaultValue={contentEditor.record?.id_reuniao || ""}
                    name="id_reuniao"
                    required
                  />
                </label>
                <DateInputField
                  defaultValue={contentEditor.record?.data_reuniao || ""}
                  name="data_reuniao"
                  span="Data"
                />
                <label>
                  <span>Horario</span>
                  <input defaultValue={contentEditor.record?.hora || ""} name="hora" />
                </label>
                <label>
                  <span>Local</span>
                  <input defaultValue={contentEditor.record?.local || ""} name="local" />
                </label>
                <label>
                  <span>Status</span>
                  <select
                    defaultValue={contentEditor.record?.status_reuniao || "Planejada"}
                    name="status_reuniao"
                  >
                    <option value="Planejada">Planejada</option>
                    <option value="Realizada">Realizada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </label>
                <label>
                  <span>Quorum</span>
                  <input
                    defaultValue={contentEditor.record?.quorum_registrado || ""}
                    name="quorum_registrado"
                  />
                </label>
                <label>
                  <span>Classificacao da pauta</span>
                  <input
                    defaultValue={contentEditor.record?.classificacao_pauta || ""}
                    name="classificacao_pauta"
                  />
                </label>
                <label>
                  <span>Link da ata</span>
                  <input defaultValue={contentEditor.record?.link_ata || ""} name="link_ata" />
                </label>
                <label className="form-grid__full">
                  <span>Descricao da pauta</span>
                  <textarea
                    defaultValue={contentEditor.record?.descricao_pauta || ""}
                    name="descricao_pauta"
                    rows="3"
                  />
                </label>
                <label className="form-grid__full">
                  <span>Texto da ata</span>
                  <textarea
                    defaultValue={contentEditor.record?.texto_ata || ""}
                    name="texto_ata"
                    rows="4"
                  />
                </label>
                <label className="form-grid__full">
                  <span>Observacao</span>
                  <textarea
                    defaultValue={contentEditor.record?.observacao || ""}
                    name="observacao"
                    rows="3"
                  />
                </label>
              </>
            ) : null}

            {contentEditor.type === "publicacao" ? (
              <>
                <label>
                  <span>Tipo</span>
                  <select defaultValue={contentEditor.record?.tipo || "Resolucao"} name="tipo">
                    <option value="Decreto">Decreto</option>
                    <option value="Despacho">Despacho</option>
                    <option value="Despacho numerado">Despacho numerado</option>
                    <option value="Memorando">Memorando</option>
                    <option value="Minuta">Minuta</option>
                    <option value="Nota Tecnica">Nota Tecnica</option>
                    <option value="Oficio">Oficio</option>
                    <option value="Resolucao">Resolucao</option>
                  </select>
                </label>
                <label>
                  <span>Numero</span>
                  <input defaultValue={contentEditor.record?.numero || ""} name="numero" />
                </label>
                <DateInputField
                  defaultValue={contentEditor.record?.data_publicacao || ""}
                  name="data_publicacao"
                  span="Data"
                />
                <label>
                  <span>Ano</span>
                  <input defaultValue={contentEditor.record?.ano || ""} name="ano" />
                </label>
                <label>
                  <span>Status</span>
                  <select defaultValue={contentEditor.record?.status || "Ativo"} name="status">
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </label>
                <label className="form-grid__full">
                  <span>Titulo</span>
                  <input
                    defaultValue={contentEditor.record?.nome_pasta || ""}
                    name="nome_pasta"
                    required
                  />
                </label>
                <label className="form-grid__full">
                  <span>Assunto</span>
                  <textarea
                    defaultValue={contentEditor.record?.assunto || ""}
                    name="assunto"
                    rows="3"
                  />
                </label>
                <label className="form-grid__full">
                  <span>Link</span>
                  <input defaultValue={contentEditor.record?.link_pasta || ""} name="link_pasta" />
                </label>
                <label className="form-grid__full">
                  <span>Observacao</span>
                  <textarea
                    defaultValue={contentEditor.record?.observacao || ""}
                    name="observacao"
                    rows="3"
                  />
                </label>
              </>
            ) : null}

            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                Alteracao registrada para {user?.primeiroNome || "usuario autenticado"}.
              </span>
              <button className="primary-button" disabled={contentSaving} type="submit">
                {contentSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
            {contentEditorError ? (
              <div className="inline-message danger-text">{contentEditorError}</div>
            ) : null}
          </form>
        </EditFormModal>
      ) : null}

      {["editar-colegiado", "nova-instancia"].includes(activeModal) ? (
        <EditFormModal
          onClose={() => {
            setActiveModal("");
            setEditorError("");
          }}
          title={
            activeModal === "editar-colegiado"
              ? `Editar colegiado ${formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}`
              : "Adicionar nova instancia"
          }
        >
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setEditorError("");

              try {
                const formData = new FormData(event.currentTarget);
                const tipoVinculo = formData.get("tipo_vinculo");
                const payload = {
                  categoria: "Interno",
                  sigla: activeModal === "editar-colegiado" ? colegiado.sigla : formData.get("sigla"),
                  sigla_exibicao: formData.get("sigla_exibicao"),
                  nome: formData.get("nome"),
                  tipo:
                    activeModal === "nova-instancia"
                      ? tipoVinculo === "Colegiado filho"
                        ? formData.get("tipo")
                        : "Instancia colegiada"
                      : formData.get("tipo"),
                  sigla_colegiado_pai:
                    activeModal === "editar-colegiado"
                      ? formData.get("sigla_colegiado_pai")
                      : colegiado.sigla,
                  unidade: formData.get("unidade"),
                  sigla_unidade_pai: formData.get("sigla_unidade_pai"),
                  ato_criacao: formData.get("ato_criacao"),
                  data_instituicao: formData.get("data_instituicao"),
                  data_termino: formData.get("data_termino"),
                  qtd_min_reunioes_anuais: formData.get("qtd_min_reunioes_anuais"),
                  regra_quorum: formData.get("regra_quorum"),
                  competencia: formData.get("competencia"),
                  observacoes: formData.get("observacoes"),
                  ativo: formData.get("ativo"),
                  municipio: formData.get("municipio"),
                  uf: formData.get("uf"),
                  estado: formData.get("estado"),
                };

                const options = {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                };

                const result =
                  activeModal === "editar-colegiado"
                    ? await api.put(`/api/colegiados/${colegiado.sigla}`, payload, options)
                    : await api.post("/api/colegiados", payload, options);
                const savedColegiado = result?.colegiado;

                if (savedColegiado) {
                  if (activeModal === "editar-colegiado") {
                    setColegiado((current) =>
                      current
                        ? {
                            ...current,
                            ...savedColegiado,
                            membros: current.membros,
                            reunioes: current.reunioes,
                            publicacoes: current.publicacoes,
                          }
                        : current,
                    );
                  } else {
                    setInstanciasCount((current) => current + 1);
                    setInstanciasRefreshKey((current) => current + 1);
                  }
                } else {
                  await loadColegiado();
                }

                setActiveModal("");
              } catch (requestError) {
                setEditorError(requestError.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            {activeModal !== "editar-colegiado" ? (
              <label>
                <span>Sigla</span>
                <input name="sigla" required />
              </label>
            ) : null}
            {activeModal === "nova-instancia" ? (
              <label>
                <span>Tipo de vinculo</span>
                <select defaultValue="Instancia colegiada" name="tipo_vinculo">
                  <option value="Instancia colegiada">Instancia colegiada</option>
                  <option value="Colegiado filho">Colegiado filho</option>
                </select>
              </label>
            ) : null}
            <label>
              <span>Sigla de exibicao</span>
              <input
                defaultValue={activeModal === "editar-colegiado" ? colegiado.sigla_exibicao || "" : ""}
                name="sigla_exibicao"
              />
            </label>
            <label className="form-grid__full">
              <span>Nome</span>
              <input
                defaultValue={activeModal === "editar-colegiado" ? colegiado.nome || "" : ""}
                name="nome"
                required
              />
            </label>
            {activeModal !== "nova-instancia" ? (
              <label>
                <span>Tipo</span>
                <select defaultValue={activeModal === "editar-colegiado" ? colegiado.tipo || "Conselho" : "Conselho"} name="tipo">
                  <option value="Camara">Camara</option>
                  <option value="Comite">Comite</option>
                  <option value="Conselho">Conselho</option>
                  <option value="Grupo de Trabalho">Grupo de Trabalho</option>
                  <option value="Subcomite">Subcomite</option>
                </select>
              </label>
            ) : null}
            {activeModal === "nova-instancia" ? (
              <label>
                <span>Tipo</span>
                <select defaultValue="Instancia colegiada" name="tipo">
                  <option value="Instancia colegiada">Instancia colegiada</option>
                  <option value="Camara">Camara</option>
                  <option value="Comite">Comite</option>
                  <option value="Conselho">Conselho</option>
                  <option value="Grupo de Trabalho">Grupo de Trabalho</option>
                  <option value="Subcomite">Subcomite</option>
                </select>
              </label>
            ) : null}
            <label>
              <span>Status</span>
              <select defaultValue={activeModal === "editar-colegiado" ? colegiado.ativo || "Sim" : "Sim"} name="ativo">
                <option value="Sim">Ativo</option>
                <option value="Nao">Inativo</option>
              </select>
            </label>
            <label>
              <span>UF</span>
              <input defaultValue="" name="uf" placeholder="SP" />
            </label>
            <label>
              <span>Estado</span>
              <input defaultValue="" name="estado" placeholder="Sao Paulo" />
            </label>
            <label className="form-grid__full">
              <span>Municipio</span>
              <input defaultValue="" name="municipio" placeholder="Sao Paulo" />
            </label>
            <label>
              <span>Unidade</span>
              <input defaultValue={activeModal === "editar-colegiado" ? colegiado.unidade || "" : ""} name="unidade" />
            </label>
            <label>
              <span>Sigla da unidade pai</span>
              <input
                defaultValue={activeModal === "editar-colegiado" ? colegiado.sigla_unidade_pai || "" : ""}
                name="sigla_unidade_pai"
              />
            </label>
            <DateInputField
              defaultValue={activeModal === "editar-colegiado" ? colegiado.data_instituicao || "" : ""}
              name="data_instituicao"
              span="Data de instituicao"
            />
            <DateInputField
              defaultValue={activeModal === "editar-colegiado" ? colegiado.data_termino || "" : ""}
              name="data_termino"
              span="Data de termino"
            />
            <label>
              <span>Quantidade minima de reunioes</span>
              <input
                defaultValue={
                  activeModal === "editar-colegiado" ? colegiado.qtd_min_reunioes_anuais || "" : ""
                }
                name="qtd_min_reunioes_anuais"
              />
            </label>
            <label className="form-grid__full">
              <span>Ato de criacao</span>
              <textarea
                defaultValue={activeModal === "editar-colegiado" ? colegiado.ato_criacao || "" : ""}
                name="ato_criacao"
                rows="3"
              />
            </label>
            <label className="form-grid__full">
              <span>Competencias</span>
              <textarea
                defaultValue={activeModal === "editar-colegiado" ? colegiado.competencia || "" : ""}
                name="competencia"
                rows="4"
              />
            </label>
            <label className="form-grid__full">
              <span>Regra de quorum</span>
              <textarea
                defaultValue={activeModal === "editar-colegiado" ? colegiado.regra_quorum || "" : ""}
                name="regra_quorum"
                rows="3"
              />
            </label>
            <label className="form-grid__full">
              <span>Observacoes</span>
              <textarea
                defaultValue={activeModal === "editar-colegiado" ? colegiado.observacoes || "" : ""}
                name="observacoes"
                rows="3"
              />
            </label>
            {activeModal === "editar-colegiado" ? (
              <input defaultValue={colegiado.sigla_colegiado_pai || ""} name="sigla_colegiado_pai" type="hidden" />
            ) : null}
            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                Alteracao registrada para {user?.primeiroNome || "usuario autenticado"}.
              </span>
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
            {editorError ? <div className="inline-message danger-text">{editorError}</div> : null}
          </form>
        </EditFormModal>
      ) : null}

      <ConfirmActionModal
        confirmLabel={
          deleteTarget.type === "colegiado"
            ? "Excluir colegiado"
            : deleteTarget.type === "membro"
            ? "Excluir membro"
            : deleteTarget.type === "reuniao"
              ? "Excluir reuniao"
              : "Excluir publicacao"
        }
        description={
          deleteTarget.record
            ? `O item "${deleteTarget.record.nome_membro || deleteTarget.record.id_reuniao || deleteTarget.record.nome_pasta || deleteTarget.record.sigla || "selecionado"}" sera removido permanentemente.`
            : ""
        }
        onCancel={() => {
          if (!deletingContent) {
            setDeleteTarget({ type: "", record: null });
          }
        }}
        onConfirm={() =>
          deleteTarget.record &&
          (deleteTarget.type === "colegiado"
            ? (async () => {
                setDeletingColegiado(true);
                try {
                  await api.delete(`/api/colegiados/${deleteTarget.record.sigla}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  window.location.hash = "#/colegiados/internos";
                } finally {
                  setDeletingColegiado(false);
                }
              })()
            : handleDeleteContent(deleteTarget.type, deleteTarget.record))
        }
        open={Boolean(deleteTarget.record)}
        processing={deletingContent || deletingColegiado}
        title="Confirmar exclusao"
      />
    </div>
  );
};

export default ConsultaColegiado;
