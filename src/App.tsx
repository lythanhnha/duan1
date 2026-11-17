import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { UserRole, Student, TeacherInfo, SubjectTeacherInfo, ClassRoomInfo, AdminSessionInfo } from './types';
import { DataService } from './services/dataStorage';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { TeacherDashboard } from './components/TeacherDashboard';
import { SubjectTeacherDashboard } from './components/SubjectTeacherDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAuthModal } from './components/AdminAuthModal';
import { UserGuideModal } from './components/UserGuideModal';
import { UnsavedChangesModal, UnsavedGuardHandle } from './components/UnsavedChangesModal';

export default function App() {
  const [role, setRole] = useState<UserRole>('GUEST');
  const [classes, setClasses] = useState<ClassRoomInfo[]>(DataService.getClasses());
  const [activeClassId, setActiveClassId] = useState<string>(DataService.getActiveClassId());
  const [teacher, setTeacher] = useState<TeacherInfo>(DataService.getTeacher());
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherInfo[]>(DataService.getSubjectTeachers());
  const [activeSubjectTeacher, setActiveSubjectTeacher] = useState<SubjectTeacherInfo | null>(null);
  const [students, setStudents] = useState<Student[]>(DataService.getStudents());
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeAdmin, setActiveAdmin] = useState<AdminSessionInfo | null>(null);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Clean in-app reset confirmation & toast
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [appToast, setAppToast] = useState<string | null>(null);
  const unsavedGuardRef = useRef<UnsavedGuardHandle | null>(null);
  const [pendingAppAction, setPendingAppAction] = useState<{
    type: 'LOGOUT' | 'RESET';
    message: string;
  } | null>(null);

  const showAppToast = (message: string) => {
    setAppToast(message);
    setTimeout(() => setAppToast(null), 3500);
  };

  const refreshStudents = useCallback(() => {
    const latestStudents = DataService.getStudents();
    setStudents(latestStudents);
    setActiveStudent((prev) => {
      if (!prev) return null;
      return latestStudents.find((s) => s.id === prev.id) || prev;
    });
  }, []);

  const refreshSubjectTeachers = useCallback(() => {
    const latestSubjectTeachers = DataService.getSubjectTeachers();
    setSubjectTeachers(latestSubjectTeachers);
    setActiveSubjectTeacher((prev) => {
      if (!prev) return null;
      return latestSubjectTeachers.find((st) => st.subject === prev.subject) || prev;
    });
  }, []);

  const refreshAllClassData = useCallback(() => {
    setClasses(DataService.getClasses());
    setActiveClassId(DataService.getActiveClassId());
    setTeacher(DataService.getTeacher());
    refreshStudents();
    refreshSubjectTeachers();
  }, [refreshStudents, refreshSubjectTeachers]);

  const handleSelectClass = useCallback((classId: string) => {
    DataService.setActiveClassId(classId);
    setActiveClassId(classId);
    refreshAllClassData();
    setDataVersion((v) => v + 1);
  }, [refreshAllClassData]);

  const handleCreateClass = (input: {
    className: string;
    schoolYear: string;
    teacherName: string;
    teacherCode: string;
    subject?: string;
    phone?: string;
    password?: string;
  }): ClassRoomInfo => {
    const created = DataService.createClass(input);
    setActiveClassId(created.id);
    refreshAllClassData();
    setDataVersion((v) => v + 1);
    showAppToast(`Đã tạo ${created.className} (GVCN: ${created.teacherName})`);
    return created;
  };

  // Sync Firestore data & attach real-time listeners directly on startup
  useEffect(() => {
    let active = true;

    const initSync = async () => {
      try {
        await DataService.syncFromFirebase();
        if (!active) return;
        refreshAllClassData();
        setDataVersion((v) => v + 1);
      } catch (err) {
        console.warn('Could not sync classroom data:', err);
      }
    };

    void initSync();

    const unsubscribeRealtime = DataService.subscribeToRealtimeSync(() => {
      if (!active) return;
      refreshAllClassData();
      setDataVersion((v) => v + 1);
    });

    return () => {
      active = false;
      unsubscribeRealtime();
    };
  }, [refreshAllClassData]);

  const handleTeacherLogin = (passwordEntered: string): boolean => {
    const expectedPassword = teacher.password || '123';
    if (passwordEntered.trim() !== expectedPassword) {
      return false;
    }
    DataService.setActiveActor({
      uid: `teacher_${teacher.code}`,
      name: teacher.name,
      label: `GVCN (${teacher.code})`,
    });
    setRole('TEACHER');
    return true;
  };

  const handleSubjectTeacherLogin = (st: SubjectTeacherInfo, passwordEntered: string): boolean => {
    const expectedPassword = st.password || '123';
    if (passwordEntered.trim() !== expectedPassword) {
      return false;
    }
    DataService.setActiveActor({
      uid: `subject_${st.code}`,
      name: st.name,
      label: `GV Môn ${st.subject}`,
    });
    setActiveSubjectTeacher(st);
    setRole('SUBJECT_TEACHER');
    return true;
  };

  const handleParentLogin = (student: Student, passwordEntered: string): boolean => {
    if (student.parentPassword === passwordEntered) {
      DataService.setActiveActor({
        uid: `parent_${student.id}`,
        name: `Phụ huynh em ${student.name}`,
        label: `Mã HS: ${student.studentCode}`,
      });
      setActiveStudent(student);
      setRole('PARENT');
      return true;
    }
    return false;
  };

  // Secret keyboard shortcut Ctrl+Shift+A (or Cmd+Shift+A) to open hidden Admin portal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        if (role !== 'ADMIN') {
          e.preventDefault();
          setIsAdminAuthOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [role]);

  const handleAdminAuthenticated = (adminSession: AdminSessionInfo) => {
    DataService.setActiveActor({
      uid: adminSession.uid,
      name: adminSession.displayName,
      label: `Admin (${adminSession.email})`,
    });
    setActiveAdmin(adminSession);
    setIsAdminAuthOpen(false);
    setRole('ADMIN');
    showAppToast(`Đăng nhập Quản trị viên: ${adminSession.email}`);
  };

  const performSwitchRole = () => {
    if (role === 'ADMIN') {
      void signOut(auth);
      setActiveAdmin(null);
    }
    DataService.setActiveActor(null);
    setRole('GUEST');
    setActiveStudent(null);
    setActiveSubjectTeacher(null);
  };

  const handleSwitchRole = () => {
    if (unsavedGuardRef.current?.hasUnsavedChanges()) {
      setPendingAppAction({
        type: 'LOGOUT',
        message:
          unsavedGuardRef.current.getUnsavedDescription?.() ||
          'Bạn đã nhập dữ liệu nhưng chưa bấm Lưu. Bạn có muốn lưu lại trước khi quay lại trang chọn vai trò không?',
      });
      return;
    }
    performSwitchRole();
  };

  const handleAttemptResetData = () => {
    if (unsavedGuardRef.current?.hasUnsavedChanges()) {
      setPendingAppAction({
        type: 'RESET',
        message:
          unsavedGuardRef.current.getUnsavedDescription?.() ||
          'Bạn có dữ liệu vừa nhập chưa được lưu. Bạn có muốn lưu lại trước khi khôi phục dữ liệu mẫu không?',
      });
      return;
    }
    setIsResetConfirmOpen(true);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (role !== 'GUEST' && unsavedGuardRef.current?.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [role]);

  const handleConfirmResetData = () => {
    DataService.resetToDefault();
    setClasses(DataService.getClasses());
    setActiveClassId(DataService.getActiveClassId());
    setTeacher(DataService.getTeacher());
    setSubjectTeachers(DataService.getSubjectTeachers());
    setStudents(DataService.getStudents());
    if (activeStudent) {
      const resetStud = DataService.getStudents().find((s) => s.id === activeStudent.id);
      if (resetStud) setActiveStudent(resetStud);
    }
    setIsResetConfirmOpen(false);
    showAppToast('Đã khôi phục dữ liệu mẫu thành công!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {appToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{appToast}</span>
        </div>
      )}

      {/* Reset Data Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Khôi phục dữ liệu ban đầu?</h3>
              </div>
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Thao tác này sẽ xóa bộ nhớ tạm trên trình duyệt và đặt lại dữ liệu mẫu ban đầu cho lớp học.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmResetData}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={pendingAppAction !== null}
        title="Xác nhận lưu thay đổi"
        message={pendingAppAction?.message}
        saveLabel={pendingAppAction?.type === 'LOGOUT' ? 'Lưu & Quay lại' : 'Lưu & Tiếp tục'}
        discardLabel={pendingAppAction?.type === 'LOGOUT' ? 'Không lưu, quay lại' : 'Không lưu'}
        cancelLabel="Ở lại chỉnh sửa"
        onSaveAndContinue={() => {
          const result = unsavedGuardRef.current?.saveUnsavedChanges();
          const actionType = pendingAppAction?.type;
          setPendingAppAction(null);
          if (result === false) return;
          if (actionType === 'LOGOUT') {
            performSwitchRole();
          } else if (actionType === 'RESET') {
            setIsResetConfirmOpen(true);
          }
        }}
        onDiscardAndContinue={() => {
          const actionType = pendingAppAction?.type;
          setPendingAppAction(null);
          if (actionType === 'LOGOUT') {
            performSwitchRole();
          } else if (actionType === 'RESET') {
            setIsResetConfirmOpen(true);
          }
        }}
        onCancel={() => setPendingAppAction(null)}
      />

      {/* Hidden Admin Google Sign-In & Whitelist Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onAuthenticated={handleAdminAuthenticated}
      />

      {/* User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Guest Mode -> Landing Role Selector */}
      {role === 'GUEST' && (
        <LandingPage
          classes={classes}
          activeClassId={activeClassId}
          teacher={teacher}
          subjectTeachers={subjectTeachers}
          students={students}
          dataVersion={dataVersion}
          onSelectClass={handleSelectClass}
          onCreateClass={handleCreateClass}
          onSelectTeacher={handleTeacherLogin}
          onSelectSubjectTeacher={handleSubjectTeacherLogin}
          onSelectParent={handleParentLogin}
          onOpenGuide={() => setIsGuideOpen(true)}
          onTriggerHiddenAdmin={() => setIsAdminAuthOpen(true)}
        />
      )}

      {/* Role Application Shell */}
      {role !== 'GUEST' && (
        <div className="min-h-screen flex flex-col justify-between">
          <Header
            role={role}
            teacher={teacher}
            activeSubjectTeacher={activeSubjectTeacher}
            activeStudent={activeStudent}
            activeAdmin={activeAdmin}
            onLogout={handleSwitchRole}
            onOpenGuide={() => setIsGuideOpen(true)}
            onResetData={handleAttemptResetData}
          />

          <main className="flex-1">
            {role === 'ADMIN' && activeAdmin && (
              <AdminDashboard
                admin={activeAdmin}
                classes={classes}
                dataVersion={dataVersion}
                onRefreshAll={() => {
                  refreshAllClassData();
                  setDataVersion((v) => v + 1);
                }}
                onLogout={performSwitchRole}
              />
            )}

            {role === 'TEACHER' && (
              <TeacherDashboard
                key={`teacher-dashboard-${activeClassId}`}
                teacher={teacher}
                students={students}
                dataVersion={dataVersion}
                guardRef={unsavedGuardRef}
                onRefreshStudents={refreshStudents}
                onRefreshTeacher={() => {
                  setTeacher(DataService.getTeacher());
                  setClasses(DataService.getClasses());
                }}
              />
            )}

            {role === 'SUBJECT_TEACHER' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <SubjectTeacherDashboard
                  key={`subteacher-${activeClassId}-${activeSubjectTeacher?.subject || 'default'}`}
                  teacher={teacher}
                  students={students}
                  initialSubject={activeSubjectTeacher?.subject || 'Ngữ Văn'}
                  subjectTeachers={subjectTeachers}
                  dataVersion={dataVersion}
                  guardRef={unsavedGuardRef}
                  onRefreshStudents={refreshStudents}
                  onRefreshSubjectTeachers={refreshSubjectTeachers}
                />
              </div>
            )}

            {role === 'PARENT' && activeStudent && (
              <ParentDashboard
                key={`parent-${activeClassId}-${activeStudent.id}`}
                student={activeStudent}
                teacher={teacher}
                dataVersion={dataVersion}
                guardRef={unsavedGuardRef}
              />
            )}
          </main>

          <footer className="bg-white border-t border-slate-200 pt-4 pb-16 sm:pb-14 mt-12 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              D2KN Edu - Sổ Liên Lạc Điện Tử {role === 'ADMIN' ? 'Cổng Quản Trị Toàn Trường' : teacher.className} © {new Date().getFullYear()} · Kết nối Giáo viên &amp; Phụ huynh
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
