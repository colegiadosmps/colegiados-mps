import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import TabelaMembros from "../components/TabelaMembros";
import TabelaReunioes from "../components/TabelaReunioes";
import { api } from "../services/api";

const ConsultaColegiado = () => {
  const { sigla } = useParams();
  const [colegiado, setColegiado] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/api/colegiados/${sigla}`).then(setColegiado).catch((err) => setError(err.message));
  }, [sigla]);

  if (error) {
    return <div className="empty-state">{error}</div>;
  }

  if (!colegiado) {
    return <Loading label={`Carregando detalhes de ${sigla}...`} />;
  }

  return (
    <div className="page-content">
      <section className="content-card">
        <div className="detail-hero">
          <div>
            <span className="pill">{colegiado.sigla}</span>
            <h2>{colegiado.nome}</h2>
            <p className="muted">{colegiado.competencia || colegiado.descricao || "Sem competencia/descricao cadastrada."}</p>
          </div>
          <div className="detail-metrics">
            <div><strong>{colegiado.tipo || "Nao informado"}</strong><span>Tipo</span></div>
            <div><strong>{colegiado.total_membros}</strong><span>Integrantes</span></div>
            <div><strong>{colegiado.total_reunioes}</strong><span>Reunioes</span></div>
            <div><strong>{colegiado.ultima_atualizacao || "-"}</strong><span>Ultima atualizacao</span></div>
          </div>
        </div>
        <div className="form-actions">
          <Link className="text-button" to={`/integrantes?colegiado=${colegiado.sigla}`}>Ver integrantes filtrados</Link>
          <Link className="text-button" to={`/historico-reunioes?colegiado=${colegiado.sigla}`}>Ver historico de reunioes</Link>
          {colegiado.publicacoes[0] ? (
            <a className="text-button" href={colegiado.publicacoes[0].link_pasta} target="_blank" rel="noreferrer">Abrir publicacoes</a>
          ) : null}
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Integrantes do colegiado</h2>
          <p>{colegiado.membros.length} registro(s).</p>
        </div>
        <TabelaMembros membros={colegiado.membros} />
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Reunioes do colegiado</h2>
          <p>{colegiado.reunioes.length} registro(s).</p>
        </div>
        <TabelaReunioes reunioes={colegiado.reunioes} />
      </section>
    </div>
  );
};

export default ConsultaColegiado;
