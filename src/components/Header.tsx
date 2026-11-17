import React from 'react';
import {
  GraduationCap,
  BookOpen,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  BookMarked,
  ArrowLeft,
} from 'lucide-react';
import { UserRole, Student, TeacherInfo, SubjectTeacherInfo, AdminSessionInfo } from '../types';

interface Props {
  role: UserRole;
  teacher: TeacherInfo;
  activeSubjectTeacher?: SubjectTeacherInfo | null;
  activeStudent: Student | null;
  activeAdmin?: AdminSessionInfo | null;
  onLogout: () => void;
  onOpenGuide: () => void;
  onResetData: () => void;
}

export const Header: React.FC<Props> = ({
  role,
  teacher,
  activeSubjectTeacher,
  activeStudent,
  activeAdmin,
  onLogout,
  onOpenGuide,
  onResetData,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Class (click to go back to role selection) */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 min-w-0 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer group"
          title="Quay lại trang chọn vai trò"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight whitespace-nowrap group-hover:text-indigo-700 transition-colors">
                D2KN Edu
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-xs font-semibold text-indigo-700 whitespace-nowrap">
                {teacher.className}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block truncate">
              Sổ Liên Lạc Điện Tử · Năm học {teacher.schoolYear}
            </p>
          </div>
        </button>

        {/* Role Context & Utility Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Role Indicator */}
          {role === 'TEACHER' && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-semibold whitespace-nowrap">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>GVCN: {teacher.name}</span>
            </div>
          )}

          {role === 'SUBJECT_TEACHER' && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100 text-purple-900 text-xs font-semibold whitespace-nowrap">
              <BookMarked className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="max-w-[200px] truncate">
                {activeSubjectTeacher?.subject || 'Bộ Môn'} · {activeSubjectTeacher?.name || ''}
              </span>
            </div>
          )}

          {role === 'PARENT' && activeStudent && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs font-semibold whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="max-w-[180px] truncate">PH: {activeStudent.name}</span>
            </div>
          )}

          {role === 'ADMIN' && activeAdmin && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 text-xs font-semibold whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="max-w-[200px] truncate">Admin: {activeAdmin.email}</span>
            </div>
          )}

          {/* Guide Button */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Hướng dẫn sử dụng"
          >
            <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>

          {/* Reset Data Button */}
          <button
            type="button"
            onClick={onResetData}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-xs font-medium text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Khôi phục dữ liệu mẫu"
            aria-label="Khôi phục dữ liệu mẫu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Back to Role Selection (always visible on mobile & desktop) */}
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[42px] px-3.5 py-2 rounded-xl text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Quay lại trang chọn vai trò"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700 shrink-0" />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    </header>
  );
};
