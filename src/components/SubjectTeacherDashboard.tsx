import React, { useState, useEffect, useRef, useImperativeHandle, useMemo } from 'react';
import {
  BookOpen,
  Users,
  CheckCircle2,
  Save,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  Award,
  ChevronRight,
  Search,
  MessageSquare,
  Clock,
  Key,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Student, TeacherInfo, SubjectTeacherInfo, SubjectScore, WeeklyReport, WeakPointDetail } from '../types';
import { DataService } from '../services/dataStorage';
import { UnsavedChangesModal, UnsavedGuardHandle } from './UnsavedChangesModal';

interface Props {
  teacher: TeacherInfo;
  students: Student[];
  initialSubject?: string;
  subjectTeachers?: SubjectTeacherInfo[];
  dataVersion?: number;
  guardRef?: React.RefObject<UnsavedGuardHandle | null>;
  onRefreshStudents?: () => void;
  onRefreshSubjectTeachers?: () => void;
}

const areNumArraysEqual = (a: number[] = [], b: number[] = []) =>
  a.length === b.length && a.every((val, i) => val === b[i]);

const isSubjectScoreModified = (draft?: SubjectScore, saved?: SubjectScore): boolean => {
  if (!draft || !saved) return false;
  return (
    !areNumArraysEqual(draft.oralScores, saved.oralScores) ||
    !areNumArraysEqual(draft.scores15m, saved.scores15m) ||
    !areNumArraysEqual(draft.scores45m, saved.scores45m) ||
    (draft.midtermScore ?? null) !== (saved.midtermScore ?? null) ||
    (draft.finalScore ?? null) !== (saved.finalScore ?? null) ||
    (draft.teacherRemark || '') !== (saved.teacherRemark || '') ||
    Boolean(draft.isNeedingImprovement) !== Boolean(saved.isNeedingImprovement)
  );
};

