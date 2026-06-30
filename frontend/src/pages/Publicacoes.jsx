import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Loading from "../components/Loading";
import { api } from "../services/api";

const Publicacoes = () => {
  const [searchParams] = useSearchParams();
  const [publicacoes, setPublicacoes] = useState(null);
  const selectedSigla = searchParams.get("colegiado") || "";

  useEffect(() => {
    const query = selectedSigla ? `?colegiado=${selectedSigla}` : "";
    api.get(`/api/publicacoes${query}`).then(setPublicacoes);
  }, [selectedSigla]);

  if (!publicacoes) {
    return <Loading label="Carregando publicacoes..." />;
  }

  return (
    <div className="page-content">
      <section className="content-card">
        <div className="section-heading">
          <h2>Pastas de publicacoes</h2>
          <p>Links de referencia sincronizados automaticamente do Google Drive.</p>
        </div>
      </section>

      <section className="cards-list">
        {publicacoes.length ? (
          publicacoes.map((item) => (
            <article key={item.id} className="content-card publication-card">
              <div className="entity-card__header">
                <span className="pill">{item.sigla_colegiado}</span>
                <span className={`badge ${item.ativo === "Sim" ? "success" : "danger"}`}>{item.ativo}</span>
              </div>
              <h3>{item.nome_pasta}</h3>
              <p className="muted">{item.link_pasta}</p>
              <div className="entity-card__actions">
                <a href={item.link_pasta} target="_blank" rel="noreferrer">Abrir publicacoes</a>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">Nenhuma pasta de publicacoes encontrada para o filtro atual.</div>
        )}
      </section>
    </div>
  );
};

export default Publicacoes;
