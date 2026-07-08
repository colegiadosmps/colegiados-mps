import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineChartBarSquare } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import EditFormModal from "../components/EditFormModal";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import { useAuthSession } from "../context/AuthSessionContext";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const buildColumns = (extraColumns = []) => [
  {
    key: "tipo",
    label: "Tipo",
    width: "140px",
  },
  {
    key: "numero",
    label: "Numero",
    width: "120px",
  },
  {
    key: "data_publicacao",
    label: "Data",
    width: "120px",
  },
  {
    key: "ano",
    label: "Ano",
    width: "100px",
  },
  {
    key: "assunto",
    label: "Assunto",
    width: "320px",
    className: "cell-wrap",
    render: (row) => row.assunto || row.nome_pasta || "-",
  },
  {
    key: "link_pasta",
    label: "Link",
    width: "380px",
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
  {
    key: "status",
    label: "Status",
    width: "120px",
  },
  ...extraColumns,
];

const Publicacoes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEditContent, token, user } = useAuthSession();
  const [publicacoes, setPublicacoes] = useState(null);
  const [colegiados, setColegiados] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState(null);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    reuniao: normalizeFilterValue(searchParams.get("reuniao")),
  });

  const loadData = () =>
    Promise.all([api.get("/api/publicacoes"), api.get("/api/colegiados")]).then(
      ([publicacoesResult, colegiadosResult]) => {
        setPublicacoes(publicacoesResult);
        setColegiados(colegiadosResult);
      },
    );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.tipo !== ALL_VALUE) {
      params.set("tipo", filters.tipo);
    }
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    if (filters.reuniao !== ALL_VALUE) {
      params.set("reuniao", filters.reuniao);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredPublicacoes = useMemo(() => {
    if (!publicacoes) {
      return [];
    }

    const tipoMap = new Map(colegiados.map((item) => [item.sigla, item.tipo]));
    return publicacoes.filter((item) => {
      const matchesTipo =
        filters.tipo === ALL_VALUE || tipoMap.get(item.sigla_colegiado) === filters.tipo;
      const matchesSigla =
        filters.colegiado === ALL_VALUE || item.sigla_colegiado === filters.colegiado;
      const matchesReuniao =
        filters.reuniao === ALL_VALUE || item.nome_pasta === filters.reuniao;
      return matchesTipo && matchesSigla && matchesReuniao;
    });
  }, [colegiados, filters, publicacoes]);

  const actionColumns = useMemo(() => {
    if (!canEditContent) {
      return [];
    }

    return [
      {
        key: "acoes",
        label: "Acoes",
        width: "180px",
        render: (row) => (
          <div className="table-row-actions">
            <button
              className="text-button"
              onClick={() => {
                setEditingPublication(row);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              Editar
            </button>
            <button
              className="secondary-button"
              onClick={async () => {
                try {
                  const nextStatus = row.status === "Inativo" ? "Ativo" : "Inativo";
                  await api.put(
                    `/api/publicacoes/${row.id}`,
                    { ...row, status: nextStatus },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  );
                  await loadData();
                } catch (error) {
                  setEditorError(error.message);
                  setEditorOpen(true);
                }
              }}
              type="button"
            >
              {row.status === "Inativo" ? "Reativar" : "Inativar"}
            </button>
          </div>
        ),
      },
    ];
  }, [canEditContent, token]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setEditorError("");

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        sigla_colegiado: formData.get("sigla_colegiado"),
        nome_pasta: formData.get("nome_pasta"),
        tipo: formData.get("tipo"),
        numero: formData.get("numero"),
        data_publicacao: formData.get("data_publicacao"),
        ano: formData.get("ano"),
        assunto: formData.get("assunto"),
        link_pasta: formData.get("link_pasta"),
        status: formData.get("status"),
        ativo: formData.get("ativo"),
        observacao: formData.get("observacao"),
      };

      const options = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editingPublication?.id) {
        await api.put(`/api/publicacoes/${editingPublication.id}`, payload, options);
      } else {
        await api.post("/api/publicacoes", payload, options);
      }

      await loadData();
      setEditorOpen(false);
      setEditingPublication(null);
    } catch (error) {
      setEditorError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!publicacoes) {
    return <Loading label="Carregando publicacoes..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Tipo de Colegiado"
              options={buildOptions(colegiados.map((item) => item.tipo))}
              value={filters.tipo}
              onChange={(value) => setFilters((current) => ({ ...current, tipo: value }))}
            />
            <FilterDropdown
              label="Sigla Colegiado"
              options={buildOptions(publicacoes.map((item) => item.sigla_colegiado))}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <FilterDropdown
              label="Reuniao"
              options={buildOptions(publicacoes.map((item) => item.nome_pasta))}
              value={filters.reuniao}
              onChange={(value) => setFilters((current) => ({ ...current, reuniao: value }))}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({ tipo: ALL_VALUE, colegiado: ALL_VALUE, reuniao: ALL_VALUE })
              }
            />
          </>
        }
        icon={HiOutlineChartBarSquare}
        metricLabel="Publicacoes filtradas"
        metricValue={filteredPublicacoes.length}
        subtitle="Interface preparada para exibir publicacoes em tabela, mesmo partindo hoje das pastas do Google Drive."
        title="Publicacoes"
      />

      <section className="content-card">
        <div className="section-heading">
          <div>
            <h3>Base de publicacoes</h3>
            <p>O colaborador autenticado pode adicionar, editar e inativar registros.</p>
          </div>
          {canEditContent ? (
            <button
              className="primary-button"
              onClick={() => {
                setEditingPublication(null);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              Adicionar publicacao
            </button>
          ) : null}
        </div>
        <PowerBiTable
          columns={buildColumns(actionColumns)}
          emptyMessage="Nenhuma publicacao encontrada para os filtros selecionados."
          rows={filteredPublicacoes}
          sortable={false}
        />
      </section>

      {editorOpen ? (
        <EditFormModal
          onClose={() => {
            setEditorOpen(false);
            setEditingPublication(null);
          }}
          title={editingPublication ? "Editar publicacao" : "Adicionar publicacao"}
        >
          <form className="form-grid" onSubmit={handleSave}>
            <label>
              <span>Colegiado</span>
              <select defaultValue={editingPublication?.sigla_colegiado || ""} name="sigla_colegiado" required>
                <option value="">Selecione</option>
                {colegiados.map((item) => (
                  <option key={item.sigla} value={item.sigla}>
                    {item.sigla}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tipo</span>
              <select defaultValue={editingPublication?.tipo || "Resolucao"} name="tipo">
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
              <input defaultValue={editingPublication?.numero || ""} name="numero" />
            </label>
            <label>
              <span>Data</span>
              <input defaultValue={editingPublication?.data_publicacao || ""} name="data_publicacao" />
            </label>
            <label>
              <span>Ano</span>
              <input defaultValue={editingPublication?.ano || ""} name="ano" />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={editingPublication?.status || "Ativo"} name="status">
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </label>
            <label className="form-grid__full">
              <span>Titulo</span>
              <input defaultValue={editingPublication?.nome_pasta || ""} name="nome_pasta" required />
            </label>
            <label className="form-grid__full">
              <span>Assunto</span>
              <textarea defaultValue={editingPublication?.assunto || ""} name="assunto" rows="3" />
            </label>
            <label className="form-grid__full">
              <span>Link</span>
              <input defaultValue={editingPublication?.link_pasta || ""} name="link_pasta" />
            </label>
            <label className="form-grid__full">
              <span>Observacao</span>
              <textarea defaultValue={editingPublication?.observacao || ""} name="observacao" rows="3" />
            </label>
            <input defaultValue={editingPublication?.ativo || "Sim"} name="ativo" type="hidden" />
            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                Alteracao registrada para {user?.primeiroNome || "usuario autenticado"}.
              </span>
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar publicacao"}
              </button>
            </div>
            {editorError ? <div className="inline-message danger-text">{editorError}</div> : null}
          </form>
        </EditFormModal>
      ) : null}
    </div>
  );
};

export default Publicacoes;
