import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Filtros from "../components/Filtros";
import Loading from "../components/Loading";
import TabelaMembros from "../components/TabelaMembros";
import { api } from "../services/api";

const Membros = () => {
  const [searchParams] = useSearchParams();
  const [membros, setMembros] = useState([]);
  const [colegiados, setColegiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    colegiado: searchParams.get("colegiado") || "",
    ativo: "",
    tipo_vinculo: "",
    papel: "",
  });

  useEffect(() => {
    Promise.all([api.get("/api/membros"), api.get("/api/colegiados")])
      .then(([membrosResult, colegiadosResult]) => {
        setMembros(membrosResult);
        setColegiados(colegiadosResult);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredMembros = membros.filter((membro) => {
    const searchTerm = filters.search.toLowerCase();

    return (
      (!filters.colegiado || membro.sigla_colegiado === filters.colegiado) &&
      (!filters.ativo || membro.ativo === filters.ativo) &&
      (!filters.tipo_vinculo || membro.tipo_vinculo === filters.tipo_vinculo) &&
      (!filters.papel || membro.papel === filters.papel) &&
      (!searchTerm ||
        membro.nome_membro?.toLowerCase().includes(searchTerm) ||
        membro.detalhamento_papel?.toLowerCase().includes(searchTerm))
    );
  });

  if (loading) {
    return <Loading label="Carregando membros..." />;
  }

  return (
    <div className="page-content">
      <Filtros title="Consulta de membros">
        <label>
          Buscar por nome
          <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
        <label>
          Colegiado
          <select value={filters.colegiado} onChange={(event) => setFilters({ ...filters, colegiado: event.target.value })}>
            <option value="">Todos</option>
            {colegiados.map((colegiado) => (
              <option key={colegiado.id} value={colegiado.sigla}>
                {colegiado.sigla}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ativo
          <select value={filters.ativo} onChange={(event) => setFilters({ ...filters, ativo: event.target.value })}>
            <option value="">Todos</option>
            <option value="Sim">Ativo</option>
            <option value="Nao">Inativo</option>
          </select>
        </label>
        <label>
          Tipo de vinculo
          <input value={filters.tipo_vinculo} onChange={(event) => setFilters({ ...filters, tipo_vinculo: event.target.value })} />
        </label>
        <label>
          Papel
          <input value={filters.papel} onChange={(event) => setFilters({ ...filters, papel: event.target.value })} />
        </label>
      </Filtros>

      <section className="content-card">
        <div className="section-heading">
          <h2>Base de membros</h2>
          <p>{filteredMembros.length} registro(s) encontrados.</p>
        </div>
        <TabelaMembros membros={filteredMembros} />
      </section>
    </div>
  );
};

export default Membros;
