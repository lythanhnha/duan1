import React, { useState, useImperativeHandle } from 'react';
import { 
  Calendar, Award, AlertTriangle, MessageSquare, BookOpen, 
  Send, Sparkles, CheckCircle2, User, HelpCircle, 
  ChevronRight, X, Info, TrendingUp, Clock, FileText, Megaphone,
  Key, Lock, Eye, EyeOff, AlertCircle, ShieldCheck, Pin, BellRing
} from 'lucide-react';
import { Student, TeacherInfo, WeeklySchedule, SubjectScore, WeeklyReport, Announcement, WeakPointDetail } from '../types';
import { DataService } from '../services/dataStorage';
import { UnsavedChangesModal, UnsavedGuardHandle } from './UnsavedChangesModal';

interface Props {
  student: Student;
  teacher: TeacherInfo;
  dataVersion?: number;
  guardRef?: React.RefObject<UnsavedGuardHandle | null>;
}

export const ParentDashboard: React.FC<Props> = ({ student, teacher, dataVersion, guardRef }) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<SubjectScore | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isFeedbackSent, setIsFeedbackSent] = useState<boolean>(false);

  // Password Change state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  // Pending navigation confirmation modal
  const [pendingAction, setPendingAction] = useState<{
    message: string;
    onSave: () => boolean | void;
    onDiscard: () => void;
    onProceed: () => void;
  } | null>(null);

  // Pinned important announcements alert modal state
  const [dismissedPinnedIds, setDismissedPinnedIds] = useState<string[]>([]);
  const [isPinnedModalForceOpen, setIsPinnedModalForceOpen] = useState<boolean>(false);

  // Load week-specific data (dataVersion ensures fresh reads when realtime updates arrive)
  void dataVersion;
  const schedule: WeeklySchedule = DataService.getWeeklySchedule(selectedWeek);
  const subjectScores: SubjectScore[] = DataService.getSubjectScores(student.id);
  const weeklyReport: WeeklyReport = DataService.getWeeklyReport(student.id, selectedWeek);
  const announcements: Announcement[] = DataService.getAnnouncements();

  const pinnedAnnouncements = announcements.filter((ann) => Boolean(ann.isPinned));
  const unreadPinnedAnnouncements = pinnedAnnouncements.filter((ann) => !dismissedPinnedIds.includes(ann.id));
  const modalPinnedList =
    unreadPinnedAnnouncements.length > 0
      ? unreadPinnedAnnouncements
      : isPinnedModalForceOpen
      ? pinnedAnnouncements
      : [];
  const showPinnedAlertModal = modalPinnedList.length > 0;

  const handleDismissPinnedModal = () => {
    const idsToDismiss = modalPinnedList.map((a) => a.id);
    setDismissedPinnedIds((prev) => Array.from(new Set([...prev, ...idsToDismiss])));
    setIsPinnedModalForceOpen(false);
  };

  const isFeedbackDirty = feedbackInput.trim().length > 0;

  const saveFeedbackNow = (): boolean => {
    if (!feedbackInput.trim()) return false;
    DataService.saveParentFeedback(student.id, selectedWeek, feedbackInput.trim());
    DataService.recordAuditLog({
      actorRole: 'PARENT',
      action: 'SEND_PARENT_FEEDBACK',
      targetType: 'WEEKLY_REPORT',
      targetLabel: `Tuần ${selectedWeek} • ${student.name}`,
      summary: `Phụ huynh gửi phản hồi tuần ${selectedWeek}: "${feedbackInput.trim().slice(0, 120)}${feedbackInput.trim().length > 120 ? '...' : ''}"`,
    });
    setFeedbackInput('');
    setIsFeedbackSent(true);
    setTimeout(() => setIsFeedbackSent(false), 3000);
    return true;
  };

  useImperativeHandle(guardRef, () => ({
    hasUnsavedChanges: () => isFeedbackDirty,
    saveUnsavedChanges: () => saveFeedbackNow(),
    getUnsavedDescription: () =>
      `Bạn đã nhập nội dung phản hồi Tuần ${selectedWeek} cho giáo viên nhưng chưa bấm gửi. Bạn có muốn lưu & gửi trước khi rời khỏi không?`,
  }));

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    saveFeedbackNow();
  };

  const handleWeekChangeAttempt = (nextWeek: number) => {
    if (nextWeek === selectedWeek) return;
    if (isFeedbackDirty) {
      setPendingAction({
        message: `Bạn đã nhập phản hồi cho Tuần ${selectedWeek} nhưng chưa bấm "Gửi Cho Giáo Viên". Bạn có muốn lưu & gửi trước khi chuyển sang Tuần ${nextWeek} không?`,
        onSave: () => saveFeedbackNow(),
        onDiscard: () => setFeedbackInput(''),
        onProceed: () => setSelectedWeek(nextWeek),
      });
      return;
    }
    setSelectedWeek(nextWeek);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (currentPassword !== student.parentPassword) {
      setPasswordError('Mật khẩu hiện tại không chính xác!');
      return;
    }

    if (newPassword.trim().length < 3) {
      setPasswordError('Mật khẩu mới phải có ít nhất 3 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }

    DataService.updateStudentPassword(student.id, newPassword);
    student.parentPassword = newPassword;
    DataService.recordAuditLog({
      actorRole: 'PARENT',
      action: 'UPDATE_PARENT_PASSWORD',
      targetType: 'STUDENT_PASSWORD',
      targetLabel: `Học sinh ${student.name} (${student.studentCode})`,
      summary: 'Phụ huynh tự đổi mật khẩu truy cập Sổ liên lạc',
    });
    setPasswordSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được lưu.');

    setTimeout(() => {
      setIsChangePasswordOpen(false);
      setPasswordSuccess('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 font-sans">
      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={pendingAction !== null}
        title="Xác nhận lưu phản hồi"
        message={pendingAction?.message}
        saveLabel="Lưu & Tiếp tục"
        onSaveAndContinue={() => {
          if (!pendingAction) return;
          const ok = pendingAction.onSave();
          const proceed = pendingAction.onProceed;
          setPendingAction(null);
          if (ok !== false) proceed();
        }}
        onDiscardAndContinue={() => {
          if (!pendingAction) return;
          pendingAction.onDiscard();
          const proceed = pendingAction.onProceed;
          setPendingAction(null);
          proceed();
        }}
        onCancel={() => setPendingAction(null)}
      />

      {/* Student Profile Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={student.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-200 border-2 border-white/30 shadow-md flex items-end justify-center overflow-hidden shrink-0">
                <svg className="w-[85%] h-[85%] text-slate-400 translate-y-[10%]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs bg-emerald-400/20 text-emerald-100 px-3 py-0.5 rounded-full border border-emerald-400/30 font-semibold whitespace-nowrap">
                  Sổ Liên Lạc Học Sinh
                </span>
                <span className="text-xs bg-indigo-400/20 text-indigo-100 px-3 py-0.5 rounded-full border border-indigo-400/30 font-semibold whitespace-nowrap">
                  Mã: {student.studentCode}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{student.name}</h1>
              <p className="text-sm font-medium text-emerald-100 mt-1">
                {teacher.className} • GVCN: {teacher.name} • Ngày sinh: {student.dob}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Password Change */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <div className="text-center px-3">
                <span className="text-xs font-semibold text-emerald-200 block whitespace-nowrap">ĐTB Chung</span>
                <span className="text-2xl font-black text-amber-300">{student.overallGPA}</span>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center px-3">
                <span className="text-xs font-semibold text-emerald-200 block whitespace-nowrap">Hạnh Kiểm</span>
                <span className="text-lg font-extrabold text-emerald-300">{student.conduct}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsChangePasswordOpen(true);
                setPasswordError('');
                setPasswordSuccess('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="px-3.5 py-3 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold backdrop-blur-md border border-white/20 transition-all flex items-center space-x-2 shadow-xs cursor-pointer active:scale-95"
              title="Thay đổi mật khẩu đăng nhập của phụ huynh"
            >
              <Key className="w-4 h-4 text-emerald-300" />
              <span>Đổi Mật Khẩu</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION: THỜI KHÓA BIỂU THEO TUẦN (NẰM Ở TRÊN) */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Thời Khóa Biểu Học Sinh (Cập nhật theo tuần)
              </h2>
              <p className="text-xs text-slate-500">
                Lịch học cố định hàng ngày • Các tiết được giáo viên đánh giá cần chú ý sẽ nổi bật đỏ
              </p>
            </div>
          </div>

          {/* Week selector */}
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shrink-0">
            <span className="text-xs font-bold text-slate-600 pl-2 whitespace-nowrap">Chọn Tuần:</span>
            <select
              value={selectedWeek}
              onChange={(e) => handleWeekChangeAttempt(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-indigo-700 shadow-2xs focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Tuần {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timetable Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="p-3 border border-slate-800 text-center w-28">Tiết / Giờ</th>
                {schedule.days.map((d) => (
                  <th key={d.dayName} className="p-3 border border-slate-800 text-center">
                    {d.dayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((periodNum) => (
                <tr key={periodNum} className="hover:bg-slate-50/80">
                  {/* Period Time Column */}
                  <td className="p-2.5 border border-slate-200 font-bold text-center bg-slate-50 text-slate-700">
                    <div className="text-xs">Tiết {periodNum}</div>
                    <div className="text-2xs text-slate-400 font-normal">
                      {periodNum === 1 ? '07:30 - 08:15' :
                       periodNum === 2 ? '08:20 - 09:05' :
                       periodNum === 3 ? '09:15 - 10:00' :
                       periodNum === 4 ? '10:05 - 10:50' : '11:00 - 11:45'}
                    </div>
                  </td>

                  {/* Day Columns */}
                  {schedule.days.map((day) => {
                    const period = day.periods.find((p) => p.periodNumber === periodNum);
                    // Check if this specific day & period is flagged in weekly report as a weak point
                    const isWeak = weeklyReport.weakPoints.some(
                      (wp) => wp.day === day.dayName && wp.periodNumber === periodNum
                    );
                    const weakDetail = weeklyReport.weakPoints.find(
                      (wp) => wp.day === day.dayName && wp.periodNumber === periodNum
                    );

                    return (
                      <td key={day.dayName} className="p-2 border border-slate-200 min-w-[120px]">
                        {period ? (
                          <div
                            className={`p-2.5 rounded-xl border transition-all text-center space-y-1 relative group ${
                              isWeak
                                ? 'bg-red-50 border-red-300 text-red-950 shadow-2xs'
                                : 'bg-slate-50/90 border-slate-200/80 text-slate-800 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <span className="font-extrabold text-xs">{period.subject}</span>
                              {isWeak && (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" />
                              )}
                            </div>
                            <p className="text-2xs text-slate-500 font-medium">{period.room}</p>

                            {/* Weak point popover info */}
                            {isWeak && weakDetail && (
                              <div className="mt-1 text-2xs bg-red-100 text-red-900 p-1 rounded font-semibold leading-tight">
                                ⚠️ {weakDetail.reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-slate-300 text-2xs">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TWO COLUMN MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: XEM ĐIỂM SỐ & QUÁ TRÌNH HỌC TẬP (BÊN TRÁI) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Bảng Điểm & Kết Quả Học Tập Môn Học
                  </h2>
                  <p className="text-xs text-slate-500">Nhấn vào môn học để xem chi tiết điểm các cột bài kiểm tra</p>
                </div>
              </div>
            </div>

            {/* Subject Grade Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjectScores.map((score) => (
                <div
                  key={score.subjectName}
                  onClick={() => setSelectedSubject(score)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    score.isNeedingImprovement
                      ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                      : 'bg-slate-50/60 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                        {score.subjectName}
                      </h3>
                      {score.isNeedingImprovement && (
                        <span className="text-2xs bg-amber-200 text-amber-950 font-extrabold px-1.5 py-0.5 rounded">
                          Cần cải thiện
                        </span>
                      )}
                    </div>
                    <p className="text-2xs text-slate-500 truncate">{score.teacherName}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-semibold">ĐTB</span>
                      <span
                        className={`text-base font-black ${
                          score.averageScore >= 8.0
                            ? 'text-emerald-600'
                            : score.averageScore >= 6.5
                            ? 'text-indigo-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {score.averageScore}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TÌNH HÌNH HỌC TẬP TRONG CÁC TUẦN & TƯƠNG TÁC (BÊN PHẢI) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Weekly Status & Weak Point Alerts */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Tình Hình Học Tập Tuần {selectedWeek}
                  </h2>
                  <p className="text-xs text-slate-500">Đánh giá chung và số tiết vắng trong tuần</p>
                </div>
              </div>

              <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                Xếp loại: {weeklyReport.learningStatus}
              </span>
            </div>

            {/* Attendance Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-2xs text-slate-500 font-medium block">Tổng Số Tiết</span>
                <span className="text-lg font-bold text-slate-800">{weeklyReport.totalPeriods}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-2xs text-emerald-700 font-medium block">Vắng Có Phép</span>
                <span className="text-lg font-bold text-emerald-700">{weeklyReport.excusedAbsences}</span>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                <span className="text-2xs text-red-600 font-medium block">Vắng Không Phép</span>
                <span className="text-lg font-bold text-red-600">{weeklyReport.unexcusedAbsences}</span>
              </div>
            </div>

            {/* WEAK POINTS / TIẾT HỌC CẦN LƯU Ý IN THIS WEEK */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Tiết Học & Môn Học Học Sinh Còn Yếu Tuần {selectedWeek}</span>
              </h3>

              {weeklyReport.weakPoints.length === 0 ? (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center space-x-3 text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Tuần này học sinh tham gia học tập tốt, chưa có tiết học yếu bị ghi nhận!</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {weeklyReport.weakPoints.map((wp) => (
                    <div
                      key={wp.id}
                      className="p-3.5 bg-red-50/80 border border-red-200 rounded-2xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-950">
                          {wp.day} • Tiết {wp.periodNumber} ({wp.timeSlot})
                        </span>
                        <span className="px-2 py-0.5 bg-red-200 text-red-950 font-bold rounded text-2xs">
                          Môn {wp.subject}
                        </span>
                      </div>
                      <p className="text-red-900 text-xs mt-1">Lý do: {wp.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TEACHER REMARK */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-1.5">
              <h4 className="font-bold text-indigo-900 text-xs flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Nhận Xét Của Giáo Viên Chủ Nhiệm (Tuần {selectedWeek})</span>
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{weeklyReport.teacherComment || 'Chưa có nhận xét.'}"
              </p>
              {(weeklyReport.updatedByName || weeklyReport.updatedByEmail) && (
                <div className="pt-1 flex items-center space-x-1.5 text-2xs text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Đã cập nhật bởi <strong>{weeklyReport.updatedByName || weeklyReport.updatedByEmail}</strong> lúc {weeklyReport.updatedAt}
                  </span>
                </div>
              )}
            </div>

            {/* SUBJECT TEACHERS REMARKS OVERVIEW */}
            <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2.5">
              <h4 className="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Lời Nhận Xét Từ Các Giáo Viên Bộ Môn</span>
              </h4>
              <div className="space-y-2">
                {subjectScores.filter(s => s.teacherRemark && s.teacherRemark.trim()).length === 0 ? (
                  <p className="text-2xs text-purple-800 italic">Chưa có nhận xét bộ môn cho học sinh này.</p>
                ) : (
                  subjectScores.filter(s => s.teacherRemark && s.teacherRemark.trim()).map(s => (
                    <div key={s.subjectName} className="p-2.5 bg-white rounded-xl border border-purple-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900">Môn {s.subjectName} — {s.teacherName}</span>
                        <span className="text-2xs bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded">ĐTB: {s.averageScore}</span>
                      </div>
                      <p className="text-slate-800 italic">"{s.teacherRemark}"</p>
                      {(s.updatedByName || s.updatedByEmail) && (
                        <div className="flex items-center space-x-1 text-2xs text-emerald-700 font-medium pt-0.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>
                            Đã cập nhật bởi <span className="font-semibold">{s.updatedByName || s.updatedByEmail}</span>
                            {s.updatedAt ? ` lúc ${s.updatedAt}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* INTERACTION WITH TEACHER (GỬI PHẢN HỒI CHO GIÁO VIÊN) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Trao Đổi / Phản Hồi Cho Giáo Viên Tuần Này</span>
                </h3>
              </div>

              {weeklyReport.parentFeedback && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-2xs text-slate-500">
                    <span className="font-bold text-slate-700">Phản hồi đã gửi của Phụ huynh:</span>
                    <span>{weeklyReport.parentFeedbackDate}</span>
                  </div>
                  <p className="text-slate-800 font-medium">"{weeklyReport.parentFeedback}"</p>
                </div>
              )}

              <form onSubmit={handleSendFeedback} className="space-y-2">
                <textarea
                  rows={2}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Nhập ý kiến, thắc mắc hoặc thông báo gửi tới Cô chủ nhiệm cho tuần này..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />

                <div className="flex items-center justify-between">
                  {isFeedbackSent ? (
                    <span className="text-2xs font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã gửi phản hồi thành công!</span>
                    </span>
                  ) : (
                    <span className="text-2xs text-slate-400">Giáo viên sẽ nhận được tin nhắn này.</span>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Cho Giáo Viên</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* CLASS ANNOUNCEMENTS FEED */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <span>Bảng Tin Thông Báo Từ Giáo Viên</span>
              </h2>
              {pinnedAnnouncements.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPinnedModalForceOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5 text-orange-600" />
                  <span>Xem {pinnedAnnouncements.length} tin ghim quan trọng</span>
                </button>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                Hiện chưa có thông báo mới từ Giáo viên chủ nhiệm.
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                      ann.isPinned
                        ? 'bg-gradient-to-r from-amber-50/90 to-orange-50/50 border-2 border-amber-300 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ann.isPinned && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-orange-600 text-white rounded font-bold text-2xs">
                            <Pin className="w-3 h-3" />
                            <span>Đã Ghim • Quan trọng</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-2xs">
                          {ann.category}
                        </span>
                      </div>
                      <span className="text-2xs text-slate-400">{ann.date}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* IMPORTANT PINNED ANNOUNCEMENT ALERT MODAL */}
      {showPinnedAlertModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleDismissPinnedModal}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-amber-300 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white flex items-start justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-2xl border border-white/30 shrink-0">
                  <BellRing className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100 block">
                    Thông báo quan trọng được ghim
                  </span>
                  <h3 className="font-extrabold text-lg sm:text-xl leading-snug">
                    Có {modalPinnedList.length} thông báo quan trọng từ GVCN!
                  </h3>
                  <p className="text-xs text-amber-50 mt-0.5">
                    {teacher.className} · GVCN: {teacher.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissPinnedModal}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-amber-50/30">
              {modalPinnedList.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-amber-200 shadow-xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-orange-600 text-white text-2xs font-bold">
                        <Pin className="w-3 h-3" />
                        <span>Đã Ghim</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-2xs font-bold">
                        {ann.category}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{ann.date}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                    {ann.title}
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>
                  <div className="pt-1 text-[11px] text-slate-400 font-medium">
                    Người đăng: {ann.author}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Bạn vẫn có thể xem lại các tin đã ghim ở mục <strong>Bảng Tin Thông Báo</strong> bên dưới.
              </p>
              <button
                type="button"
                onClick={handleDismissPinnedModal}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Đã Đọc Xong • Tắt Thông Báo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED SUBJECT MODAL */}
      {selectedSubject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedSubject(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-indigo-600">Chi Tiết Điểm Môn</span>
                <h3 className="font-extrabold text-slate-900 text-xl">{selectedSubject.subjectName}</h3>
                <p className="text-xs text-slate-500">Giảng dạy: {selectedSubject.teacherName}</p>
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breakdown of test scores */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Điểm Kiểm Tra Miệng</span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {selectedSubject.oralScores.join(', ')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Điểm 15 Phút</span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {selectedSubject.scores15m.join(', ')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Điểm 1 Tiết (45 Phút)</span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {selectedSubject.scores45m.join(', ')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Thi Giữa Kỳ</span>
                <span className="font-mono text-xs font-bold text-indigo-700">
                  {selectedSubject.midtermScore ?? 'Chưa thi'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Thi Cuối Kỳ</span>
                <span className="font-mono text-xs font-bold text-indigo-700">
                  {selectedSubject.finalScore ?? 'Chưa thi'}
                </span>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Điểm Trung Bình Môn</span>
                <span className="text-2xl font-black text-indigo-700">{selectedSubject.averageScore}</span>
              </div>

              {selectedSubject.teacherRemark && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Nhận xét bộ môn:</span>
                  <p>"{selectedSubject.teacherRemark}"</p>
                </div>
              )}

              {(selectedSubject.updatedByName || selectedSubject.updatedByEmail) && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Đã cập nhật bởi <strong>{selectedSubject.updatedByName || selectedSubject.updatedByEmail}</strong>
                    {selectedSubject.updatedAt ? ` lúc ${selectedSubject.updatedAt}` : ''}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSubject(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Đóng Chi Tiết
            </button>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if ((currentPassword || newPassword || confirmPassword) && !passwordSuccess) {
              setPendingAction({
                message: 'Bạn đang nhập thông tin đổi mật khẩu nhưng chưa cập nhật. Bạn có muốn lưu hoặc hủy bỏ thay đổi này?',
                onSave: () => {
                  const form = document.getElementById('parent-change-pass-form') as HTMLFormElement | null;
                  form?.requestSubmit();
                  return false;
                },
                onDiscard: () => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                },
                onProceed: () => setIsChangePasswordOpen(false),
              });
              return;
            }
            setIsChangePasswordOpen(false);
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Đổi Mật Khẩu Phụ Huynh</h3>
                  <p className="text-xs text-slate-500">Tài khoản học sinh: {student.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="parent-change-pass-form" onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang sử dụng..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu mới</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 3 ký tự)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Xác nhận mật khẩu mới</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  <Key className="w-4 h-4" />
                  <span>Cập Nhật Mật Khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
