import React, { useState, useRef } from 'react';
import { 
  Trophy, 
  Star, 
  Flame, 
  Clock, 
  Award, 
  Share2, 
  Download, 
  Check, 
  Sparkles, 
  X, 
  Copy, 
  Heart, 
  Edit3, 
  BookOpen, 
  Zap, 
  Crown,
  Palette,
  Printer
} from 'lucide-react';
import { UserProfile } from '../types';
import { audioService } from '../utils/audio';
import triggerConfetti from 'canvas-confetti';

interface AchievementCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
}

export const AchievementCardModal: React.FC<AchievementCardModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  if (!isOpen) return null;

  const cardRef = useRef<HTMLDivElement>(null);

  const studentName = user?.name || 'Bé Quốc Minh';
  const level = user?.level || 1;
  const stars = user?.stars || 0;
  const streak = user?.streakDays || 1;
  const studyMinutes = user?.studyTimeMinutes || 15;
  const studyHours = (studyMinutes / 60).toFixed(1);
  const completedLessons = user?.completedLessonsCount || 3;
  const learnedVocab = user?.learnedVocabCount || 12;

  // Customization Options
  const [selectedBadge, setSelectedBadge] = useState<string>('🌟 Siêu Sao Tiếng Anh');
  const [selectedTheme, setSelectedTheme] = useState<'gold' | 'galaxy' | 'jungle' | 'coral' | 'ocean'>('gold');
  const [customTitle, setCustomTitle] = useState<string>('BẢNG THÀNH TÍCH XUẤT SẮC');
  const [parentNote, setParentNote] = useState<string>(
    `Con đã học tập rất chăm chỉ và xuất sắc hoàn thành ${completedLessons} bài học tuần này. Chúc mừng con cún cưng của ba mẹ!`
  );
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const badgeOptions = [
    '🌟 Siêu Sao Tiếng Anh',
    '🚀 Chiến Binh Chăm Chỉ',
    '🏆 Bậc Thầy Từ Vựng',
    '👑 DINO VIP Premium',
    '🔥 Dũng Sĩ Streak 🔥',
    '⚡ Thần Tốc Tiếng Anh'
  ];

  const themeStyles = {
    gold: {
      bg: 'bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-600',
      border: 'border-amber-300',
      cardBg: 'bg-slate-900/90 text-white border-amber-400/40',
      badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
      accentText: 'text-amber-400',
      glow: 'shadow-amber-500/25',
    },
    galaxy: {
      bg: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900',
      border: 'border-purple-400',
      cardBg: 'bg-slate-950/80 text-white border-purple-400/40',
      badgeBg: 'bg-purple-400/20 text-purple-300 border-purple-400/50',
      accentText: 'text-purple-300',
      glow: 'shadow-purple-500/25',
    },
    jungle: {
      bg: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-green-900',
      border: 'border-emerald-300',
      cardBg: 'bg-slate-900/90 text-white border-emerald-400/40',
      badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/50',
      accentText: 'text-emerald-400',
      glow: 'shadow-emerald-500/25',
    },
    coral: {
      bg: 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-600',
      border: 'border-rose-300',
      cardBg: 'bg-slate-900/90 text-white border-rose-400/40',
      badgeBg: 'bg-rose-400/20 text-rose-300 border-rose-400/50',
      accentText: 'text-rose-400',
      glow: 'shadow-rose-500/25',
    },
    ocean: {
      bg: 'bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-800',
      border: 'border-sky-300',
      cardBg: 'bg-slate-900/90 text-white border-sky-400/40',
      badgeBg: 'bg-sky-400/20 text-sky-300 border-sky-400/50',
      accentText: 'text-sky-300',
      glow: 'shadow-sky-500/25',
    }
  };

  const currentTheme = themeStyles[selectedTheme];

  const handleCopySummary = () => {
    audioService.playClickSound();
    const text = `🎉 BẢNG THÀNH TÍCH DINOENGLISH 🎉
Bé: ${studentName} (${selectedBadge})
🏆 Đạt Cấp Độ: Level ${level}
⭐ Tích lũy: ${stars} Sao
🔥 Chuỗi Ngày Học: ${streak} Ngày
⏱️ Thời gian học: ${studyHours} Giờ
📚 Bài học hoàn thành: ${completedLessons} Bài
💬 Lời nhắn: "${parentNote}"
---
Cùng con học Tiếng Anh thông minh tại DinoEnglish! 🦖✨`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      triggerConfetti({ particleCount: 40, spread: 60 });
      setTimeout(() => setCopiedText(false), 2500);
    });
  };

  // Web Share API handler to share image or text snippet directly to mobile apps (Zalo, FB, Messenger, etc.)
  const handleWebShare = async () => {
    audioService.playSuccessSound();
    triggerConfetti({ particleCount: 60, spread: 70 });

    const shareTitle = `Thẻ Thành Tích Tiếng Anh của ${studentName}`;
    const shareText = `🎉 BẢNG THÀNH TÍCH DINOENGLISH 🎉
Bé: ${studentName} (${selectedBadge})
🏆 Level: ${level} | ⭐ Sao: ${stars} | 🔥 Streak: ${streak} Ngày
⏱️ Thời gian học: ${studyHours} Giờ | 📚 Bài học: ${completedLessons} Bài
💬 Lời nhắn: "${parentNote}"

Cùng con học Tiếng Anh thông minh tại DinoEnglish! 🦖✨`;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 1200, 700);
        if (selectedTheme === 'gold') {
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(0.5, '#d97706');
          grad.addColorStop(1, '#78350f');
        } else if (selectedTheme === 'galaxy') {
          grad.addColorStop(0, '#312e81');
          grad.addColorStop(0.5, '#581c87');
          grad.addColorStop(1, '#0f172a');
        } else if (selectedTheme === 'jungle') {
          grad.addColorStop(0, '#059669');
          grad.addColorStop(0.5, '#0f766e');
          grad.addColorStop(1, '#064e3b');
        } else if (selectedTheme === 'coral') {
          grad.addColorStop(0, '#f43f5e');
          grad.addColorStop(0.5, '#ea580c');
          grad.addColorStop(1, '#9a3412');
        } else {
          grad.addColorStop(0, '#2563eb');
          grad.addColorStop(0.5, '#0284c7');
          grad.addColorStop(1, '#1e1b4b');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 700);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 10;
        ctx.strokeRect(30, 30, 1140, 640);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦖 DINOENGLISH - ACHIEVEMENTS', 600, 90);
        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(customTitle, 600, 140);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(80, 180, 1040, 440, 30);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`👦 ${studentName}`, 130, 250);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(selectedBadge, 130, 295);

        const stats = [
          { label: '🏆 Cấp Độ', val: `LEVEL ${level}` },
          { label: '⭐ Sao Tích Lũy', val: `${stars} Sao` },
          { label: '🔥 Chuỗi Ngày', val: `${streak} Ngày` },
          { label: '⏱️ Thời Gian Học', val: `${studyHours} Giờ` },
          { label: '📚 Đã Hoàn Thành', val: `${completedLessons} Bài` },
          { label: '🔤 Từ Vựng Nhớ', val: `${learnedVocab} Từ` },
        ];
        stats.forEach((st, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const x = 130 + col * 340;
          const y = 350 + row * 85;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.roundRect(x, y, 310, 70, 16);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(st.label, x + 20, y + 30);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(st.val, x + 20, y + 58);
        });
        if (parentNote) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
          ctx.beginPath();
          ctx.roundRect(130, 535, 940, 65, 16);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.font = 'italic bold 20px sans-serif';
          ctx.fillText(`💬 "${parentNote}"`, 150, 575);
        }

        if (navigator.share) {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], `Thanh-Tich-${studentName.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                  await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    files: [file],
                  });
                  return;
                } catch (e) {
                  console.log('File share canceled/failed:', e);
                }
              }
            }
            try {
              await navigator.share({
                title: shareTitle,
                text: shareText,
                url: window.location.href,
              });
            } catch (err) {
              console.log('Share text canceled or failed:', err);
            }
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Canvas share error:', e);
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled:', err);
      }
    } else {
      handleCopySummary();
    }
  };

  // HTML5 Canvas Fallback Image Exporter for high-resolution card download
  const handleDownloadImage = async () => {
    audioService.playSuccessSound();
    setIsExporting(true);
    triggerConfetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

    try {
      // Build a standard canvas element to draw the achievement card
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Fill background based on theme
        const grad = ctx.createLinearGradient(0, 0, 1200, 700);
        if (selectedTheme === 'gold') {
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(0.5, '#d97706');
          grad.addColorStop(1, '#78350f');
        } else if (selectedTheme === 'galaxy') {
          grad.addColorStop(0, '#312e81');
          grad.addColorStop(0.5, '#581c87');
          grad.addColorStop(1, '#0f172a');
        } else if (selectedTheme === 'jungle') {
          grad.addColorStop(0, '#059669');
          grad.addColorStop(0.5, '#0f766e');
          grad.addColorStop(1, '#064e3b');
        } else if (selectedTheme === 'coral') {
          grad.addColorStop(0, '#f43f5e');
          grad.addColorStop(0.5, '#ea580c');
          grad.addColorStop(1, '#9a3412');
        } else {
          grad.addColorStop(0, '#2563eb');
          grad.addColorStop(0.5, '#0284c7');
          grad.addColorStop(1, '#1e1b4b');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 700);

        // Draw outer decorative rounded rectangle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 10;
        ctx.strokeRect(30, 30, 1140, 640);

        // Header Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦖 DINOENGLISH - ACHIEVEMENTS', 600, 90);

        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(customTitle, 600, 140);

        // Inner Dark Card Box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(80, 180, 1040, 440, 30);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        // Student Info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`👦 ${studentName}`, 130, 250);

        // Badge Pill
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(selectedBadge, 130, 295);

        // Stats Grid in Canvas
        const stats = [
          { label: '🏆 Cấp Độ', val: `LEVEL ${level}` },
          { label: '⭐ Sao Tích Lũy', val: `${stars} Sao` },
          { label: '🔥 Chuỗi Ngày', val: `${streak} Ngày` },
          { label: '⏱️ Thời Gian Học', val: `${studyHours} Giờ` },
          { label: '📚 Đã Hoàn Thành', val: `${completedLessons} Bài` },
          { label: '🔤 Từ Vựng Nhớ', val: `${learnedVocab} Từ` },
        ];

        stats.forEach((st, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const x = 130 + col * 340;
          const y = 350 + row * 85;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.roundRect(x, y, 310, 70, 16);
          ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(st.label, x + 20, y + 30);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(st.val, x + 20, y + 58);
        });

        // Parent Note Box
        ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
        ctx.beginPath();
        ctx.roundRect(130, 535, 940, 65, 16);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'italic bold 20px sans-serif';
        ctx.fillText(`💬 "${parentNote}"`, 150, 575);

        // Convert canvas to image & download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `The-Thanh-Tich-${studentName.replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error('Error generating card image:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border-2 border-amber-300 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1d50b4] to-[#2563eb] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-md">
              🏆
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Tạo Thẻ Thành Tích Học Tập (Achievement Card)
              </h2>
              <p className="text-xs font-semibold text-blue-100">
                Tùy chỉnh, xem trước và lưu/chia sẻ thành tích học tập đáng tự hào của bé!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioService.playClickSound();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Editor & Preview Split */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Customization Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Palette className="w-4 h-4 text-sky-600" />
                <span>Tùy Chỉnh Thẻ Thành Tích</span>
              </h3>

              {/* Theme Picker */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 block">
                  🎨 Chủ đề màu sắc:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['gold', 'galaxy', 'jungle', 'coral', 'ocean'] as const).map((th) => (
                    <button
                      key={th}
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTheme(th);
                      }}
                      className={`h-9 rounded-xl transition border-2 cursor-pointer flex items-center justify-center capitalize font-black text-[10px] ${
                        selectedTheme === th ? 'border-amber-500 scale-105 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                      } ${
                        th === 'gold' ? 'bg-amber-500 text-white' :
                        th === 'galaxy' ? 'bg-purple-900 text-white' :
                        th === 'jungle' ? 'bg-emerald-700 text-white' :
                        th === 'coral' ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  🏷️ Tiêu đề danh hiệu:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  placeholder="Nhập tiêu đề thẻ..."
                />
              </div>

              {/* Badge Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  🏅 Huy hiệu khen thưởng:
                </label>
                <select
                  value={selectedBadge}
                  onChange={(e) => {
                    audioService.playClickSound();
                    setSelectedBadge(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {badgeOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parent Note Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  💬 Lời khen từ Ba Mẹ / Thầy Cô:
                </label>
                <textarea
                  value={parentNote}
                  onChange={(e) => setParentNote(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Viết lời động viên dành cho bé..."
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Live Card Preview (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  XEM TRƯỚC THẺ THÀNH TÍCH (PREVIEW)
                </span>

                <span className="text-[11px] font-bold text-slate-400">
                  {new Date().toLocaleDateString('vi-VN')}
                </span>
              </div>

              {/* The Visual Card Container */}
              <div
                ref={cardRef}
                className={`p-5 sm:p-6 rounded-3xl ${currentTheme.bg} border-2 ${currentTheme.border} ${currentTheme.glow} shadow-xl relative overflow-hidden transition-all duration-300 space-y-5`}
              >
                {/* Background Decorative Circles */}
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

                {/* Card Top Brand Line */}
                <div className="flex items-center justify-between relative z-10 border-b border-white/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🦖</span>
                    <span className="font-black text-white text-sm tracking-tight uppercase">
                      DINOENGLISH APP
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                    OFFICIAL CERTIFICATE
                  </span>
                </div>

                {/* Student Avatar & Title */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border-2 border-white/40 p-1 backdrop-blur-md shadow-lg shrink-0 flex items-center justify-center text-4xl">
                    {user?.avatar || '🦖'}
                  </div>

                  <div className="space-y-1">
                    <div className={`px-3 py-0.5 rounded-full text-[11px] font-black inline-block border ${currentTheme.badgeBg}`}>
                      {selectedBadge}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {studentName}
                    </h3>
                    <p className={`text-xs font-bold ${currentTheme.accentText}`}>
                      {customTitle}
                    </p>
                  </div>
                </div>

                {/* 6 Grid Stats Cards inside Preview */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className={`p-3 rounded-2xl ${currentTheme.cardBg} backdrop-blur-md space-y-0.5`}>
                    <span className="text-[10px] font-extrabold text-slate-300 uppercase block">Cấp Độ</span>
                    <span className="text-base font-black text-amber-400">LEVEL {level}</span>
                  </div>

                  <div className={`p-3 rounded-2xl ${currentTheme.cardBg} backdrop-blur-md space-y-0.5`}>
                    <span className="text-[10px] font-extrabold text-slate-300 uppercase block">Sao Tích Lũy</span>
                    <span className="text-base font-black text-yellow-300">{stars} ⭐</span>
                  </div>

                  <div className={`p-3 rounded-2xl ${currentTheme.cardBg} backdrop-blur-md space-y-0.5`}>
                    <span className="text-[10px] font-extrabold text-slate-300 uppercase block">Chuỗi Ngày</span>
                    <span className="text-base font-black text-rose-400">{streak} Ngày 🔥</span>
                  </div>

                  <div className={`p-3 rounded-2xl ${currentTheme.cardBg} backdrop-blur-md space-y-0.5`}>
                    <span className="text-[10px] font-extrabold text-slate-300 uppercase block">Thời Gian Học</span>
                    <span className="text-base font-black text-sky-300">{studyHours} Giờ</span>
                  </div>

                  <div className={`p-3 rounded-2xl ${currentTheme.cardBg} backdrop-blur-md space-y-0.5`}>
                    <span className="text-[10px] font-extrabold text-slate-300 uppercase block">Đã Hoàn Thành</span>
                    <span className="text-base font-black text-emerald-400">{completedLessons} Bài</span>
                  </div>

                  <div className={`p-3 rounded-2xl ${currentTheme.cardBg} backdrop-blur-md space-y-0.5`}>
                    <span className="text-[10px] font-extrabold text-slate-300 uppercase block">Từ Vựng Nhớ</span>
                    <span className="text-base font-black text-purple-300">{learnedVocab} Từ</span>
                  </div>
                </div>

                {/* Parent Note Footer inside Card */}
                {parentNote && (
                  <div className="relative z-10 p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                    <p className="text-xs font-semibold italic text-amber-100 leading-relaxed">
                      💬 "{parentNote}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleWebShare}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer scale-100 hover:scale-[1.02] active:scale-95"
              title="Chia sẻ qua Zalo, Facebook, Messenger hoặc ứng dụng trên thiết bị"
            >
              <Share2 size={16} />
              <span>Chia sẻ Web Share 📲</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-black text-xs rounded-xl shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check size={16} className="text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy size={16} className="text-slate-500" />
                  <span>Sao chép chữ</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioService.playClickSound();
                onClose();
              }}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download size={16} />
              <span>{isExporting ? 'Đang tạo ảnh...' : 'Tải Ảnh Thẻ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
