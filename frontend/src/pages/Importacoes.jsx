import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { api } from "../services/api";

const Importacoes = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadHistory = () =>
    api
      .get("/api/importacoes")
      .then(setHistory)
      .finally(() => setLoading(false));

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setMessage("Selecione um arquivo CSV antes de enviar.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const uploadResult = await api.upload("/api/importacoes/upload", file);
      setResult(uploadResult);
      setLoading(true);
      await loadHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
      setFile(null);
      event.target.reset();
    }
  };

  if (loading) {
    return <Loading label="Carregando historico de importacoes..." />;
  }

  return (
    <div className="page-content">
      <section className="content-card">
        <div className="section-heading">
          <h2>Importacao de arquivos CSV</h2>
          <p>Envie arquivos no padrao SIGLA_TIPO_DD_MM_AAAA.csv para atualizar a base.</p>
        </div>

        <form className="upload-form" onSubmit={handleSubmit}>
          <input accept=".csv" onChange={(event) => setFile(event.target.files?.[0] || null)} type="file" />
          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "Enviando..." : "Enviar arquivo"}
          </button>
        </form>

        {message ? <div className="inline-message">{message}</div> : null}

        {result ? (
          <div className="result-card">
            <h3>Resultado da importacao</h3>
            <p>Arquivo: {result.arquivo}</p>
            <p>Tipo: {result.tipo}</p>
            <p>Colegiado: {result.sigla_colegiado}</p>
            <p>Data base: {result.data_base}</p>
            <p>Quantidade de registros: {result.quantidade_registros}</p>
            <p>Status: {result.status}</p>
          </div>
        ) : null}
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Historico de importacoes</h2>
          <p>Registro completo das leituras realizadas na base.</p>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tipo</th>
                <th>Colegiado</th>
                <th>Data base</th>
                <th>Importacao</th>
                <th>Qtd.</th>
                <th>Status</th>
                <th>Observacao</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{item.arquivo}</td>
                  <td>{item.tipo}</td>
                  <td>{item.sigla_colegiado}</td>
                  <td>{item.data_base || "-"}</td>
                  <td>{item.data_importacao}</td>
                  <td>{item.quantidade_registros}</td>
                  <td>{item.status}</td>
                  <td>{item.observacao || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Importacoes;
