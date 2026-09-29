import React, { useState } from 'react';
import { User, Key, Shield, MessageCircle, BookOpen, AlertCircle, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { audioService } from '../utils/audio';
import { UserAccount } from '../types';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { recordUserLogin, saveAccountToFirebase } from '../lib/firebaseSync';
import { isTrustedAdmin, ADMIN_EMAILS, ADMIN_EMAIL } from '../lib/adminAccess';

interface LoginViewProps {
  accounts: UserAccount[];
  onLoginSuccess: (account: UserAccount) => void;
  onContactClick: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ accounts, onLoginSuccess, onContactClick }) => {
  const [loginTab, setLoginTab] = useState<'kid' | 'parent'>('kid');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for Image 3 & Image 4 & Unactivated Gmail warning
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAccount, setSuccessAccount] = useState<UserAccount | null>(null);
  const [showUnactivatedModal, setShowUnactivatedModal] = useState(false);
  const [unactivatedEmail, setUnactivatedEmail] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => !a.isDeleted);

  // Finder logic - finds account by username, name, or email
  const findAccount = (inputUsername: string) => {
    const cleanInput = inputUsername.trim().toLowerCase();
    if (!cleanInput) return null;

    return activeAccounts.find(
      (a) => a.username?.trim().toLowerCase() === cleanInput
    ) || activeAccounts.find(
      (a) => a.name?.trim().toLowerCase() === cleanInput || a.email?.trim().toLowerCase() === cleanInput
    ) || null;
  };

  const triggerSuccessFlow = (account: UserAccount) => {
    setSuccessAccount(account);
    setShowSuccessModal(true);
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimUser = username.trim();
    const trimPass = password.trim();

    if (!trimUser) {
      setErrorMsg('Vui lòng nhập tên đăng nhập!');
      audioService.playClickSound();
      return;
    }

    if (!trimPass) {
      setErrorMsg('Vui lòng nhập mật khẩu!');
      audioService.playClickSound();
      return;
    }

    const matched = findAccount(trimUser);

    if (!matched) {
      setErrorMsg('Không tìm thấy tài khoản. Vui lòng kiểm tra lại tên đăng nhập.');
      audioService.playClickSound();
      return;
    }

    // Check if the tab role matches or check strictly
    const expectedPass = matched.passwordHash;
    if (trimPass !== expectedPass) {
      setErrorMsg('Mật khẩu không đúng! Vui lòng kiểm tra lại mật khẩu.');
      audioService.playClickSound();
      return;
    }

    if (auth.currentUser) {
      try { await signOut(auth); }
      catch { setErrorMsg('Không thể đóng phiên Google cũ. Vui lòng tải lại trang rồi thử lại.'); return; }
    }
    audioService.playSuccessSound();
    triggerSuccessFlow(matched);
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg(null);
      setIsConnectingGoogle(true); // Triggers "Đang kết nối Google..."
      audioService.playClickSound();

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = user.email ? user.email.toLowerCase().trim() : '';

      if (!user.emailVerified || !userEmail) {
        await signOut(auth);
        setIsConnectingGoogle(false);
        setErrorMsg('Tài khoản Google chưa có email được xác minh.');
        return;
      }

      // 1. Check if user is pre-approved Super Admin
      const isSuperAdmin = ADMIN_EMAILS.includes(userEmail) || (await isTrustedAdmin(user));

      // 2. Search for registered user in local accounts
      let existing = activeAccounts.find(
        (a) =>
          !a.isDeleted &&
          (a.id === `google:${user.uid}` ||
            a.id === user.uid ||
            (a.email && a.email.toLowerCase().trim() === userEmail) ||
            (a.username && a.username.toLowerCase().trim() === userEmail))
      );

      // If not found locally, query Firestore directly to ensure real-time accuracy
      if (!existing) {
        try {
          const d1 = await getDoc(doc(db, 'users', `google:${user.uid}`)).catch(() => null);
          if (d1?.exists() && !d1.data()?.isDeleted) {
            existing = { ...d1.data(), id: d1.id } as UserAccount;
          }
        } catch {}
      }

      if (!existing) {
        try {
          const d2 = await getDoc(doc(db, 'users', user.uid)).catch(() => null);
          if (d2?.exists() && !d2.data()?.isDeleted) {
            existing = { ...d2.data(), id: d2.id } as UserAccount;
          }
        } catch {}
      }

      if (!existing) {
        try {
          const qSnap = await getDocs(query(collection(db, 'users'), where('email', '==', userEmail))).catch(() => null);
          if (qSnap && !qSnap.empty) {
            const foundDoc = qSnap.docs.find((d) => !d.data()?.isDeleted);
            if (foundDoc) {
              existing = { ...foundDoc.data(), id: foundDoc.id } as UserAccount;
            }
          }
        } catch {}
      }

      // 3. Check if account is not activated by admin
      const isExplicitlyUnactivated = existing && (existing.isActivated === false || existing.isApproved === false || existing.isDeleted === true);

      // If NOT a Super Admin AND (no account exists in Firestore OR account is deactivated/unapproved):
      if (!isSuperAdmin && (!existing || isExplicitlyUnactivated)) {
        await signOut(auth);
        setIsConnectingGoogle(false);
        audioService.playErrorSound();
        setUnactivatedEmail(userEmail);
        setShowUnactivatedModal(true);
        setErrorMsg(`Tài khoản Gmail [${userEmail}] chưa được Quản trị viên kích hoạt trên hệ thống.`);
        return;
      }

      // 4. Role assignment:
      // - Admin accounts get admin rights
      // - Parent accounts get parent rights
      // - Student accounts get kid rights
      let effectiveRole: 'admin' | 'parent' | 'kid' = 'parent';
      if (isSuperAdmin || existing?.role === 'admin') {
        effectiveRole = 'admin';
      } else if (existing?.role === 'kid') {
        effectiveRole = 'kid';
      } else if (existing?.role === 'parent') {
        effectiveRole = 'parent';
      }

      const matchedAccount: UserAccount = existing
        ? {
            ...existing,
            role: effectiveRole,
            email: userEmail,
            passwordHash: '',
          }
        : {
            id: `google:${user.uid}`,
            username: userEmail.split('@')[0],
            passwordHash: '',
            role: 'admin', // Only reaches here if isSuperAdmin
            name: user.displayName || userEmail.split('@')[0],
            email: userEmail,
            avatar: '🛡️',
            vipExpiryDate: '2099-12-31',
            isVip: true,
            createdAt: new Date().toISOString(),
            allowedGrades: ['all'],
          };

      // Persist to Firebase if it was a new super admin account
      if (!existing && isSuperAdmin) {
        await saveAccountToFirebase(matchedAccount).catch(() => {});
      }

      setIsConnectingGoogle(false);
      audioService.playSuccessSound();
      triggerSuccessFlow(matchedAccount);
    } catch (err: any) {
      setIsConnectingGoogle(false);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        // User voluntarily closed the Google login popup, silently cancel
        return;
      }
      console.error('Google Sign-In Error:', err);
      const help = err?.code === 'auth/unauthorized-domain'
        ? `Cần thêm ${window.location.hostname} vào Firebase Authentication → Settings → Authorized domains của đúng dự án Firebase đang chạy.`
        : err?.code === 'auth/operation-not-allowed'
          ? 'Cần bật phương thức Google trong Firebase Authentication → Sign-in method.'
          : err?.code === 'auth/popup-blocked'
            ? 'Trình duyệt đã chặn cửa sổ Google. Hãy cho phép cửa sổ bật lên rồi thử lại.'
            : (err?.message || 'Lỗi không xác định');
      setErrorMsg('Đăng nhập Google thất bại: ' + help);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#e8f3ff] flex items-center justify-center p-3 sm:p-4 py-8 relative font-sans select-none overflow-y-auto">
      {/* Background Subtle Doodle Elements */}
      <div className="absolute top-10 left-10 text-pink-200/80 text-3xl pointer-events-none">✏️</div>
      <div className="absolute top-16 right-12 text-emerald-200/80 text-3xl pointer-events-none">📖</div>
      <div className="absolute bottom-20 left-12 text-pink-200/80 text-3xl pointer-events-none">🎵</div>
      <div className="absolute bottom-16 right-16 text-[#cbd5e1] text-3xl pointer-events-none">🎓</div>
      <div className="absolute top-1/2 left-6 text-amber-200/80 text-3xl pointer-events-none">🎨</div>
      <div className="absolute top-1/2 right-6 text-sky-200/80 text-3xl pointer-events-none">🌐</div>

      {/* Main Login Card */}
      <div className="w-full max-w-[420px] min-w-0 bg-white rounded-[28px] sm:rounded-[36px] p-4 sm:p-7 border-2 border-[#50b2ff] shadow-xl relative z-10 flex flex-col items-center space-y-4 animate-fadeIn my-auto">
        
        {/* Top 3D Kido Mascot Avatar (Image 1 & 2) */}
        <div className="w-22 h-22 rounded-full bg-gradient-to-b from-[#70c3ff] to-[#a8dcff] p-1 shadow-sm flex items-center justify-center relative overflow-hidden shrink-0 border-2 border-white">
          <div className="text-4xl transform hover:scale-110 transition duration-300">🦖</div>
          <div className="absolute top-1.5 left-2 text-xs">⭐</div>
          <div className="absolute top-2 right-2 text-xs">🌟</div>
          <div className="absolute bottom-1.5 left-2 text-xs">🧸</div>
          <div className="absolute bottom-1.5 right-2 text-xs">⚽</div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a3d8f] tracking-tight">
            KIDOEnglish
          </h1>
          <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1">
            <span>Học Tiếng Anh Thật Vui</span>
            <span className="text-amber-400 text-sm">⭐</span>
          </p>
        </div>

        {/* Segmented Control Switcher (Cho Bé Học vs Phụ Huynh / Admin) */}
        <div className="w-full bg-[#f0f6ff] p-1.5 rounded-2xl border border-[#d2e5ff] flex items-center text-xs font-black">
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              setErrorMsg(null);
              setLoginTab('kid');
              setUsername('');
              setPassword('');
            }}
            className={`flex-1 py-2.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              loginTab === 'kid'
                ? 'bg-white text-[#1a3d8f] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <User size={15} className="text-[#1a3d8f]" />
            <span>Cho Bé Học</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              setErrorMsg(null);
              setLoginTab('parent');
              setUsername('');
              setPassword('');
            }}
            className={`flex-1 py-2.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              loginTab === 'parent'
                ? 'bg-white text-[#1a3d8f] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Shield size={15} className="text-[#1a3d8f]" />
            <span>Phụ Huynh / Admin</span>
          </button>
        </div>

        {/* Error Message Notification */}
        {errorMsg && (
          <div className="w-full p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: CHO BÉ HỌC (Image 1) */}
        {loginTab === 'kid' && (
          <form onSubmit={handleFormLogin} className="w-full space-y-3 text-xs font-bold">
            {/* Username Field */}
            <div className="space-y-1">
              <label className="text-[#1a3d8f] block text-xs font-black">
                Tên đăng nhập của bé:
              </label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setUsername(e.target.value);
                  }}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 focus:border-[#50b2ff] focus:outline-none text-slate-800 text-xs font-bold bg-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[#1a3d8f] block text-xs font-black">
                Mật khẩu:
              </label>
              <div className="relative flex items-center">
                <Key size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setErrorMsg(null);
                    setPassword(e.target.value);
                  }}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 focus:border-[#50b2ff] focus:outline-none text-slate-800 text-xs font-bold bg-white"
                />
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="submit"
                className="py-3 px-2 rounded-2xl bg-[#f0e2d3] hover:bg-[#e8d2bd] text-[#5c3e1e] font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border-2 border-dashed border-[#c29869] active:scale-95 shadow-xs"
              >
                <BookOpen size={15} />
                <span>Vào Học Ngay Thôi</span>
              </button>

              <button
                type="button"
                onClick={onContactClick}
                className="py-3 px-2 rounded-2xl bg-[#e6f3ff] hover:bg-[#d4e9ff] text-[#1d50b4] font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border-2 border-dashed border-[#50b2ff] active:scale-95 shadow-xs"
              >
                <MessageCircle size={15} />
                <span>Liên Hệ Tôi</span>
              </button>
            </div>

            {/* Footer Notice */}
            <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed pt-1">
              Ba mẹ vui lòng sử dụng tài khoản được cấp để đăng nhập cho bé nhé (Dự án không thương mại) <span className="text-red-500 inline-block">❤️</span>
            </p>
          </form>
        )}

        {/* TAB 2: PHỤ HUYNH / ADMIN (Image 2 & 3) */}
        {loginTab === 'parent' && (
          <div className="w-full space-y-4 py-2 text-center">
            <p className="text-xs font-extrabold text-slate-600 leading-relaxed px-2">
              Phụ huynh đăng nhập bằng Google Gmail để quản lý bé, nạp bài học hoặc gia hạn VIP.
            </p>

            {/* Google Sign In Button (Normal - Image 2 vs Connecting - Image 3) */}
            {!isConnectingGoogle ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#fbbb05] via-[#ff9800] to-[#f4511e] hover:brightness-105 text-white font-black text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2.5 border border-amber-300 active:scale-95"
              >
                <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Đăng nhập với Google Gmail</span>
              </button>
            ) : (
              /* Image 3 Connecting State */
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-300 text-[#1a3d8f] font-black text-sm shadow-xs flex items-center justify-center gap-2 cursor-wait animate-pulse"
              >
                <span className="text-base">⏳</span>
                <span>Đang kết nối Google...</span>
              </button>
            )}

            <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed px-2 pt-2">
              Phụ huynh dùng Google để tạo phiên học. Quyền Admin cần được cấp riêng trong Firebase Auth.
            </p>
          </div>
        )}
      </div>

      {/* IMAGE 4: SUCCESS LOGIN MODAL ("Tuyệt vời ông mặt trời 🌟") */}
      {showSuccessModal && successAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] border-2 border-dashed border-[#3b82f6] p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-300 bg-emerald-50 flex items-center justify-center mx-auto text-3xl shadow-inner text-emerald-600">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Tuyệt vời ông mặt trời 🌟</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                Đăng nhập thành công! Chào mừng {successAccount.role === 'parent' ? 'ba mẹ của ' : ''}{successAccount.name} 🎉
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                recordUserLogin(successAccount);
                onLoginSuccess(successAccount);
              }}
              className="w-full py-3 rounded-2xl bg-[#2563eb] hover:bg-blue-700 text-white font-black text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Đồng ý</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* UNACTIVATED GMAIL MODAL */}
      {showUnactivatedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn select-none font-sans">
          <div className="bg-white rounded-[32px] border-2 border-rose-300 p-6 sm:p-7 max-w-md w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-rose-300 bg-rose-50 flex items-center justify-center mx-auto text-3xl shadow-inner text-rose-600">
              🔒
            </div>

            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold border border-rose-200">
                Chưa Được Kích Hoạt
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Không Thể Đăng Nhập Bằng Gmail
              </h3>
              {unactivatedEmail && (
                <p className="text-xs font-mono font-bold text-slate-700 bg-slate-100 py-1 px-2.5 rounded-lg inline-block break-all max-w-full">
                  {unactivatedEmail}
                </p>
              )}
            </div>

            <div className="text-left bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100 text-xs text-rose-950 space-y-1.5 leading-relaxed font-medium">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <span>⚠️</span>
                <span>Thông báo hệ thống KIDOEnglish:</span>
              </p>
              <p>
                Tài khoản Gmail này <strong>chưa được Quản trị viên kích hoạt</strong> trên hệ thống.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700 pt-1">
                <li>Tài khoản <strong>Quản trị viên (Admin)</strong>: Cần thuộc danh sách Quản trị hệ thống.</li>
                <li>Tài khoản <strong>Phụ huynh (Parents)</strong> & <strong>Học sinh (Kids)</strong>: Cần được Admin đăng ký và kích hoạt trước.</li>
              </ul>
              <p className="text-[11px] text-slate-600 pt-1">
                👉 Vui lòng liên hệ Quản trị viên để được mở quyền truy cập tài khoản!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUnactivatedModal(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                Đã hiểu
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(ADMIN_EMAIL);
                  alert(`Đã sao chép email Quản trị viên (${ADMIN_EMAIL}) vào bộ nhớ tạm!`);
                }}
                className="w-full py-2.5 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs border border-rose-200 transition cursor-pointer"
              >
                Sao chép Email Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
