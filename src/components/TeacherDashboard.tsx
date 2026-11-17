import React, { useState, useEffect, useRef, useImperativeHandle, useMemo } from 'react';
import {
  KeyRound, Megaphone, Calendar, UserCheck, AlertTriangle,
  Plus, Trash2, Edit3, Save, CheckCircle2, RefreshCw,
  BookOpen, Sparkles, Send, Eye, EyeOff, Shield, Award, FileSpreadsheet, MessageSquare, Lock,
  ShieldCheck, History, Search, Key, X, AlertCircle, UserPlus, Pin, BellRing
} from 'lucide-react';
import {
  Student, TeacherInfo, WeeklySchedule, SubjectScore,
  WeeklyReport, Announcement, WeakPointDetail, AuditLogEntry, AuditTargetType
} from '../types';
import { DataService, formatEditTimestamp } from '../services/dataStorage';
import { SubjectTeacherDashboard } from './SubjectTeacherDashboard';
import { UnsavedChangesModal, UnsavedGuardHandle } from './UnsavedChangesModal';

interface Props {
  teacher: TeacherInfo;
  students: Student[];
  dataVersion?: number;
  guardRef?: React.RefObject<UnsavedGuardHandle | null>;
  onRefreshStudents: () => void;
  onRefreshTeacher?: () => void;
}

const areNumArraysEqual = (a: number[] = [], b: number[] = []) =>
  a.length === b.length && a.every((val, i) => val === b[i]);