export const SubjectTeacherDashboard: React.FC<Props> = ({
  teacher,
  students,
  initialSubject = 'Ngữ Văn',
  subjectTeachers: subjectTeachersProp,
  dataVersion,
  guardRef,
  onRefreshStudents,
  onRefreshSubjectTeachers,
}) => {
  const [teachersList, setTeachersList] = useState<SubjectTeacherInfo[]>(() =>
    subjectTeachersProp && subjectTeachersProp.length > 0
      ? subjectTeachersProp
      : DataService.getSubjectTeachers()
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [activeSubjectTeacher, setActiveSubjectTeacher] = useState<SubjectTeacherInfo>(() => {
    const initialList =
      subjectTeachersProp && subjectTeachersProp.length > 0
        ? subjectTeachersProp
        : DataService.getSubjectTeachers();
    return initialList.find((t) => t.subject === initialSubject) || initialList[1] || initialList[0];
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'hs01');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Draft state & saved snapshot for each student's subject score
  const [scoresMap, setScoresMap] = useState<Record<string, SubjectScore>>({});
  const [savedScoresMap, setSavedScoresMap] = useState<Record<string, SubjectScore>>({});
  const savedScoresMapRef = useRef<Record<string, SubjectScore>>({});

  const updateSavedScoresMap = (next: Record<string, SubjectScore>) => {
    savedScoresMapRef.current = next;
    setSavedScoresMap(next);
  };

  // Weak point draft state
  const [newWeakDay, setNewWeakDay] = useState('Thứ 2');
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [newWeakReason, setNewWeakReason] = useState('');

  // Change Password modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Pending navigation confirmation modal
  const [pendingAction, setPendingAction] = useState<{
    message: string;
    onSave: () => boolean | void;
    onDiscard: () => void;
    onProceed: () => void;
  } | null>(null);

  // Keep subject teachers list synced with prop / Firestore updates
  useEffect(() => {
    if (subjectTeachersProp && subjectTeachersProp.length > 0) {
      setTeachersList(subjectTeachersProp);
    } else {
      setTeachersList(DataService.getSubjectTeachers());
    }
  }, [subjectTeachersProp, dataVersion]);

  // Update subject teacher info when selectedSubject or teachersList changes
  useEffect(() => {
    const found = teachersList.find((t) => t.subject === selectedSubject);
    if (found) {
      setActiveSubjectTeacher(found);
    }
  }, [selectedSubject, teachersList]);

  // Load subject scores for all students for the current subject
  const buildScoresMapFromStorage = () => {
    const map: Record<string, SubjectScore> = {};
    students.forEach(st => {
      const allScores = DataService.getSubjectScores(st.id);
      let subjectScore = allScores.find(s => s.subjectName === selectedSubject);
      if (!subjectScore) {
        subjectScore = {
          subjectName: selectedSubject,
          teacherName: activeSubjectTeacher.name,
          oralScores: [],
          scores15m: [],
          scores45m: [],
          averageScore: 0,
          teacherRemark: '',
          isNeedingImprovement: false,
        };
      } else {
        subjectScore = {
          ...subjectScore,
          oralScores: [...(subjectScore.oralScores || [])],
          scores15m: [...(subjectScore.scores15m || [])],
          scores45m: [...(subjectScore.scores45m || [])],
          teacherName: activeSubjectTeacher.name,
        };
      }
      map[st.id] = subjectScore;
    });
    return map;
  };

  useEffect(() => {
    const freshMap = buildScoresMapFromStorage();
    updateSavedScoresMap(freshMap);
    setScoresMap(freshMap);
  }, [selectedSubject]);

  useEffect(() => {
    const prevSaved = savedScoresMapRef.current;
    const freshMap = buildScoresMapFromStorage();
    updateSavedScoresMap(freshMap);
    setScoresMap((prev) => {
      const next: Record<string, SubjectScore> = {};
      students.forEach((st) => {
        if (prev[st.id] && isSubjectScoreModified(prev[st.id], prevSaved[st.id])) {
          next[st.id] = prev[st.id];
        } else {
          next[st.id] = freshMap[st.id];
        }
      });
      return next;
    });
    setSelectedStudentId((prev) => {
      if (students.length === 0) return prev;
      return students.some((st) => st.id === prev) ? prev : students[0].id;
    });
  }, [students, dataVersion]);

  const dirtyStudentIds = useMemo(
    () => students.filter((st) => isSubjectScoreModified(scoresMap[st.id], savedScoresMap[st.id])).map((st) => st.id),
    [students, scoresMap, savedScoresMap]
  );

  const isWeakNoteDirty = newWeakReason.trim().length > 0;
  const hasUnsavedChanges = dirtyStudentIds.length > 0 || isWeakNoteDirty;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to calculate average score
  const calculateAverage = (scoreObj: SubjectScore): number => {
    const oralSum = scoreObj.oralScores.reduce((a, b) => a + b, 0);
    const oralCount = scoreObj.oralScores.length;

    const s15Sum = scoreObj.scores15m.reduce((a, b) => a + b, 0);
    const s15Count = scoreObj.scores15m.length;

    const s45Sum = scoreObj.scores45m.reduce((a, b) => a + b, 0);
    const s45Count = scoreObj.scores45m.length;

    let totalPoints = oralSum + s15Sum + s45Sum * 2;
    let totalCoeff = oralCount + s15Count + s45Count * 2;

    if (scoreObj.midtermScore !== undefined && scoreObj.midtermScore !== null && !isNaN(scoreObj.midtermScore)) {
      totalPoints += scoreObj.midtermScore * 2;
      totalCoeff += 2;
    }

    if (scoreObj.finalScore !== undefined && scoreObj.finalScore !== null && !isNaN(scoreObj.finalScore)) {
      totalPoints += scoreObj.finalScore * 3;
      totalCoeff += 3;
    }

    if (totalCoeff === 0) return 0;
    return Number((totalPoints / totalCoeff).toFixed(1));
  };

  // Update a field in draft scoresMap
  const handleScoreChange = (studentId: string, field: keyof SubjectScore, value: any) => {
    setScoresMap(prev => {
      const current = prev[studentId] || {
        subjectName: selectedSubject,
        teacherName: activeSubjectTeacher.name,
        oralScores: [],
        scores15m: [],
        scores45m: [],
        averageScore: 0,
        teacherRemark: '',
        isNeedingImprovement: false
      };

      const updated = { ...current, [field]: value };
      updated.averageScore = calculateAverage(updated);
      return { ...prev, [studentId]: updated };
    });
  };

  // Save single student's subject score & remark
  const handleSaveStudentScore = (studentId: string) => {
    const scoreObj = scoresMap[studentId];
    if (!scoreObj) return;

    const stamped = DataService.saveSingleSubjectScore(studentId, scoreObj);
    setScoresMap((prev) => ({ ...prev, [studentId]: stamped }));
    updateSavedScoresMap({ ...savedScoresMapRef.current, [studentId]: stamped });
    const student = students.find(s => s.id === studentId);
    DataService.recordAuditLog({
      actorRole: 'SUBJECT_TEACHER',
      action: 'UPDATE_SCORE_REMARK',
      targetType: 'SUBJECT_SCORE',
      targetLabel: `Môn ${selectedSubject} • ${student?.name || studentId}`,
      summary: `Cập nhật điểm (ĐTB: ${stamped.averageScore})${stamped.teacherRemark ? ` & nhận xét: "${stamped.teacherRemark.slice(0, 80)}${stamped.teacherRemark.length > 80 ? '...' : ''}"` : ''}`,
    });
    showToast(`Đã lưu nhận xét & điểm môn ${selectedSubject} cho em ${student?.name || ''}!`);
    if (onRefreshStudents) onRefreshStudents();
  };

  // Save all students' scores & remarks
  const handleSaveAll = () => {
    const updatedMap: Record<string, SubjectScore> = { ...scoresMap };
    students.forEach(st => {
      const scoreObj = scoresMap[st.id];
      if (scoreObj) {
        updatedMap[st.id] = DataService.saveSingleSubjectScore(st.id, scoreObj);
      }
    });
    setScoresMap(updatedMap);
    updateSavedScoresMap(updatedMap);
    DataService.recordAuditLog({
      actorRole: 'SUBJECT_TEACHER',
      action: 'BATCH_UPDATE_SCORES',
      targetType: 'SUBJECT_SCORE',
      targetLabel: `Môn ${selectedSubject} • Toàn lớp ${teacher.className}`,
      summary: `Cập nhật hàng loạt bảng điểm & nhận xét môn ${selectedSubject} cho ${students.length} học sinh`,
    });
    showToast(`Đã lưu toàn bộ điểm & nhận xét môn ${selectedSubject} cho lớp ${teacher.className}!`);
    if (onRefreshStudents) onRefreshStudents();
  };

  // Class Schedule for Week to add weak period note
  const currentSchedule = DataService.getWeeklySchedule(selectedWeek);
  const currentDaySchedule = currentSchedule.days.find(d => d.dayName === newWeakDay);
  const availablePeriods = currentDaySchedule?.periods.filter(p => p.subject === selectedSubject) || currentDaySchedule?.periods || [];

  const handleAddWeakNote = (): boolean => {
    if (!newWeakReason.trim()) {
      showToast('Vui lòng nhập lý do/nội dung nhắc nhở học sinh!');
      return false;
    }

    const safeIndex = selectedPeriodIndex < availablePeriods.length ? selectedPeriodIndex : 0;
    const selectedPeriodObj = availablePeriods[safeIndex];

    const periodNum = selectedPeriodObj ? selectedPeriodObj.periodNumber : 1;
    const timeSlotStr = selectedPeriodObj ? selectedPeriodObj.timeSlot : '07:30 - 08:15';

    const report = DataService.getWeeklyReport(selectedStudentId, selectedWeek);
    const newWp: WeakPointDetail = {
      id: 'wp_' + Date.now(),
      day: newWeakDay,
      periodNumber: periodNum,
      timeSlot: timeSlotStr,
      subject: selectedSubject,
      reason: newWeakReason.trim(),
      severity: 'Trung bình'
    };

    report.weakPoints = [...report.weakPoints, newWp];
    DataService.saveWeeklyReport(selectedStudentId, selectedWeek, report, true);

    const st = students.find(s => s.id === selectedStudentId);
    DataService.recordAuditLog({
      actorRole: 'SUBJECT_TEACHER',
      action: 'ADD_WEAK_PERIOD',
      targetType: 'WEEKLY_REPORT',
      targetLabel: `Tuần ${selectedWeek} • ${st?.name || selectedStudentId}`,
      summary: `Ghi nhận tiết cần lưu ý môn ${selectedSubject} (${newWeakDay} - Tiết ${periodNum}): ${newWeakReason.trim()}`,
    });
    setNewWeakReason('');
    showToast(`Đã ghi nhận tiết học cần lưu ý môn ${selectedSubject} cho em ${st?.name || ''}!`);
    return true;
  };

  const saveAllPendingChanges = () => {
    if (dirtyStudentIds.length > 0) {
      handleSaveAll();
    }
    if (isWeakNoteDirty) {
      handleAddWeakNote();
    }
  };

  const getUnsavedSummary = () => {
    const parts: string[] = [];
    if (dirtyStudentIds.length > 0) {
      parts.push(`điểm / lời nhận xét môn ${selectedSubject} (${dirtyStudentIds.length} học sinh)`);
    }
    if (isWeakNoteDirty) {
      parts.push('ghi nhận tiết học cần lưu ý');
    }
    return `Bạn đã nhập ${parts.join(' và ')} nhưng chưa bấm Lưu. Bạn có muốn lưu lại trước khi rời khỏi không?`;
  };

  useImperativeHandle(guardRef, () => ({
    hasUnsavedChanges: () => hasUnsavedChanges,
    saveUnsavedChanges: () => {
      saveAllPendingChanges();
      return true;
    },
    getUnsavedDescription: () => getUnsavedSummary(),
  }));

  const handleSubjectSwitchAttempt = (nextSubject: string) => {
    if (nextSubject === selectedSubject) return;
    if (hasUnsavedChanges) {
      setPendingAction({
        message: getUnsavedSummary(),
        onSave: () => {
          saveAllPendingChanges();
          return true;
        },
        onDiscard: () => {
          setScoresMap(savedScoresMap);
          setNewWeakReason('');
        },
        onProceed: () => setSelectedSubject(nextSubject),
      });
      return;
    }
    setSelectedSubject(nextSubject);
  };

  const handleWeakStudentOrWeekAttempt = (proceedFn: () => void) => {
    if (isWeakNoteDirty) {
      setPendingAction({
        message: 'Bạn đã nhập nội dung nhắc nhở tiết học nhưng chưa bấm "Ghi Nhận Vào Báo Cáo". Bạn có muốn lưu lại trước khi thay đổi không?',
        onSave: () => handleAddWeakNote(),
        onDiscard: () => setNewWeakReason(''),
        onProceed: proceedFn,
      });
      return;
    }
    proceedFn();
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Unsaved Changes Modal */}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: SUBJECT TEACHER BAR & SUBJECT SWITCHER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
              <span>Giao Diện Cho Giáo Viên Bộ Môn</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
              <span>Môn: {selectedSubject}</span>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                {activeSubjectTeacher.name}
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Trực tiếp nhập nhận xét môn học, theo dõi tiến độ bài kiểm tra và phản hồi tới Phụ huynh học sinh {teacher.className}.
            </p>
          </div>

          {/* Subject Switcher & Change Password */}
          <div className="flex flex-col gap-3 shrink-0 max-w-xs w-full">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2">
              <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Đổi Môn Giảng Dạy:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectSwitchAttempt(e.target.value)}
                className="w-full bg-white text-slate-900 font-extrabold text-sm p-2.5 rounded-xl border-none shadow-md focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                {teachersList.map((st) => (
                  <option key={st.subject} value={st.subject}>
                    Môn {st.subject} — ({st.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setIsChangePasswordOpen(true);
              }}
              className="w-full px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Key className="w-4 h-4 text-amber-300" />
              <span>Đổi Mật Khẩu Môn {selectedSubject}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATS & ACTIONS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Sĩ Số Học Sinh</span>
            <div className="text-2xl font-black text-slate-900">{students.length} Học Sinh</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">ĐTB Môn {selectedSubject}</span>
            <div className="text-2xl font-black text-indigo-600">
              {(
                (Object.values(scoresMap) as SubjectScore[]).reduce((acc: number, curr: SubjectScore) => acc + (curr.averageScore || 0), 0) /
                (Object.keys(scoresMap).length || 1)
              ).toFixed(1)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400">Học Sinh Cần Lưu Ý</span>
            <div className="text-2xl font-black text-amber-600">
              {(Object.values(scoresMap) as SubjectScore[]).filter((s: SubjectScore) => s.isNeedingImprovement || s.averageScore < 6.5).length} Học Sinh
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MAIN SECTION: ENTER SUBJECT REMARKS & SCORES FOR ALL STUDENTS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Bảng Nhận Xét & Nhập Điểm Môn {selectedSubject}
              </h2>
              <p className="text-xs text-slate-500">
                Giáo viên bộ môn trực tiếp ghi nhận xét cá nhân từng em và cập nhật điểm số công khai tới Phụ huynh.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {dirtyStudentIds.length > 0 && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{dirtyStudentIds.length} học sinh chưa lưu</span>
              </span>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên/mã học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Save All Button */}
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Tất Cả ({filteredStudents.length})</span>
            </button>
          </div>
        </div>

        {/* STUDENT REMARK CARDS LIST */}
        <div className="space-y-6">
          {filteredStudents.map((student) => {
            const scoreObj = scoresMap[student.id] || {
              subjectName: selectedSubject,
              teacherName: activeSubjectTeacher.name,
              oralScores: [],
              scores15m: [],
              scores45m: [],
              averageScore: 0,
              teacherRemark: '',
              isNeedingImprovement: false,
            };

            return (
              <div
                key={student.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  scoreObj.isNeedingImprovement
                    ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                    : 'bg-slate-50/50 border-slate-200/90 hover:border-indigo-200'
                }`}
              >
                {/* Student Header info & Save Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-slate-900 text-base">{student.name}</h3>
                        <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                          MS: {student.studentCode}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-500 font-medium">Lớp {teacher.className}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {dirtyStudentIds.includes(student.id) && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-2xs font-bold">
                        Chưa lưu
                      </span>
                    )}

                    <label className="flex items-center space-x-2 text-xs font-bold text-amber-900 bg-amber-100/80 px-3 py-1.5 rounded-xl cursor-pointer border border-amber-200">
                      <input
                        type="checkbox"
                        checked={scoreObj.isNeedingImprovement || false}
                        onChange={(e) => handleScoreChange(student.id, 'isNeedingImprovement', e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Đánh giá cần cố gắng</span>
                    </label>

                    <button
                      onClick={() => handleSaveStudentScore(student.id)}
                      className={`px-3.5 py-1.5 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer ${
                        dirtyStudentIds.includes(student.id)
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Lưu Nhận Xét</span>
                    </button>
                  </div>
                </div>

                {/* Score inputs grid */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 mb-1">
                      Điểm Miệng (Phẩy)
                    </label>
                    <input
                      type="text"
                      value={scoreObj.oralScores.join(', ')}
                      onChange={(e) => {
                        const vals = e.target.value
                          .split(',')
                          .map(v => parseFloat(v.trim()))
                          .filter(v => !isNaN(v) && v >= 0 && v <= 10);
                        handleScoreChange(student.id, 'oralScores', vals);
                      }}
                      placeholder="VD: 8, 9"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-500 mb-1">
                      Điểm 15 Phút
                    </label>
                    <input
                      type="text"
                      value={scoreObj.scores15m.join(', ')}
                      onChange={(e) => {
                        const vals = e.target.value
                          .split(',')
                          .map(v => parseFloat(v.trim()))
                          .filter(v => !isNaN(v) && v >= 0 && v <= 10);
                        handleScoreChange(student.id, 'scores15m', vals);
                      }}
                      placeholder="VD: 7, 8.5"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-500 mb-1">
                      Điểm 1 Tiết (45P)
                    </label>
                    <input
                      type="text"
                      value={scoreObj.scores45m.join(', ')}
                      onChange={(e) => {
                        const vals = e.target.value
                          .split(',')
                          .map(v => parseFloat(v.trim()))
                          .filter(v => !isNaN(v) && v >= 0 && v <= 10);
                        handleScoreChange(student.id, 'scores45m', vals);
                      }}
                      placeholder="VD: 8"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-500 mb-1">
                      Thi Giữa Kỳ
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={scoreObj.midtermScore ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        handleScoreChange(student.id, 'midtermScore', isNaN(val) ? undefined : val);
                      }}
                      placeholder="VD: 8.5"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-500 mb-1">
                      Thi Cuối Kỳ
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={scoreObj.finalScore ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        handleScoreChange(student.id, 'finalScore', isNaN(val) ? undefined : val);
                      }}
                      placeholder="VD: 9.0"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="bg-indigo-50/80 p-2 rounded-xl border border-indigo-100 text-center flex flex-col justify-center">
                    <span className="text-2xs font-bold text-indigo-900 block">ĐTB Môn</span>
                    <span className="text-lg font-black text-indigo-700">{scoreObj.averageScore}</span>
                  </div>
                </div>

                {/* Subject Teacher Remark Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Lời Nhận Xét Của Giáo Viên Môn {selectedSubject} ({activeSubjectTeacher.name}):</span>
                    <span className="text-2xs font-normal text-slate-400">Nội dung này hiển thị trực tiếp cho Phụ huynh</span>
                  </label>
                  <textarea
                    rows={2}
                    value={scoreObj.teacherRemark || ''}
                    onChange={(e) => handleScoreChange(student.id, 'teacherRemark', e.target.value)}
                    placeholder={`VD: Em ${student.name} có thái độ học tập môn ${selectedSubject} rất nghiêm túc, hoàn thành tốt các bài tập được giao...`}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                  {(scoreObj.updatedByName || scoreObj.updatedByEmail) && (
                    <div className="mt-2 flex items-center space-x-1.5 text-2xs text-emerald-700 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Đã cập nhật bởi <strong>{scoreObj.updatedByName || scoreObj.updatedByEmail}</strong>
                        {scoreObj.updatedAt ? ` lúc ${scoreObj.updatedAt}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: RECORD WEEKLY SUBJECT NOTE / WEAK PERIOD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Ghi Nhận Tiết Học Cần Chú Ý Môn {selectedSubject} Theo Tuần
            </h2>
            <p className="text-xs text-slate-500">
              Khi học sinh học yếu, chưa chuẩn bị bài hoặc vi phạm trong tiết học môn này, Giáo viên bộ môn có thể ghi chú ngay vào sổ báo cáo tuần của học sinh.
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Student Select */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Học Sinh</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  const val = e.target.value;
                  handleWeakStudentOrWeekAttempt(() => setSelectedStudentId(val));
                }}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Week Select */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Tuần Học</label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  handleWeakStudentOrWeekAttempt(() => setSelectedWeek(val));
                }}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>

            {/* Day Select */}
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">Thứ Mấy</label>
              <select
                value={newWeakDay}
                onChange={(e) => {
                  setNewWeakDay(e.target.value);
                  setSelectedPeriodIndex(0);
                }}
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lý Do / Nội Dung Nhắc Nhở Tiết Học Môn {selectedSubject}
            </label>
            <input
              type="text"
              value={newWeakReason}
              onChange={(e) => setNewWeakReason(e.target.value)}
              placeholder={`VD: Không thuộc bài cũ môn ${selectedSubject}, chưa chuẩn bị tập bài tập...`}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleAddWeakNote}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi Nhận Vào Báo Cáo Báo Cho Phụ Huynh</span>
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if ((currentPassword || newPassword || confirmPassword) && !passwordSuccess) {
              setPendingAction({
                message: 'Bạn đang nhập thông tin đổi mật khẩu nhưng chưa cập nhật. Bạn có muốn đóng hộp thoại không?',
                onSave: () => {
                  const form = document.getElementById('subject-teacher-pass-form') as HTMLFormElement | null;
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
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Đổi Mật Khẩu GV Bộ Môn</h3>
                  <p className="text-xs text-slate-500">
                    Môn {selectedSubject} • {activeSubjectTeacher.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              id="subject-teacher-pass-form"
              onSubmit={(e) => {
                e.preventDefault();
                setPasswordError('');
                setPasswordSuccess('');

                const currentStoredPass = activeSubjectTeacher.password || '123';
                if (currentPassword.trim() !== currentStoredPass) {
                  setPasswordError('Mật khẩu hiện tại không chính xác!');
                  return;
                }

                const trimmedNew = newPassword.trim();
                if (trimmedNew.length < 3) {
                  setPasswordError('Mật khẩu mới phải có ít nhất 3 ký tự!');
                  return;
                }

                if (trimmedNew !== confirmPassword.trim()) {
                  setPasswordError('Xác nhận mật khẩu mới không trùng khớp!');
                  return;
                }

                if (trimmedNew === currentStoredPass) {
                  setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
                  return;
                }

                const updatedList = DataService.updateSubjectTeacherPassword(selectedSubject, trimmedNew);
                setTeachersList(updatedList);
                const updatedTeacher = updatedList.find((t) => t.subject === selectedSubject);
                if (updatedTeacher) {
                  setActiveSubjectTeacher(updatedTeacher);
                }
                DataService.recordAuditLog({
                  actorRole: 'SUBJECT_TEACHER',
                  action: 'UPDATE_SUBJECT_PASSWORD',
                  targetType: 'SUBJECT_PASSWORD',
                  targetLabel: `Môn ${selectedSubject} • ${activeSubjectTeacher.name}`,
                  summary: `Thay đổi mật khẩu đăng nhập Giáo viên bộ môn ${selectedSubject}`,
                });
                if (onRefreshSubjectTeachers) {
                  onRefreshSubjectTeachers();
                }

                setPasswordSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được đồng bộ lên Firebase.');

                setTimeout(() => {
                  setIsChangePasswordOpen(false);
                  setPasswordSuccess('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }, 1500);
              }}
              className="space-y-4"
            >
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
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại (Mặc định: 123)..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu mới</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 3 ký tự)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Xác nhận mật khẩu mới</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
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
