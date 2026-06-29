const TabelaMembros = ({ membros }) => {
  if (!membros.length) {
    return <div className="empty-state">Nenhum membro encontrado para os filtros selecionados.</div>;
  }

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Colegiado</th>
            <th>Tipo de vinculo</th>
            <th>Papel</th>
            <th>Detalhamento</th>
            <th>Inicio</th>
            <th>Fim</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {membros.map((membro) => (
            <tr key={membro.id}>
              <td>{membro.nome_membro}</td>
              <td>{membro.sigla_colegiado}</td>
              <td>{membro.tipo_vinculo || "-"}</td>
              <td>{membro.papel || "-"}</td>
              <td>{membro.detalhamento_papel || "-"}</td>
              <td>{membro.inicio_vigencia || "-"}</td>
              <td>{membro.fim_vigencia || "-"}</td>
              <td>
                <span className={`badge ${membro.ativo === "Sim" ? "success" : "danger"}`}>
                  {membro.ativo || "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaMembros;