const areSubjectScoresEqual = (a: SubjectScore[], b: SubjectScore[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((itemA, idx) => {
    const itemB = b[idx];
    if (!itemB || itemA.subjectName !== itemB.subjectName) return false;
    return (
      areNumArraysEqual(itemA.oralScores, itemB.oralScores) &&
      areNumArraysEqual(itemA.scores15m, itemB.scores15m) &&
      areNumArraysEqual(itemA.scores45m, itemB.scores45m) &&
      (itemA.midtermScore ?? null) === (itemB.midtermScore ?? null) &&
      (itemA.finalScore ?? null) === (itemB.finalScore ?? null) &&
      (itemA.teacherRemark || '') === (itemB.teacherRemark || '')
    );
  });
};

const isWeeklyReportModified = (draft: WeeklyReport, saved: WeeklyReport): boolean => {
  return (
    draft.totalPeriods !== saved.totalPeriods ||
    draft.excusedAbsences !== saved.excusedAbsences ||
    draft.unexcusedAbsences !== saved.unexcusedAbsences ||
    draft.lateArrivals !== saved.lateArrivals ||
    draft.learningStatus !== saved.learningStatus ||
    draft.conductStatus !== saved.conductStatus ||
    (draft.teacherComment || '') !== (saved.teacherComment || '') ||
    JSON.stringify(draft.weakPoints || []) !== JSON.stringify(saved.weakPoints || [])
  );
};

export const TeacherDashboard: React.FC<Props> = ({
  teacher,
  students,
  dataVersion = 0,
  guardRef,
  onRefreshStudents,
  onRefreshTeacher,
}) => {
  type TeacherTab = 'REPORTS' | 'PASSWORDS' | 'ANNOUNCEMENTS' | 'SCHEDULE' | 'GRADES' | 'SUBJECT_TEACHER' | 'AUDIT_LOGS';
  const [activeTab, setActiveTab] = useState<TeacherTab>('REPORTS');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(DataService.getAuditLogs());
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterType, setAuditFilterType] = useState<'ALL' | AuditTargetType>('ALL');
  const subjectTeacherGuardRef = useRef<UnsavedGuardHandle | null>(null);

  // Selected state for Weekly Evaluation
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'hs01');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [currentReport, setCurrentReport] = useState<WeeklyReport>(() =>
    DataService.getWeeklyReport(students[0]?.id || 'hs01', 1)
  );
  const [savedReport, setSavedReport] = useState<WeeklyReport>(() =>
    DataService.getWeeklyReport(students[0]?.id || 'hs01', 1)
  );

  // Password management state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // GVCN own password change modal state
  const [isChangeTeacherPassOpen, setIsChangeTeacherPassOpen] = useState(false);
  const [currTeacherPass, setCurrTeacherPass] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const [confirmTeacherPass, setConfirmTeacherPass] = useState('');
  const [showTeacherPasses, setShowTeacherPasses] = useState(false);
  const [teacherPassError, setTeacherPassError] = useState('');
  const [teacherPassSuccess, setTeacherPassSuccess] = useState('');

  // GVCN rename modal state
  const [isRenameTeacherOpen, setIsRenameTeacherOpen] = useState(false);
  const [newTeacherNameInput, setNewTeacherNameInput] = useState('');
  const [renameTeacherError, setRenameTeacherError] = useState('');

  // Add Student modal state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [newStudentDob, setNewStudentDob] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('123');
  const [newStudentConduct, setNewStudentConduct] = useState<'Tốt' | 'Khá' | 'Trung bình'>('Tốt');
  const [addStudentError, setAddStudentError] = useState('');
  const [studentPendingDelete, setStudentPendingDelete] = useState<Student | null>(null);

  // Announcement state
  const [announcements, setAnnouncements] = useState<Announcement[]>(DataService.getAnnouncements());
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<Announcement['category']>('Thông báo chung');
  const [newAnnPinned, setNewAnnPinned] = useState(false);

  // Schedule state
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => DataService.getWeeklySchedule(1));
  const [savedSchedule, setSavedSchedule] = useState<WeeklySchedule>(() => DataService.getWeeklySchedule(1));

  // Subject Grades state
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>(() =>
    DataService.getSubjectScores(students[0]?.id || 'hs01')
  );
  const [savedSubjectScores, setSavedSubjectScores] = useState<SubjectScore[]>(() =>
    DataService.getSubjectScores(students[0]?.id || 'hs01')
  );

  // Weak Point draft state
  const [newWeakDay, setNewWeakDay] = useState('Thứ 2');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [newWeakReason, setNewWeakReason] = useState('');

  // Pending navigation confirmation modal
  const [pendingAction, setPendingAction] = useState<{
    message: string;
    onSave: () => boolean | void;
    onDiscard: () => void;
    onProceed: () => void;
  } | null>(null);

  // Get current day's schedule periods from class schedule
  const currentDaySchedule = schedule.days.find(d => d.dayName === newWeakDay);
  const availablePeriods = currentDaySchedule?.periods || [];

  const handleDayChange = (day: string) => {
    setNewWeakDay(day);
    setSelectedPeriodIndex(0);
  };

  const refreshAuditLogs = () => {
    setAuditLogs(DataService.getAuditLogs());
  };

  const savedReportRef = useRef<WeeklyReport>(savedReport);
  const savedSubjectScoresRef = useRef<SubjectScore[]>(savedSubjectScores);
  const savedScheduleRef = useRef<WeeklySchedule>(savedSchedule);

  useEffect(() => {
    savedReportRef.current = savedReport;
  }, [savedReport]);

  useEffect(() => {
    savedSubjectScoresRef.current = savedSubjectScores;
  }, [savedSubjectScores]);

  useEffect(() => {
    savedScheduleRef.current = savedSchedule;
  }, [savedSchedule]);

  // Load fresh report & scores when student or week changes
  useEffect(() => {
    const freshReport = DataService.getWeeklyReport(selectedStudentId, selectedWeek);
    savedReportRef.current = freshReport;
    setCurrentReport(freshReport);
    setSavedReport(freshReport);
  }, [selectedStudentId, selectedWeek]);

  useEffect(() => {
    const freshScores = DataService.getSubjectScores(selectedStudentId);
    savedSubjectScoresRef.current = freshScores;
    setSubjectScores(freshScores);
    setSavedSubjectScores(freshScores);
  }, [selectedStudentId]);

  useEffect(() => {
    const freshSchedule = DataService.getWeeklySchedule(selectedWeek);
    savedScheduleRef.current = freshSchedule;
    setSchedule(freshSchedule);
    setSavedSchedule(freshSchedule);
  }, [selectedWeek]);

  // Realtime dataVersion sync: avoid overwriting unsaved drafts
  useEffect(() => {
    if (!dataVersion) return;
    const prevSavedReport = savedReportRef.current;
    const freshReport = DataService.getWeeklyReport(selectedStudentId, selectedWeek);
    savedReportRef.current = freshReport;
    setSavedReport(freshReport);
    setCurrentReport((prev) => (isWeeklyReportModified(prev, prevSavedReport) ? prev : freshReport));

    const prevSavedScores = savedSubjectScoresRef.current;
    const freshScores = DataService.getSubjectScores(selectedStudentId);
    savedSubjectScoresRef.current = freshScores;
    setSavedSubjectScores(freshScores);
    setSubjectScores((prev) => (areSubjectScoresEqual(prev, prevSavedScores) ? freshScores : prev));

    const prevSavedSchedule = savedScheduleRef.current;
    const freshSchedule = DataService.getWeeklySchedule(selectedWeek);
    savedScheduleRef.current = freshSchedule;
    setSavedSchedule(freshSchedule);
    setSchedule((prev) =>
      JSON.stringify(prev.days) !== JSON.stringify(prevSavedSchedule.days) ? prev : freshSchedule
    );

    setAnnouncements(DataService.getAnnouncements());
    refreshAuditLogs();
  }, [students, dataVersion]);

  const isReportDirty = useMemo(
    () => isWeeklyReportModified(currentReport, savedReport) || newWeakReason.trim().length > 0,
    [currentReport, savedReport, newWeakReason]
  );

  const isPasswordDirty = useMemo(() => {
    if (!editingStudentId) return false;
    const target = students.find((s) => s.id === editingStudentId);
    return newPasswordValue.trim() !== (target?.parentPassword || '');
  }, [editingStudentId, newPasswordValue, students]);

  const isAnnouncementDirty = newAnnTitle.trim().length > 0 || newAnnContent.trim().length > 0;

  const isScheduleDirty = useMemo(
    () => JSON.stringify(schedule.days) !== JSON.stringify(savedSchedule.days),
    [schedule, savedSchedule]
  );

  const isGradesDirty = useMemo(
    () => !areSubjectScoresEqual(subjectScores, savedSubjectScores),
    [subjectScores, savedSubjectScores]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save Password Change
  const handleSavePassword = (studentId: string): boolean => {
    if (!newPasswordValue.trim()) {
      showToast('Vui lòng nhập mật khẩu mới trước khi lưu!');
      return false;
    }
    DataService.updateStudentPassword(studentId, newPasswordValue.trim());
    const st = students.find((s) => s.id === studentId);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'UPDATE_PARENT_PASSWORD',
      targetType: 'STUDENT_PASSWORD',
      targetLabel: `Học sinh ${st?.name || studentId} (${st?.studentCode || ''})`,
      summary: 'GVCN cập nhật mật khẩu đăng nhập cho Phụ huynh học sinh',
    });
    refreshAuditLogs();
    setEditingStudentId(null);
    onRefreshStudents();
    showToast('Đã cập nhật mật khẩu Phụ huynh thành công!');
    return true;
  };

  // Suggest next student code (e.g., 10A105)
  const getSuggestedStudentCode = () => {
    let idx = students.length + 1;
    let candidate = `10A1${String(idx).padStart(2, '0')}`;
    while (students.some((s) => s.studentCode.toLowerCase() === candidate.toLowerCase())) {
      idx += 1;
      candidate = `10A1${String(idx).padStart(2, '0')}`;
    }
    return candidate;
  };

  const resetAddStudentForm = () => {
    setNewStudentName('');
    setNewStudentCode('');
    setNewStudentGender('Nam');
    setNewStudentDob('');
    setNewStudentPassword('123');
    setNewStudentConduct('Tốt');
    setAddStudentError('');
  };

  const handleOpenAddStudentModal = () => {
    setNewStudentName('');
    setNewStudentCode(getSuggestedStudentCode());
    setNewStudentGender('Nam');
    setNewStudentDob('');
    setNewStudentPassword('123');
    setNewStudentConduct('Tốt');
    setAddStudentError('');
    setIsAddStudentOpen(true);
  };

  const submitAddStudent = (): boolean => {
    setAddStudentError('');
    const trimmedName = newStudentName.trim();
    const trimmedCode = newStudentCode.trim();
    const trimmedPass = newStudentPassword.trim();
    const trimmedDob = newStudentDob.trim() || '01/01/2010';

    if (!trimmedName) {
      setAddStudentError('Vui lòng nhập họ và tên học sinh!');
      return false;
    }
    if (trimmedName.length > 120) {
      setAddStudentError('Họ và tên học sinh không được vượt quá 120 ký tự!');
      return false;
    }
    if (!trimmedCode) {
      setAddStudentError('Vui lòng nhập mã học sinh!');
      return false;
    }
    if (trimmedCode.length > 32) {
      setAddStudentError('Mã học sinh không được vượt quá 32 ký tự!');
      return false;
    }
    if (students.some((s) => s.studentCode.toLowerCase() === trimmedCode.toLowerCase())) {
      setAddStudentError(`Mã học sinh "${trimmedCode}" đã tồn tại trong lớp!`);
      return false;
    }
    if (!trimmedPass) {
      setAddStudentError('Vui lòng nhập mật khẩu đăng nhập cho Phụ huynh!');
      return false;
    }
    if (trimmedPass.length > 64) {
      setAddStudentError('Mật khẩu Phụ huynh không được vượt quá 64 ký tự!');
      return false;
    }

    const created = DataService.addStudent({
      name: trimmedName,
      studentCode: trimmedCode,
      gender: newStudentGender,
      dob: trimmedDob,
      parentPassword: trimmedPass,
      conduct: newStudentConduct,
    });

    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'ADD_STUDENT',
      targetType: 'STUDENT_PASSWORD',
      targetLabel: `Học sinh ${created.name} (${created.studentCode})`,
      summary: `GVCN thêm học sinh mới và đồng bộ sang Phụ huynh & GV Bộ môn`,
    });
    refreshAuditLogs();
    onRefreshStudents();

    if (!isReportDirty) {
      setSelectedStudentId(created.id);
    }

    setIsAddStudentOpen(false);
    resetAddStudentForm();
    showToast(`Đã thêm học sinh ${created.name} và đồng bộ sang Phụ huynh & GV Bộ môn!`);
    return true;
  };

  const handleConfirmDeleteStudent = () => {
    if (!studentPendingDelete) return;
    if (students.length <= 1) {
      setStudentPendingDelete(null);
      showToast('Lớp học cần có ít nhất 1 học sinh, không thể xóa học sinh cuối cùng!');
      return;
    }

    const target = studentPendingDelete;
    const remaining = DataService.deleteStudent(target.id);

    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'DELETE_STUDENT',
      targetType: 'STUDENT_PASSWORD',
      targetLabel: `Học sinh ${target.name} (${target.studentCode})`,
      summary: 'GVCN xóa học sinh khỏi lớp và đồng bộ xóa bên Phụ huynh & GV Bộ môn',
    });

    if (editingStudentId === target.id) {
      setEditingStudentId(null);
      setNewPasswordValue('');
    }
    if (selectedStudentId === target.id && remaining.length > 0) {
      setNewWeakReason('');
      setSelectedStudentId(remaining[0].id);
    }

    setStudentPendingDelete(null);
    refreshAuditLogs();
    onRefreshStudents();
    showToast(`Đã xóa học sinh ${target.name} và đồng bộ sang Phụ huynh & GV Bộ môn!`);
  };

  const handleOpenRenameTeacherModal = () => {
    setNewTeacherNameInput(teacher.name);
    setRenameTeacherError('');
    setIsRenameTeacherOpen(true);
  };

  const submitRenameTeacher = (): boolean => {
    setRenameTeacherError('');
    const trimmed = newTeacherNameInput.trim();
    if (!trimmed) {
      setRenameTeacherError('Vui lòng nhập tên Giáo viên chủ nhiệm!');
      return false;
    }
    if (trimmed.length > 120) {
      setRenameTeacherError('Tên Giáo viên chủ nhiệm không được vượt quá 120 ký tự!');
      return false;
    }
    if (trimmed === teacher.name) {
      setRenameTeacherError('Tên mới đang giống với tên hiện tại!');
      return false;
    }

    const previousName = teacher.name;
    const updated = DataService.updateTeacherName(trimmed);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'UPDATE_TEACHER_NAME',
      targetType: 'TEACHER_PASSWORD',
      targetLabel: `GVCN ${updated.name} • ${updated.className}`,
      summary: `Đổi tên Giáo viên chủ nhiệm từ "${previousName}" thành "${updated.name}"`,
    });
    refreshAuditLogs();
    onRefreshTeacher?.();
    setIsRenameTeacherOpen(false);
    setRenameTeacherError('');
    showToast(`Đã đổi tên Giáo viên chủ nhiệm thành "${updated.name}"!`);
    return true;
  };

  // Generate Random Password
  const handleGeneratePassword = (studentId: string) => {
    const randomPass = Math.floor(100000 + Math.random() * 900000).toString();
    DataService.updateStudentPassword(studentId, randomPass);
    const st = students.find((s) => s.id === studentId);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'GENERATE_PARENT_PASSWORD',
      targetType: 'STUDENT_PASSWORD',
      targetLabel: `Học sinh ${st?.name || studentId} (${st?.studentCode || ''})`,
      summary: 'GVCN tạo mật khẩu ngẫu nhiên mới cho Phụ huynh',
    });
    refreshAuditLogs();
    onRefreshStudents();
    showToast(`Đã tạo ngẫu nhiên mật khẩu mới: ${randomPass}`);
  };

  // Save Weekly Report (also auto-commits any typed weak-point reason)
  const handleSaveWeeklyReport = () => {
    let reportToSave = currentReport;
    if (newWeakReason.trim()) {
      const safeIndex = selectedPeriodIndex < availablePeriods.length ? selectedPeriodIndex : 0;
      const selectedPeriodObj = availablePeriods[safeIndex];
      const newWp: WeakPointDetail = {
        id: 'wp_' + Date.now(),
        day: newWeakDay,
        periodNumber: selectedPeriodObj ? selectedPeriodObj.periodNumber : 1,
        timeSlot: selectedPeriodObj ? selectedPeriodObj.timeSlot : '07:30 - 08:15',
        subject: selectedPeriodObj ? selectedPeriodObj.subject : 'Chưa xác định',
        reason: newWeakReason.trim(),
        severity: 'Cao'
      };
      reportToSave = {
        ...currentReport,
        weakPoints: [...currentReport.weakPoints, newWp]
      };
      setNewWeakReason('');
    }
    const stamped = DataService.saveWeeklyReport(selectedStudentId, selectedWeek, reportToSave, true);
    setCurrentReport(stamped);
    setSavedReport(stamped);
    const st = students.find((s) => s.id === selectedStudentId);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'UPDATE_WEEKLY_REPORT',
      targetType: 'WEEKLY_REPORT',
      targetLabel: `Tuần ${selectedWeek} • ${st?.name || selectedStudentId}`,
      summary: `Cập nhật đánh giá tuần ${selectedWeek} (Xếp loại: ${stamped.learningStatus}, Vắng KP: ${stamped.unexcusedAbsences}, Tiết yếu: ${stamped.weakPoints.length})`,
    });
    refreshAuditLogs();
    showToast('Đã lưu Báo cáo tình hình học tập tuần thành công!');
  };

  // Add Weak Point
  const handleAddWeakPoint = () => {
    if (!newWeakReason.trim()) {
      showToast('Vui lòng nhập lý do/nội dung học sinh còn yếu!');
      return;
    }

    const safeIndex = selectedPeriodIndex < availablePeriods.length ? selectedPeriodIndex : 0;
    const selectedPeriodObj = availablePeriods[safeIndex];

    const periodNum = selectedPeriodObj ? selectedPeriodObj.periodNumber : 1;
    const timeSlotStr = selectedPeriodObj ? selectedPeriodObj.timeSlot : '07:30 - 08:15';
    const subjectStr = selectedPeriodObj ? selectedPeriodObj.subject : 'Chưa xác định';

    const newWp: WeakPointDetail = {
      id: 'wp_' + Date.now(),
      day: newWeakDay,
      periodNumber: periodNum,
      timeSlot: timeSlotStr,
      subject: subjectStr,
      reason: newWeakReason,
      severity: 'Cao'
    };

    const updatedReport = {
      ...currentReport,
      weakPoints: [...currentReport.weakPoints, newWp]
    };
    setCurrentReport(updatedReport);
    setNewWeakReason('');
    showToast(`Đã thêm tiết học yếu: ${newWeakDay} - Tiết ${periodNum} (${subjectStr})`);
  };

  const handleRemoveWeakPoint = (id: string) => {
    const updatedReport = {
      ...currentReport,
      weakPoints: currentReport.weakPoints.filter(w => w.id !== id)
    };
    setCurrentReport(updatedReport);
  };

  // Create Announcement
  const submitAnnouncementNow = (): boolean => {
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!');
      return false;
    }
    DataService.addAnnouncement(newAnnTitle, newAnnContent, newAnnCategory, newAnnPinned);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'ADD_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetLabel: `Thông báo: ${newAnnTitle.trim().slice(0, 120)}`,
      summary: `Đăng thông báo mới (${newAnnCategory}) tới toàn lớp ${teacher.className}`,
    });
    refreshAuditLogs();
    setAnnouncements(DataService.getAnnouncements());
    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnPinned(false);
    showToast(
      newAnnPinned
        ? 'Đã đăng & GHIM thông báo quan trọng lên đầu bảng tin Phụ huynh!'
        : 'Đã đăng thông báo mới cho Phụ huynh!'
    );
    return true;
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnnouncementNow();
  };

  const handleToggleAnnouncementPin = (id: string) => {
    const targetAnn = announcements.find((a) => a.id === id);
    const nextPinned = !targetAnn?.isPinned;
    const updatedList = DataService.toggleAnnouncementPin(id);
    setAnnouncements(updatedList);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: nextPinned ? 'PIN_ANNOUNCEMENT' : 'UNPIN_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetLabel: `Thông báo: ${targetAnn?.title || id}`,
      summary: nextPinned
        ? 'GVCN ghim thông báo quan trọng lên đầu bảng tin Phụ huynh'
        : 'GVCN bỏ ghim thông báo trên bảng tin Phụ huynh',
    });
    refreshAuditLogs();
    showToast(
      nextPinned
        ? 'Đã ghim thông báo lên đầu bảng tin Phụ huynh!'
        : 'Đã bỏ ghim thông báo.'
    );
  };

  // Delete Announcement
  const handleDeleteAnnouncement = (id: string) => {
    const targetAnn = announcements.find((a) => a.id === id);
    DataService.deleteAnnouncement(id);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'DELETE_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetLabel: `Thông báo: ${targetAnn?.title || id}`,
      summary: 'GVCN xóa một thông báo lớp',
    });
    refreshAuditLogs();
    setAnnouncements(DataService.getAnnouncements());
    showToast('Đã xóa thông báo.');
  };

  // Save Subject Scores
  const handleSaveSubjectScores = () => {
    DataService.saveSubjectScores(selectedStudentId, subjectScores);
    setSavedSubjectScores(subjectScores);
    const scoredSubs = subjectScores.filter(s => s.averageScore > 0);
    const avgGPA = scoredSubs.length > 0
      ? Math.round((scoredSubs.reduce((acc, curr) => acc + curr.averageScore, 0) / scoredSubs.length) * 10) / 10
      : 0;

    const allStudents = DataService.getStudents();
    const updatedStudents = allStudents.map(s => s.id === selectedStudentId ? { ...s, overallGPA: avgGPA } : s);
    DataService.saveStudents(updatedStudents);
    const st = allStudents.find((s) => s.id === selectedStudentId);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'UPDATE_SUBJECT_SCORES',
      targetType: 'SUBJECT_SCORE',
      targetLabel: `Bảng điểm • ${st?.name || selectedStudentId}`,
      summary: `GVCN lưu bảng điểm tổng hợp các môn (ĐTB chung: ${avgGPA})`,
    });
    refreshAuditLogs();
    onRefreshStudents();
    showToast('Đã cập nhật bảng điểm & ĐTB chung của học sinh!');
  };

  // Save Schedule
  const handleSaveSchedule = () => {
    DataService.saveWeeklySchedule(selectedWeek, schedule);
    setSavedSchedule(schedule);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'UPDATE_SCHEDULE',
      targetType: 'SCHEDULE',
      targetLabel: `Thời khóa biểu Tuần ${selectedWeek}`,
      summary: `Cập nhật thời khóa biểu Tuần ${selectedWeek} cho ${teacher.className}`,
    });
    refreshAuditLogs();
    showToast(`Đã lưu Thời khóa biểu Tuần ${selectedWeek} thành công!`);
  };

  // Apply Schedule to All Weeks
  const handleApplyScheduleToAllWeeks = () => {
    for (let w = 1; w <= 18; w++) {
      DataService.saveWeeklySchedule(w, {
        ...schedule,
        weekNumber: w,
        startDate: `Đầu tuần ${w}`,
        endDate: `Cuối tuần ${w}`
      });
    }
    setSavedSchedule(schedule);
    DataService.recordAuditLog({
      actorRole: 'TEACHER',
      action: 'APPLY_SCHEDULE_ALL_WEEKS',
      targetType: 'SCHEDULE',
      targetLabel: `Thời khóa biểu 18 tuần • ${teacher.className}`,
      summary: 'Áp dụng mẫu thời khóa biểu hiện tại cho toàn bộ 18 tuần học',
    });
    refreshAuditLogs();
    showToast('Đã áp dụng Thời khóa biểu này cho tất cả 18 tuần!');
  };

  // Unsaved-changes helpers by tab
  const getTabUnsavedState = (tab: TeacherTab): { dirty: boolean; message: string; save: () => boolean | void; discard: () => void } => {
    if (tab === 'REPORTS' && isReportDirty) {
      return {
        dirty: true,
        message: `Bạn đã chỉnh sửa báo cáo tuần ${selectedWeek} (nhận xét, điểm danh hoặc tiết học yếu) nhưng chưa bấm "Lưu Báo Cáo". Bạn có muốn lưu lại không?`,
        save: () => { handleSaveWeeklyReport(); return true; },
        discard: () => { setCurrentReport(savedReport); setNewWeakReason(''); },
      };
    }
    if (tab === 'PASSWORDS' && isPasswordDirty && editingStudentId) {
      return {
        dirty: true,
        message: 'Bạn đang sửa mật khẩu phụ huynh nhưng chưa bấm "Lưu". Bạn có muốn lưu lại thay đổi này không?',
        save: () => handleSavePassword(editingStudentId),
        discard: () => { setEditingStudentId(null); setNewPasswordValue(''); },
      };
    }
    if (tab === 'ANNOUNCEMENTS' && isAnnouncementDirty) {
      return {
        dirty: true,
        message: 'Bạn đang soạn thông báo mới nhưng chưa đăng tải. Bạn có muốn đăng thông báo này trước khi rời khỏi không?',
        save: () => submitAnnouncementNow(),
        discard: () => { setNewAnnTitle(''); setNewAnnContent(''); },
      };
    }
    if (tab === 'SCHEDULE' && isScheduleDirty) {
      return {
        dirty: true,
        message: `Bạn đã thay đổi Thời khóa biểu Tuần ${selectedWeek} nhưng chưa bấm "Lưu Biểu Tuần ${selectedWeek}". Bạn có muốn lưu lại không?`,
        save: () => { handleSaveSchedule(); return true; },
        discard: () => setSchedule(savedSchedule),
      };
    }
    if (tab === 'GRADES' && isGradesDirty) {
      return {
        dirty: true,
        message: 'Bạn đã nhập hoặc chỉnh sửa điểm số học sinh nhưng chưa bấm "Lưu Bảng Điểm". Bạn có muốn lưu lại trước khi rời khỏi không?',
        save: () => { handleSaveSubjectScores(); return true; },
        discard: () => setSubjectScores(savedSubjectScores),
      };
    }
    if (tab === 'SUBJECT_TEACHER' && subjectTeacherGuardRef.current?.hasUnsavedChanges()) {
      return {
        dirty: true,
        message: subjectTeacherGuardRef.current.getUnsavedDescription?.() || 'Bạn có điểm hoặc lời nhận xét bộ môn chưa lưu. Bạn có muốn lưu lại không?',
        save: () => subjectTeacherGuardRef.current?.saveUnsavedChanges() ?? true,
        discard: () => {},
      };
    }
    return { dirty: false, message: '', save: () => true, discard: () => {} };
  };

  useImperativeHandle(guardRef, () => ({
    hasUnsavedChanges: () => {
      if (getTabUnsavedState(activeTab).dirty) return true;
      return isReportDirty || isPasswordDirty || isAnnouncementDirty || isScheduleDirty || isGradesDirty || (subjectTeacherGuardRef.current?.hasUnsavedChanges() ?? false);
    },
    saveUnsavedChanges: () => {
      const current = getTabUnsavedState(activeTab);
      if (current.dirty) {
        return current.save();
      }
      if (isReportDirty) handleSaveWeeklyReport();
      if (isScheduleDirty) handleSaveSchedule();
      if (isGradesDirty) handleSaveSubjectScores();
      if (subjectTeacherGuardRef.current?.hasUnsavedChanges()) {
        subjectTeacherGuardRef.current.saveUnsavedChanges();
      }
      if (isPasswordDirty && editingStudentId) {
        return handleSavePassword(editingStudentId);
      }
      if (isAnnouncementDirty) {
        return submitAnnouncementNow();
      }
      return true;
    },
    getUnsavedDescription: () => {
      const current = getTabUnsavedState(activeTab);
      if (current.dirty) return current.message;
      return 'Bạn có dữ liệu vừa nhập chưa được lưu. Bạn có muốn lưu lại trước khi rời khỏi không?';
    },
  }));

  const handleAttemptTabChange = (nextTab: TeacherTab) => {
    if (nextTab === activeTab) {
      if (nextTab === 'AUDIT_LOGS') refreshAuditLogs();
      return;
    }
    const unsaved = getTabUnsavedState(activeTab);
    if (unsaved.dirty) {
      setPendingAction({
        message: unsaved.message,
        onSave: unsaved.save,
        onDiscard: unsaved.discard,
        onProceed: () => {
          if (nextTab === 'AUDIT_LOGS') refreshAuditLogs();
          setActiveTab(nextTab);
        },
      });
      return;
    }
    if (nextTab === 'AUDIT_LOGS') refreshAuditLogs();
    setActiveTab(nextTab);
  };

  const guardReportContextChange = (proceedFn: () => void) => {
    if (isReportDirty) {
      const unsaved = getTabUnsavedState('REPORTS');
      setPendingAction({
        message: unsaved.message,
        onSave: unsaved.save,
        onDiscard: unsaved.discard,
        onProceed: proceedFn,
      });
      return;
    }
    proceedFn();
  };

  const guardScheduleWeekChange = (nextWeek: number) => {
    if (nextWeek === selectedWeek) return;
    if (isScheduleDirty) {
      const unsaved = getTabUnsavedState('SCHEDULE');
      setPendingAction({
        message: unsaved.message,
        onSave: unsaved.save,
        onDiscard: unsaved.discard,
        onProceed: () => setSelectedWeek(nextWeek),
      });
      return;
    }
    setSelectedWeek(nextWeek);
  };

  const guardGradesStudentChange = (nextStudentId: string) => {
    if (nextStudentId === selectedStudentId) return;
    if (isGradesDirty) {
      const unsaved = getTabUnsavedState('GRADES');
      setPendingAction({
        message: unsaved.message,
        onSave: unsaved.save,
        onDiscard: unsaved.discard,
        onProceed: () => setSelectedStudentId(nextStudentId),
      });
      return;
    }
    setSelectedStudentId(nextStudentId);
  };

  const guardPasswordAction = (proceedFn: () => void) => {
    if (isPasswordDirty && editingStudentId) {
      const unsaved = getTabUnsavedState('PASSWORDS');
      setPendingAction({
        message: unsaved.message,
        onSave: unsaved.save,
        onDiscard: unsaved.discard,
        onProceed: proceedFn,
      });
      return;
    }
    proceedFn();
  };

  // Update a period in schedule
  const handleUpdateSchedulePeriod = (dayName: string, periodNum: number, field: 'subject' | 'room' | 'teacher', val: string) => {
    const updatedDays = schedule.days.map(day => {
      if (day.dayName !== dayName) return day;
      const periodExists = day.periods.some(p => p.periodNumber === periodNum);
      let updatedPeriods = [...day.periods];
      if (periodExists) {
        updatedPeriods = updatedPeriods.map(p => {
          if (p.periodNumber === periodNum) {
            return { ...p, [field]: val };
          }
          return p;
        });
      } else {
        const timeSlotStr = periodNum === 1 ? '07:30 - 08:15' :
                            periodNum === 2 ? '08:20 - 09:05' :
                            periodNum === 3 ? '09:15 - 10:00' :
                            periodNum === 4 ? '10:05 - 10:50' : '11:00 - 11:45';
        updatedPeriods.push({
          periodNumber: periodNum,
          timeSlot: timeSlotStr,
          subject: field === 'subject' ? val : 'Môn học mới',
          teacher: field === 'teacher' ? val : teacher.name,
          room: field === 'room' ? val : 'Phòng 201'
        });
      }
      return { ...day, periods: updatedPeriods };
    });
    setSchedule({ ...schedule, days: updatedDays });
  };

  // Update subject score row
  const handleUpdateSubjectScore = (
    index: number,
    field: keyof SubjectScore,
    val: any
  ) => {
    const updated = [...subjectScores];
    const current = { ...updated[index] };

    if (field === 'oralScores' || field === 'scores15m' || field === 'scores45m') {
      const nums = typeof val === 'string'
        ? val.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
        : val;
      current[field] = nums;
    } else if (field === 'midtermScore' || field === 'finalScore') {
      const num = val === '' ? undefined : parseFloat(val);
      current[field] = isNaN(num as number) ? undefined : num;
    } else {
      (current as any)[field] = val;
    }

    // Auto calculate average score
    let totalScore = 0;
    let totalWeight = 0;

    current.oralScores.forEach(s => { totalScore += s * 1; totalWeight += 1; });
    current.scores15m.forEach(s => { totalScore += s * 1; totalWeight += 1; });
    current.scores45m.forEach(s => { totalScore += s * 2; totalWeight += 2; });
    if (current.midtermScore !== undefined && current.midtermScore !== null && !isNaN(current.midtermScore)) {
      totalScore += current.midtermScore * 2;
      totalWeight += 2;
    }
    if (current.finalScore !== undefined && current.finalScore !== null && !isNaN(current.finalScore)) {
      totalScore += current.finalScore * 3;
      totalWeight += 3;
    }

    current.averageScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 0;

    const actor = DataService.getCurrentActorStamp();
    if (actor) {
      current.updatedByEmail = actor.email;
      current.updatedByName = actor.name;
      current.updatedAt = actor.displayTime || formatEditTimestamp();
    }

    updated[index] = current;
    setSubjectScores(updated);
  };

  const selectedStudentObj = students.find(s => s.id === selectedStudentId) || students[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={pendingAction !== null}
        title="Xác nhận lưu thay đổi"
        message={pendingAction?.message}
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

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold tracking-tight">{teacher.name}</h1>
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  {teacher.code}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                {teacher.subject} • {teacher.className} ({teacher.schoolYear}) • SĐT: {teacher.phone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-2xl border border-white/10 text-xs">
              <div>
                <p className="text-indigo-200">Sĩ số lớp:</p>
                <p className="font-extrabold text-base text-white">{students.length} Học sinh</p>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <p className="text-indigo-200">Trạng thái:</p>
                <p className="font-bold text-emerald-300">Đã sẵn sàng</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenRenameTeacherModal}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-2xl border border-white/15 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-indigo-200" />
                <span>Đổi Tên GVCN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTeacherPassError('');
                  setTeacherPassSuccess('');
                  setCurrTeacherPass('');
                  setNewTeacherPass('');
                  setConfirmTeacherPass('');
                  setIsChangeTeacherPassOpen(true);
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-2xl border border-white/15 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4 text-indigo-200" />
                <span>Đổi Mật Khẩu GVCN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center overflow-x-auto space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => handleAttemptTabChange('REPORTS')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'REPORTS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Đánh Giá Tuần & Tiết Yếu</span>
        </button>

        <button
          onClick={() => handleAttemptTabChange('PASSWORDS')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'PASSWORDS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Mật Khẩu Phụ Huynh</span>
        </button>

        <button
          onClick={() => handleAttemptTabChange('ANNOUNCEMENTS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer relative ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md ring-2 ring-amber-300/70'
              : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 hover:from-amber-100 hover:to-orange-100 border-2 border-amber-300 shadow-xs'
          }`}
        >
          <BellRing className={`w-4 h-4 ${activeTab === 'ANNOUNCEMENTS' ? 'text-white' : 'text-orange-600 animate-pulse'}`} />
          <span>Đăng Thông Báo</span>
          {announcements.some((a) => a.isPinned) ? (
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                activeTab === 'ANNOUNCEMENTS'
                  ? 'bg-white/25 text-white'
                  : 'bg-orange-600 text-white'
              }`}
            >
              {announcements.filter((a) => a.isPinned).length} Ghim
            </span>
          ) : (
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                activeTab === 'ANNOUNCEMENTS'
                  ? 'bg-white/25 text-white'
                  : 'bg-amber-200/90 text-amber-900'
              }`}
            >
              Nổi bật
            </span>
          )}
        </button>

        <button
          onClick={() => handleAttemptTabChange('SCHEDULE')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'SCHEDULE'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Thời Khóa Biểu</span>
        </button>

        <button
          onClick={() => handleAttemptTabChange('GRADES')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'GRADES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bảng Điểm Học Sinh</span>
        </button>

        <button
          onClick={() => handleAttemptTabChange('SUBJECT_TEACHER')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'SUBJECT_TEACHER'
              ? 'bg-indigo-900 text-white shadow-md'
              : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>📚 Giáo Viên Bộ Môn Nhận Xét</span>
        </button>

        <button
          onClick={() => handleAttemptTabChange('AUDIT_LOGS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật Ký Chỉnh Sửa ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: WEEKLY EVALUATION & WEAK POINT REPORT */}
      {activeTab === 'REPORTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Selector */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Chọn Tuần Học
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  const nextW = Number(e.target.value);
                  if (nextW !== selectedWeek) {
                    guardReportContextChange(() => setSelectedWeek(nextW));
                  }
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w} (Học kỳ I)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <label className="block text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  2. Chọn Học Sinh Cần Báo Cáo
                </label>
                <button
                  type="button"
                  onClick={handleOpenAddStudentModal}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  title="Thêm học sinh mới vào lớp và đồng bộ sang Phụ huynh & GV Bộ môn"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Thêm Học Sinh</span>
                </button>
              </div>
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {students.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (s.id !== selectedStudentId) {
                        guardReportContextChange(() => setSelectedStudentId(s.id));
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3.5 ${
                      selectedStudentId === s.id
                        ? 'bg-indigo-50/90 border-indigo-600 shadow-sm ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s.avatar ? (
                      <img
                        src={s.avatar}
                        alt={s.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 border border-slate-300 flex items-end justify-center overflow-hidden shrink-0">
                        <svg className="w-[85%] h-[85%] text-slate-400 translate-y-[10%]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-base text-slate-900 truncate">{s.name}</h4>
                      <p className="text-sm text-slate-600 font-mono font-medium mt-0.5 whitespace-nowrap">Mã: {s.studentCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (students.length <= 1) {
                          showToast('Lớp học cần có ít nhất 1 học sinh, không thể xóa học sinh cuối cùng!');
                          return;
                        }
                        setStudentPendingDelete(s);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title={`Xóa học sinh ${s.name}`}
                      aria-label={`Xóa học sinh ${s.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Report Editor */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {selectedStudentObj.avatar ? (
                  <img
                    src={selectedStudentObj.avatar}
                    alt={selectedStudentObj.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-200 border border-slate-300 flex items-end justify-center overflow-hidden shrink-0">
                    <svg className="w-[85%] h-[85%] text-slate-400 translate-y-[10%]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">
                    Báo Tình Hình Tuần {selectedWeek} - {selectedStudentObj.name}
                  </h2>
                  <p className="text-xs text-slate-500">Mã: {selectedStudentObj.studentCode} • Lớp 10A1</p>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                {isReportDirty && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-2xs font-bold">
                    Chưa lưu
                  </span>
                )}
                <button
                  onClick={handleSaveWeeklyReport}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Báo Cáo</span>
                </button>
              </div>
            </div>

            {/* Attendance & Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-2xs font-semibold text-slate-500">Tổng Số Tiết</label>
                <input
                  type="number"
                  value={currentReport.totalPeriods}
                  onChange={(e) =>
                    setCurrentReport({ ...currentReport, totalPeriods: Number(e.target.value) })
                  }
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-2xs font-semibold text-slate-500">Vắng Có Phép</label>
                <input
                  type="number"
                  value={currentReport.excusedAbsences}
                  onChange={(e) =>
                    setCurrentReport({ ...currentReport, excusedAbsences: Number(e.target.value) })
                  }
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-emerald-700"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-2xs font-semibold text-slate-500">Vắng Không Phép</label>
                <input
                  type="number"
                  value={currentReport.unexcusedAbsences}
                  onChange={(e) =>
                    setCurrentReport({ ...currentReport, unexcusedAbsences: Number(e.target.value) })
                  }
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-red-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-2xs font-semibold text-slate-500">Số Lần Đi Trễ</label>
                <input
                  type="number"
                  value={currentReport.lateArrivals}
                  onChange={(e) =>
                    setCurrentReport({ ...currentReport, lateArrivals: Number(e.target.value) })
                  }
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-amber-600"
                />
              </div>
            </div>

            {/* Ratings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xếp Loại Học Tập Tuần</label>
                <select
                  value={currentReport.learningStatus}
                  onChange={(e) =>
                    setCurrentReport({ ...currentReport, learningStatus: e.target.value as any })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="Chưa xếp loại">Chưa xếp loại</option>
                  <option value="Xuất sắc">Xuất sắc</option>
                  <option value="Tốt">Tốt</option>
                  <option value="Khá">Khá</option>
                  <option value="Cần cố gắng">Cần cố gắng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xếp Loại Hạnh Kiểm Tuần</label>
                <select
                  value={currentReport.conductStatus}
                  onChange={(e) =>
                    setCurrentReport({ ...currentReport, conductStatus: e.target.value as any })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="Tốt">Tốt</option>
                  <option value="Khá">Khá</option>
                  <option value="Cần rèn luyện">Cần rèn luyện</option>
                </select>
              </div>
            </div>

            {/* WEAK POINTS REGISTRATION (Tiết nào giờ nào học sinh còn yếu) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Ghi Nhận Môn Học & Tiết Học Yếu Trong Tuần</h3>
                </div>
                <span className="text-2xs text-slate-400">Hiện có {currentReport.weakPoints.length} tiết cần lưu ý</span>
              </div>

              {/* Added List */}
              <div className="space-y-2">
                {currentReport.weakPoints.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl text-center">
                    Chưa có tiết học yếu được ghi nhận trong tuần này.
                  </p>
                ) : (
                  currentReport.weakPoints.map((wp) => (
                    <div
                      key={wp.id}
                      className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between space-x-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-amber-950">
                            {wp.day} - Tiết {wp.periodNumber} ({wp.timeSlot})
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-bold text-2xs">
                            Môn {wp.subject}
                          </span>
                        </div>
                        <p className="text-amber-900">{wp.reason}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveWeakPoint(wp.id)}
                        className="p-1.5 text-amber-700 hover:text-red-600 rounded-lg hover:bg-amber-100 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Form to Add Weak Point */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-wider">
                    Thêm Tiết Học Học Sinh Yếu
                  </h4>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full whitespace-nowrap">
                    Tự động đồng bộ TKB Tuần {selectedWeek}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Thứ Mấy</label>
                    <select
                      value={newWeakDay}
                      onChange={(e) => handleDayChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Thứ 2">Thứ 2</option>
                      <option value="Thứ 3">Thứ 3</option>
                      <option value="Thứ 4">Thứ 4</option>
                      <option value="Thứ 5">Thứ 5</option>
                      <option value="Thứ 6">Thứ 6</option>
                      <option value="Thứ 7">Thứ 7</option>
                    </select>
                  </div>

                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chọn Tiết & Môn Học Theo Thời Khóa Biểu
                    </label>
                    <select
                      value={selectedPeriodIndex < availablePeriods.length ? selectedPeriodIndex : 0}
                      onChange={(e) => setSelectedPeriodIndex(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      {availablePeriods.length > 0 ? (
                        availablePeriods.map((p, idx) => (
                          <option key={idx} value={idx}>
                            Tiết {p.periodNumber} ({p.timeSlot}) — Môn: {p.subject} {p.teacher ? `[GV: ${p.teacher}]` : ''}
                          </option>
                        ))
                      ) : (
                        <option value={0}>Chưa có thời khóa biểu ngày này</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lý Do / Nhận Xét Tiết Học</label>
                  <input
                    type="text"
                    value={newWeakReason}
                    onChange={(e) => setNewWeakReason(e.target.value)}
                    placeholder="VD: Chưa làm bài tập về nhà, không tập trung nghe giảng..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddWeakPoint}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-2xs transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ghi Nhận Vào Báo Cáo</span>
                </button>
              </div>
            </div>

            {/* Teacher Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nhận Xét Của Giáo Viên Chủ Nhiệm Trong Tuần
              </label>
              <textarea
                rows={3}
                value={currentReport.teacherComment}
                onChange={(e) =>
                  setCurrentReport({ ...currentReport, teacherComment: e.target.value })
                }
                placeholder="Nhập nhận xét tổng quan tình hình học tập và đạo đức của học sinh..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {(currentReport.updatedByName || currentReport.updatedByEmail) && (
                <div className="mt-2 flex items-center space-x-1.5 text-2xs text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Đã cập nhật bởi <strong>{currentReport.updatedByName || currentReport.updatedByEmail}</strong> lúc {currentReport.updatedAt}
                  </span>
                </div>
              )}
            </div>

            {/* Parent Feedback View */}
            {currentReport.parentFeedback && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Phản Hồi Từ Phụ Huynh Học Sinh:</span>
                  <span className="text-2xs font-normal text-emerald-700">{currentReport.parentFeedbackDate}</span>
                </div>
                <p className="text-xs text-emerald-950 italic">"{currentReport.parentFeedback}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PARENT PASSWORDS MANAGEMENT */}
      {activeTab === 'PASSWORDS' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>Quản Lý Mật Khẩu Phụ Huynh</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mật khẩu cấp riêng cho từng Phụ huynh để truy cập sổ liên lạc học sinh
              </p>
            </div>
            <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-semibold border border-indigo-100">
              Sĩ số: {students.length} Học sinh
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Học Sinh</th>
                  <th className="p-3.5">Mã HS</th>
                  <th className="p-3.5">Mật Khẩu Hiện Tại</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-300 flex items-end justify-center overflow-hidden shrink-0">
                            <svg className="w-[85%] h-[85%] text-slate-400 translate-y-[10%]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-2xs text-slate-400">Ngày sinh: {student.dob}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 font-bold">{student.studentCode}</td>
                    <td className="p-3.5">
                      {editingStudentId === student.id ? (
                        <input
                          type="text"
                          value={newPasswordValue}
                          onChange={(e) => setNewPasswordValue(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-indigo-500 rounded-lg text-xs font-mono font-bold text-indigo-900 focus:outline-none"
                        />
                      ) : (
                        <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-bold text-xs">
                          {student.parentPassword}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {editingStudentId === student.id ? (
                        <>
                          <button
                            onClick={() => handleSavePassword(student.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-2xs transition-colors cursor-pointer"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudentId(null);
                              setNewPasswordValue('');
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-2xs transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => guardPasswordAction(() => {
                            setEditingStudentId(student.id);
                            setNewPasswordValue(student.parentPassword);
                          })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-2xs transition-colors cursor-pointer"
                        >
                          Đổi MK
                        </button>
                      )}

                      <button
                        onClick={() => guardPasswordAction(() => handleGeneratePassword(student.id))}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-2xs transition-colors cursor-pointer"
                      >
                        Tạo Ngẫu Nhiên
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENTS MANAGEMENT */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">Đăng Thông Báo / Ghi Chú Mới</h2>
                  <p className="text-xs text-amber-700 font-medium">
                    Gửi tin trực tiếp tới bảng tin Phụ huynh học sinh
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Tiêu Đề Thông Báo</label>
                <input
                  type="text"
                  required
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thông báo..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Phân Loại</label>
                <select
                  value={newAnnCategory}
                  onChange={(e) => setNewAnnCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Thông báo chung">Thông báo chung</option>
                  <option value="Học tập">Học tập & Thi cử</option>
                  <option value="Họp Phụ huynh">Họp Phụ huynh</option>
                  <option value="Hoạt động ngoại khóa">Hoạt động ngoại khóa</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Nội Dung Chi Tiết</label>
                <textarea
                  rows={4}
                  required
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  placeholder="Nhập nội dung gửi tới Phụ huynh..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <label
                htmlFor="pin"
                className={`flex items-start space-x-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  newAnnPinned
                    ? 'bg-amber-50 border-amber-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                }`}
              >
                <input
                  type="checkbox"
                  id="pin"
                  checked={newAnnPinned}
                  onChange={(e) => setNewAnnPinned(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400 text-orange-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <Pin className={`w-3.5 h-3.5 ${newAnnPinned ? 'text-orange-600' : 'text-slate-500'}`} />
                    <span className={`text-xs font-extrabold ${newAnnPinned ? 'text-amber-950' : 'text-slate-800'}`}>
                      Ghim lên đầu bảng tin Phụ huynh
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${newAnnPinned ? 'text-amber-800 font-medium' : 'text-slate-500'}`}>
                    Khi bật ghim, Phụ huynh mở tab Phụ huynh học sinh sẽ thấy ngay cửa sổ cảnh báo có thông báo quan trọng.
                  </p>
                </div>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Tải Thông Báo Lên Ngay</span>
              </button>
            </form>
          </div>

          {/* List of Announcements */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-slate-900 text-base">Bảng Tin Thông Báo Đã Đăng</h2>
              <span className="text-xs font-semibold text-slate-500">
                {announcements.length} thông báo · {announcements.filter((a) => a.isPinned).length} đã ghim
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Megaphone className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Chưa có thông báo nào được đăng.</p>
                <p className="text-[11px] text-slate-400">Hãy soạn thông báo mới bên trái và bật ghim nếu là tin quan trọng.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-xl border transition-all space-y-2 ${
                      ann.isPinned
                        ? 'bg-gradient-to-r from-amber-50/90 to-orange-50/50 border-2 border-amber-300 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ann.isPinned && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-orange-600 text-white text-2xs font-bold">
                              <Pin className="w-3 h-3" />
                              <span>Đã Ghim • Quan trọng</span>
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-2xs font-semibold">
                            {ann.category}
                          </span>
                          <span className="text-2xs text-slate-400">{ann.date}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1.5">{ann.title}</h3>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleAnnouncementPin(ann.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
                            ann.isPinned
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                          title={ann.isPinned ? 'Bỏ ghim thông báo này' : 'Ghim thông báo lên đầu bảng tin Phụ huynh'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{ann.isPinned ? 'Bỏ ghim' : 'Ghim'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULE MANAGEMENT */}
      {activeTab === 'SCHEDULE' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Chỉnh Sửa Thời Khóa Biểu (Lớp 10A1)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Nhập tên môn học, phòng học, giáo viên trực tiếp vào từng ô bên dưới. Thay đổi sẽ cập nhật trực tiếp cho Phụ huynh.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isScheduleDirty && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-2xs font-bold">
                  Chưa lưu
                </span>
              )}

              <select
                value={selectedWeek}
                onChange={(e) => guardScheduleWeekChange(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Biểu Tuần {selectedWeek}</span>
              </button>

              <button
                onClick={handleApplyScheduleToAllWeeks}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1"
                title="Sử dụng thời khóa biểu này áp dụng cho toàn bộ 18 tuần"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Áp Dụng Cho 18 Tuần</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="bg-slate-800 text-white font-bold">
                  <th className="p-3 border border-slate-700 text-center w-24">Tiết / Giờ</th>
                  {schedule.days.map((d) => (
                    <th key={d.dayName} className="p-3 border border-slate-700 text-center">
                      {d.dayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((periodNum) => (
                  <tr key={periodNum} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-bold text-center bg-slate-50 text-slate-700">
                      <div>Tiết {periodNum}</div>
                      <div className="text-2xs text-slate-400 font-normal">
                        {periodNum === 1 ? '07:30' : periodNum === 2 ? '08:20' : periodNum === 3 ? '09:15' : periodNum === 4 ? '10:05' : '11:00'}
                      </div>
                    </td>
                    {schedule.days.map((day) => {
                      const period = day.periods.find((p) => p.periodNumber === periodNum);
                      const currentSubject = period?.subject || '';
                      const currentRoom = period?.room || '';

                      return (
                        <td key={day.dayName} className="p-1.5 border border-slate-200 min-w-[120px]">
                          <div className="space-y-1 p-1 bg-indigo-50/40 rounded-xl border border-indigo-100">
                            <input
                              type="text"
                              value={currentSubject}
                              placeholder="Môn học"
                              onChange={(e) =>
                                handleUpdateSchedulePeriod(day.dayName, periodNum, 'subject', e.target.value)
                              }
                              className="w-full text-center font-bold text-xs text-indigo-950 bg-white border border-slate-200 rounded-lg p-1 focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              value={currentRoom}
                              placeholder="Phòng học"
                              onChange={(e) =>
                                handleUpdateSchedulePeriod(day.dayName, periodNum, 'room', e.target.value)
                              }
                              className="w-full text-center text-2xs text-slate-600 bg-white border border-slate-200 rounded-lg p-0.5 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SUBJECT GRADES MANAGER */}
      {activeTab === 'GRADES' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>Nhập & Cập Nhật Điểm Môn Học</span>
              </h2>
              <p className="text-xs text-slate-500">
                Nhập các con điểm phân cách bằng dấu phẩy (VD: 8, 8.5). Điểm trung bình môn sẽ tự động tính toán.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isGradesDirty && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-2xs font-bold">
                  Chưa lưu
                </span>
              )}

              <select
                value={selectedStudentId}
                onChange={(e) => guardGradesStudentChange(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentCode})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveSubjectScores}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Bảng Điểm</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-3 min-w-[140px]">Môn Học</th>
                  <th className="p-3 w-32">Miệng (hệ số 1)</th>
                  <th className="p-3 w-36">15 Phút (hệ số 1)</th>
                  <th className="p-3 w-32">45 Phút (hệ số 2)</th>
                  <th className="p-3 w-24">Giữa Kỳ (x2)</th>
                  <th className="p-3 w-24">Cuối Kỳ (x3)</th>
                  <th className="p-3 text-right w-20">ĐTB Môn</th>
                  <th className="p-3 min-w-[180px]">Nhận Xét Bộ Môn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectScores.map((score, idx) => (
                  <tr key={score.subjectName} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{score.subjectName}</div>
                      <div className="text-2xs text-slate-400 font-normal">{score.teacherName}</div>
                      {(score.updatedByName || score.updatedByEmail) && (
                        <div className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[140px]" title={`Đã cập nhật bởi ${score.updatedByName || score.updatedByEmail}${score.updatedAt ? ` lúc ${score.updatedAt}` : ''}`}>
                            {score.updatedByName || score.updatedByEmail}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={score.oralScores.join(', ')}
                        onChange={(e) => handleUpdateSubjectScore(idx, 'oralScores', e.target.value)}
                        placeholder="VD: 8, 9"
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={score.scores15m.join(', ')}
                        onChange={(e) => handleUpdateSubjectScore(idx, 'scores15m', e.target.value)}
                        placeholder="VD: 7.5, 8"
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={score.scores45m.join(', ')}
                        onChange={(e) => handleUpdateSubjectScore(idx, 'scores45m', e.target.value)}
                        placeholder="VD: 8"
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={score.midtermScore ?? ''}
                        onChange={(e) => handleUpdateSubjectScore(idx, 'midtermScore', e.target.value)}
                        placeholder="-"
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-indigo-900 focus:ring-1 focus:ring-indigo-500 text-center"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={score.finalScore ?? ''}
                        onChange={(e) => handleUpdateSubjectScore(idx, 'finalScore', e.target.value)}
                        placeholder="-"
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-indigo-900 focus:ring-1 focus:ring-indigo-500 text-center"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                        {score.averageScore}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 italic flex items-center justify-between gap-1.5" title="Chỉ Giáo viên bộ môn mới có quyền nhập/sửa lời nhận xét này">
                        <span className="truncate">
                          {score.teacherRemark && score.teacherRemark.trim() ? (
                            score.teacherRemark
                          ) : (
                            <span className="text-slate-400 not-italic">Chưa có nhận xét GVBM</span>
                          )}
                        </span>
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SUBJECT TEACHER DASHBOARD INTEGRATION */}
      {activeTab === 'SUBJECT_TEACHER' && (
        <SubjectTeacherDashboard
          teacher={teacher}
          students={students}
          dataVersion={dataVersion}
          guardRef={subjectTeacherGuardRef}
          onRefreshStudents={() => {
            refreshAuditLogs();
            onRefreshStudents();
          }}
        />
      )}

      {/* TAB 7: AUDIT LOG & DATA AUDIT */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-6">
          {/* Database Sync & Audit Status Card */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg border border-emerald-800/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Đồng Bộ Firebase Cloud &amp; Lưu Vết Chỉnh Sửa</span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Nhật Ký Truy Vết Chỉnh Sửa (Audit Log)
                </h2>
                <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
                  Mọi thao tác sửa điểm, nhận xét, báo cáo tuần hay đổi mật khẩu đều tự động ghi nhận vai trò và thời gian thực hiện (<span className="font-bold text-white">{teacher.name}</span>). Nhật ký được khóa quyền sửa/xóa trên Firestore Rules để đảm bảo minh bạch.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1.5 text-xs shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-emerald-200">Đồng bộ Cloud:</span>
                  <span className="font-bold text-emerald-300">Đang hoạt động</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-emerald-200">Bảo mật Firestore Rules:</span>
                  <span className="font-bold text-white">Chặn sửa/xóa nhật ký</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-emerald-200">Tổng bản ghi lưu vết:</span>
                  <span className="font-extrabold text-amber-300">{auditLogs.length} thao tác</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Audit Log Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Tìm theo tên giáo viên, tên học sinh, môn học..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={auditFilterType}
                  onChange={(e) => setAuditFilterType(e.target.value as 'ALL' | AuditTargetType)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Tất cả loại thao tác</option>
                  <option value="SUBJECT_SCORE">Điểm & Nhận xét môn</option>
                  <option value="WEEKLY_REPORT">Báo cáo tuần & Tiết yếu</option>
                  <option value="STUDENT_PASSWORD">Mật khẩu Phụ huynh</option>
                  <option value="SUBJECT_PASSWORD">Mật khẩu GV Bộ môn</option>
                  <option value="TEACHER_PASSWORD">Mật khẩu GV Chủ nhiệm</option>
                  <option value="ANNOUNCEMENT">Thông báo lớp</option>
                  <option value="SCHEDULE">Thời khóa biểu</option>
                </select>
                <button
                  type="button"
                  onClick={refreshAuditLogs}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="Làm mới nhật ký"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {(() => {
              const filteredLogs = auditLogs.filter((log) => {
                if (auditFilterType !== 'ALL' && log.targetType !== auditFilterType) {
                  return false;
                }
                if (!auditSearch.trim()) return true;
                const q = auditSearch.toLowerCase();
                return (
                  log.actorEmail.toLowerCase().includes(q) ||
                  log.actorName.toLowerCase().includes(q) ||
                  log.targetLabel.toLowerCase().includes(q) ||
                  log.summary.toLowerCase().includes(q)
                );
              });

              if (filteredLogs.length === 0) {
                return (
                  <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <History className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Chưa có lịch sử chỉnh sửa nào phù hợp</p>
                    <p className="text-xs text-slate-500">
                      Khi giáo viên hoặc phụ huynh lưu điểm, nhận xét, báo cáo tuần hoặc đổi mật khẩu, hệ thống sẽ tự động ghi lại người thực hiện và thời gian tại đây.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {filteredLogs.map((log) => {
                    const roleBadge =
                      log.actorRole === 'TEACHER'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        : log.actorRole === 'SUBJECT_TEACHER'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    const roleText =
                      log.actorRole === 'TEACHER'
                        ? 'GV Chủ Nhiệm'
                        : log.actorRole === 'SUBJECT_TEACHER'
                        ? 'GV Bộ Môn'
                        : 'Phụ Huynh';

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-emerald-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-2xs font-bold px-2 py-0.5 rounded-md border ${roleBadge}`}>
                              {roleText}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {log.actorName}
                            </span>
                            {log.actorEmail && (
                              <span className="text-xs text-slate-500 font-mono">({log.actorEmail})</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-indigo-900">{log.targetLabel}</p>
                          <p className="text-xs text-slate-700">{log.summary}</p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="inline-flex items-center space-x-1 text-2xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{log.displayTime}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CHANGE GVCN PASSWORD MODAL */}
      {isChangeTeacherPassOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if ((currTeacherPass || newTeacherPass || confirmTeacherPass) && !teacherPassSuccess) {
              setPendingAction({
                message: 'Bạn đang nhập thông tin đổi mật khẩu GVCN nhưng chưa cập nhật. Bạn có muốn đóng hộp thoại không?',
                onSave: () => {
                  const form = document.getElementById('gvcn-change-pass-form') as HTMLFormElement | null;
                  form?.requestSubmit();
                  return false;
                },
                onDiscard: () => {
                  setCurrTeacherPass('');
                  setNewTeacherPass('');
                  setConfirmTeacherPass('');
                  setTeacherPassError('');
                },
                onProceed: () => setIsChangeTeacherPassOpen(false),
              });
              return;
            }
            setIsChangeTeacherPassOpen(false);
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
                  <h3 className="font-extrabold text-slate-900 text-lg">Đổi Mật Khẩu GV Chủ Nhiệm</h3>
                  <p className="text-xs text-slate-500">{teacher.name} · {teacher.className}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeTeacherPassOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="gvcn-change-pass-form"
              onSubmit={(e) => {
                e.preventDefault();
                setTeacherPassError('');
                setTeacherPassSuccess('');

                const currentStoredPass = teacher.password || '123';
                if (currTeacherPass.trim() !== currentStoredPass) {
                  setTeacherPassError('Mật khẩu hiện tại không chính xác!');
                  return;
                }

                const trimmedNew = newTeacherPass.trim();
                if (trimmedNew.length < 3) {
                  setTeacherPassError('Mật khẩu mới phải có ít nhất 3 ký tự!');
                  return;
                }

                if (trimmedNew !== confirmTeacherPass.trim()) {
                  setTeacherPassError('Xác nhận mật khẩu mới không trùng khớp!');
                  return;
                }

                if (trimmedNew === currentStoredPass) {
                  setTeacherPassError('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
                  return;
                }

                DataService.updateTeacherPassword(trimmedNew);
                DataService.recordAuditLog({
                  actorRole: 'TEACHER',
                  action: 'UPDATE_TEACHER_PASSWORD',
                  targetType: 'TEACHER_PASSWORD',
                  targetLabel: `GVCN ${teacher.name} • ${teacher.className}`,
                  summary: 'Thay đổi mật khẩu đăng nhập Giáo viên chủ nhiệm',
                });
                refreshAuditLogs();
                if (onRefreshTeacher) {
                  onRefreshTeacher();
                }

                setTeacherPassSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được đồng bộ lên Firebase.');

                setTimeout(() => {
                  setIsChangeTeacherPassOpen(false);
                  setTeacherPassSuccess('');
                  setCurrTeacherPass('');
                  setNewTeacherPass('');
                  setConfirmTeacherPass('');
                }, 1500);
              }}
              className="space-y-4"
            >
              {teacherPassError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{teacherPassError}</span>
                </div>
              )}

              {teacherPassSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{teacherPassSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showTeacherPasses ? 'text' : 'password'}
                    required
                    value={currTeacherPass}
                    onChange={(e) => setCurrTeacherPass(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại (Mặc định: 123)..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPasses(!showTeacherPasses)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showTeacherPasses ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu mới</label>
                <input
                  type={showTeacherPasses ? 'text' : 'password'}
                  required
                  value={newTeacherPass}
                  onChange={(e) => setNewTeacherPass(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 3 ký tự)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Xác nhận mật khẩu mới</label>
                <input
                  type={showTeacherPasses ? 'text' : 'password'}
                  required
                  value={confirmTeacherPass}
                  onChange={(e) => setConfirmTeacherPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangeTeacherPassOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>Cập Nhật Mật Khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW STUDENT MODAL */}
      {isAddStudentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (newStudentName.trim() || newStudentDob.trim() || newStudentPassword.trim() !== '123') {
              setPendingAction({
                message: 'Bạn đang nhập thông tin học sinh mới nhưng chưa lưu. Bạn có muốn thêm học sinh này ngay không?',
                onSave: () => submitAddStudent(),
                onDiscard: () => resetAddStudentForm(),
                onProceed: () => setIsAddStudentOpen(false),
              });
              return;
            }
            resetAddStudentForm();
            setIsAddStudentOpen(false);
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Thêm Học Sinh Mới</h3>
                  <p className="text-xs text-slate-500">
                    {teacher.className} · Tự động đồng bộ Phụ huynh &amp; Giáo viên bộ môn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newStudentName.trim() || newStudentDob.trim() || newStudentPassword.trim() !== '123') {
                    setPendingAction({
                      message: 'Bạn đang nhập thông tin học sinh mới nhưng chưa lưu. Bạn có muốn thêm học sinh này ngay không?',
                      onSave: () => submitAddStudent(),
                      onDiscard: () => resetAddStudentForm(),
                      onProceed: () => setIsAddStudentOpen(false),
                    });
                    return;
                  }
                  resetAddStudentForm();
                  setIsAddStudentOpen(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="add-student-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitAddStudent();
              }}
              className="space-y-4"
            >
              {addStudentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{addStudentError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Họ và tên học sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Anh"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mã học sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={32}
                    value={newStudentCode}
                    onChange={(e) => setNewStudentCode(e.target.value)}
                    placeholder="VD: 10A105"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Ngày sinh</label>
                  <input
                    type="text"
                    maxLength={32}
                    value={newStudentDob}
                    onChange={(e) => setNewStudentDob(e.target.value)}
                    placeholder="VD: 15/05/2010"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Giới tính</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Hạnh kiểm ban đầu</label>
                  <select
                    value={newStudentConduct}
                    onChange={(e) => setNewStudentConduct(e.target.value as 'Tốt' | 'Khá' | 'Trung bình')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Tốt">Tốt</option>
                    <option value="Khá">Khá</option>
                    <option value="Trung bình">Trung bình</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mật khẩu đăng nhập Phụ huynh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={64}
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    placeholder="Mặc định: 123"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-800 leading-relaxed">
                Học sinh sau khi thêm sẽ lập tức hiển thị ở <strong>Cổng Phụ huynh</strong>, mục{' '}
                <strong>Cấp Mật Khẩu</strong>, <strong>Bảng Điểm</strong> và danh sách học sinh của{' '}
                <strong>Giáo viên Bộ Môn nhận xét</strong>.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newStudentName.trim() || newStudentDob.trim() || newStudentPassword.trim() !== '123') {
                      setPendingAction({
                        message: 'Bạn đang nhập thông tin học sinh mới nhưng chưa lưu. Bạn có muốn thêm học sinh này ngay không?',
                        onSave: () => submitAddStudent(),
                        onDiscard: () => resetAddStudentForm(),
                        onProceed: () => setIsAddStudentOpen(false),
                      });
                      return;
                    }
                    resetAddStudentForm();
                    setIsAddStudentOpen(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Lưu &amp; Thêm Học Sinh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STUDENT CONFIRMATION MODAL */}
      {studentPendingDelete && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setStudentPendingDelete(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl border border-red-200 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block">
                    Xác nhận xóa học sinh
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                    Bạn có chắc chắn muốn xóa học sinh này?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStudentPendingDelete(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900">{studentPendingDelete.name}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700">
                  Mã: {studentPendingDelete.studentCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khi xác nhận xóa, học sinh này cùng bảng điểm, nhận xét bộ môn, báo cáo tuần và tài khoản đăng nhập sẽ bị xóa và đồng bộ bên{' '}
                <strong>Phụ huynh học sinh</strong> và <strong>Giáo viên Bộ Môn</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStudentPendingDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME GVCN MODAL */}
      {isRenameTeacherOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (newTeacherNameInput.trim() !== teacher.name) {
              setPendingAction({
                message: 'Bạn đã nhập tên Giáo viên chủ nhiệm mới nhưng chưa lưu. Bạn có muốn lưu thay đổi này không?',
                onSave: () => submitRenameTeacher(),
                onDiscard: () => {
                  setNewTeacherNameInput(teacher.name);
                  setRenameTeacherError('');
                },
                onProceed: () => setIsRenameTeacherOpen(false),
              });
              return;
            }
            setIsRenameTeacherOpen(false);
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Đổi Tên GV Chủ Nhiệm</h3>
                  <p className="text-xs text-slate-500">
                    {teacher.className} · Mã: {teacher.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (newTeacherNameInput.trim() !== teacher.name) {
                    setPendingAction({
                      message: 'Bạn đã nhập tên Giáo viên chủ nhiệm mới nhưng chưa lưu. Bạn có muốn lưu thay đổi này không?',
                      onSave: () => submitRenameTeacher(),
                      onDiscard: () => {
                        setNewTeacherNameInput(teacher.name);
                        setRenameTeacherError('');
                      },
                      onProceed: () => setIsRenameTeacherOpen(false),
                    });
                    return;
                  }
                  setIsRenameTeacherOpen(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="gvcn-rename-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitRenameTeacher();
              }}
              className="space-y-4"
            >
              {renameTeacherError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{renameTeacherError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Tên hiển thị hiện tại</label>
                <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                  {teacher.name}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Tên Giáo viên chủ nhiệm mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  autoFocus
                  value={newTeacherNameInput}
                  onChange={(e) => setNewTeacherNameInput(e.target.value)}
                  placeholder="VD: Cô Nguyễn Thị Minh Tâm"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-800 leading-relaxed">
                Tên mới sẽ được lưu đồng bộ lên Firestore và hiển thị ở <strong>Trang chủ</strong>,{' '}
                <strong>Sổ liên lạc Phụ huynh</strong> và <strong>Giáo viên Bộ Môn</strong>.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newTeacherNameInput.trim() !== teacher.name) {
                      setPendingAction({
                        message: 'Bạn đã nhập tên Giáo viên chủ nhiệm mới nhưng chưa lưu. Bạn có muốn lưu thay đổi này không?',
                        onSave: () => submitRenameTeacher(),
                        onDiscard: () => {
                          setNewTeacherNameInput(teacher.name);
                          setRenameTeacherError('');
                        },
                        onProceed: () => setIsRenameTeacherOpen(false),
                      });
                      return;
                    }
                    setIsRenameTeacherOpen(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Tên Mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
