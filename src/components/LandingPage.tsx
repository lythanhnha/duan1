import React, { useState, useRef, useEffect } from 'react';
import {
  UserCheck,
  ShieldCheck,
  BookOpen,
  Search,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Lock,
  HelpCircle,
  CheckCircle,
  BookMarked,
  BellRing,
  X,
  School,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { Student, TeacherInfo, SubjectTeacherInfo, ClassRoomInfo } from '../types';
import { DEFAULT_SUBJECT_TEACHERS, DataService } from '../services/dataStorage';

interface Props {
  classes: ClassRoomInfo[];
  activeClassId: string;
  teacher: TeacherInfo;
  subjectTeachers: SubjectTeacherInfo[];
  students: Student[];
  dataVersion?: number;
  onSelectClass: (classId: string) => void;
  onCreateClass: (input: {
    className: string;
    schoolYear: string;
    teacherName: string;
    teacherCode: string;
    subject?: string;
    phone?: string;
    password?: string;
  }) => ClassRoomInfo;
  onSelectTeacher: (code: string) => boolean;
  onSelectSubjectTeacher: (subjectTeacher: SubjectTeacherInfo, passwordEntered: string) => boolean;
  onSelectParent: (student: Student, passwordEntered: string) => boolean;
  onOpenGuide: () => void;
  onTriggerHiddenAdmin?: () => void;
}

export const LandingPage: React.FC<Props> = ({
  classes,
  activeClassId,
  teacher,
  subjectTeachers,
  students,
  dataVersion,
  onSelectClass,
  onCreateClass,
  onSelectTeacher,
  onSelectSubjectTeacher,
  onSelectParent,
  onOpenGuide,
  onTriggerHiddenAdmin,
}) => {
  void dataVersion;
  const [selectedRole, setSelectedRole] = useState<'NONE' | 'TEACHER' | 'SUBJECT_TEACHER' | 'PARENT'>('NONE');
  const [isParentPinnedBannerDismissed, setIsParentPinnedBannerDismissed] = useState(false);
  const pinnedAnnouncementsCount = DataService.getAnnouncements().filter((a) => Boolean(a.isPinned)).length;
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Subject Teacher selection state
  const [selectedSubject, setSelectedSubject] = useState<string>('Ngữ Văn');
  const [subjectPasswordInput, setSubjectPasswordInput] = useState('');
  const [subjectError, setSubjectError] = useState('');

  // Parent student login state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [parentError, setParentError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  // Create new class modal & top-right class dropdown state
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const classMenuRef = useRef<HTMLDivElement | null>(null);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newSchoolYear, setNewSchoolYear] = useState('2025 - 2026');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherCode, setNewTeacherCode] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('Chủ nhiệm / Giáo viên');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('123');
  const [createClassError, setCreateClassError] = useState('');

  // Secret 10-click logo trigger for hidden Admin portal
  const logoClickCountRef = useRef(0);
  const logoLastClickTimeRef = useRef(0);

  const handleSecretLogoClick = () => {
    if (selectedRole !== 'NONE') {
      setSelectedRole('NONE');
      setSelectedStudent(null);
      return;
    }
    const now = Date.now();
    if (now - logoLastClickTimeRef.current > 3500) {
      logoClickCountRef.current = 1;
    } else {
      logoClickCountRef.current += 1;
    }
    logoLastClickTimeRef.current = now;

    if (logoClickCountRef.current >= 10) {
      logoClickCountRef.current = 0;
      onTriggerHiddenAdmin?.();
    }
  };

  useEffect(() => {
    if (!isClassMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (classMenuRef.current && !classMenuRef.current.contains(e.target as Node)) {
        setIsClassMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsClassMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClassMenuOpen]);

  const handleClassSwitch = (classId: string) => {
    onSelectClass(classId);
    setSelectedStudent(null);
    setSearchQuery('');
    setPasswordInput('');
    setTeacherPasswordInput('');
    setSubjectPasswordInput('');
    setTeacherError('');
    setSubjectError('');
    setParentError('');
    setIsParentPinnedBannerDismissed(false);
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanClass = newClassName.trim();
    const cleanTeacher = newTeacherName.trim();
    if (!cleanClass) {
      setCreateClassError('Vui lòng nhập tên lớp học (VD: Lớp 10A4).');
      return;
    }
    if (!cleanTeacher) {
      setCreateClassError('Vui lòng nhập tên Giáo viên chủ nhiệm phụ trách lớp.');
      return;
    }
    if (classes.some((c) => c.className.trim().toLowerCase() === cleanClass.toLowerCase())) {
      setCreateClassError(`Lớp "${cleanClass}" đã tồn tại trong danh sách.`);
      return;
    }

    const generatedCode =
      newTeacherCode.trim() ||
      `GV${cleanClass.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || classes.length + 1}`;

    onCreateClass({
      className: cleanClass,
      schoolYear: newSchoolYear.trim() || '2025 - 2026',
      teacherName: cleanTeacher,
      teacherCode: generatedCode,
      subject: newTeacherSubject.trim() || 'Chủ nhiệm / Giáo viên',
      phone: newTeacherPhone.trim() || '0900 000 000',
      password: newTeacherPassword.trim() || '123',
    });

    setNewClassName('');
    setNewTeacherName('');
    setNewTeacherCode('');
    setNewTeacherSubject('Chủ nhiệm / Giáo viên');
    setNewTeacherPhone('');
    setNewTeacherPassword('123');
    setCreateClassError('');
    setIsCreateClassOpen(false);
    setSelectedStudent(null);
    setIsParentPinnedBannerDismissed(false);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherPasswordInput.trim()) {
      setTeacherError('Vui lòng nhập mật khẩu Giáo viên chủ nhiệm!');
      return;
    }
    const isSuccess = onSelectTeacher(teacherPasswordInput.trim());
    if (!isSuccess) {
      setTeacherError('Mật khẩu Giáo viên chủ nhiệm chưa đúng! (Mật khẩu mặc định ban đầu là 123)');
    } else {
      setTeacherError('');
    }
  };

  const teachersList = subjectTeachers.length > 0 ? subjectTeachers : DEFAULT_SUBJECT_TEACHERS;

  const handleSubjectTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = teachersList.find((t) => t.subject === selectedSubject) || teachersList[1] || teachersList[0];
    if (!subjectPasswordInput.trim()) {
      setSubjectError('Vui lòng nhập mật khẩu Giáo viên bộ môn!');
      return;
    }
    const isSuccess = onSelectSubjectTeacher(found, subjectPasswordInput);
    if (!isSuccess) {
      setSubjectError(`Mật khẩu môn ${found.subject} chưa đúng! (Mật khẩu mặc định ban đầu là 123)`);
    } else {
      setSubjectError('');
    }
  };

  const handleParentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!passwordInput.trim()) {
      setParentError('Vui lòng nhập mật khẩu Phụ huynh!');
      return;
    }
    const isSuccess = onSelectParent(selectedStudent, passwordInput);
    if (!isSuccess) {
      setParentError('Mật khẩu chưa đúng! (Thử mật khẩu mặc định: 123 hoặc xem lại trong phần Giáo viên)');
    } else {
      setParentError('');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleSecretLogoClick}
            className={`flex items-center gap-3 min-w-0 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              selectedRole !== 'NONE' ? 'cursor-pointer group' : 'cursor-default select-none'
            }`}
            title={selectedRole !== 'NONE' ? 'Quay lại chọn vai trò' : undefined}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight whitespace-nowrap">
                  D2KN Edu
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-xs font-bold text-indigo-700 whitespace-nowrap">
                  {teacher.className}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block truncate">Sổ Liên Lạc Điện Tử Lớp Học</p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Compact Class Selector Dropdown at Top-Right Corner */}
            <div className="relative" ref={classMenuRef}>
              <button
                type="button"
                onClick={() => setIsClassMenuOpen((prev) => !prev)}
                aria-expanded={isClassMenuOpen}
                aria-haspopup="listbox"
                className="min-h-[42px] inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title={`Đang chọn ${teacher.className} (GVCN: ${teacher.name})`}
              >
                <School className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="hidden md:inline text-indigo-600/80 font-semibold">Chọn lớp:</span>
                <span className="max-w-[96px] sm:max-w-[130px] truncate">{teacher.className}</span>
                <ChevronDown
                  className={`w-4 h-4 text-indigo-600 shrink-0 transition-transform duration-150 ${
                    isClassMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isClassMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Danh sách lớp học"
                  className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Chọn Lớp Học ({classes.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">GVCN riêng</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                    {classes.map((cls) => {
                      const isActive = cls.id === activeClassId;
                      const count = DataService.getStudentCountForClass(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            handleClassSwitch(cls.id);
                            setIsClassMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-950 border border-indigo-200'
                              : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold text-sm truncate ${isActive ? 'text-indigo-800' : 'text-slate-900'}`}>
                                {cls.className}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                                · {count} HS
                              </span>
                            </div>
                            <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-indigo-700 font-semibold' : 'text-slate-500'}`}>
                              GVCN: {cls.teacherName}
                            </p>
                          </div>
                          {isActive && (
                            <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsClassMenuOpen(false);
                        setCreateClassError('');
                        setIsCreateClassOpen(true);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Lớp &amp; GVCN Mới</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedRole !== 'NONE' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('NONE');
                  setSelectedStudent(null);
                }}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Quay lại</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenGuide}
              className="min-h-[42px] inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-semibold text-[#374151] hover:text-blue-700 hover:bg-blue-50/80 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="hidden lg:inline">Hướng dẫn sử dụng</span>
              <span className="lg:hidden hidden sm:inline">Hướng dẫn</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-11 pb-12 sm:pb-14 flex-1 w-full flex flex-col justify-center">
        {/* Intro Greeting */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-3">
          <p className="text-sm sm:text-[15px] font-bold text-blue-700 tracking-tight">
            Năm học {teacher.schoolYear} · GVCN: {teacher.name} · {teacher.className}
          </p>
          <h1 className="text-[32px] leading-tight sm:text-4xl font-extrabold text-slate-900 tracking-tight text-balance">
            Chào Mừng Bạn Đến Với D2KN Edu
          </h1>
          <p className="text-[#374151] text-base sm:text-lg leading-relaxed">
            Chọn đúng vai trò bên dưới và nhập mật khẩu riêng để theo dõi học tập, điểm số và nhận xét minh bạch.
          </p>
        </div>

        {/* Role Choice Cards (Mobile: Parent first via order-1 md:order-3; Full-card clickable + 56px icons + 48px solid button CTAs) */}
        {selectedRole === 'NONE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 max-w-6xl mx-auto w-full">
            {/* Teacher Option Card (Blue - Mobile #2, Desktop #1) */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('TEACHER');
                setTeacherPasswordInput('');
                setTeacherError('');
              }}
              className="order-2 md:order-1 group relative w-full text-left rounded-3xl p-6 sm:p-8 border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white border-blue-300/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-600 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <div className="space-y-4 relative z-10 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center transition-colors duration-200 shrink-0 group-hover:bg-blue-600 group-hover:text-white">
                    <UserCheck className="w-7 h-7" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[13px] sm:text-sm font-bold uppercase tracking-wide text-blue-700">
                    Dành cho
                  </p>
                  <h2 className="text-[22px] sm:text-2xl font-bold text-slate-900 leading-snug">
                    Giáo Viên Chủ Nhiệm
                  </h2>
                  <p className="text-[#374151] text-base leading-relaxed">
                    Cập nhật đánh giá tuần, điểm danh vắng, cấp mật khẩu Phụ huynh, theo dõi tiết yếu và gửi thông báo toàn lớp.
                  </p>
                </div>
              </div>

              <div className="mt-7 w-full relative z-10">
                <div className="min-h-[48px] w-full px-4 sm:px-5 py-3 rounded-xl border-2 flex items-center justify-between gap-2 font-bold text-[15px] lg:text-base transition-colors duration-200 bg-blue-600 border-blue-600 text-white group-hover:bg-blue-700 group-hover:border-blue-700 shadow-xs">
                  <span className="whitespace-nowrap truncate">Vào GV Chủ Nhiệm</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
                </div>
              </div>
            </button>

            {/* Subject Teacher Option Card (Purple - Mobile #3, Desktop #2) */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('SUBJECT_TEACHER');
                setSubjectPasswordInput('');
                setSubjectError('');
              }}
              className="order-3 md:order-2 group relative w-full text-left rounded-3xl p-6 sm:p-8 border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-purple-50/50 via-white to-white border-purple-300/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-purple-600 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
            >
              <div className="space-y-4 relative z-10 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center transition-colors duration-200 shrink-0 group-hover:bg-purple-600 group-hover:text-white">
                    <BookMarked className="w-7 h-7" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[13px] sm:text-sm font-bold uppercase tracking-wide text-purple-700">
                    Dành cho
                  </p>
                  <h2 className="text-[22px] sm:text-2xl font-bold text-slate-900 leading-snug">
                    Giáo Viên Bộ Môn
                  </h2>
                  <p className="text-[#374151] text-base leading-relaxed">
                    Đăng nhập theo môn giảng dạy (Ngữ Văn, Tiếng Anh, Lý, Hóa...) để nhập điểm số và viết lời nhận xét riêng.
                  </p>
                </div>
              </div>

              <div className="mt-7 w-full relative z-10">
                <div className="min-h-[48px] w-full px-4 sm:px-5 py-3 rounded-xl border-2 flex items-center justify-between gap-2 font-bold text-[15px] lg:text-base transition-colors duration-200 bg-purple-600 border-purple-600 text-white group-hover:bg-purple-700 group-hover:border-purple-700 shadow-xs">
                  <span className="whitespace-nowrap truncate">Chọn Môn Nhập Nhận Xét</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
                </div>
              </div>
            </button>

            {/* Parent Option Card (Emerald - Mobile #1 Priority, Desktop #3) */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole('PARENT');
                setParentError('');
                setIsParentPinnedBannerDismissed(false);
              }}
              className="order-1 md:order-3 group relative w-full text-left rounded-3xl p-6 sm:p-8 border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-white border-emerald-400/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-emerald-600 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <div className="space-y-4 relative z-10 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors duration-200 shrink-0 group-hover:bg-emerald-600 group-hover:text-white">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  {pinnedAnnouncementsCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold">
                      <BellRing className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                      <span>{pinnedAnnouncementsCount} tin quan trọng</span>
                    </span>
                  ) : (
                    <span className="text-[13px] sm:text-sm font-bold text-emerald-700">
                      Phổ biến nhất
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[13px] sm:text-sm font-bold uppercase tracking-wide text-emerald-700">
                    Dành cho
                  </p>
                  <h2 className="text-[22px] sm:text-2xl font-bold text-slate-900 leading-snug">
                    Phụ Huynh Học Sinh
                  </h2>
                  <p className="text-[#374151] text-base leading-relaxed">
                    Chọn học sinh trong danh sách và nhập mật khẩu để xem điểm số, nhận xét tuần, thời khóa biểu và trao đổi với GVCN.
                  </p>
                </div>
              </div>

              <div className="mt-7 w-full relative z-10">
                <div className="min-h-[48px] w-full px-4 sm:px-5 py-3 rounded-xl border-2 flex items-center justify-between gap-2 font-bold text-[15px] lg:text-base transition-colors duration-200 bg-emerald-600 border-emerald-600 text-white group-hover:bg-emerald-700 group-hover:border-emerald-700 shadow-xs">
                  <span className="whitespace-nowrap truncate">Danh Sách Học Sinh</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* TEACHER LOGIN FLOW */}
        {selectedRole === 'TEACHER' && (
          <div className="max-w-md mx-auto w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg">Đăng Nhập Giáo Viên Chủ Nhiệm</h3>
                  <p className="text-xs text-slate-500 truncate">{teacher.name} · {teacher.className}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole('NONE')}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold shrink-0 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật Khẩu Giáo Viên Chủ Nhiệm (Bắt buộc)
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    autoFocus
                    value={teacherPasswordInput}
                    onChange={(e) => setTeacherPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu (Mặc định: 123)"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Gợi ý thử nghiệm: Mật khẩu mặc định ban đầu là{' '}
                  <strong className="text-slate-800 font-mono">123</strong> (có thể đổi sau khi đăng nhập)
                </p>
              </div>

              {teacherError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {teacherError}
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[44px] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Xác Nhận &amp; Vào Giao Diện GVCN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* SUBJECT TEACHER LOGIN FLOW */}
        {selectedRole === 'SUBJECT_TEACHER' && (
          <div className="max-w-md mx-auto w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <BookMarked className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg">Đăng Nhập Giáo Viên Bộ Môn</h3>
                  <p className="text-xs text-slate-500 truncate">{teacher.className} · Năm học {teacher.schoolYear}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole('NONE')}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold shrink-0 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            </div>

            <form onSubmit={handleSubjectTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn Môn Học Giảng Dạy Lớp {teacher.className}
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSubjectPasswordInput('');
                    setSubjectError('');
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                >
                  {teachersList.map((st) => (
                    <option key={st.subject} value={st.subject}>
                      Môn {st.subject} — ({st.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-2xl text-xs text-purple-950 space-y-1">
                <span className="font-bold block">Giáo viên phụ trách:</span>
                <p>
                  {teachersList.find((t) => t.subject === selectedSubject)?.name || 'Giáo viên bộ môn'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật Khẩu Giáo Viên Bộ Môn (Bắt buộc)
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    autoFocus
                    value={subjectPasswordInput}
                    onChange={(e) => setSubjectPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu (Mặc định: 123)"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Gợi ý thử nghiệm: Mật khẩu mặc định ban đầu là{' '}
                  <strong className="text-slate-800 font-mono">123</strong> (có thể đổi sau khi đăng nhập)
                </p>
              </div>

              {subjectError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {subjectError}
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[44px] py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Xác Nhận &amp; Vào Môn {selectedSubject}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* PARENT LOGIN FLOW - STUDENT LIST */}
        {selectedRole === 'PARENT' && (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('NONE');
                    setSelectedStudent(null);
                  }}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-sm font-bold transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>
                <div>
                  <h2 className="font-bold text-slate-900 text-base sm:text-lg">Danh Sách Học Sinh {teacher.className}</h2>
                  <p className="text-xs text-slate-500">Nhấn vào tên học sinh và nhập mật khẩu do GVCN cấp</p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm học sinh theo tên, mã..."
                  className="w-full min-h-[40px] pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {pinnedAnnouncementsCount > 0 && !isParentPinnedBannerDismissed && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 text-sm text-amber-950 shadow-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-600 text-white shrink-0">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-amber-950">
                      Có {pinnedAnnouncementsCount} thông báo quan trọng được GVCN ghim!
                    </p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Vui lòng chọn học sinh bên dưới và đăng nhập để đọc chi tiết thông báo quan trọng từ giáo viên.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParentPinnedBannerDismissed(true)}
                  className="p-1.5 rounded-xl text-amber-700 hover:text-amber-950 hover:bg-amber-200/70 transition-colors cursor-pointer shrink-0"
                  title="Tắt thông báo"
                  aria-label="Tắt thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-sm text-emerald-900">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Mật khẩu mặc định:</strong> Tất cả học sinh mẫu ban đầu đều có mật khẩu Phụ huynh là{' '}
                  <code className="bg-emerald-100 text-emerald-950 font-mono px-2 py-0.5 rounded font-bold text-base">123</code>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordHint(!showPasswordHint)}
                className="text-xs font-bold text-emerald-700 underline shrink-0 hover:text-emerald-900 cursor-pointer"
              >
                {showPasswordHint ? 'Ẩn gợi ý' : 'Hiện mật khẩu lớp'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredStudents.map((student) => (
                <button
                  type="button"
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setPasswordInput('');
                    setParentError('');
                  }}
                  className="group w-full text-left bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-200 border border-slate-300 flex items-end justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        <svg className="w-[85%] h-[85%] text-slate-400 translate-y-[10%]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-bold text-slate-900 text-lg sm:text-xl group-hover:text-emerald-700 transition-colors truncate">
                        {student.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600 tabular-nums">
                        <span className="font-mono font-bold text-slate-700 whitespace-nowrap">
                          Mã: {student.studentCode}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="whitespace-nowrap font-medium text-slate-700">
                          Điểm TB: <strong className="text-slate-900 font-extrabold text-base">{student.overallGPA}</strong>
                        </span>
                      </div>
                      {showPasswordHint && (
                        <p className="text-xs sm:text-sm text-emerald-700 font-mono font-bold mt-1">
                          MK: {student.parentPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PARENT PASSWORD MODAL */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {selectedStudent.avatar ? (
                    <img
                      src={selectedStudent.avatar}
                      alt={selectedStudent.name}
                      referrerPolicy="no-referrer"
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
                    <h3 className="font-bold text-slate-900 text-base">{selectedStudent.name}</h3>
                    <p className="text-xs text-slate-500">Mã HS: {selectedStudent.studentCode} · {teacher.className}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold cursor-pointer shrink-0 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
              </div>

              <form onSubmit={handleParentLoginSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nhập Mật Khẩu Phụ Huynh (Bắt buộc)
                    </label>
                    <span className="text-xs text-slate-400">Do Giáo viên cấp</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      autoFocus
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu (Mặc định: 123)"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Gợi ý thử nghiệm: Mật khẩu mặc định là <strong className="text-slate-800 font-mono">123</strong>
                  </p>
                </div>

                {parentError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                    {parentError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full min-h-[44px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Xác Nhận Đăng Nhập</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CREATE NEW CLASS MODAL */}
        {isCreateClassOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Thêm Lớp Học &amp; GVCN Mới</h3>
                    <p className="text-xs text-slate-500">Mỗi lớp mới sẽ có Giáo viên chủ nhiệm và sổ liên lạc riêng</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClassSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên lớp học <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="VD: Lớp 10A4"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Năm học
                    </label>
                    <input
                      type="text"
                      value={newSchoolYear}
                      onChange={(e) => setNewSchoolYear(e.target.value)}
                      placeholder="2025 - 2026"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Giáo viên chủ nhiệm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="VD: Cô Phạm Lan Anh"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã GVCN
                    </label>
                    <input
                      type="text"
                      value={newTeacherCode}
                      onChange={(e) => setNewTeacherCode(e.target.value)}
                      placeholder="VD: GV10A4"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bộ môn giảng dạy
                    </label>
                    <input
                      type="text"
                      value={newTeacherSubject}
                      onChange={(e) => setNewTeacherSubject(e.target.value)}
                      placeholder="Chủ nhiệm / Giáo viên Tiếng Anh"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại GVCN
                    </label>
                    <input
                      type="text"
                      value={newTeacherPhone}
                      onChange={(e) => setNewTeacherPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu đăng nhập GVCN
                  </label>
                  <input
                    type="text"
                    value={newTeacherPassword}
                    onChange={(e) => setNewTeacherPassword(e.target.value)}
                    placeholder="Mặc định: 123"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                {createClassError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                    {createClassError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateClassOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Lớp Mới</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer with extra bottom clearance so Netlify's bottom-right badge never overlaps content on mobile or desktop */}
      <footer className="bg-white border-t border-slate-200 pt-4 pb-16 sm:pb-14 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          D2KN Edu - Nền Tảng Sổ Liên Lạc Điện Tử {teacher.className} © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};
