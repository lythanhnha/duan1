import { Student, TeacherInfo, SubjectTeacherInfo, WeeklySchedule, SubjectScore, WeeklyReport, Announcement, AuditLogEntry, AuditTargetType, UserRole, ClassRoomInfo, AdminWhitelistEntry } from '../types';
import { db, OperationType, handleFirestoreError, stripUndefined } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';

export const DEFAULT_CLASS_ID = 'class_10a1';
export const SUPER_ADMIN_EMAIL = 'lythanhnha2k7@gmail.com';

export const DEFAULT_TEACHER: TeacherInfo = {
  name: 'Thầy Lê Anh Tuấn',
  code: 'GV10A1',
  className: 'Lớp 10A1',
  schoolYear: '2025 - 2026',
  email: 'anhtuan.teacher@edu.vn',
  phone: '0988 123 456',
  subject: 'Chủ nhiệm / Giáo viên Toán',
  password: '123'
};

export const DEFAULT_TEACHER_10A2: TeacherInfo = {
  name: 'Cô Nguyễn Thị Minh Tâm',
  code: 'GV10A2',
  className: 'Lớp 10A2',
  schoolYear: '2025 - 2026',
  email: 'minhtam.teacher@edu.vn',
  phone: '0977 456 789',
  subject: 'Chủ nhiệm / Giáo viên Ngữ Văn',
  password: '123'
};

export const DEFAULT_TEACHER_10A3: TeacherInfo = {
  name: 'Thầy Trần Hoàng Nam',
  code: 'GV10A3',
  className: 'Lớp 10A3',
  schoolYear: '2025 - 2026',
  email: 'hoangnam.teacher@edu.vn',
  phone: '0912 345 678',
  subject: 'Chủ nhiệm / Giáo viên Vật Lý',
  password: '123'
};

export const DEFAULT_CLASSES: ClassRoomInfo[] = [
  {
    id: 'class_10a1',
    className: DEFAULT_TEACHER.className,
    schoolYear: DEFAULT_TEACHER.schoolYear,
    teacherName: DEFAULT_TEACHER.name,
    teacherCode: DEFAULT_TEACHER.code,
    isDefault: true,
  },
  {
    id: 'class_10a2',
    className: DEFAULT_TEACHER_10A2.className,
    schoolYear: DEFAULT_TEACHER_10A2.schoolYear,
    teacherName: DEFAULT_TEACHER_10A2.name,
    teacherCode: DEFAULT_TEACHER_10A2.code,
    isDefault: true,
  },
  {
    id: 'class_10a3',
    className: DEFAULT_TEACHER_10A3.className,
    schoolYear: DEFAULT_TEACHER_10A3.schoolYear,
    teacherName: DEFAULT_TEACHER_10A3.name,
    teacherCode: DEFAULT_TEACHER_10A3.code,
    isDefault: true,
  },
];

export const DEFAULT_SUBJECT_TEACHERS: SubjectTeacherInfo[] = [
  { subject: 'Toán Học', name: 'Thầy Lê Anh Tuấn', code: 'GV_TOAN', password: '123' },
  { subject: 'Ngữ Văn', name: 'Thầy Lê Văn Thành', code: 'GV_VAN', password: '123' },
  { subject: 'Tiếng Anh', name: 'Cô Trần Thu Trang', code: 'GV_ANH', password: '123' },
  { subject: 'Vật Lý', name: 'Thầy Phạm Văn Bình', code: 'GV_LY', password: '123' },
  { subject: 'Hóa Học', name: 'Cô Vũ Thị Mai', code: 'GV_HOA', password: '123' },
  { subject: 'Sinh Học', name: 'Thầy Nguyễn Đức Tâm', code: 'GV_SINH', password: '123' },
  { subject: 'Lịch Sử', name: 'Cô Đào Thị Huệ', code: 'GV_SU', password: '123' },
  { subject: 'Địa Lý', name: 'Thầy Trịnh Văn Nam', code: 'GV_DIA', password: '123' },
  { subject: 'Tin Học', name: 'Thầy Hoàng Anh Tuấn', code: 'GV_TIN', password: '123' },
  { subject: 'GDCD', name: 'Cô Hoàng Mỹ Linh', code: 'GV_GDCD', password: '123' },
];

export const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'hs01',
    name: 'Lý Thanh Nhã',
    studentCode: '10A101',
    avatar: '',
    gender: 'Nữ',
    dob: '12/04/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs02',
    name: 'Cao Phạm Bảo Khang',
    studentCode: '10A102',
    avatar: '',
    gender: 'Nam',
    dob: '25/08/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs03',
    name: 'Lê Nguyễn Đức Duy',
    studentCode: '10A103',
    avatar: '',
    gender: 'Nam',
    dob: '03/01/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs04',
    name: 'Nguyễn Đăng Khoa',
    studentCode: '10A104',
    avatar: '',
    gender: 'Nam',
    dob: '18/11/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  }
];

