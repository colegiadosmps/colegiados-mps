import { HiOutlineXMark } from "react-icons/hi2";

const EditFormModal = ({
  children,
  onClose,
  title,
  footer = null,
  wide = false,
}) => (
  <>
    <button className="status-panel-backdrop" onClick={onClose} type="button" />
    <section className={`app-modal ${wide ? "app-modal--wide-editor" : ""}`.trim()}>
      <div className="app-modal__header">
        <h3>{title}</h3>
        <button className="app-modal__close" onClick={onClose} type="button">
          <HiOutlineXMark />
        </button>
      </div>
      <div className="app-modal__body">{children}</div>
      {footer ? <div className="app-modal__footer app-modal__footer--split">{footer}</div> : null}
    </section>
  </>
);

export default EditFormModal;
