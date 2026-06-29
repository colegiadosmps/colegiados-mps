import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Loading from "../components/Loading";
import { api } from "../services/api";

const initialForm = {
  sigla_colegiado: "",
  nome_pasta: "",
  link_pasta: "",
  data_base: "",
  ativo: "Sim",
};

const Publicacoes = () => {
  const [searchParams] = useSearchParams();
  const [publicacoes, setPublicacoes] = useState([]);
  const [colegiados, setColegiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const selectedSigla = searchParams.get("colegiado") || "";
  const [form, setForm] = useState({
    ...initialForm,
    sigla_colegiado: selectedSigla,
  });

  const loadData = () =>
    Promise.all([api.get("/api/publicacoes"), api.get("/api/colegiados")])
      .then(([publicacoesResult, colegiadosResult]) => {
        setPublicacoes(publicacoesResult);
        setColegiados(colegiadosResult);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    loadData();
  }, []);

  const filteredPublicacoes = selectedSigla
    ? publicacoes.filter((item) => item.sigla_colegiado === selectedSigla)
    : publicacoes;

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingId) {
        await api.put(`/api/publicacoes/${editingId}`, form);
        setMessage("Pasta de publicacoes atualizada com sucesso.");
      } else {
        await api.post("/api/publicacoes", form);
        setMessage("Pasta de publicacoes cadastrada com sucesso.");
      }

      setForm({ ...initialForm, sigla_colegiado: selectedSigla });
      setEditingId(null);
      setLoading(true);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      sigla_colegiado: item.sigla_colegiado,
      nome_pasta: item.nome_pasta,
      link_pasta: item.link_pasta,
      data_base: item.data_base || "",
      ativo: item.ativo || "Sim",
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/publicacoes/${id}`);
      setMessage("Pasta removida com sucesso.");
      setLoading(true);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
    return <Loading label="Carregando publicacoes..." />;
  }

  return (
    <div className="page-content">
      <section className="content-card">
        <div className="section-heading">
          <h2>Pastas de publicacoes</h2>
          <p>Cadastre os links oficiais de referencia para cada colegiado.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Colegiado
            <select value={form.sigla_colegiado} onChange={(event) => setForm({ ...form, sigla_colegiado: event.target.value })} required>
              <option value="">Selecione</option>
              {colegiados.map((colegiado) => (
                <option key={colegiado.id} value={colegiado.sigla}>
                  {colegiado.sigla}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nome da pasta
            <input value={form.nome_pasta} onChange={(event) => setForm({ ...form, nome_pasta: event.target.value })} required />
          </label>
          <label>
            Link da pasta
            <input value={form.link_pasta} onChange={(event) => setForm({ ...form, link_pasta: event.target.value })} required />
          </label>
          <label>
            Data base
            <input type="date" value={form.data_base} onChange={(event) => setForm({ ...form, data_base: event.target.value })} />
          </label>
          <label>
            Status
            <select value={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.value })}>
              <option value="Sim">Ativo</option>
              <option value="Nao">Inativo</option>
            </select>
          </label>
          <div className="form-actions full">
            <button className="primary-button" type="submit">
              {editingId ? "Salvar alteracoes" : "Cadastrar pasta"}
            </button>
            {editingId ? (
              <button className="secondary-button" type="button" onClick={() => {
                setEditingId(null);
                setForm({ ...initialForm, sigla_colegiado: selectedSigla });
              }}>
                Cancelar edicao
              </button>
            ) : null}
          </div>
        </form>

        {message ? <div className="inline-message">{message}</div> : null}
      </section>

      <section className="cards-list">
        {filteredPublicacoes.length ? (
          filteredPublicacoes.map((item) => (
            <article key={item.id} className="content-card publication-card">
              <div className="entity-card__header">
                <span className="pill">{item.sigla_colegiado}</span>
                <span className={`badge ${item.ativo === "Sim" ? "success" : "danger"}`}>{item.ativo}</span>
              </div>
              <h3>{item.nome_pasta}</h3>
              <p className="muted">{item.link_pasta}</p>
              <div className="entity-card__actions">
                <a href={item.link_pasta} target="_blank" rel="noreferrer">
                  Abrir publicacoes
                </a>
                <button className="text-button" onClick={() => handleEdit(item)} type="button">
                  Editar
                </button>
                <button className="text-button danger-text" onClick={() => handleDelete(item.id)} type="button">
                  Excluir
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">Nenhuma pasta de publicacoes cadastrada para o filtro atual.</div>
        )}
      </section>
    </div>
  );
};

export default Publicacoes;
