const ExpandedChartModal = ({ children, onClose, title }) => (
  <>
    <button
      aria-label="Fechar visualizacao expandida"
      className="modal-backdrop"
      onClick={onClose}
      type="button"
    />
    <section className="app-modal chart-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="app-modal__header">
        <h3>{title}</h3>
        <button className="app-modal__close" onClick={onClose} type="button">
          Fechar
        </button>
      </div>
      <div className="app-modal__body">{children}</div>
    </section>
  </>
);

export default ExpandedChartModal;
