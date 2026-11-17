import React, { useState } from 'react';
import {
  BookOpen,
  X,
  UserCheck,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileText,
  BookMarked,
  Lock,
  CheckCircle2,
  ArrowLeft,
  History,
  KeyRound,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'HOMEROOM' | 'SUBJECT' | 'PARENT'>('GENERAL');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/15 rounded-xl shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Hướng Dẫn Sử Dụng D2KN Edu</h2>
              <p className="text-xs sm:text-sm text-indigo-100 mt-0.5">
                Sổ liên lạc điện tử kết nối GVCN, GV Bộ Môn và Phụ huynh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 pt-3 overflow-x-auto overflow-y-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab('GENERAL')}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'GENERAL'
                  ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Tổng Quan &amp; Đăng Nhập</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PARENT')}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'PARENT'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Phụ Huynh</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('HOMEROOM')}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'HOMEROOM'
                  ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>GV Chủ Nhiệm</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SUBJECT')}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'SUBJECT'
                  ? 'bg-white text-purple-700 border-purple-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <BookMarked className="w-4 h-4 text-purple-600 shrink-0" />
              <span>GV Bộ Môn</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-0 flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 text-[#374151] text-sm sm:text-[15px] leading-relaxed">
          {activeTab === 'GENERAL' && (
            <div className="space-y-5">
              {/* Quick Start Guide */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white shadow-2xs flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Cách Truy Cập Nhanh Theo Vai Trò
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">
                      Áp dụng cho Phụ huynh, Giáo viên chủ nhiệm và Giáo viên bộ môn
                    </p>
                  </div>
                </div>

                <ol className="space-y-2 text-sm text-[#374151] list-decimal list-inside">
                  <li>
                    Tại trang chủ D2KN Edu, chọn trực tiếp vai trò của bạn trong 3 thẻ: <strong>Phụ Huynh Học Sinh</strong>, <strong>Giáo Viên Chủ Nhiệm</strong> hoặc <strong>Giáo Viên Bộ Môn</strong>.
                  </li>
                  <li>
                    Nhập <strong>mật khẩu riêng</strong> tương ứng để vào sổ liên lạc.
                  </li>
                  <li>
                    Khi muốn chuyển sang vai trò khác hoặc chọn học sinh khác, nhấn nút <ArrowLeft className="w-3.5 h-3.5 inline" /> <strong>Quay lại</strong> trên thanh tiêu đề.
                  </li>
                </ol>

                <div className="pt-2 border-t border-blue-100 flex items-start gap-2 text-xs sm:text-sm text-emerald-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Đồng bộ trực tiếp Firebase Cloud:</strong> Mọi cập nhật điểm số, nhận xét tuần và mật khẩu đều tự động lưu theo thời gian thực và ghi dấu vào <strong>Nhật ký chỉnh sửa (Audit Log)</strong>.
                  </span>
                </div>
              </div>

              {/* 3 Roles Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-emerald-200 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Phụ Huynh Học Sinh</span>
                  </div>
                  <ul className="space-y-1 text-xs sm:text-sm text-[#374151] list-disc list-inside">
                    <li>Chọn tên con + nhập mật khẩu</li>
                    <li>Xem Thời khóa biểu &amp; Tiết yếu</li>
                    <li>Xem điểm số &amp; nhận xét GVBM</li>
                    <li>Gửi phản hồi cho GVCN</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
                    <UserCheck className="w-4 h-4" />
                    <span>GV Chủ Nhiệm</span>
                  </div>
                  <ul className="space-y-1 text-xs sm:text-sm text-[#374151] list-disc list-inside">
                    <li>Nhập mật khẩu GVCN (mặc định 123)</li>
                    <li>Đánh giá tuần, tiết vắng &amp; tiết yếu</li>
                    <li>Cấp/đổi mật khẩu Phụ huynh</li>
                    <li>Xem Nhật ký chỉnh sửa (Audit Log)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm">
                    <BookMarked className="w-4 h-4" />
                    <span>GV Bộ Môn</span>
                  </div>
                  <ul className="space-y-1 text-xs sm:text-sm text-[#374151] list-disc list-inside">
                    <li>Chọn môn dạy + nhập mật khẩu</li>
                    <li>Nhập điểm số môn giảng dạy</li>
                    <li>Viết lời nhận xét riêng từng em</li>
                    <li>Tự đổi mật khẩu bảo mật môn</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs sm:text-sm uppercase tracking-wide">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Quy Định Phân Quyền &amp; Nhật Ký Chỉnh Sửa</span>
                </div>
                <p className="text-xs sm:text-sm text-purple-950 leading-relaxed">
                  <strong>Lời nhận xét của Giáo viên bộ môn</strong> chỉ có chính Giáo viên bộ môn đó được quyền chỉnh sửa; Giáo viên chủ nhiệm chỉ có thể xem. Mọi thao tác sửa điểm, nhận xét, báo cáo tuần hoặc đổi mật khẩu đều tự động lưu dấu người thực hiện vào <strong>Nhật Ký Chỉnh Sửa (Audit Log)</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'PARENT' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Hướng dẫn từng bước dành cho Phụ huynh học sinh</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs shrink-0">
                    Bước 1
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      Chọn Tên Con Em &amp; Nhập Mật Khẩu Phụ Huynh
                    </h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Bấm vào thẻ <strong>Phụ Huynh Học Sinh</strong> (nằm đầu tiên trên điện thoại), chọn học sinh trong danh sách lớp và nhập mật khẩu do GVCN cấp (mật khẩu mẫu ban đầu là <strong>123</strong>, có thể tự đổi sau khi vào xem).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Calendar className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Thời Khóa Biểu &amp; Tiết Học Còn Yếu</h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Xem lịch học từ Thứ 2 đến Thứ 7. Những tiết học con gặp khó khăn hoặc cần chú ý sẽ được đánh dấu rõ ràng theo từng ngày.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Điểm Số &amp; Nhận Xét Từ Giáo Viên Bộ Môn</h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Xem bảng điểm các môn học và đọc lời nhận xét trực tiếp từ từng Giáo viên bộ môn kèm dấu xác nhận người cập nhật.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Đánh Giá Tuần, Phản Hồi &amp; Nút Quay Lại</h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Theo dõi nhận xét tuần của GVCN và gửi ý kiến trao đổi trực tiếp. Khi cần quay lại trang chủ hoặc chọn học sinh khác, nhấn nút <ArrowLeft className="w-3.5 h-3.5 inline" /> <strong>Quay lại</strong> trên thanh tiêu đề.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HOMEROOM' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>Hướng dẫn dành cho Giáo viên Chủ nhiệm (GVCN)</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                  <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs shrink-0">1</span>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
                      Nhập Mật Khẩu Giáo Viên Chủ Nhiệm
                    </h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Nhấn thẻ <strong>Giáo Viên Chủ Nhiệm</strong> tại trang chủ và nhập mật khẩu GVCN (mật khẩu mặc định ban đầu là <strong className="font-mono">123</strong>, có thể nhấn <strong>Đổi Mật Khẩu</strong> sau khi đăng nhập).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs shrink-0">2</span>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Quản Lý Mật Khẩu Phụ Huynh</h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Vào tab &quot;Mật Khẩu Phụ Huynh&quot; để tạo ngẫu nhiên hoặc đặt mật khẩu đăng nhập cho từng Phụ huynh học sinh.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs shrink-0">3</span>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Đánh Giá Tuần, Thông Báo &amp; Thời Khóa Biểu</h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Chọn Học sinh &amp; Tuần để cập nhật số tiết vắng, danh sách tiết yếu, nhận xét tuần của GVCN, đăng thông báo lớp và chỉnh sửa Thời khóa biểu.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs shrink-0">4</span>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                      <History className="w-4 h-4 text-emerald-600" />
                      <span>Theo Dõi Nhật Ký Chỉnh Sửa (Audit Log)</span>
                    </h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Kiểm tra minh bạch giáo viên hay phụ huynh nào đã cập nhật điểm, nhận xét hay đổi mật khẩu vào thời điểm nào.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SUBJECT' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <BookMarked className="w-5 h-5 text-purple-600" />
                <span>Hướng dẫn dành cho Giáo viên Bộ môn (GVBM)</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
                  <span className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-bold text-xs shrink-0">1</span>
                  <div>
                    <h4 className="font-semibold text-purple-950 text-sm sm:text-base">Chọn Môn Giảng Dạy &amp; Nhập Mật Khẩu Riêng</h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Chọn thẻ <strong>Giáo Viên Bộ Môn</strong>, chọn đúng môn phụ trách (Ngữ Văn, Tiếng Anh, Vật Lý, Hóa Học...) và nhập mật khẩu (mặc định ban đầu là <strong>123</strong>). Sau khi đăng nhập, thầy/cô có thể nhấn <strong>Đổi Mật Khẩu</strong> để tự đặt mật khẩu mới.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                  <span className="px-2.5 py-1 bg-purple-200 text-purple-800 rounded-lg font-bold text-xs shrink-0">2</span>
                  <div>
                    <h4 className="font-semibold text-purple-950 text-sm sm:text-base">Nhập Điểm Số &amp; Viết Lời Nhận Xét Môn Học</h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Cập nhật điểm Miệng, 15 phút, 1 tiết, Giữa kỳ, Cuối kỳ và nhập nhận xét riêng cho từng học sinh. Hệ thống tự tính điểm trung bình và khóa quyền chỉnh sửa nhận xét đối với GVCN.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                  <span className="px-2.5 py-1 bg-purple-200 text-purple-800 rounded-lg font-bold text-xs shrink-0">3</span>
                  <div>
                    <h4 className="font-semibold text-purple-950 text-sm sm:text-base">Đồng Bộ Trực Tiếp Lên Firebase Cloud</h4>
                    <p className="text-sm text-[#374151] mt-0.5">
                      Sau khi bấm lưu, điểm số, lời nhận xét và tên người cập nhật lập tức đồng bộ sang sổ liên lạc của Phụ huynh và Nhật ký chỉnh sửa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-100 px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-500">D2KN Edu · Sổ Liên Lạc Điện Tử Đồng Bộ Firebase</p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm cursor-pointer shrink-0"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
