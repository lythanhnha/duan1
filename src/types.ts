export type UserRole = 'GUEST' | 'TEACHER' | 'SUBJECT_TEACHER' | 'PARENT' | 'ADMIN';

export interface AdminWhitelistEntry {
  email: string;
  note?: string;
  isSuperAdmin?: boolean;
  addedAt: string;
}

export interface AdminSessionInfo {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface SubjectTeacherInfo {
  name: string;
  subject: string;
  code: string;
  password: string;
}

export interface Student {
  id: string;
  name: string;
  studentCode: string;
  avatar: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  parentPassword: string;
  conduct: 'Tốt' | 'Khá' | 'Trung bình';
  overallGPA: number;
}

export interface SchedulePeriod {
  periodNumber: number; // 1 to 5
  timeSlot: string;     // e.g. "07:30 - 08:15"
  subject: string;
  teacher: string;
  room: string;
  isWeakPoint?: boolean;
  weakNote?: string;
}

export interface DaySchedule {
  dayName: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7';
  periods: SchedulePeriod[];
}

export interface WeeklySchedule {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: DaySchedule[];
}

export interface SubjectScore {
  subjectName: string;
  teacherName: string;
  oralScores: number[];
  scores15m: number[];
  scores45m: number[];
  midtermScore?: number | null;
  finalScore?: number | null;
  averageScore: number;
  teacherRemark?: string;
  isNeedingImprovement?: boolean;
  updatedByEmail?: string;
  updatedByName?: string;
  updatedAt?: string;
}

export interface WeakPointDetail {
  id: string;
  day: string;          // e.g. "Thứ 3"
  periodNumber: number; // e.g. 2
  timeSlot: string;     // e.g. "08:20 - 09:05"
  subject: string;
  reason: string;       // e.g. "Chưa thuộc công thức Toán, tiếp thu bài chậm"
  severity: 'Cao' | 'Trung bình' | 'Nhắc nhở';
}

export interface WeeklyReport {
  studentId: string;
  weekNumber: number;
  totalPeriods: number;
  excusedAbsences: number;
  unexcusedAbsences: number;
  lateArrivals: number;
  weakPoints: WeakPointDetail[];
  learningStatus: 'Chưa xếp loại' | 'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần cố gắng';
  conductStatus: 'Tốt' | 'Khá' | 'Cần rèn luyện';
  teacherComment: string;
  parentFeedback?: string;
  parentFeedbackDate?: string;
  updatedAt: string;
  updatedByEmail?: string;
  updatedByName?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'Thông báo chung' | 'Học tập' | 'Hoạt động ngoại khóa' | 'Họp Phụ huynh';
  isPinned?: boolean;
}

export interface TeacherInfo {
  name: string;
  code: string;
  className: string;
  schoolYear: string;
  email: string;
  phone: string;
  subject: string;
  password?: string;
}

export interface ClassRoomInfo {
  id: string;
  className: string;
  schoolYear: string;
  teacherName: string;
  teacherCode: string;
  isDefault?: boolean;
}

export interface AuthUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  linkedRole?: Exclude<UserRole, 'GUEST'> | 'NONE' | null;
  linkedSubject?: string | null;
  linkedStudentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AuditTargetType =
  | 'SUBJECT_SCORE'
  | 'WEEKLY_REPORT'
  | 'STUDENT_PASSWORD'
  | 'SUBJECT_PASSWORD'
  | 'TEACHER_PASSWORD'
  | 'ANNOUNCEMENT'
  | 'SCHEDULE'
  | 'CLASS_ADMIN';

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorName: string;
  actorRole: Exclude<UserRole, 'GUEST'>;
  action: string;
  targetType: AuditTargetType;
  targetLabel: string;
  summary: string;
  createdAt: string;
  displayTime: string;
}
