import { useEffect, useState } from "react";
import { api } from "../services/api";
import Loading from "../components/Loading";

const initialForm = {
  sigla: "",
  nome: "",
  tipo: "",
  descricao: "",
  ativo: "Sim",
};

const Colegiados = () => {
  const [colegiados, setColegiados] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadColegiados = () =>
    api
      .get("/api/colegiados")
      .then((result) => setColegiados(result))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadColegiados();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingId) {
        await api.put(`/api/colegiados/${editingId}`, form);
        setMessage("Colegiado atualizado com sucesso.");
      } else {
        await api.post("/api/colegiados", form);
        setMessage("Colegiado cadastrado com sucesso.");
      }

      setForm(initialForm);
      setEditingId(null);
      setLoading(true);
      await loadColegiados();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleEdit = (colegiado) => {
    setEditingId(colegiado.id);
    setForm({
      sigla: colegiado.sigla,
      nome: colegiado.nome,
      tipo: colegiado.tipo || "",
      descricao: colegiado.descricao || "",
      ativo: colegiado.ativo || "Sim",
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/colegiados/${id}`);
      setMessage("Colegiado removido com sucesso.");
      setLoading(true);
      await loadColegiados();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
    return <Loading label="Carregando colegiados..." />;
  }

  return (
    <div className="page-content">
      <section className="content-card">
        <div className="section-heading">
          <h2>Cadastro de colegiados</h2>
          <p>Mantenha a base institucional organizada com status e descricao.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Sigla
            <input value={form.sigla} onChange={(event) => setForm({ ...form, sigla: event.target.value })} required />
          </label>
          <label>
            Nome
            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required />
          </label>
          <label>
            Tipo
            <input value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} />
          </label>
          <label>
            Status
            <select value={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.value })}>
              <option value="Sim">Ativo</option>
              <option value="Nao">Inativo</option>
            </select>
          </label>
          <label className="full">
            Descricao
            <textarea value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} rows="3" />
          </label>
          <div className="form-actions full">
            <button className="primary-button" type="submit">
              {editingId ? "Salvar alteracoes" : "Cadastrar colegiado"}
            </button>
            {editingId ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
              >
                Cancelar edicao
              </button>
            ) : null}
          </div>
        </form>

        {message ? <div className="inline-message">{message}</div> : null}
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Lista de colegiados</h2>
          <p>Visao consolidada com quantitativos e ultima atualizacao.</p>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sigla</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Membros</th>
                <th>Reunioes</th>
                <th>Ultima atualizacao</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {colegiados.map((colegiado) => (
                <tr key={colegiado.id}>
                  <td>{colegiado.sigla}</td>
                  <td>{colegiado.nome}</td>
                  <td>{colegiado.tipo || "-"}</td>
                  <td>
                    <span className={`badge ${colegiado.ativo === "Sim" ? "success" : "danger"}`}>
                      {colegiado.ativo}
                    </span>
                  </td>
                  <td>{colegiado.total_membros}</td>
                  <td>{colegiado.total_reunioes}</td>
                  <td>{colegiado.ultima_atualizacao || "-"}</td>
                  <td>
                    <div className="table-actions">
                      <button className="text-button" onClick={() => handleEdit(colegiado)} type="button">
                        Editar
                      </button>
                      <button className="text-button danger-text" onClick={() => handleDelete(colegiado.id)} type="button">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Colegiados;
