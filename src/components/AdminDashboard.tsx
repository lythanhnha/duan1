import React, { useState, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  School,
  Users,
  BookMarked,
  Megaphone,
  History,
  Database,
  Plus,
  Edit3,
  Trash2,
  KeyRound,
  ArrowRightLeft,
  Download,
  Upload,
  RefreshCw,
  Pin,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  MailCheck,
  Send,
  LogOut,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';
import {
  AdminSessionInfo,
  AdminWhitelistEntry,
  Announcement,
  AuditLogEntry,
  ClassRoomInfo,
  Student,
  SubjectTeacherInfo,
  TeacherInfo,
} from '../types';
import { DataService, SUPER_ADMIN_EMAIL } from '../services/dataStorage';
import {
  authorizeGmailAccess,
  buildWhitelistConfirmationEmailContent,
  getActiveGmailToken,
  sendWhitelistConfirmationGmail,
  WhitelistEmailPayload,
} from '../services/gmailService';

interface Props {
  admin: AdminSessionInfo;
  classes: ClassRoomInfo[];
  dataVersion?: number;
  onRefreshAll: () => void;
  onLogout: () => void;
}

type AdminTab = 'CLASSES' | 'SUBJECT_TEACHERS' | 'STUDENTS' | 'ANNOUNCEMENTS' | 'AUDIT_LOGS' | 'SYSTEM';

export const AdminDashboard: React.FC<Props> = ({
  admin,
  classes,
  dataVersion,
  onRefreshAll,
  onLogout,
}) => {
  void dataVersion;
  const [activeTab, setActiveTab] = useState<AdminTab>('CLASSES');
  const [toast, setToast] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const triggerSync = () => {
    setLocalRefresh((v) => v + 1);
    onRefreshAll();
  };

  // ==================== CLASS & GVCN STATE ====================
  const [showPasswordsMap, setShowPasswordsMap] = useState<Record<string, boolean>>({});
  const [editingClass, setEditingClass] = useState<{
    classId: string;
    className: string;
    schoolYear: string;
    teacherName: string;
    teacherCode: string;
    subject: string;
    phone: string;
    password: string;
  } | null>(null);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    className: '',
    schoolYear: '2025 - 2026',
    teacherName: '',
    teacherCode: '',
    subject: 'Chủ nhiệm / Giáo viên',
    phone: '',
    password: '123',
  });
  const [classFormError, setClassFormError] = useState('');
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<ClassRoomInfo | null>(null);

  // ==================== SUBJECT TEACHERS STATE ====================
  const [selectedSTClassId, setSelectedSTClassId] = useState<string>(classes[0]?.id || 'class_10a1');
  const [applySTToAllClasses, setApplySTToAllClasses] = useState(false);
  const [stDrafts, setStDrafts] = useState<SubjectTeacherInfo[]>(() =>
    DataService.getSubjectTeachersForClass(classes[0]?.id || 'class_10a1')
  );

  const handleSelectSTClass = (classId: string) => {
    setSelectedSTClassId(classId);
    setStDrafts(DataService.getSubjectTeachersForClass(classId));
  };

  // ==================== STUDENTS CROSS-CLASS STATE ====================
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilterClass, setStudentFilterClass] = useState<string>('ALL');
  const [onlyNeedSupport, setOnlyNeedSupport] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{
    student: Student;
    fromClassId: string;
    fromClassName: string;
    toClassId: string;
  } | null>(null);

  // ==================== ANNOUNCEMENTS STATE ====================
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<Announcement['category']>('Thông báo chung');
  const [annPinned, setAnnPinned] = useState(true);
  const [annViewClassId, setAnnViewClassId] = useState<string>(classes[0]?.id || 'class_10a1');

  // ==================== AUDIT LOGS STATE ====================
  const [auditFilterClass, setAuditFilterClass] = useState<string>('ALL');
  const [auditFilterRole, setAuditFilterRole] = useState<string>('ALL');

  // ==================== WHITELIST & BACKUP STATE ====================
  const [whitelist, setWhitelist] = useState<AdminWhitelistEntry[]>(() => DataService.getAdminWhitelist());
  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');
  const [newWhitelistNote, setNewWhitelistNote] = useState('');
  const [whitelistError, setWhitelistError] = useState('');
  const [whitelistAddedNotice, setWhitelistAddedNotice] = useState<{
    email: string;
    note: string;
    addedAt: string;
  } | null>(null);
  const [pendingGmailConfirm, setPendingGmailConfirm] = useState<{
    email: string;
    note: string;
    addedAt: string;
    isNewAddition: boolean;
  } | null>(null);
  const [gmailSending, setGmailSending] = useState(false);
  const [gmailAuthorizing, setGmailAuthorizing] = useState(false);
  const [gmailSentInfo, setGmailSentInfo] = useState<{ email: string; messageId: string } | null>(null);
  const [gmailError, setGmailError] = useState('');
  const [hasGmailToken, setHasGmailToken] = useState<boolean>(() => Boolean(getActiveGmailToken()));
  const [isFactoryResetConfirmOpen, setIsFactoryResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ==================== DERIVED DATA ====================
  const classSnapshots = useMemo(() => {
    void localRefresh;
    return classes.map((cls) => {
      const teacher: TeacherInfo = DataService.getTeacher(cls.id);
      const students = DataService.getStudentsForClass(cls.id);
      const avgGPA =
        students.length > 0
          ? Number(
              (students.reduce((acc, s) => acc + (Number(s.overallGPA) || 0), 0) / students.length).toFixed(2)
            )
          : 0;
      const announcements = DataService.getAnnouncementsForClass(cls.id);
      return {
        classInfo: cls,
        teacher,
        students,
        avgGPA,
        announcementsCount: announcements.length,
        pinnedCount: announcements.filter((a) => Boolean(a.isPinned)).length,
      };
    });
  }, [classes, localRefresh]);

  const allStudentsRows = useMemo(() => {
    void localRefresh;
    const rows: Array<{
      student: Student;
      classId: string;
      className: string;
      teacherName: string;
      weakPointsCount: number;
    }> = [];
    classSnapshots.forEach((snap) => {
      snap.students.forEach((student) => {
        const w1 = DataService.getWeeklyReportForClass(snap.classInfo.id, student.id, 1);
        rows.push({
          student,
          classId: snap.classInfo.id,
          className: snap.teacher.className,
          teacherName: snap.teacher.name,
          weakPointsCount: Array.isArray(w1.weakPoints) ? w1.weakPoints.length : 0,
        });
      });
    });
    return rows;
  }, [classSnapshots, localRefresh]);

  const filteredStudentRows = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    return allStudentsRows.filter((row) => {
      if (studentFilterClass !== 'ALL' && row.classId !== studentFilterClass) return false;
      if (onlyNeedSupport && row.student.overallGPA >= 6.5 && row.weakPointsCount === 0) return false;
      if (!q) return true;
      return (
        row.student.name.toLowerCase().includes(q) ||
        row.student.studentCode.toLowerCase().includes(q) ||
        row.className.toLowerCase().includes(q)
      );
    });
  }, [allStudentsRows, studentSearch, studentFilterClass, onlyNeedSupport]);

  const allAuditLogs = useMemo(() => {
    void localRefresh;
    const combined: Array<AuditLogEntry & { classId: string; className: string }> = [];
    classes.forEach((cls) => {
      const logs = DataService.getAuditLogsForClass(cls.id);
      logs.forEach((log) => {
        combined.push({
          ...log,
          classId: cls.id,
          className: cls.className,
        });
      });
    });
    return combined.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [classes, localRefresh]);

  const filteredAuditLogs = useMemo(() => {
    return allAuditLogs.filter((log) => {
      if (auditFilterClass !== 'ALL' && log.classId !== auditFilterClass) return false;
      if (auditFilterRole !== 'ALL' && log.actorRole !== auditFilterRole) return false;
      return true;
    });
  }, [allAuditLogs, auditFilterClass, auditFilterRole]);

  const totalStudentsCount = allStudentsRows.length;
  const needSupportCount = allStudentsRows.filter(
    (r) => r.student.overallGPA < 6.5 || r.weakPointsCount > 0
  ).length;

  // ==================== HANDLERS ====================
  const handleSaveClassEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (!editingClass.className.trim() || !editingClass.teacherName.trim()) {
      setClassFormError('Tên lớp và Tên GVCN không được để trống.');
      return;
    }
    DataService.updateClassDetails(editingClass.classId, editingClass);
    setEditingClass(null);
    setClassFormError('');
    triggerSync();
    showToast(`Đã cập nhật ${editingClass.className} (GVCN: ${editingClass.teacherName})`);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanClass = newClassForm.className.trim();
    const cleanTeacher = newClassForm.teacherName.trim();
    if (!cleanClass || !cleanTeacher) {
      setClassFormError('Vui lòng nhập đầy đủ Tên lớp và Tên GVCN.');
      return;
    }
    if (classes.some((c) => c.className.trim().toLowerCase() === cleanClass.toLowerCase())) {
      setClassFormError(`Lớp "${cleanClass}" đã tồn tại.`);
      return;
    }
    const created = DataService.createClass({
      ...newClassForm,
      teacherCode:
        newClassForm.teacherCode.trim() ||
        `GV${cleanClass.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || classes.length + 1}`,
    });
    setIsAddClassOpen(false);
    setNewClassForm({
      className: '',
      schoolYear: '2025 - 2026',
      teacherName: '',
      teacherCode: '',
      subject: 'Chủ nhiệm / Giáo viên',
      phone: '',
      password: '123',
    });
    setClassFormError('');
    triggerSync();
    showToast(`Đã tạo ${created.className} (GVCN: ${created.teacherName})`);
  };

  const handleConfirmDeleteClass = () => {
    if (!confirmDeleteClass) return;
    if (classes.length <= 1) {
      showToast('Không thể xóa lớp cuối cùng trong hệ thống.');
      setConfirmDeleteClass(null);
      return;
    }
    const name = confirmDeleteClass.className;
    DataService.deleteClass(confirmDeleteClass.id);
    setConfirmDeleteClass(null);
    triggerSync();
    showToast(`Đã xóa ${name} khỏi hệ thống.`);
  };

  const handleSaveSubjectTeachers = () => {
    if (applySTToAllClasses) {
      classes.forEach((cls) => {
        DataService.saveSubjectTeachersForClass(cls.id, stDrafts);
      });
      triggerSync();
      showToast(`Đã cập nhật danh sách Giáo viên Bộ môn cho toàn bộ ${classes.length} lớp!`);
    } else {
      DataService.saveSubjectTeachersForClass(selectedSTClassId, stDrafts);
      triggerSync();
      const targetClass = classes.find((c) => c.id === selectedSTClassId)?.className || 'lớp';
      showToast(`Đã lưu danh sách Giáo viên Bộ môn cho ${targetClass}!`);
    }
  };

  const handleResetAllSubjectTeacherPasswords = () => {
    const resetList = stDrafts.map((st) => ({ ...st, password: '123' }));
    setStDrafts(resetList);
    if (applySTToAllClasses) {
      classes.forEach((cls) => DataService.saveSubjectTeachersForClass(cls.id, resetList));
      showToast(`Đã đặt lại mật khẩu GV Bộ môn về "123" cho tất cả ${classes.length} lớp.`);
    } else {
      DataService.saveSubjectTeachersForClass(selectedSTClassId, resetList);
      showToast('Đã đặt lại mật khẩu GV Bộ môn của lớp về "123".');
    }
    triggerSync();
  };

  const handleExecuteTransferStudent = () => {
    if (!transferTarget) return;
    const moved = DataService.transferStudentBetweenClasses(
      transferTarget.student.id,
      transferTarget.fromClassId,
      transferTarget.toClassId
    );
    if (moved) {
      const destName = classes.find((c) => c.id === transferTarget.toClassId)?.className || 'lớp mới';
      showToast(`Đã chuyển em ${moved.name} sang ${destName}.`);
      triggerSync();
    }
    setTransferTarget(null);
  };

  const handleResetStudentParentPassword = (classId: string, student: Student) => {
    const students = DataService.getStudentsForClass(classId).map((s) =>
      s.id === student.id ? { ...s, parentPassword: '123' } : s
    );
    const prevActive = DataService.getActiveClassId();
    DataService.setActiveClassId(classId);
    DataService.saveStudents(students);
    DataService.setActiveClassId(prevActive);
    triggerSync();
    showToast(`Đã đặt lại mật khẩu phụ huynh em ${student.name} về "123".`);
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.');
      return;
    }
    DataService.broadcastSchoolAnnouncement(
      annTitle,
      annContent,
      annCategory,
      annPinned,
      `Ban Giám Hiệu (${admin.displayName})`
    );
    setAnnTitle('');
    setAnnContent('');
    triggerSync();
    showToast(`Đã phát thông báo tới toàn bộ ${classes.length} lớp học!`);
  };

  const openGmailConfirmModal = (info: {
    email: string;
    note: string;
    addedAt: string;
    isNewAddition: boolean;
  }) => {
    setGmailSending(false);
    setGmailAuthorizing(false);
    setGmailSentInfo(null);
    setGmailError('');
    setHasGmailToken(Boolean(getActiveGmailToken()));
    setPendingGmailConfirm(info);
  };

  const buildPendingGmailPayload = (target: {
    email: string;
    note: string;
    addedAt: string;
  }): WhitelistEmailPayload => ({
    toEmail: target.email,
    roleNote: target.note || 'Quản trị viên',
    addedAt: target.addedAt,
    grantedByEmail: admin.email,
    grantedByName: admin.displayName || admin.email,
    appUrl: typeof window !== 'undefined' ? window.location.origin : 'D2KN Edu',
  });

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newWhitelistEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setWhitelistError('Vui lòng nhập địa chỉ email Google hợp lệ.');
      return;
    }
    if (whitelist.some((w) => w.email.toLowerCase() === email)) {
      setWhitelistError('Email này đã có trong danh sách Whitelist.');
      return;
    }
    const updated = DataService.addAdminWhitelistEmail(email, newWhitelistNote);
    const addedEntry = updated.find((w) => w.email.toLowerCase() === email);
    const confirmInfo = {
      email,
      note: addedEntry?.note || newWhitelistNote.trim() || 'Quản trị viên',
      addedAt: addedEntry?.addedAt || new Date().toLocaleString('vi-VN'),
    };
    setWhitelist(updated);
    setNewWhitelistEmail('');
    setNewWhitelistNote('');
    setWhitelistError('');
    setWhitelistAddedNotice(confirmInfo);
    openGmailConfirmModal({ ...confirmInfo, isNewAddition: true });
    showToast(`Xác nhận đã thêm tài khoản ${email} vào Whitelist!`);
  };

  const handleAuthorizeGmail = async () => {
    setGmailError('');
    setGmailAuthorizing(true);
    try {
      await authorizeGmailAccess();
      setHasGmailToken(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setGmailError('Bạn đã đóng cửa sổ cấp quyền Google. Vui lòng thử lại để gửi email.');
      } else if (code === 'auth/popup-blocked') {
        setGmailError('Trình duyệt đã chặn popup cấp quyền Google. Hãy cho phép popup và thử lại.');
      } else {
        setGmailError(
          err instanceof Error
            ? err.message
            : 'Không thể kết nối quyền gửi Gmail. Vui lòng thử lại.'
        );
      }
      setHasGmailToken(Boolean(getActiveGmailToken()));
    } finally {
      setGmailAuthorizing(false);
    }
  };

  const handleConfirmSendGmail = async () => {
    if (!pendingGmailConfirm) return;
    const token = getActiveGmailToken();
    if (!token) {
      setHasGmailToken(false);
      setGmailError('Phiên hiện tại chưa có quyền gửi Gmail. Vui lòng nhấn "Sign in with Google" ở trên để cấp quyền.');
      return;
    }

    setGmailError('');
    setGmailSending(true);
    try {
      const payload = buildPendingGmailPayload(pendingGmailConfirm);
      const res = await sendWhitelistConfirmationGmail(payload, token);
      setGmailSentInfo({ email: pendingGmailConfirm.email, messageId: res.messageId });
      DataService.recordAuditLog({
        actorRole: 'ADMIN',
        action: 'Gửi Gmail Whitelist',
        targetType: 'CLASS_ADMIN',
        targetLabel: pendingGmailConfirm.email,
        summary: `Đã gửi email xác nhận cấp quyền Whitelist (${pendingGmailConfirm.note}) tới Gmail ${pendingGmailConfirm.email}`,
      });
      triggerSync();
      showToast(`Đã gửi email xác nhận về Gmail ${pendingGmailConfirm.email}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'MISSING_GMAIL_TOKEN' || msg.startsWith('GMAIL_AUTH_ERROR')) {
        setHasGmailToken(false);
        setGmailError(
          'Quyền gửi Gmail đã hết hạn hoặc chưa được cấp cho tài khoản này. Vui lòng nhấn nút Google bên trên để cấp lại quyền.'
        );
      } else {
        setGmailError(msg || 'Gửi email qua Gmail thất bại. Vui lòng thử lại.');
      }
    } finally {
      setGmailSending(false);
    }
  };

  const handleRemoveWhitelist = (email: string) => {
    const updated = DataService.removeAdminWhitelistEmail(email);
    setWhitelist(updated);
    showToast(`Đã gỡ ${email} khỏi Whitelist.`);
  };

  const handleExportBackup = () => {
    const json = DataService.exportAllSystemData();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `d2knedu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file sao lưu dữ liệu hệ thống (.json).');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const summary = DataService.importAllSystemData(text);
        setWhitelist(DataService.getAdminWhitelist());
        triggerSync();
        showToast(
          `Khôi phục thành công ${summary.classesCount} lớp và ${summary.studentsCount} học sinh!`
        );
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'File sao lưu không hợp lệ.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFactoryReset = () => {
    const savedWhitelist = DataService.getAdminWhitelist();
    DataService.resetToDefault();
    localStorage.setItem('edulink_admin_whitelist', JSON.stringify(savedWhitelist));
    setWhitelist(DataService.getAdminWhitelist());
    setIsFactoryResetConfirmOpen(false);
    triggerSync();
    showToast('Đã khôi phục toàn bộ dữ liệu mẫu ban đầu (giữ nguyên Whitelist Admin).');
  };

  const viewAnnouncements = DataService.getAnnouncementsForClass(annViewClassId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Admin Identity Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 shadow-xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {admin.photoURL ? (
            <img
              src={admin.photoURL}
              alt={admin.displayName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/70 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-extrabold uppercase tracking-wide">
                Quản Trị Viên Hệ Thống
              </span>
              {admin.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-bold">
                  Super Admin
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
              {admin.displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-mono truncate">{admin.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="grid grid-cols-3 gap-3 bg-white/10 rounded-2xl px-4 py-2.5 text-center border border-white/10">
            <div>
              <p className="text-[11px] text-slate-300">Số lớp</p>
              <p className="text-lg font-extrabold">{classes.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-300">Học sinh</p>
              <p className="text-lg font-extrabold">{totalStudentsCount}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-300">Cần hỗ trợ</p>
              <p className="text-lg font-extrabold text-amber-300">{needSupportCount}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        {[
          { id: 'CLASSES', label: 'Lớp học & GVCN', icon: School },
          { id: 'SUBJECT_TEACHERS', label: 'GV Bộ môn', icon: BookMarked },
          { id: 'STUDENTS', label: 'Học sinh Toàn trường', icon: Users },
          { id: 'ANNOUNCEMENTS', label: 'Thông báo Toàn trường', icon: Megaphone },
          { id: 'AUDIT_LOGS', label: 'Nhật ký Hệ thống', icon: History },
          { id: 'SYSTEM', label: 'Whitelist & Sao lưu', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CLASSES & GVCN */}
      {activeTab === 'CLASSES' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">
                Quản Lý Lớp Học &amp; Phân Công GVCN ({classes.length} lớp)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo lớp mới, điều chuyển GVCN, đổi mã/mật khẩu đăng nhập GVCN hoặc đặt lại mật khẩu hàng loạt
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setClassFormError('');
                setIsAddClassOpen(true);
              }}
              className="min-h-[42px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Lớp Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classSnapshots.map(({ classInfo, teacher, students, avgGPA, announcementsCount }) => {
              const showPass = Boolean(showPasswordsMap[classInfo.id]);
              return (
                <div
                  key={classInfo.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold mb-1">
                          {teacher.schoolYear}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-lg">{teacher.className}</h3>
                      </div>
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {teacher.code}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-xs">
                      <p className="font-bold text-slate-900 text-sm">{teacher.name}</p>
                      <p className="text-slate-600">{teacher.subject}</p>
                      <p className="text-slate-500">SĐT: {teacher.phone}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                        <span className="text-slate-600">
                          MK GVCN:{' '}
                          <code className="font-mono font-bold text-slate-900">
                            {showPass ? teacher.password || '123' : '••••••'}
                          </code>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordsMap((prev) => ({
                              ...prev,
                              [classInfo.id]: !prev[classInfo.id],
                            }))
                          }
                          className="text-indigo-600 hover:text-indigo-800 p-1 cursor-pointer"
                          title={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-blue-50/70">
                        <p className="text-[11px] text-blue-700">Sĩ số</p>
                        <p className="font-extrabold text-blue-950 text-sm">{students.length} HS</p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/70">
                        <p className="text-[11px] text-emerald-700">ĐTB lớp</p>
                        <p className="font-extrabold text-emerald-950 text-sm">{avgGPA}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50/70">
                        <p className="text-[11px] text-amber-700">Thông báo</p>
                        <p className="font-extrabold text-amber-950 text-sm">{announcementsCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setClassFormError('');
                          setEditingClass({
                            classId: classInfo.id,
                            className: teacher.className,
                            schoolYear: teacher.schoolYear,
                            teacherName: teacher.name,
                            teacherCode: teacher.code,
                            subject: teacher.subject,
                            phone: teacher.phone,
                            password: teacher.password || '123',
                          });
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa / Đổi GVCN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          DataService.resetPasswordsForClass(
                            classInfo.id,
                            { teacher: true, parents: true },
                            '123'
                          );
                          triggerSync();
                          showToast(`Đã đặt lại MK GVCN & Phụ huynh ${teacher.className} về "123".`);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset MK về 123</span>
                      </button>
                    </div>

                    {classes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteClass(classInfo)}
                        className="w-full px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa lớp này</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: SUBJECT TEACHERS */}
      {activeTab === 'SUBJECT_TEACHERS' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">
                Quản Lý Giáo Viên Bộ Môn &amp; Mật Khẩu
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉnh sửa tên giáo viên phụ trách môn, mã GV và mật khẩu đăng nhập cho từng lớp hoặc đồng bộ tất cả các lớp
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedSTClassId}
                onChange={(e) => handleSelectSTClass(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className} — GVCN: {c.teacherName}
                  </option>
                ))}
              </select>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applySTToAllClasses}
                  onChange={(e) => setApplySTToAllClasses(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Áp dụng cho tất cả {classes.length} lớp</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {stDrafts.map((st, idx) => (
              <div
                key={st.subject}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-900 text-sm">Môn {st.subject}</span>
                  <span className="text-[11px] font-mono text-slate-500">#{idx + 1}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mã GV</label>
                    <input
                      type="text"
                      value={st.code}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStDrafts((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, code: val } : item))
                        );
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tên Giáo viên</label>
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStDrafts((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                        );
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mật khẩu</label>
                    <input
                      type="text"
                      value={st.password}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStDrafts((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, password: val } : item))
                        );
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetAllSubjectTeacherPasswords}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Đặt lại MK về 123</span>
            </button>
            <button
              type="button"
              onClick={handleSaveSubjectTeachers}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Danh Sách GV Bộ Môn</span>
            </button>
          </div>
        </section>
      )}

      {/* TAB 3: SCHOOL-WIDE STUDENTS */}
      {activeTab === 'STUDENTS' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">
                Danh Sách &amp; Theo Dõi Học Sinh Toàn Trường ({filteredStudentRows.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lọc học sinh cần hỗ trợ trên toàn trường, xem mật khẩu phụ huynh hoặc chuyển lớp nhanh
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Tìm tên, mã HS, lớp..."
                  className="pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={studentFilterClass}
                onChange={(e) => setStudentFilterClass(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
              >
                <option value="ALL">Tất cả các lớp ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyNeedSupport((v) => !v)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                  onlyNeedSupport
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {onlyNeedSupport ? '✓ Đang lọc: Cần hỗ trợ' : 'Chỉ hiện HS cần hỗ trợ'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                  <th className="py-3 px-3">Học sinh</th>
                  <th className="py-3 px-3">Lớp / GVCN</th>
                  <th className="py-3 px-3">Điểm TB</th>
                  <th className="py-3 px-3">Hạnh kiểm</th>
                  <th className="py-3 px-3">Tiết yếu T1</th>
                  <th className="py-3 px-3">MK Phụ huynh</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudentRows.map(({ student, classId, className, teacherName, weakPointsCount }) => (
                  <tr key={`${classId}_${student.id}`} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-xs font-mono text-slate-500">
                        {student.studentCode} · {student.gender}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold text-xs">
                        {className}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{teacherName}</p>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900 tabular-nums">
                      {student.overallGPA}
                    </td>
                    <td className="py-3 px-3">{student.conduct}</td>
                    <td className="py-3 px-3">
                      {weakPointsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                          {weakPointsCount} tiết yếu
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Không có</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {student.parentPassword}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {classes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const other = classes.find((c) => c.id !== classId);
                              if (!other) return;
                              setTransferTarget({
                                student,
                                fromClassId: classId,
                                fromClassName: className,
                                toClassId: other.id,
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Chuyển sang lớp khác"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Chuyển lớp</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleResetStudentParentPassword(classId, student)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Đặt lại mật khẩu về 123"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset MK</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudentRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                      Không tìm thấy học sinh phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: SCHOOL-WIDE ANNOUNCEMENTS */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleBroadcastAnnouncement}
            className="lg:col-span-5 bg-white rounded-3xl border-2 border-indigo-200 p-5 sm:p-6 space-y-4 shadow-sm h-fit"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">
                  Phát Thông Báo Toàn Trường
                </h2>
                <p className="text-xs text-slate-500">
                  Đồng thời gửi tới toàn bộ {classes.length} lớp học
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề thông báo</label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="VD: Thông báo lịch thi Học kỳ & Nghỉ lễ"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên mục</label>
              <select
                value={annCategory}
                onChange={(e) => setAnnCategory(e.target.value as Announcement['category'])}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
              >
                <option value="Thông báo chung">Thông báo chung</option>
                <option value="Học tập">Học tập</option>
                <option value="Hoạt động ngoại khóa">Hoạt động ngoại khóa</option>
                <option value="Họp Phụ huynh">Họp Phụ huynh</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung chi tiết</label>
              <textarea
                rows={4}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Nhập nội dung gửi tới Phụ huynh & Giáo viên toàn trường..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer text-xs font-bold text-amber-950">
              <input
                type="checkbox"
                checked={annPinned}
                onChange={(e) => setAnnPinned(e.target.checked)}
                className="rounded text-orange-600"
              />
              <Pin className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Ghim lên đầu &amp; bật thông báo nổi khi Phụ huynh đăng nhập</span>
            </label>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Gửi Thông Báo Toàn Trường ({classes.length} lớp)</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                Kiểm Soát Bảng Tin Theo Lớp ({viewAnnouncements.length})
              </h3>
              <select
                value={annViewClassId}
                onChange={(e) => setAnnViewClassId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className} ({DataService.getAnnouncementsForClass(c.id).length} tin)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {viewAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    ann.isPinned ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {ann.isPinned && (
                          <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-bold">
                            ĐÃ GHIM
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-indigo-700">{ann.category}</span>
                        <span className="text-[11px] text-slate-400">· {ann.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          DataService.toggleAnnouncementPinForClass(annViewClassId, ann.id);
                          triggerSync();
                        }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-amber-100 text-amber-700 cursor-pointer"
                        title={ann.isPinned ? 'Bỏ ghim' : 'Ghim thông báo'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          DataService.deleteAnnouncementForClass(annViewClassId, ann.id);
                          triggerSync();
                          showToast('Đã xóa thông báo.');
                        }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-100 text-red-600 cursor-pointer"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-line">{ann.content}</p>
                  <p className="text-[11px] text-slate-500">Người đăng: {ann.author}</p>
                </div>
              ))}
              {viewAnnouncements.length === 0 && (
                <p className="text-center py-8 text-sm text-slate-500">
                  Lớp này chưa có thông báo nào.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">
                Nhật Ký Hoạt Động Toàn Hệ Thống ({filteredAuditLogs.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi lịch sử nhập điểm, chỉnh sửa nhận xét, cấp mật khẩu và thay đổi dữ liệu giữa các lớp
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={auditFilterClass}
                onChange={(e) => setAuditFilterClass(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              >
                <option value="ALL">Tất cả các lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className}
                  </option>
                ))}
              </select>
              <select
                value={auditFilterRole}
                onChange={(e) => setAuditFilterRole(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Admin Hệ thống</option>
                <option value="TEACHER">GVCN</option>
                <option value="SUBJECT_TEACHER">GV Bộ môn</option>
                <option value="PARENT">Phụ huynh</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {filteredAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold">
                      {log.className}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      {log.actorRole}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{log.action}</span>
                    <span className="text-xs text-slate-500">· {log.targetLabel}</span>
                  </div>
                  <p className="text-xs text-slate-700">{log.summary}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-800">{log.actorName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{log.displayTime}</p>
                </div>
              </div>
            ))}
            {filteredAuditLogs.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Chưa có nhật ký hoạt động nào khớp với bộ lọc.
              </p>
            )}
          </div>
        </section>
      )}

      {/* TAB 6: WHITELIST & BACKUP / RESTORE */}
      {activeTab === 'SYSTEM' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Whitelist Management */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <MailCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">
                  Danh Sách Whitelist Tài Khoản Google Admin
                </h2>
                <p className="text-xs text-slate-500">
                  Chỉ các email Google bên dưới mới được phép truy cập Cổng Quản trị ẩn
                </p>
              </div>
            </div>

            <form onSubmit={handleAddWhitelist} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="email"
                value={newWhitelistEmail}
                onChange={(e) => setNewWhitelistEmail(e.target.value)}
                placeholder="Email Google (VD: hieu.truong@gmail.com)"
                className="sm:col-span-5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <input
                type="text"
                value={newWhitelistNote}
                onChange={(e) => setNewWhitelistNote(e.target.value)}
                placeholder="Ghi chú vai trò (VD: Hiệu phó)"
                className="sm:col-span-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                type="submit"
                className="sm:col-span-3 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Email</span>
              </button>
            </form>

            {whitelistError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {whitelistError}
              </div>
            )}

            {whitelistAddedNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-start justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-emerald-900">
                      Xác nhận đã thêm tài khoản Google vào Whitelist!
                    </p>
                    <p className="text-emerald-800">
                      Tài khoản <strong className="font-mono">{whitelistAddedNotice.email}</strong> ({whitelistAddedNotice.note}) đã được cấp quyền truy cập Cổng Quản trị viên.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        openGmailConfirmModal({ ...whitelistAddedNotice, isNewAddition: true })
                      }
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Gửi email xác nhận về Gmail này</span>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWhitelistAddedNotice(null)}
                  className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-200/70 cursor-pointer shrink-0"
                  aria-label="Đóng thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {whitelist.map((entry) => (
                <div
                  key={entry.email}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {entry.email}
                      </span>
                      {entry.isSuperAdmin && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                          Super Admin (Cố định)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {entry.note || 'Quản trị viên'} · Thêm lúc: {entry.addedAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        openGmailConfirmModal({
                          email: entry.email,
                          note: entry.note || 'Quản trị viên',
                          addedAt: entry.addedAt,
                          isNewAddition: false,
                        })
                      }
                      className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-indigo-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      title="Gửi email xác nhận về Gmail"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Gửi Gmail</span>
                    </button>

                    {!entry.isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveWhitelist(entry.email)}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-red-50 text-red-600 cursor-pointer"
                        title="Xóa khỏi Whitelist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs h-fit">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">
                  Sao Lưu &amp; Khôi Phục Dữ Liệu
                </h2>
                <p className="text-xs text-slate-500">
                  Xuất toàn bộ lớp học, điểm số, báo cáo tuần ra file JSON
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất File Sao Lưu Toàn Trường (.json)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập &amp; Khôi Phục Từ File (.json)</span>
            </button>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFactoryResetConfirmOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Khôi Phục Dữ Liệu Gốc Toàn Hệ Thống</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Edit Class & GVCN Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Chỉnh Sửa Lớp &amp; Phân Công GVCN
              </h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClassEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên lớp</label>
                  <input
                    type="text"
                    value={editingClass.className}
                    onChange={(e) => setEditingClass({ ...editingClass, className: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={editingClass.schoolYear}
                    onChange={(e) => setEditingClass({ ...editingClass, schoolYear: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên GVCN</label>
                  <input
                    type="text"
                    value={editingClass.teacherName}
                    onChange={(e) => setEditingClass({ ...editingClass, teacherName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã GVCN</label>
                  <input
                    type="text"
                    value={editingClass.teacherCode}
                    onChange={(e) => setEditingClass({ ...editingClass, teacherCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Môn / Vai trò</label>
                  <input
                    type="text"
                    value={editingClass.subject}
                    onChange={(e) => setEditingClass({ ...editingClass, subject: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editingClass.phone}
                    onChange={(e) => setEditingClass({ ...editingClass, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu GVCN</label>
                <input
                  type="text"
                  value={editingClass.password}
                  onChange={(e) => setEditingClass({ ...editingClass, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono"
                />
              </div>
              {classFormError && (
                <p className="text-xs text-red-600 font-medium">{classFormError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Tạo Lớp Học Mới</h3>
              <button
                type="button"
                onClick={() => setIsAddClassOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên lớp *</label>
                  <input
                    type="text"
                    value={newClassForm.className}
                    onChange={(e) => setNewClassForm({ ...newClassForm, className: e.target.value })}
                    placeholder="VD: Lớp 10A4"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={newClassForm.schoolYear}
                    onChange={(e) => setNewClassForm({ ...newClassForm, schoolYear: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên GVCN *</label>
                  <input
                    type="text"
                    value={newClassForm.teacherName}
                    onChange={(e) => setNewClassForm({ ...newClassForm, teacherName: e.target.value })}
                    placeholder="VD: Cô Phạm Lan Anh"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã GVCN</label>
                  <input
                    type="text"
                    value={newClassForm.teacherCode}
                    onChange={(e) => setNewClassForm({ ...newClassForm, teacherCode: e.target.value })}
                    placeholder="VD: GV10A4"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={newClassForm.phone}
                    onChange={(e) => setNewClassForm({ ...newClassForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu GVCN</label>
                  <input
                    type="text"
                    value={newClassForm.password}
                    onChange={(e) => setNewClassForm({ ...newClassForm, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>
              {classFormError && (
                <p className="text-xs text-red-600 font-medium">{classFormError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer"
                >
                  Tạo Lớp Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Class Confirmation Modal */}
      {confirmDeleteClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">
                Xác nhận xóa {confirmDeleteClass.className}?
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Toàn bộ dữ liệu riêng của <strong>{confirmDeleteClass.className}</strong> (học sinh, điểm số, báo cáo tuần, lịch học) sẽ bị xóa khỏi trình duyệt. Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer"
              >
                Xác nhận xóa lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Student Modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Chuyển Lớp Học Sinh</h3>
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Chuyển em <strong>{transferTarget.student.name}</strong> ({transferTarget.student.studentCode}) từ{' '}
              <strong>{transferTarget.fromClassName}</strong> sang lớp:
            </p>
            <select
              value={transferTarget.toClassId}
              onChange={(e) => setTransferTarget({ ...transferTarget, toClassId: e.target.value })}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900"
            >
              {classes
                .filter((c) => c.id !== transferTarget.fromClassId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className} (GVCN: {c.teacherName})
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteTransferStudent}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer"
              >
                Xác nhận chuyển lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Whitelist Gmail Confirmation Dialog */}
      {pendingGmailConfirm && (() => {
        const preview = buildWhitelistConfirmationEmailContent(
          buildPendingGmailPayload(pendingGmailConfirm)
        );
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl shrink-0 ${gmailSentInfo ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {gmailSentInfo ? <CheckCircle2 className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                      {gmailSentInfo
                        ? 'Đã Gửi Email Xác Nhận Thành Công'
                        : pendingGmailConfirm.isNewAddition
                        ? 'Đã Thêm Whitelist · Gửi Thông Báo Gmail?'
                        : 'Xác Nhận Gửi Email Thông Báo Whitelist'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {gmailSentInfo
                        ? `Thư đã được gửi trực tiếp tới hộp thư ${gmailSentInfo.email}`
                        : 'Xác nhận nội dung trước khi gửi qua tài khoản Gmail của bạn'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingGmailConfirm(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {gmailSentInfo ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-sm text-emerald-950">
                    <p className="font-bold text-emerald-900">
                      Email xác nhận cấp quyền Quản trị viên đã được gửi!
                    </p>
                    <p className="text-xs text-emerald-800">
                      Người nhận: <strong className="font-mono">{gmailSentInfo.email}</strong>
                    </p>
                    <p className="text-xs text-emerald-800">
                      Người gửi: <strong className="font-mono">{admin.email}</strong>
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPendingGmailConfirm(null)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn tất &amp; Đóng</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold">Người nhận (Gmail):</span>
                      <span className="font-mono font-bold text-slate-900 break-all">{pendingGmailConfirm.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold">Người gửi:</span>
                      <span className="font-mono text-slate-700 break-all">{admin.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold">Vai trò cấp quyền:</span>
                      <span className="font-bold text-indigo-700">{pendingGmailConfirm.note}</span>
                    </div>
                    <div className="pt-2 mt-1 border-t border-slate-200">
                      <p className="text-[11px] font-bold text-slate-500 mb-1">Tiêu đề email:</p>
                      <p className="font-bold text-slate-900 text-xs">{preview.subject}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-1.5">Nội dung thư sẽ gửi:</p>
                    <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 text-[11px] leading-relaxed whitespace-pre-wrap font-sans max-h-48 overflow-y-auto border border-slate-800">
                      {preview.textPreview}
                    </pre>
                  </div>

                  {!hasGmailToken && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
                      <p className="text-xs text-amber-900 font-medium leading-relaxed">
                        Cần xác nhận quyền gửi thư từ tài khoản Google của bạn trong phiên làm việc này trước khi gửi email.
                      </p>
                      <button
                        type="button"
                        disabled={gmailAuthorizing}
                        onClick={() => void handleAuthorizeGmail()}
                        className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs border border-slate-300 shadow-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span>
                          {gmailAuthorizing
                            ? 'Đang mở cửa sổ cấp quyền Google...'
                            : 'Sign in with Google · Cấp quyền gửi Gmail'}
                        </span>
                      </button>
                    </div>
                  )}

                  {gmailError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{gmailError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={gmailSending}
                      onClick={() => setPendingGmailConfirm(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {pendingGmailConfirm.isNewAddition ? 'Chỉ lưu Whitelist, không gửi' : 'Hủy'}
                    </button>
                    <button
                      type="button"
                      disabled={!hasGmailToken || gmailSending}
                      onClick={() => void handleConfirmSendGmail()}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{gmailSending ? 'Đang gửi email...' : 'Xác nhận & Gửi về Gmail'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Factory Reset Confirmation Modal */}
      {isFactoryResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <RefreshCw className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Khôi phục dữ liệu mẫu toàn hệ thống?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Thao tác này sẽ đặt lại toàn bộ lớp học, học sinh, điểm số và thông báo về trạng thái mẫu ban đầu (Whitelist Admin vẫn được giữ nguyên).
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsFactoryResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleFactoryReset}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold cursor-pointer"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
