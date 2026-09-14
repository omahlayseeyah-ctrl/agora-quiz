"use client";

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "YES / SUBMIT",
  cancelLabel = "CANCEL",
  onConfirm,
  onCancel,
  danger,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="card w-full max-w-sm p-5 text-center">
        <h3 className="font-poppins font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-300 font-nunito mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={danger ? "btn-danger flex-1" : "btn-primary flex-1"}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
