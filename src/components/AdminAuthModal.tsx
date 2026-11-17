import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, LogOut, ArrowRight, CheckCircle2, AlertTriangle, KeyRound, Copy, Check } from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider, cacheOAuthTokenFromResult } from '../lib/firebase';
import { DataService } from '../services/dataStorage';
import { AdminSessionInfo } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (admin: AdminSessionInfo) => void;
}

export const AdminAuthModal: React.FC<Props> = ({ isOpen, onClose, onAuthenticated }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState('');
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg('');
      setUnauthorizedDomain('');
      setCopiedDomain(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const verifyAndEnter = async (user: User) => {
    const email = (user.email || '').toLowerCase().trim();
    if (!email) {
      await signOut(auth);
      setErrorMsg('Không thể đọc địa chỉ email từ tài khoản Google này.');
      return;
    }

    if (user.emailVerified === false) {
      await signOut(auth);
      setErrorMsg(`Email "${email}" chưa được Google xác minh.`);
      return;
    }

    if (!DataService.isAdminWhitelisted(email)) {
      await signOut(auth);
      setErrorMsg(
        `Truy cập bị từ chối: Tài khoản "${email}" không nằm trong danh sách Whitelist Quản trị viên.`
      );
      return;
    }

    onAuthenticated({
      uid: user.uid,
      email,
      displayName: user.displayName || email,
      photoURL: user.photoURL || '',
    });
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setUnauthorizedDomain('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      cacheOAuthTokenFromResult(result);
      await verifyAndEnter(result.user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMsg('Bạn đã đóng cửa sổ đăng nhập Google. Vui lòng thử lại.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Trình duyệt đã chặn cửa sổ bật lên (popup). Hãy cho phép popup và thử lại.');
      } else if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(host);
        setErrorMsg(
          'Tên miền hiện tại chưa được cấp phép trong Firebase Authentication Authorized Domains.'
        );
      } else {
        setErrorMsg('Đăng nhập Google không thành công. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    setErrorMsg('');
    setUnauthorizedDomain('');
    setIsLoading(true);
    try {
      await signOut(auth);
      const result = await signInWithPopup(auth, googleProvider);
      cacheOAuthTokenFromResult(result);
      await verifyAndEnter(result.user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(host);
        setErrorMsg(
          'Tên miền hiện tại chưa được cấp phép trong Firebase Authentication Authorized Domains.'
        );
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setErrorMsg('Không thể chuyển tài khoản Google. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activeProjectId = auth.app.options.projectId || '';

  const isCurrentWhitelisted = currentUser?.email
    ? DataService.isAdminWhitelisted(currentUser.email)
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                Cổng Quản Trị Hệ Thống
              </h3>
              <p className="text-xs text-slate-500">
                Khu vực giới hạn · Yêu cầu Google trong Whitelist
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
          <KeyRound className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            Chỉ tài khoản Google đã được cấp quyền trong <strong>Whitelist Quản trị viên</strong> mới có thể truy cập bảng điều khiển toàn trường.
          </span>
        </div>

        {currentUser && currentUser.email && isCurrentWhitelisted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Admin'}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover border border-emerald-300 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                  {(currentUser.email[0] || 'A').toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="font-bold text-emerald-950 text-sm truncate">
                    {currentUser.displayName || 'Quản trị viên'}
                  </p>
                </div>
                <p className="text-xs text-emerald-800 font-mono truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void verifyAndEnter(currentUser)}
                className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              >
                <span>Xác Nhận &amp; Vào Quản Trị</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => void handleSwitchAccount()}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng nhập bằng tài khoản Google khác</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleGoogleSignIn()}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm border-2 border-slate-200 hover:border-slate-300 shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.54-5.17 3.54-8.97z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96h-3.98v3.14C3.515 21.3 7.565 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.535 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62h-3.98a11.74 11.74 0 0 0 0 10.76l3.98-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.7 6.62l3.98 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>{isLoading ? 'Đang xác thực Google...' : 'Đăng nhập bằng Google'}</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 space-y-2.5 text-xs text-red-700 font-medium leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {unauthorizedDomain && (
              <div className="p-2.5 rounded-xl bg-white border border-red-200 space-y-2 text-slate-800">
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                  Hãy chọn đúng dự án Firebase{' '}
                  {activeProjectId && (
                    <code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                      {activeProjectId}
                    </code>
                  )}{' '}
                  → Authentication → Settings → Authorized domains và thêm:
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-[11px] font-bold text-indigo-800 break-all">
                    {unauthorizedDomain}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(unauthorizedDomain);
                      setCopiedDomain(true);
                      setTimeout(() => setCopiedDomain(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Đã chép' : 'Chép'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
