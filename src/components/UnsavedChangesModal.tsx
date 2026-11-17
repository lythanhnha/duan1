import React from 'react';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';

export interface UnsavedGuardHandle {
  hasUnsavedChanges: () => boolean;
  saveUnsavedChanges: () => boolean | void;
  getUnsavedDescription?: () => string;
}

interface UnsavedChangesModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  saveLabel?: string;
  discardLabel?: string;
  cancelLabel?: string;
  onSaveAndContinue: () => void;
  onDiscardAndContinue: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  title = 'Xác nhận lưu thay đổi',
  message = 'Bạn đã nhập hoặc chỉnh sửa dữ liệu (điểm, lời nhận xét, báo cáo...) nhưng chưa bấm Lưu. Bạn có muốn lưu lại trước khi rời khỏi không?',
  saveLabel = 'Lưu & Tiếp tục',
  discardLabel = 'Không lưu',
  cancelLabel = 'Ở lại chỉnh sửa',
  onSaveAndContinue,
  onDiscardAndContinue,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                Dữ liệu chưa được lưu
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer order-3 sm:order-1"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onDiscardAndContinue}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer order-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{discardLabel}</span>
          </button>
          <button
            type="button"
            onClick={onSaveAndContinue}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer order-1 sm:order-3"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
