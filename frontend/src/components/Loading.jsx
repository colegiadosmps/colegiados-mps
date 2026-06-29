const Loading = ({ label = "Carregando dados..." }) => (
  <div className="loading-state">
    <div className="spinner" />
    <span>{label}</span>
  </div>
);

export default Loading;
