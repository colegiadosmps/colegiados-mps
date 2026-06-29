const TabelaReunioes = ({ reunioes }) => {
  if (!reunioes.length) {
    return (
      <div className="empty-state">
        Nenhuma reuniao encontrada para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Hora</th>
            <th>Colegiado</th>
            <th>Local</th>
            <th>Classificacao</th>
            <th>Descricao da pauta</th>
            <th>Status</th>
            <th>Quorum</th>
          </tr>
        </thead>
        <tbody>
          {reunioes.map((reuniao) => (
            <tr key={reuniao.id}>
              <td>{reuniao.data_reuniao || "-"}</td>
              <td>{reuniao.hora || "-"}</td>
              <td>{reuniao.sigla_colegiado}</td>
              <td>{reuniao.local || "-"}</td>
              <td>{reuniao.classificacao_pauta || "-"}</td>
              <td>{reuniao.descricao_pauta || "-"}</td>
              <td>{reuniao.status_reuniao || "-"}</td>
              <td>{reuniao.quorum_registrado || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaReunioes;
