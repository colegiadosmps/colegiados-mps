import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Filtros from "../components/Filtros";
import Loading from "../components/Loading";
import TabelaReunioes from "../components/TabelaReunioes";
import { api } from "../services/api";

const HistoricoReunioes = () => {
  const [searchParams] = useSearchParams();
  const [reunioes, setReunioes] = useState([]);
  const [colegiados, setColegiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    colegiado: searchParams.get("colegiado") || "",
    status: "",
    search: "",
  });

  useEffect(() => {
    Promise.all([api.get("/api/reunioes"), api.get("/api/colegiados")])
      .then(([reunioesResult, colegiadosResult]) => {
        setReunioes(reunioesResult);
        setColegiados(colegiadosResult);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredReunioes = reunioes.filter((reuniao) => {
    const searchTerm = filters.search.toLowerCase();

    return (
      (!filters.colegiado || reuniao.sigla_colegiado === filters.colegiado) &&
      (!filters.status || reuniao.status_reuniao === filters.status) &&
      (!searchTerm ||
        reuniao.classificacao_pauta?.toLowerCase().includes(searchTerm) ||
        reuniao.descricao_pauta?.toLowerCase().includes(searchTerm) ||
        reuniao.texto_ata?.toLowerCase().includes(searchTerm))
    );
  });

  if (loading) {
    return <Loading label="Carregando historico de reunioes..." />;
  }

  return (
    <div className="page-content">
      <Filtros title="Historico de reunioes">
        <label>
          Colegiado
          <select value={filters.colegiado} onChange={(event) => setFilters({ ...filters, colegiado: event.target.value })}>
            <option value="">Todos</option>
            {colegiados.map((colegiado) => (
              <option key={colegiado.id} value={colegiado.sigla}>{colegiado.sigla}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <input value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} />
        </label>
        <label>
          Busca por pauta/ata
          <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
      </Filtros>

      <section className="content-card">
        <div className="section-heading">
          <h2>Historico consolidado</h2>
          <p>{filteredReunioes.length} reuniao(oes) encontradas.</p>
        </div>
        <TabelaReunioes reunioes={filteredReunioes} />
      </section>
    </div>
  );
};

export default HistoricoReunioes;
