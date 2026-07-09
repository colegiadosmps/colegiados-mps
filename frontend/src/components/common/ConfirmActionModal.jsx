import { HiOutlineXMark } from "react-icons/hi2";
import LottieAnimation from "./LottieAnimation";

const ConfirmActionModal = ({
  cancelLabel = "Cancelar",
  confirmLabel = "Excluir",
  description,
  onCancel,
  onConfirm,
  open,
  processing = false,
  title = "Confirmar exclusao",
}) => {
  if (!open) {
    return null;
  }

  return (
    <>
      <button className="modal-backdrop" onClick={onCancel} type="button" />
      <section
        aria-label={title}
        aria-modal="true"
        className="app-modal confirm-action-modal"
        role="dialog"
      >
        <div className="app-modal__header">
          <h3>{title}</h3>
          <button className="app-modal__close" onClick={onCancel} type="button">
            <HiOutlineXMark />
          </button>
        </div>
        <div className="app-modal__body confirm-action-modal__body">
          <LottieAnimation
            fallback={<div className="spinner" />}
            height={150}
            name="delete-bin"
            width={150}
          />
          <p>{description}</p>
          <div className="status-actions">
            <button
              className="success-button"
              disabled={processing}
              onClick={onConfirm}
              type="button"
            >
              {processing ? "Excluindo..." : confirmLabel}
            </button>
            <button className="text-button" disabled={processing} onClick={onCancel} type="button">
              {cancelLabel}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default ConfirmActionModal;