export const DEFAULT_STUDENTS_10A2: Student[] = [
  {
    id: 'hs01',
    name: 'Trần Ngọc Bảo Trâm',
    studentCode: '10A201',
    avatar: '',
    gender: 'Nữ',
    dob: '14/03/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs02',
    name: 'Phạm Gia Huy',
    studentCode: '10A202',
    avatar: '',
    gender: 'Nam',
    dob: '22/07/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs03',
    name: 'Võ Hoàng Minh Quân',
    studentCode: '10A203',
    avatar: '',
    gender: 'Nam',
    dob: '09/10/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs04',
    name: 'Đặng Thị Phương Thảo',
    studentCode: '10A204',
    avatar: '',
    gender: 'Nữ',
    dob: '19/05/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  }
];

export const DEFAULT_STUDENTS_10A3: Student[] = [
  {
    id: 'hs01',
    name: 'Huỳnh Khánh Linh',
    studentCode: '10A301',
    avatar: '',
    gender: 'Nữ',
    dob: '02/06/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs02',
    name: 'Bùi Quốc Bảo',
    studentCode: '10A302',
    avatar: '',
    gender: 'Nam',
    dob: '11/09/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs03',
    name: 'Đỗ Minh Khôi',
    studentCode: '10A303',
    avatar: '',
    gender: 'Nam',
    dob: '28/12/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  },
  {
    id: 'hs04',
    name: 'Ngô Thùy Dương',
    studentCode: '10A304',
    avatar: '',
    gender: 'Nữ',
    dob: '15/02/2010',
    parentPassword: '123',
    conduct: 'Tốt',
    overallGPA: 0.0,
  }
];

export const TIME_SLOTS = [
  '07:30 - 08:15',
  '08:20 - 09:05',
  '09:15 - 10:00',
  '10:05 - 10:50',
  '11:00 - 11:45'
];

export function generateWeeklySchedule(weekNum: number): WeeklySchedule {
  return {
    weekNumber: weekNum,
    startDate: `Đầu tuần ${weekNum}`,
    endDate: `Cuối tuần ${weekNum}`,
    days: [
      {
        dayName: 'Thứ 2',
        periods: [
          { periodNumber: 1, timeSlot: TIME_SLOTS[0], subject: 'Chào cờ / SHCC', teacher: 'Thầy Lê Anh Tuấn', room: 'Sân trường' },
          { periodNumber: 2, timeSlot: TIME_SLOTS[1], subject: 'Toán Học', teacher: 'Thầy Lê Anh Tuấn', room: 'Phòng 201' },
          { periodNumber: 3, timeSlot: TIME_SLOTS[2], subject: 'Toán Học', teacher: 'Thầy Lê Anh Tuấn', room: 'Phòng 201' },
          { periodNumber: 4, timeSlot: TIME_SLOTS[3], subject: 'Ngữ Văn', teacher: 'Thầy Lê Văn Thành', room: 'Phòng 201' },
          { periodNumber: 5, timeSlot: TIME_SLOTS[4], subject: 'Tiếng Anh', teacher: 'Cô Trần Thu Trang', room: 'Phòng Lab 1' },
        ]
      },
      {
        dayName: 'Thứ 3',
        periods: [
          { periodNumber: 1, timeSlot: TIME_SLOTS[0], subject: 'Vật Lý', teacher: 'Thầy Phạm Văn Bình', room: 'Phòng Lý' },
          { periodNumber: 2, timeSlot: TIME_SLOTS[1], subject: 'Vật Lý', teacher: 'Thầy Phạm Văn Bình', room: 'Phòng Lý' },
          { periodNumber: 3, timeSlot: TIME_SLOTS[2], subject: 'Hóa Học', teacher: 'Cô Vũ Thị Mai', room: 'Phòng Hóa' },
          { periodNumber: 4, timeSlot: TIME_SLOTS[3], subject: 'Ngữ Văn', teacher: 'Thầy Lê Văn Thành', room: 'Phòng 201' },
          { periodNumber: 5, timeSlot: TIME_SLOTS[4], subject: 'GDCD', teacher: 'Cô Hoàng Mỹ Linh', room: 'Phòng 201' },
        ]
      },
      {
        dayName: 'Thứ 4',
        periods: [
          { periodNumber: 1, timeSlot: TIME_SLOTS[0], subject: 'Sinh Học', teacher: 'Thầy Nguyễn Đức Tâm', room: 'Phòng Sinh' },
          { periodNumber: 2, timeSlot: TIME_SLOTS[1], subject: 'Tiếng Anh', teacher: 'Cô Trần Thu Trang', room: 'Phòng Lab 1' },
          { periodNumber: 3, timeSlot: TIME_SLOTS[2], subject: 'Toán Học', teacher: 'Thầy Lê Anh Tuấn', room: 'Phòng 201' },
          { periodNumber: 4, timeSlot: TIME_SLOTS[3], subject: 'Lịch Sử', teacher: 'Cô Đào Thị Huệ', room: 'Phòng 201' },
          { periodNumber: 5, timeSlot: TIME_SLOTS[4], subject: 'Địa Lý', teacher: 'Thầy Trịnh Văn Nam', room: 'Phòng 201' },
        ]
      },
      {
        dayName: 'Thứ 5',
        periods: [
          { periodNumber: 1, timeSlot: TIME_SLOTS[0], subject: 'Tin Học', teacher: 'Thầy Hoàng Anh Tuấn', room: 'Phòng Máy 2' },
          { periodNumber: 2, timeSlot: TIME_SLOTS[1], subject: 'Tin Học', teacher: 'Thầy Hoàng Anh Tuấn', room: 'Phòng Máy 2' },
          { periodNumber: 3, timeSlot: TIME_SLOTS[2], subject: 'Hóa Học', teacher: 'Cô Vũ Thị Mai', room: 'Phòng Hóa' },
          { periodNumber: 4, timeSlot: TIME_SLOTS[3], subject: 'Tiếng Anh', teacher: 'Cô Trần Thu Trang', room: 'Phòng 201' },
          { periodNumber: 5, timeSlot: TIME_SLOTS[4], subject: 'Thể Dục', teacher: 'Thầy Bùi Tiến Dũng', room: 'Sân Vận Động' },
        ]
      },
      {
        dayName: 'Thứ 6',
        periods: [
          { periodNumber: 1, timeSlot: TIME_SLOTS[0], subject: 'Ngữ Văn', teacher: 'Thầy Lê Văn Thành', room: 'Phòng 201' },
          { periodNumber: 2, timeSlot: TIME_SLOTS[1], subject: 'Ngữ Văn', teacher: 'Thầy Lê Văn Thành', room: 'Phòng 201' },
          { periodNumber: 3, timeSlot: TIME_SLOTS[2], subject: 'Toán Học', teacher: 'Thầy Lê Anh Tuấn', room: 'Phòng 201' },
          { periodNumber: 4, timeSlot: TIME_SLOTS[3], subject: 'Vật Lý', teacher: 'Thầy Phạm Văn Bình', room: 'Phòng Lý' },
          { periodNumber: 5, timeSlot: TIME_SLOTS[4], subject: 'Sinh Học', teacher: 'Thầy Nguyễn Đức Tâm', room: 'Phòng Sinh' },
        ]
      },
      {
        dayName: 'Thứ 7',
        periods: [
          { periodNumber: 1, timeSlot: TIME_SLOTS[0], subject: 'Tiếng Anh', teacher: 'Cô Trần Thu Trang', room: 'Phòng 201' },
          { periodNumber: 2, timeSlot: TIME_SLOTS[1], subject: 'Toán Học', teacher: 'Thầy Lê Anh Tuấn', room: 'Phòng 201' },
          { periodNumber: 3, timeSlot: TIME_SLOTS[2], subject: 'Lịch Sử', teacher: 'Cô Đào Thị Huệ', room: 'Phòng 201' },
          { periodNumber: 4, timeSlot: TIME_SLOTS[3], subject: 'Sinh Hoạt Lớp', teacher: 'Thầy Lê Anh Tuấn', room: 'Phòng 201' },
          { periodNumber: 5, timeSlot: TIME_SLOTS[4], subject: 'HĐ Lớp / Ngoại khóa', teacher: 'Thầy Lê Anh Tuấn', room: 'Hội trường' },
        ]
      }
    ]
  };
}

export function getDefaultSubjectScores(studentId: string): SubjectScore[] {
  // Empty default subject scores so user can input their own data
  const defaultSubjects = [
    { subjectName: 'Toán Học', teacherName: 'Thầy Lê Anh Tuấn' },
    { subjectName: 'Ngữ Văn', teacherName: 'Thầy Lê Văn Thành' },
    { subjectName: 'Tiếng Anh', teacherName: 'Cô Trần Thu Trang' },
    { subjectName: 'Vật Lý', teacherName: 'Thầy Phạm Văn Bình' },
    { subjectName: 'Hóa Học', teacherName: 'Cô Vũ Thị Mai' },
    { subjectName: 'Sinh Học', teacherName: 'Thầy Nguyễn Đức Tâm' },
    { subjectName: 'Lịch Sử', teacherName: 'Cô Đào Thị Huệ' },
    { subjectName: 'Địa Lý', teacherName: 'Thầy Trịnh Văn Nam' },
    { subjectName: 'Tin Học', teacherName: 'Thầy Hoàng Anh Tuấn' },
    { subjectName: 'GDCD', teacherName: 'Cô Hoàng Mỹ Linh' },
  ];

  return defaultSubjects.map(sub => ({
    subjectName: sub.subjectName,
    teacherName: sub.teacherName,
    oralScores: [],
    scores15m: [],
    scores45m: [],
    midtermScore: null,
    finalScore: null,
    averageScore: 0,
    teacherRemark: '',
    isNeedingImprovement: false,
  }));
}

export function getDefaultWeeklyReports(studentId: string, weekNum: number): WeeklyReport {
  return {
    studentId,
    weekNumber: weekNum,
    totalPeriods: 0,
    excusedAbsences: 0,
    unexcusedAbsences: 0,
    lateArrivals: 0,
    weakPoints: [],
    learningStatus: 'Chưa xếp loại',
    conductStatus: 'Tốt',
    teacherComment: '',
    parentFeedback: '',
    updatedAt: new Date().toLocaleString('vi-VN')
  };
}

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [];

// Persistent State Storage Helper
const STORAGE_KEYS = {
  CLASSES: 'edulink_classes',
  ACTIVE_CLASS_ID: 'edulink_active_class_id',
  TEACHER: 'edulink_teacher',
  SUBJECT_TEACHERS: 'edulink_subject_teachers',
  STUDENTS: 'edulink_students',
  ANNOUNCEMENTS: 'edulink_announcements',
  WEEKLY_REPORTS: 'edulink_weekly_reports',
  SUBJECT_SCORES: 'edulink_subject_scores',
  WEEKLY_SCHEDULES: 'edulink_weekly_schedules',
  AUDIT_LOGS: 'edulink_audit_logs',
  ACTIVE_ACTOR: 'edulink_active_actor',
  ADMIN_WHITELIST: 'edulink_admin_whitelist'
};

export interface ActiveActorInfo {
  uid: string;
  name: string;
  label: string;
}

export function formatEditTimestamp(date: Date = new Date()): string {
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('vi-VN');
  return `${timeStr} • ${dateStr}`;
}

export class DataService {
  private static activeClassIdMemory: string | null = null;

  private static scopedKey(baseKey: string, classId: string = this.getActiveClassId()): string {
    return classId === DEFAULT_CLASS_ID ? baseKey : `${baseKey}__${classId}`;
  }

  private static isDefaultCloudClass(classId: string = this.getActiveClassId()): boolean {
    return classId === DEFAULT_CLASS_ID;
  }

  private static getDefaultTeacherForClass(classId: string): TeacherInfo {
    if (classId === 'class_10a2') return { ...DEFAULT_TEACHER_10A2 };
    if (classId === 'class_10a3') return { ...DEFAULT_TEACHER_10A3 };
    return { ...DEFAULT_TEACHER };
  }

  private static getDefaultStudentsForClass(classId: string): Student[] {
    if (classId === 'class_10a2') return DEFAULT_STUDENTS_10A2.map(s => ({ ...s, avatar: '' }));
    if (classId === 'class_10a3') return DEFAULT_STUDENTS_10A3.map(s => ({ ...s, avatar: '' }));
    return DEFAULT_STUDENTS.map(s => ({ ...s, avatar: '' }));
  }

  static getClasses(): ClassRoomInfo[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ClassRoomInfo[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback to defaults
      }
    }
    const seeded = DEFAULT_CLASSES.map(c => ({ ...c }));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(seeded));
    return seeded;
  }

  static getActiveClassId(): string {
    if (this.activeClassIdMemory) {
      return this.activeClassIdMemory;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS_ID);
    const classes = this.getClasses();
    if (saved && classes.some(c => c.id === saved)) {
      this.activeClassIdMemory = saved;
      return saved;
    }
    this.activeClassIdMemory = classes[0]?.id || DEFAULT_CLASS_ID;
    return this.activeClassIdMemory;
  }

  static setActiveClassId(classId: string): void {
    const classes = this.getClasses();
    const target = classes.some(c => c.id === classId) ? classId : DEFAULT_CLASS_ID;
    this.activeClassIdMemory = target;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS_ID, target);
  }

  static getStudentCountForClass(classId: string): number {
    return this.getStudentsForClass(classId).length;
  }

  static createClass(input: {
    className: string;
    schoolYear: string;
    teacherName: string;
    teacherCode: string;
    subject?: string;
    phone?: string;
    password?: string;
  }): ClassRoomInfo {
    const classes = this.getClasses();
    const classId = `class_${Date.now()}`;
    const cleanClassName = input.className.trim().slice(0, 64);
    const cleanSchoolYear = input.schoolYear.trim().slice(0, 32) || '2025 - 2026';
    const cleanTeacherName = input.teacherName.trim().slice(0, 120);
    const cleanTeacherCode = input.teacherCode.trim().slice(0, 32) || `GV${classes.length + 1}`;
    const cleanSubject = (input.subject || 'Giáo viên chủ nhiệm').trim().slice(0, 120);
    const cleanPhone = (input.phone || '0900 000 000').trim().slice(0, 32);
    const cleanPassword = (input.password || '123').trim().slice(0, 64) || '123';

    const teacherInfo: TeacherInfo = {
      name: cleanTeacherName,
      code: cleanTeacherCode,
      className: cleanClassName,
      schoolYear: cleanSchoolYear,
      email: `${cleanTeacherCode.toLowerCase()}@edu.vn`,
      phone: cleanPhone,
      subject: cleanSubject,
      password: cleanPassword,
    };

    const classSlug = cleanClassName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || `L${classes.length + 1}`;
    const starterStudent: Student = {
      id: 'hs01',
      name: 'Học Sinh Mẫu 01',
      studentCode: `${classSlug}01`.slice(0, 32),
      avatar: '',
      gender: 'Nữ',
      dob: '01/01/2010',
      parentPassword: '123',
      conduct: 'Tốt',
      overallGPA: 0.0,
    };

    localStorage.setItem(this.scopedKey(STORAGE_KEYS.TEACHER, classId), JSON.stringify(teacherInfo));
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.STUDENTS, classId), JSON.stringify([starterStudent]));
    localStorage.setItem(
      this.scopedKey(`${STORAGE_KEYS.SUBJECT_SCORES}_${starterStudent.id}`, classId),
      JSON.stringify(getDefaultSubjectScores(starterStudent.id))
    );

    const newClassInfo: ClassRoomInfo = {
      id: classId,
      className: cleanClassName,
      schoolYear: cleanSchoolYear,
      teacherName: cleanTeacherName,
      teacherCode: cleanTeacherCode,
      isDefault: false,
    };

    const updatedClasses = [...classes, newClassInfo];
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    this.setActiveClassId(classId);
    return newClassInfo;
  }

  static getTeacher(classId: string = this.getActiveClassId()): TeacherInfo {
    const data = localStorage.getItem(this.scopedKey(STORAGE_KEYS.TEACHER, classId));
    const fallback = this.getDefaultTeacherForClass(classId);
    if (data) {
      try {
        const parsed: TeacherInfo = JSON.parse(data);
        if (!parsed.name || parsed.name.includes('Hoàng Yến')) {
          localStorage.setItem(this.scopedKey(STORAGE_KEYS.TEACHER, classId), JSON.stringify(fallback));
          return fallback;
        }
        return {
          ...parsed,
          password: parsed.password || '123',
        };
      } catch (e) {
        return fallback;
      }
    }
    return fallback;
  }

  private static async writeDocSafe(collectionName: string, docId: string, data: unknown): Promise<void> {
    const path = `${collectionName}/${docId}`;
    try {
      await setDoc(doc(db, collectionName, docId), stripUndefined(data));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch (loggedErr) {
        console.warn('Firebase background write error:', loggedErr);
      }
    }
  }

  private static async deleteDocSafe(collectionName: string, docId: string): Promise<void> {
    const path = `${collectionName}/${docId}`;
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch (loggedErr) {
        console.warn('Firebase background delete error:', loggedErr);
      }
    }
  }

  static saveTeacher(teacher: TeacherInfo, classId: string = this.getActiveClassId()): void {
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.TEACHER, classId), JSON.stringify(teacher));
    // Keep class registry synchronized
    const classes = this.getClasses();
    const updatedClasses = classes.map((c) =>
      c.id === classId
        ? {
            ...c,
            className: teacher.className,
            schoolYear: teacher.schoolYear,
            teacherName: teacher.name,
            teacherCode: teacher.code,
          }
        : c
    );
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    if (this.isDefaultCloudClass(classId)) {
      void this.writeDocSafe('settings', 'teacher', teacher);
    }
  }

  static updateTeacherPassword(newPassword: string): TeacherInfo {
    const current = this.getTeacher();
    const updated: TeacherInfo = {
      ...current,
      password: newPassword,
    };
    this.saveTeacher(updated);
    return updated;
  }

  static updateTeacherName(newName: string): TeacherInfo {
    const current = this.getTeacher();
    const cleanedName = newName.trim().slice(0, 120);
    const updated: TeacherInfo = {
      ...current,
      name: cleanedName,
    };
    this.saveTeacher(updated);

    const activeActor = this.getActiveActor();
    if (activeActor && activeActor.uid === `teacher_${current.code}`) {
      this.setActiveActor({
        ...activeActor,
        name: cleanedName,
      });
    }
    return updated;
  }

  static getStudentsForClass(classId: string): Student[] {
    const key = this.scopedKey(STORAGE_KEYS.STUDENTS, classId);
    const fallback = this.getDefaultStudentsForClass(classId);
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed: Student[] = JSON.parse(data);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.setItem(key, JSON.stringify(fallback));
          return fallback;
        }
        if (classId === DEFAULT_CLASS_ID && parsed.some(s => s.name === 'Nguyễn Văn Minh' || s.name === 'Trần Thị Mỹ Linh')) {
          localStorage.setItem(key, JSON.stringify(fallback));
          return fallback;
        }
        return parsed.map(s => ({ ...s, avatar: s.avatar || '' }));
      } catch (e) {
        return fallback;
      }
    }
    return fallback;
  }

  static getStudents(): Student[] {
    return this.getStudentsForClass(this.getActiveClassId());
  }

  static saveStudents(students: Student[]): void {
    const classId = this.getActiveClassId();
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.STUDENTS, classId), JSON.stringify(students));
    if (this.isDefaultCloudClass(classId)) {
      students.forEach(student => {
        void this.writeDocSafe('students', student.id, student);
      });
    }
  }

  static addStudent(input: {
    name: string;
    studentCode: string;
    gender: 'Nam' | 'Nữ';
    dob: string;
    parentPassword: string;
    conduct: 'Tốt' | 'Khá' | 'Trung bình';
  }): Student {
    const classId = this.getActiveClassId();
    const existing = this.getStudents();
    let index = existing.length + 1;
    let candidateId = `hs${String(index).padStart(2, '0')}`;
    while (existing.some(s => s.id === candidateId)) {
      index += 1;
      candidateId = `hs${String(index).padStart(2, '0')}`;
    }

    const newStudent: Student = {
      id: candidateId,
      name: input.name.trim().slice(0, 120),
      studentCode: input.studentCode.trim().slice(0, 32),
      avatar: '',
      gender: input.gender,
      dob: input.dob.trim().slice(0, 32) || '01/01/2010',
      parentPassword: input.parentPassword.trim().slice(0, 64) || '123',
      conduct: input.conduct,
      overallGPA: 0.0,
    };

    const updatedStudents = [...existing, newStudent];
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.STUDENTS, classId), JSON.stringify(updatedStudents));
    if (this.isDefaultCloudClass(classId)) {
      void this.writeDocSafe('students', newStudent.id, newStudent);
    }

    // Initialize subject scores so Subject Teacher & Grades sync immediately
    const defaultScores = getDefaultSubjectScores(newStudent.id);
    this.saveSubjectScores(newStudent.id, defaultScores);

    // Initialize week 1 weekly report
    const defaultReport = getDefaultWeeklyReports(newStudent.id, 1);
    this.saveWeeklyReport(newStudent.id, 1, defaultReport, false);

    return newStudent;
  }

  static deleteStudent(studentId: string): Student[] {
    const classId = this.getActiveClassId();
    const existing = this.getStudents();
    const updatedStudents = existing.filter(s => s.id !== studentId);
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.STUDENTS, classId), JSON.stringify(updatedStudents));

    // Clean up local student-specific scores & weekly reports
    localStorage.removeItem(this.scopedKey(`${STORAGE_KEYS.SUBJECT_SCORES}_${studentId}`, classId));
    for (let w = 1; w <= 52; w++) {
      localStorage.removeItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${studentId}_${w}`, classId));
    }

    if (this.isDefaultCloudClass(classId)) {
      void this.deleteDocSafe('students', studentId);
      void this.deleteDocSafe('subject_scores', studentId);
      void this.deleteStudentWeeklyReportsFromFirebase(studentId);
    }

    return updatedStudents;
  }

  private static async deleteStudentWeeklyReportsFromFirebase(studentId: string): Promise<void> {
    try {
      const q = query(collection(db, 'weekly_reports'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        void this.deleteDocSafe('weekly_reports', d.id);
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `weekly_reports?studentId=${studentId}`);
      } catch (loggedErr) {
        console.warn('Firebase weekly reports cleanup error:', loggedErr);
      }
    }
  }

  static updateStudentPassword(studentId: string, newPass: string): void {
    const students = this.getStudents();
    const updated = students.map(s => s.id === studentId ? { ...s, parentPassword: newPass } : s);
    this.saveStudents(updated);
  }

  static getAnnouncements(): Announcement[] {
    const data = localStorage.getItem(this.scopedKey(STORAGE_KEYS.ANNOUNCEMENTS));
    const list: Announcement[] = data ? JSON.parse(data) : DEFAULT_ANNOUNCEMENTS;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
      if (pinDiff !== 0) return pinDiff;
      return (b.id || '').localeCompare(a.id || '');
    });
  }

  static saveAnnouncements(announcements: Announcement[]): void {
    const classId = this.getActiveClassId();
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.ANNOUNCEMENTS, classId), JSON.stringify(announcements));
    if (this.isDefaultCloudClass(classId)) {
      announcements.forEach(ann => {
        void this.writeDocSafe('announcements', ann.id, ann);
      });
    }
  }

  static addAnnouncement(title: string, content: string, category: Announcement['category'], isPinned: boolean = false): Announcement {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      id: 'ann_' + Date.now(),
      title,
      content,
      category,
      date: new Date().toLocaleDateString('vi-VN'),
      author: this.getTeacher().name,
      isPinned
    };
    const updated = [newAnn, ...list];
    this.saveAnnouncements(updated);
    return newAnn;
  }

  static toggleAnnouncementPin(id: string): Announcement[] {
    const list = this.getAnnouncements();
    const updated = list.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    this.saveAnnouncements(updated);
    return this.getAnnouncements();
  }

  static deleteAnnouncement(id: string): void {
    const classId = this.getActiveClassId();
    const list = this.getAnnouncements();
    this.saveAnnouncements(list.filter(a => a.id !== id));
    if (this.isDefaultCloudClass(classId)) {
      deleteDoc(doc(db, 'announcements', id)).catch((error) => {
        try {
          handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
        } catch (loggedErr) {
          console.warn('Firebase delete error:', loggedErr);
        }
      });
    }
  }

  static getWeeklySchedule(weekNum: number): WeeklySchedule {
    const data = localStorage.getItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_SCHEDULES}_${weekNum}`));
    return data ? JSON.parse(data) : generateWeeklySchedule(weekNum);
  }

  static saveWeeklySchedule(weekNum: number, schedule: WeeklySchedule): void {
    const classId = this.getActiveClassId();
    localStorage.setItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_SCHEDULES}_${weekNum}`, classId), JSON.stringify(schedule));
    if (this.isDefaultCloudClass(classId)) {
      void this.writeDocSafe('weekly_schedules', `week_${weekNum}`, schedule);
    }
  }

  static getSubjectTeachers(): SubjectTeacherInfo[] {
    return this.getSubjectTeachersForClass(this.getActiveClassId());
  }

  static getSubjectTeachersForClass(classId: string): SubjectTeacherInfo[] {
    const data = localStorage.getItem(this.scopedKey(STORAGE_KEYS.SUBJECT_TEACHERS, classId));
    if (data) {
      try {
        const parsed = JSON.parse(data) as SubjectTeacherInfo[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((st) => ({
            ...st,
            password: st.password || '123',
          }));
        }
      } catch (e) {
        return DEFAULT_SUBJECT_TEACHERS;
      }
    }
    return DEFAULT_SUBJECT_TEACHERS;
  }

  static saveSubjectTeachers(teachers: SubjectTeacherInfo[]): void {
    this.saveSubjectTeachersForClass(this.getActiveClassId(), teachers);
  }

  static saveSubjectTeachersForClass(classId: string, teachers: SubjectTeacherInfo[]): void {
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.SUBJECT_TEACHERS, classId), JSON.stringify(teachers));
    if (this.isDefaultCloudClass(classId)) {
      void this.writeDocSafe('settings', 'subject_teachers', { teachers });
    }
  }

  static updateSubjectTeacherPassword(subject: string, newPassword: string): SubjectTeacherInfo[] {
    const teachers = this.getSubjectTeachers();
    const updated = teachers.map((st) =>
      st.subject === subject ? { ...st, password: newPassword } : st
    );
    this.saveSubjectTeachers(updated);
    return updated;
  }

  private static activeActor: ActiveActorInfo | null = null;

  static setActiveActor(actor: ActiveActorInfo | null): void {
    this.activeActor = actor;
    try {
      if (actor) {
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_ACTOR, JSON.stringify(actor));
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_ACTOR);
      }
    } catch {
      // ignore storage errors
    }
  }

  static getActiveActor(): ActiveActorInfo | null {
    if (this.activeActor) return this.activeActor;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.ACTIVE_ACTOR);
      if (raw) {
        this.activeActor = JSON.parse(raw) as ActiveActorInfo;
        return this.activeActor;
      }
    } catch {
      // ignore storage errors
    }
    return null;
  }

  static getCurrentActorStamp(fallbackRole?: Exclude<UserRole, 'GUEST'>): { uid: string; email: string; name: string; displayTime: string } {
    const actor = this.getActiveActor();
    if (actor) {
      return {
        uid: actor.uid.slice(0, 128),
        email: actor.label.slice(0, 254),
        name: actor.name.slice(0, 120),
        displayTime: formatEditTimestamp(),
      };
    }

    const teacher = this.getTeacher();
    const defaultName =
      fallbackRole === 'PARENT'
        ? 'Phụ huynh học sinh'
        : fallbackRole === 'SUBJECT_TEACHER'
        ? 'Giáo viên bộ môn'
        : fallbackRole === 'ADMIN'
        ? 'Quản trị viên Hệ thống'
        : teacher.name;
    const defaultLabel =
      fallbackRole === 'PARENT'
        ? 'Phụ huynh'
        : fallbackRole === 'SUBJECT_TEACHER'
        ? 'GV Bộ Môn'
        : fallbackRole === 'ADMIN'
        ? 'Admin Hệ Thống'
        : `GVCN (${teacher.code})`;

    return {
      uid: `role_${fallbackRole || 'TEACHER'}`,
      email: defaultLabel.slice(0, 254),
      name: defaultName.slice(0, 120),
      displayTime: formatEditTimestamp(),
    };
  }

  static getAuditLogs(): AuditLogEntry[] {
    return this.getAuditLogsForClass(this.getActiveClassId());
  }

  static getAuditLogsForClass(classId: string): AuditLogEntry[] {
    const data = localStorage.getItem(this.scopedKey(STORAGE_KEYS.AUDIT_LOGS, classId));
    if (!data) return [];
    try {
      const parsed = JSON.parse(data) as AuditLogEntry[];
      if (!Array.isArray(parsed)) return [];
      return parsed.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch {
      return [];
    }
  }

  static recordAuditLog(params: {
    actorRole: Exclude<UserRole, 'GUEST'>;
    action: string;
    targetType: AuditTargetType;
    targetLabel: string;
    summary: string;
    classIdOverride?: string;
  }): void {
    const classId = params.classIdOverride || this.getActiveClassId();
    const actor = this.getCurrentActorStamp(params.actorRole);

    const now = new Date();
    const id = `log_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`;
    const entry: AuditLogEntry = {
      id: id.slice(0, 64),
      actorUid: actor.uid.slice(0, 128),
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: params.actorRole,
      action: params.action.slice(0, 64),
      targetType: params.targetType,
      targetLabel: params.targetLabel.slice(0, 200),
      summary: params.summary.slice(0, 500),
      createdAt: now.toISOString(),
      displayTime: formatEditTimestamp(now).slice(0, 64),
    };

    const existing = this.getAuditLogsForClass(classId);
    const updated = [entry, ...existing].slice(0, 200);
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.AUDIT_LOGS, classId), JSON.stringify(updated));
    if (this.isDefaultCloudClass(classId)) {
      const cloudEntry: AuditLogEntry = {
        ...entry,
        actorRole: entry.actorRole === 'ADMIN' ? 'TEACHER' : entry.actorRole,
        targetType: entry.targetType === 'CLASS_ADMIN' ? 'TEACHER_PASSWORD' : entry.targetType,
      };
      void this.writeDocSafe('audit_logs', entry.id, cloudEntry);
    }
  }

  static getSubjectScores(studentId: string): SubjectScore[] {
    return this.getSubjectScoresForClass(this.getActiveClassId(), studentId);
  }

  static getSubjectScoresForClass(classId: string, studentId: string): SubjectScore[] {
    const data = localStorage.getItem(this.scopedKey(`${STORAGE_KEYS.SUBJECT_SCORES}_${studentId}`, classId));
    return data ? JSON.parse(data) : getDefaultSubjectScores(studentId);
  }

  static saveSubjectScores(studentId: string, scores: SubjectScore[]): void {
    const classId = this.getActiveClassId();
    localStorage.setItem(this.scopedKey(`${STORAGE_KEYS.SUBJECT_SCORES}_${studentId}`, classId), JSON.stringify(scores));
    if (this.isDefaultCloudClass(classId)) {
      void this.writeDocSafe('subject_scores', studentId, { studentId, scores });
    }
  }

  static saveSingleSubjectScore(studentId: string, updatedSubjectScore: SubjectScore): SubjectScore {
    const actor = this.getCurrentActorStamp();
    const stampedScore: SubjectScore = {
      ...updatedSubjectScore,
      updatedByEmail: actor?.email || updatedSubjectScore.updatedByEmail,
      updatedByName: actor?.name || updatedSubjectScore.updatedByName,
      updatedAt: actor?.displayTime || formatEditTimestamp(),
    };
    const scores = this.getSubjectScores(studentId);
    const index = scores.findIndex(s => s.subjectName === stampedScore.subjectName);
    if (index !== -1) {
      scores[index] = stampedScore;
    } else {
      scores.push(stampedScore);
    }
    this.saveSubjectScores(studentId, scores);
    return stampedScore;
  }

  static getWeeklyReport(studentId: string, weekNum: number): WeeklyReport {
    return this.getWeeklyReportForClass(this.getActiveClassId(), studentId, weekNum);
  }

  static getWeeklyReportForClass(classId: string, studentId: string, weekNum: number): WeeklyReport {
    const data = localStorage.getItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${studentId}_${weekNum}`, classId));
    return data ? JSON.parse(data) : getDefaultWeeklyReports(studentId, weekNum);
  }

  static saveWeeklyReport(studentId: string, weekNum: number, report: WeeklyReport, stampActor: boolean = true): WeeklyReport {
    const classId = this.getActiveClassId();
    const actor = stampActor ? this.getCurrentActorStamp() : null;
    const stampedReport: WeeklyReport = {
      ...report,
      updatedAt: (actor?.displayTime || report.updatedAt || formatEditTimestamp()).slice(0, 64),
      ...(actor ? { updatedByEmail: actor.email, updatedByName: actor.name } : {}),
    };
    localStorage.setItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${studentId}_${weekNum}`, classId), JSON.stringify(stampedReport));
    if (this.isDefaultCloudClass(classId)) {
      void this.writeDocSafe('weekly_reports', `${studentId}_w${weekNum}`, stampedReport);
    }
    return stampedReport;
  }

  static saveParentFeedback(studentId: string, weekNum: number, feedback: string): void {
    const report = this.getWeeklyReport(studentId, weekNum);
    report.parentFeedback = feedback;
    report.parentFeedbackDate = formatEditTimestamp();
    this.saveWeeklyReport(studentId, weekNum, report, false);
  }

  static subscribeToRealtimeSync(onDataUpdated: () => void): () => void {

    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snap) => {
        if (!snap.empty) {
          const fetchedStudents: Student[] = [];
          snap.forEach((d) => fetchedStudents.push(d.data() as Student));
          if (fetchedStudents.length > 0) {
            fetchedStudents.sort((a, b) => (a.studentCode || a.id).localeCompare(b.studentCode || b.id, 'vi'));
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(fetchedStudents));
            onDataUpdated();
          }
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'students');
        } catch (err) {
          console.warn('Realtime students sync error:', err);
        }
      }
    );

    const unsubScores = onSnapshot(
      collection(db, 'subject_scores'),
      (snap) => {
        if (!snap.empty) {
          snap.forEach((d) => {
            const data = d.data();
            if (data.studentId && data.scores) {
              localStorage.setItem(`${STORAGE_KEYS.SUBJECT_SCORES}_${data.studentId}`, JSON.stringify(data.scores));
            }
          });
          onDataUpdated();
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'subject_scores');
        } catch (err) {
          console.warn('Realtime subject_scores sync error:', err);
        }
      }
    );

    const unsubReports = onSnapshot(
      collection(db, 'weekly_reports'),
      (snap) => {
        if (!snap.empty) {
          snap.forEach((d) => {
            const data = d.data() as WeeklyReport;
            if (data.studentId && data.weekNumber) {
              localStorage.setItem(`${STORAGE_KEYS.WEEKLY_REPORTS}_${data.studentId}_${data.weekNumber}`, JSON.stringify(data));
            }
          });
          onDataUpdated();
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'weekly_reports');
        } catch (err) {
          console.warn('Realtime weekly_reports sync error:', err);
        }
      }
    );

    const unsubAnnouncements = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        const fetchedAnn: Announcement[] = [];
        snap.forEach((d) => fetchedAnn.push(d.data() as Announcement));
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(fetchedAnn));
        onDataUpdated();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'announcements');
        } catch (err) {
          console.warn('Realtime announcements sync error:', err);
        }
      }
    );

    const unsubSchedules = onSnapshot(
      collection(db, 'weekly_schedules'),
      (snap) => {
        if (!snap.empty) {
          snap.forEach((d) => {
            const data = d.data() as WeeklySchedule;
            if (data.weekNumber) {
              localStorage.setItem(`${STORAGE_KEYS.WEEKLY_SCHEDULES}_${data.weekNumber}`, JSON.stringify(data));
            }
          });
          onDataUpdated();
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'weekly_schedules');
        } catch (err) {
          console.warn('Realtime weekly_schedules sync error:', err);
        }
      }
    );

    const unsubTeacher = onSnapshot(
      doc(db, 'settings', 'teacher'),
      (snap) => {
        if (snap.exists()) {
          const teacherData = snap.data() as TeacherInfo;
          localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(teacherData));
          this.syncDefaultClassInRegistry(teacherData);
          onDataUpdated();
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'settings/teacher');
        } catch (err) {
          console.warn('Realtime settings/teacher sync error:', err);
        }
      }
    );

    const unsubSubjectTeachers = onSnapshot(
      doc(db, 'settings', 'subject_teachers'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { teachers?: SubjectTeacherInfo[] };
          if (Array.isArray(data.teachers) && data.teachers.length > 0) {
            localStorage.setItem(STORAGE_KEYS.SUBJECT_TEACHERS, JSON.stringify(data.teachers));
            onDataUpdated();
          }
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'settings/subject_teachers');
        } catch (err) {
          console.warn('Realtime settings/subject_teachers sync error:', err);
        }
      }
    );

    const unsubAuditLogs = onSnapshot(
      query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(100)),
      (snap) => {
        const fetchedLogs: AuditLogEntry[] = [];
        snap.forEach((d) => fetchedLogs.push(d.data() as AuditLogEntry));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(fetchedLogs));
        onDataUpdated();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'audit_logs');
        } catch (err) {
          console.warn('Realtime audit_logs sync error:', err);
        }
      }
    );

    return () => {
      unsubStudents();
      unsubScores();
      unsubReports();
      unsubAnnouncements();
      unsubSchedules();
      unsubTeacher();
      unsubSubjectTeachers();
      unsubAuditLogs();
    };
  }

  private static syncDefaultClassInRegistry(teacherData: TeacherInfo): void {
    const classes = this.getClasses();
    const updated = classes.map((c) =>
      c.id === DEFAULT_CLASS_ID
        ? {
            ...c,
            className: teacherData.className || c.className,
            schoolYear: teacherData.schoolYear || c.schoolYear,
            teacherName: teacherData.name || c.teacherName,
            teacherCode: teacherData.code || c.teacherCode,
          }
        : c
    );
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updated));
  }

  static async syncFromFirebase(): Promise<void> {
    try {
      // 1. Fetch Students
      const studentsSnap = await getDocs(collection(db, 'students'));
      if (!studentsSnap.empty) {
        const fetchedStudents: Student[] = [];
        studentsSnap.forEach(d => fetchedStudents.push(d.data() as Student));
        if (fetchedStudents.length > 0) {
          fetchedStudents.sort((a, b) => (a.studentCode || a.id).localeCompare(b.studentCode || b.id, 'vi'));
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(fetchedStudents));
        }
      } else {
        // Seed default students to Firestore if empty
        const defaults = DEFAULT_STUDENTS.map(s => ({ ...s, avatar: '' }));
        defaults.forEach(s => {
          void this.writeDocSafe('students', s.id, s);
        });
      }

      // 2. Fetch Subject Scores
      const scoresSnap = await getDocs(collection(db, 'subject_scores'));
      if (!scoresSnap.empty) {
        scoresSnap.forEach(d => {
          const data = d.data();
          if (data.studentId && data.scores) {
            localStorage.setItem(`${STORAGE_KEYS.SUBJECT_SCORES}_${data.studentId}`, JSON.stringify(data.scores));
          }
        });
      } else {
        // Seed default subject scores for initial students
        DEFAULT_STUDENTS.forEach(s => {
          const scores = getDefaultSubjectScores(s.id);
          void this.writeDocSafe('subject_scores', s.id, { studentId: s.id, scores });
        });
      }

      // 3. Fetch Weekly Reports
      const reportsSnap = await getDocs(collection(db, 'weekly_reports'));
      if (!reportsSnap.empty) {
        reportsSnap.forEach(d => {
          const data = d.data() as WeeklyReport;
          if (data.studentId && data.weekNumber) {
            localStorage.setItem(`${STORAGE_KEYS.WEEKLY_REPORTS}_${data.studentId}_${data.weekNumber}`, JSON.stringify(data));
          }
        });
      }

      // 4. Fetch Weekly Schedules
      const schedulesSnap = await getDocs(collection(db, 'weekly_schedules'));
      if (!schedulesSnap.empty) {
        schedulesSnap.forEach(d => {
          const data = d.data() as WeeklySchedule;
          if (data.weekNumber) {
            localStorage.setItem(`${STORAGE_KEYS.WEEKLY_SCHEDULES}_${data.weekNumber}`, JSON.stringify(data));
          }
        });
      }

      // 5. Fetch Announcements
      const annSnap = await getDocs(collection(db, 'announcements'));
      if (!annSnap.empty) {
        const fetchedAnn: Announcement[] = [];
        annSnap.forEach(d => fetchedAnn.push(d.data() as Announcement));
        if (fetchedAnn.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(fetchedAnn));
        }
      }

      // 6. Fetch Teacher info
      const teacherSnap = await getDoc(doc(db, 'settings', 'teacher'));
      if (teacherSnap.exists()) {
        const teacherData = teacherSnap.data() as TeacherInfo;
        localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(teacherData));
        this.syncDefaultClassInRegistry(teacherData);
      } else {
        void this.writeDocSafe('settings', 'teacher', DEFAULT_TEACHER);
      }

      // 7. Fetch Subject Teachers info & passwords
      const subjectTeachersSnap = await getDoc(doc(db, 'settings', 'subject_teachers'));
      if (subjectTeachersSnap.exists()) {
        const data = subjectTeachersSnap.data() as { teachers?: SubjectTeacherInfo[] };
        if (Array.isArray(data.teachers) && data.teachers.length > 0) {
          localStorage.setItem(STORAGE_KEYS.SUBJECT_TEACHERS, JSON.stringify(data.teachers));
        }
      } else {
        void this.writeDocSafe('settings', 'subject_teachers', { teachers: DEFAULT_SUBJECT_TEACHERS });
      }

      // 8. Fetch Audit Logs
      const auditSnap = await getDocs(
        query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(100))
      );
      if (!auditSnap.empty) {
        const fetchedLogs: AuditLogEntry[] = [];
        auditSnap.forEach((d) => fetchedLogs.push(d.data() as AuditLogEntry));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(fetchedLogs));
      }
    } catch (err) {
      console.warn('Firebase initial sync warning:', err);
    }
  }

  // ================= ADMIN WHITELIST & CROSS-CLASS MANAGEMENT =================

  static getAdminWhitelist(): AdminWhitelistEntry[] {
    const fallback: AdminWhitelistEntry[] = [
      {
        email: SUPER_ADMIN_EMAIL,
        note: 'Super Admin hệ thống',
        isSuperAdmin: true,
        addedAt: 'Mặc định',
      },
    ];
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_WHITELIST);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_WHITELIST, JSON.stringify(fallback));
      return fallback;
    }
    try {
      const parsed = JSON.parse(raw) as AdminWhitelistEntry[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_WHITELIST, JSON.stringify(fallback));
        return fallback;
      }
      const hasSuper = parsed.some((e) => e.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
      if (!hasSuper) {
        const merged = [fallback[0], ...parsed];
        localStorage.setItem(STORAGE_KEYS.ADMIN_WHITELIST, JSON.stringify(merged));
        return merged;
      }
      return parsed.map((e) => ({
        ...e,
        email: e.email.toLowerCase().trim(),
        isSuperAdmin: e.email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase(),
      }));
    } catch {
      return fallback;
    }
  }

  static isAdminWhitelisted(email?: string | null): boolean {
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    return this.getAdminWhitelist().some((entry) => entry.email.toLowerCase().trim() === normalized);
  }

  static addAdminWhitelistEmail(email: string, note: string = ''): AdminWhitelistEntry[] {
    const normalized = email.toLowerCase().trim().slice(0, 254);
    const list = this.getAdminWhitelist();
    if (!normalized || list.some((e) => e.email.toLowerCase() === normalized)) {
      return list;
    }
    const updated: AdminWhitelistEntry[] = [
      ...list,
      {
        email: normalized,
        note: note.trim().slice(0, 120) || 'Quản trị viên',
        isSuperAdmin: normalized === SUPER_ADMIN_EMAIL.toLowerCase(),
        addedAt: formatEditTimestamp(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ADMIN_WHITELIST, JSON.stringify(updated));
    return updated;
  }

  static removeAdminWhitelistEmail(email: string): AdminWhitelistEntry[] {
    const normalized = email.toLowerCase().trim();
    if (normalized === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return this.getAdminWhitelist();
    }
    const updated = this.getAdminWhitelist().filter((e) => e.email.toLowerCase() !== normalized);
    localStorage.setItem(STORAGE_KEYS.ADMIN_WHITELIST, JSON.stringify(updated));
    return updated;
  }

  static getAnnouncementsForClass(classId: string): Announcement[] {
    const data = localStorage.getItem(this.scopedKey(STORAGE_KEYS.ANNOUNCEMENTS, classId));
    const list: Announcement[] = data ? JSON.parse(data) : DEFAULT_ANNOUNCEMENTS;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
      if (pinDiff !== 0) return pinDiff;
      return (b.id || '').localeCompare(a.id || '');
    });
  }

  static deleteAnnouncementForClass(classId: string, id: string): void {
    const list = this.getAnnouncementsForClass(classId).filter((a) => a.id !== id);
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.ANNOUNCEMENTS, classId), JSON.stringify(list));
    if (this.isDefaultCloudClass(classId)) {
      void this.deleteDocSafe('announcements', id);
    }
  }

  static toggleAnnouncementPinForClass(classId: string, id: string): Announcement[] {
    const list = this.getAnnouncementsForClass(classId).map((a) =>
      a.id === id ? { ...a, isPinned: !a.isPinned } : a
    );
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.ANNOUNCEMENTS, classId), JSON.stringify(list));
    if (this.isDefaultCloudClass(classId)) {
      const target = list.find((a) => a.id === id);
      if (target) {
        void this.writeDocSafe('announcements', target.id, target);
      }
    }
    return this.getAnnouncementsForClass(classId);
  }

  static broadcastSchoolAnnouncement(
    title: string,
    content: string,
    category: Announcement['category'],
    isPinned: boolean = true,
    authorLabel: string = 'Ban Giám Hiệu (Admin)'
  ): void {
    const classes = this.getClasses();
    const baseId = `ann_school_${Date.now()}`;
    const newAnn: Announcement = {
      id: baseId,
      title: title.trim().slice(0, 200),
      content: content.trim().slice(0, 5000),
      category,
      date: new Date().toLocaleDateString('vi-VN'),
      author: authorLabel.trim().slice(0, 120),
      isPinned,
    };

    classes.forEach((cls) => {
      const existing = this.getAnnouncementsForClass(cls.id);
      const updated = [newAnn, ...existing];
      localStorage.setItem(this.scopedKey(STORAGE_KEYS.ANNOUNCEMENTS, cls.id), JSON.stringify(updated));
      if (this.isDefaultCloudClass(cls.id)) {
        void this.writeDocSafe('announcements', newAnn.id, newAnn);
      }
    });

    this.recordAuditLog({
      actorRole: 'ADMIN',
      action: 'Phát thông báo toàn trường',
      targetType: 'ANNOUNCEMENT',
      targetLabel: newAnn.title,
      summary: `Gửi thông báo cấp quản trị tới ${classes.length} lớp học${isPinned ? ' (Đã ghim)' : ''}`,
      classIdOverride: DEFAULT_CLASS_ID,
    });
  }

  static updateClassDetails(
    classId: string,
    updates: {
      className: string;
      schoolYear: string;
      teacherName: string;
      teacherCode: string;
      subject: string;
      phone: string;
      password: string;
    }
  ): ClassRoomInfo[] {
    const current = this.getTeacher(classId);
    const updatedTeacher: TeacherInfo = {
      ...current,
      className: updates.className.trim().slice(0, 64) || current.className,
      schoolYear: updates.schoolYear.trim().slice(0, 32) || current.schoolYear,
      name: updates.teacherName.trim().slice(0, 120) || current.name,
      code: updates.teacherCode.trim().slice(0, 32) || current.code,
      subject: updates.subject.trim().slice(0, 120) || current.subject,
      phone: updates.phone.trim().slice(0, 32) || current.phone,
      password: updates.password.trim().slice(0, 64) || current.password || '123',
    };
    this.saveTeacher(updatedTeacher, classId);
    this.recordAuditLog({
      actorRole: 'ADMIN',
      action: 'Cập nhật lớp & GVCN',
      targetType: 'CLASS_ADMIN',
      targetLabel: updatedTeacher.className,
      summary: `Admin điều chỉnh thông tin lớp ${updatedTeacher.className} — GVCN: ${updatedTeacher.name} (${updatedTeacher.code})`,
      classIdOverride: classId,
    });
    return this.getClasses();
  }

  static deleteClass(classId: string): ClassRoomInfo[] {
    const classes = this.getClasses();
    if (classes.length <= 1) {
      return classes;
    }

    const students = this.getStudentsForClass(classId);
    students.forEach((s) => {
      localStorage.removeItem(this.scopedKey(`${STORAGE_KEYS.SUBJECT_SCORES}_${s.id}`, classId));
      for (let w = 1; w <= 52; w++) {
        localStorage.removeItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${s.id}_${w}`, classId));
      }
    });
    for (let w = 1; w <= 52; w++) {
      localStorage.removeItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_SCHEDULES}_${w}`, classId));
    }
    localStorage.removeItem(this.scopedKey(STORAGE_KEYS.TEACHER, classId));
    localStorage.removeItem(this.scopedKey(STORAGE_KEYS.SUBJECT_TEACHERS, classId));
    localStorage.removeItem(this.scopedKey(STORAGE_KEYS.STUDENTS, classId));
    localStorage.removeItem(this.scopedKey(STORAGE_KEYS.ANNOUNCEMENTS, classId));
    localStorage.removeItem(this.scopedKey(STORAGE_KEYS.AUDIT_LOGS, classId));

    const remaining = classes.filter((c) => c.id !== classId);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(remaining));
    if (this.getActiveClassId() === classId && remaining[0]) {
      this.setActiveClassId(remaining[0].id);
    }
    return remaining;
  }

  static resetPasswordsForClass(
    classId: string,
    targets: { teacher?: boolean; subjectTeachers?: boolean; parents?: boolean },
    defaultPassword: string = '123'
  ): void {
    const cleanPass = defaultPassword.trim().slice(0, 64) || '123';
    const classTeacher = this.getTeacher(classId);
    const actions: string[] = [];

    if (targets.teacher) {
      this.saveTeacher({ ...classTeacher, password: cleanPass }, classId);
      actions.push('GVCN');
    }

    if (targets.subjectTeachers) {
      const updatedST = this.getSubjectTeachersForClass(classId).map((st) => ({
        ...st,
        password: cleanPass,
      }));
      this.saveSubjectTeachersForClass(classId, updatedST);
      actions.push('GV Bộ môn');
    }

    if (targets.parents) {
      const updatedStudents = this.getStudentsForClass(classId).map((s) => ({
        ...s,
        parentPassword: cleanPass,
      }));
      localStorage.setItem(this.scopedKey(STORAGE_KEYS.STUDENTS, classId), JSON.stringify(updatedStudents));
      if (this.isDefaultCloudClass(classId)) {
        updatedStudents.forEach((student) => {
          void this.writeDocSafe('students', student.id, student);
        });
      }
      actions.push('Phụ huynh');
    }

    if (actions.length > 0) {
      this.recordAuditLog({
        actorRole: 'ADMIN',
        action: 'Đặt lại mật khẩu hàng loạt',
        targetType: 'CLASS_ADMIN',
        targetLabel: classTeacher.className,
        summary: `Đặt lại mật khẩu (${actions.join(', ')}) về "${cleanPass}" cho lớp ${classTeacher.className}`,
        classIdOverride: classId,
      });
    }
  }

  static transferStudentBetweenClasses(
    studentId: string,
    fromClassId: string,
    toClassId: string
  ): Student | null {
    if (fromClassId === toClassId) return null;
    const sourceStudents = this.getStudentsForClass(fromClassId);
    const targetStudents = this.getStudentsForClass(toClassId);
    const student = sourceStudents.find((s) => s.id === studentId);
    if (!student) return null;

    // Generate non-conflicting id in target class
    let newId = student.id;
    let idx = targetStudents.length + 1;
    while (targetStudents.some((s) => s.id === newId)) {
      newId = `hs${String(idx).padStart(2, '0')}`;
      idx += 1;
    }

    const movedStudent: Student = { ...student, id: newId };
    const scores = this.getSubjectScoresForClass(fromClassId, studentId);
    const reports: WeeklyReport[] = [];
    for (let w = 1; w <= 52; w++) {
      const raw = localStorage.getItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${studentId}_${w}`, fromClassId));
      if (raw) {
        try {
          reports.push({ ...(JSON.parse(raw) as WeeklyReport), studentId: newId });
        } catch {
          // ignore malformed week
        }
      }
    }

    // Remove from source class
    const nextSource = sourceStudents.filter((s) => s.id !== studentId);
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.STUDENTS, fromClassId), JSON.stringify(nextSource));
    localStorage.removeItem(this.scopedKey(`${STORAGE_KEYS.SUBJECT_SCORES}_${studentId}`, fromClassId));
    for (let w = 1; w <= 52; w++) {
      localStorage.removeItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${studentId}_${w}`, fromClassId));
    }
    if (this.isDefaultCloudClass(fromClassId)) {
      void this.deleteDocSafe('students', studentId);
      void this.deleteDocSafe('subject_scores', studentId);
      void this.deleteStudentWeeklyReportsFromFirebase(studentId);
    }

    // Insert into destination class
    const nextTarget = [...targetStudents, movedStudent];
    localStorage.setItem(this.scopedKey(STORAGE_KEYS.STUDENTS, toClassId), JSON.stringify(nextTarget));
    localStorage.setItem(
      this.scopedKey(`${STORAGE_KEYS.SUBJECT_SCORES}_${newId}`, toClassId),
      JSON.stringify(scores)
    );
    reports.forEach((rep) => {
      localStorage.setItem(
        this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${newId}_${rep.weekNumber}`, toClassId),
        JSON.stringify(rep)
      );
      if (this.isDefaultCloudClass(toClassId)) {
        void this.writeDocSafe('weekly_reports', `${newId}_w${rep.weekNumber}`, rep);
      }
    });
    if (this.isDefaultCloudClass(toClassId)) {
      void this.writeDocSafe('students', movedStudent.id, movedStudent);
      void this.writeDocSafe('subject_scores', movedStudent.id, { studentId: movedStudent.id, scores });
    }

    const fromTeacher = this.getTeacher(fromClassId);
    const toTeacher = this.getTeacher(toClassId);
    this.recordAuditLog({
      actorRole: 'ADMIN',
      action: 'Chuyển lớp học sinh',
      targetType: 'CLASS_ADMIN',
      targetLabel: movedStudent.name,
      summary: `Chuyển em ${movedStudent.name} (${movedStudent.studentCode}) từ ${fromTeacher.className} sang ${toTeacher.className}`,
      classIdOverride: toClassId,
    });

    return movedStudent;
  }

  static exportAllSystemData(): string {
    const classes = this.getClasses();
    const classPayloads = classes.map((cls) => {
      const students = this.getStudentsForClass(cls.id);
      const subjectScores: Record<string, SubjectScore[]> = {};
      const weeklyReports: Record<string, WeeklyReport[]> = {};
      students.forEach((s) => {
        subjectScores[s.id] = this.getSubjectScoresForClass(cls.id, s.id);
        const studReports: WeeklyReport[] = [];
        for (let w = 1; w <= 52; w++) {
          const raw = localStorage.getItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${s.id}_${w}`, cls.id));
          if (raw) {
            try {
              studReports.push(JSON.parse(raw) as WeeklyReport);
            } catch {
              // ignore
            }
          }
        }
        if (studReports.length > 0) {
          weeklyReports[s.id] = studReports;
        }
      });

      const weeklySchedules: Record<number, WeeklySchedule> = {};
      for (let w = 1; w <= 52; w++) {
        const rawSched = localStorage.getItem(this.scopedKey(`${STORAGE_KEYS.WEEKLY_SCHEDULES}_${w}`, cls.id));
        if (rawSched) {
          try {
            weeklySchedules[w] = JSON.parse(rawSched) as WeeklySchedule;
          } catch {
            // ignore
          }
        }
      }

      return {
        classInfo: cls,
        teacher: this.getTeacher(cls.id),
        subjectTeachers: this.getSubjectTeachersForClass(cls.id),
        students,
        announcements: this.getAnnouncementsForClass(cls.id),
        auditLogs: this.getAuditLogsForClass(cls.id),
        subjectScores,
        weeklyReports,
        weeklySchedules,
      };
    });

    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        activeClassId: this.getActiveClassId(),
        adminWhitelist: this.getAdminWhitelist(),
        classes: classPayloads,
      },
      null,
      2
    );
  }

  static importAllSystemData(jsonText: string): { classesCount: number; studentsCount: number } {
    const parsed = JSON.parse(jsonText) as {
      activeClassId?: string;
      adminWhitelist?: AdminWhitelistEntry[];
      classes?: Array<{
        classInfo: ClassRoomInfo;
        teacher: TeacherInfo;
        subjectTeachers?: SubjectTeacherInfo[];
        students: Student[];
        announcements?: Announcement[];
        auditLogs?: AuditLogEntry[];
        subjectScores?: Record<string, SubjectScore[]>;
        weeklyReports?: Record<string, WeeklyReport[]>;
        weeklySchedules?: Record<string, WeeklySchedule>;
      }>;
    };

    if (!parsed || !Array.isArray(parsed.classes) || parsed.classes.length === 0) {
      throw new Error('File sao lưu không hợp lệ hoặc không có dữ liệu lớp học.');
    }

    localStorage.clear();
    this.activeClassIdMemory = null;

    if (Array.isArray(parsed.adminWhitelist)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_WHITELIST, JSON.stringify(parsed.adminWhitelist));
      this.getAdminWhitelist();
    }

    const classInfos: ClassRoomInfo[] = [];
    let totalStudents = 0;

    parsed.classes.forEach((item) => {
      if (!item.classInfo || !item.teacher) return;
      const cid = item.classInfo.id;
      classInfos.push(item.classInfo);
      localStorage.setItem(this.scopedKey(STORAGE_KEYS.TEACHER, cid), JSON.stringify(item.teacher));
      localStorage.setItem(
        this.scopedKey(STORAGE_KEYS.SUBJECT_TEACHERS, cid),
        JSON.stringify(item.subjectTeachers || DEFAULT_SUBJECT_TEACHERS)
      );
      const studs = Array.isArray(item.students) ? item.students : [];
      totalStudents += studs.length;
      localStorage.setItem(this.scopedKey(STORAGE_KEYS.STUDENTS, cid), JSON.stringify(studs));
      localStorage.setItem(
        this.scopedKey(STORAGE_KEYS.ANNOUNCEMENTS, cid),
        JSON.stringify(item.announcements || [])
      );
      localStorage.setItem(
        this.scopedKey(STORAGE_KEYS.AUDIT_LOGS, cid),
        JSON.stringify(item.auditLogs || [])
      );

      if (item.subjectScores) {
        Object.entries(item.subjectScores).forEach(([sid, scores]) => {
          localStorage.setItem(
            this.scopedKey(`${STORAGE_KEYS.SUBJECT_SCORES}_${sid}`, cid),
            JSON.stringify(scores)
          );
        });
      }

      if (item.weeklyReports) {
        Object.entries(item.weeklyReports).forEach(([sid, reps]) => {
          reps.forEach((rep) => {
            localStorage.setItem(
              this.scopedKey(`${STORAGE_KEYS.WEEKLY_REPORTS}_${sid}_${rep.weekNumber}`, cid),
              JSON.stringify(rep)
            );
          });
        });
      }

      if (item.weeklySchedules) {
        Object.entries(item.weeklySchedules).forEach(([wk, sched]) => {
          localStorage.setItem(
            this.scopedKey(`${STORAGE_KEYS.WEEKLY_SCHEDULES}_${wk}`, cid),
            JSON.stringify(sched)
          );
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classInfos));
    const targetActive =
      parsed.activeClassId && classInfos.some((c) => c.id === parsed.activeClassId)
        ? parsed.activeClassId
        : classInfos[0]?.id || DEFAULT_CLASS_ID;
    this.setActiveClassId(targetActive);

    return {
      classesCount: classInfos.length,
      studentsCount: totalStudents,
    };
  }

  static resetToDefault(): void {
    localStorage.clear();
    this.activeClassIdMemory = null;
  }
}
