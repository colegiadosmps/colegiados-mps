import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import { api } from "../services/api";

const ColegiadosExternos = () => {
  const [colegiados, setColegiados] = useState(null);

  useEffect(() => {
    api.get("/api/colegiados?tipo=Externo").then(setColegiados);
  }, []);

  if (!colegiados) {
    return <Loading label="Carregando colegiados externos..." />;
  }

  return (
    <div className="page-content">
      <section className="content-card">
        <div className="section-heading">
          <h2>Colegiados externos</h2>
          <p>{colegiados.length} colegiado(s) externo(s) para consulta.</p>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sigla</th>
                <th>Nome</th>
                <th>Status</th>
                <th>Membros</th>
                <th>Reunioes</th>
                <th>Ultima atualizacao</th>
                <th>Consulta</th>
              </tr>
            </thead>
            <tbody>
              {colegiados.map((colegiado) => (
                <tr key={colegiado.id}>
                  <td>{colegiado.sigla}</td>
                  <td>{colegiado.nome}</td>
                  <td><span className={`badge ${colegiado.ativo === "Sim" ? "success" : "danger"}`}>{colegiado.ativo}</span></td>
                  <td>{colegiado.total_membros}</td>
                  <td>{colegiado.total_reunioes}</td>
                  <td>{colegiado.ultima_atualizacao || "-"}</td>
                  <td><Link className="text-link" to={`/colegiados/${colegiado.sigla}`}>Abrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ColegiadosExternos;
