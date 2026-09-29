import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  X, 
  Bell, 
  Clock, 
  ShieldAlert, 
  Gift, 
  Users,
  Radio,
  Search,
  Calendar,
  Image as ImageIcon,
  CheckCheck
} from 'lucide-react';
import { SystemBroadcastNotification, UserAccount, UserProfile } from '../types';
import { audioService } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import { recordBroadcastReadReceiptInFirebase } from '../lib/firebaseSync';

interface BroadcastAlertModalProps {
  broadcasts: SystemBroadcastNotification[];
  currentUser: UserAccount | UserProfile;
  onDismissBroadcast?: (broadcastId: string) => void;
}

const DISMISSED_BROADCASTS_KEY = 'KIDO_DISMISSED_BROADCASTS_V1';

export const BroadcastAlertModal: React.FC<BroadcastAlertModalProps> = ({
  broadcasts,
  currentUser,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_BROADCASTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [activePopupBroadcast, setActivePopupBroadcast] = useState<SystemBroadcastNotification | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyTimeRange, setHistoryTimeRange] = useState<'today' | 'week' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter broadcasts relevant to this user
  const userRelevantBroadcasts = broadcasts.filter((b) => {
    if (!b.isActive) return false;

    // Check expiration if set
    if (b.expiryMinutes && b.timestampMs) {
      const expiryMs = b.timestampMs + b.expiryMinutes * 60 * 1000;
      if (Date.now() > expiryMs) return false;
    }

    // Target audience matching
    if (b.targetAccountId && b.targetAccountId !== currentUser.id) {
      return false;
    }
    if (b.targetAudience === 'all_accounts') return true;
    if (b.targetAudience === 'all_students' || b.targetAudience === 'online_students') {
      return currentUser.role === 'kid';
    }
    return true;
  });

  // Automatically show modal for the newest undismissed broadcast
  useEffect(() => {
    const unread = userRelevantBroadcasts.filter((b) => !dismissedIds.includes(b.id));

    if (unread.length > 0) {
      // Prioritize urgent broadcasts first
      const urgentUnread = unread.find(b => b.priority === 'urgent' || b.category === 'urgent');
      const latest = urgentUnread || unread[0];
      setActivePopupBroadcast(latest);

      // Play alert sound
      if (latest.playAlertSound !== false) {
        if (latest.priority === 'urgent' || latest.category === 'urgent') {
          audioService.playSuccessSound();
        } else {
          audioService.playSuccessSound();
        }
      }

      // Trigger confetti burst for joy or special events
      if (latest.priority === 'joy' || latest.category === 'event' || latest.category === 'success') {
        triggerConfetti();
      }
    } else {
      setActivePopupBroadcast(null);
    }
  }, [broadcasts, currentUser.id, dismissedIds.length]);

  const handleAcknowledgeAndRead = (broadcast: SystemBroadcastNotification) => {
    audioService.playClickSound();
    
    // Record read receipt in Firebase & local cache
    const userName = (currentUser as UserAccount).name || currentUser.username || 'Người dùng';
    recordBroadcastReadReceiptInFirebase(broadcast.id, currentUser.id, userName);

    // Save dismissed state to LocalStorage
    const newDismissed = Array.from(new Set([...dismissedIds, broadcast.id]));
    setDismissedIds(newDismissed);
    try {
      localStorage.setItem(DISMISSED_BROADCASTS_KEY, JSON.stringify(newDismissed));
    } catch {}

    if (activePopupBroadcast?.id === broadcast.id) {
      setActivePopupBroadcast(null);
    }
  };

  const handleDismissAll = () => {
    audioService.playClickSound();
    const userName = (currentUser as UserAccount).name || currentUser.username || 'Người dùng';
    userRelevantBroadcasts.forEach(b => {
      recordBroadcastReadReceiptInFirebase(b.id, currentUser.id, userName);
    });

    const allIds = userRelevantBroadcasts.map((b) => b.id);
    const newDismissed = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(newDismissed);
    try {
      localStorage.setItem(DISMISSED_BROADCASTS_KEY, JSON.stringify(newDismissed));
    } catch {}
    setActivePopupBroadcast(null);
  };

  const getPriorityCategoryStyles = (b: SystemBroadcastNotification) => {
    const isUrgent = b.priority === 'urgent' || b.category === 'urgent';
    const isJoy = b.priority === 'joy' || b.category === 'success' || b.category === 'event';

    if (isUrgent) {
      return {
        bgGradient: 'from-rose-600 via-red-600 to-amber-700',
        borderColor: 'border-rose-500',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: <ShieldAlert className="w-8 h-8 text-rose-100 animate-pulse" />,
        titlePrefix: '🚨 KHẨN CẤP (BẮT BUỘC ĐỌC)',
        btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-300',
        isForcedModal: true,
      };
    }

    if (isJoy) {
      return {
        bgGradient: 'from-amber-500 via-yellow-500 to-emerald-600',
        borderColor: 'border-amber-300',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: <Sparkles className="w-8 h-8 text-amber-100 animate-spin-slow" />,
        titlePrefix: '🎉 TIN VUI / SỰ KIỆN',
        btnBg: 'bg-gradient-to-r from-amber-600 to-emerald-600 hover:brightness-110 text-white shadow-amber-200',
        isForcedModal: false,
      };
    }

    if (b.category === 'warning') {
      return {
        bgGradient: 'from-orange-500 via-amber-600 to-orange-700',
        borderColor: 'border-orange-300',
        badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
        icon: <AlertTriangle className="w-8 h-8 text-orange-100 animate-bounce" />,
        titlePrefix: '⚠️ CẢNH BÁO HỆ THỐNG',
        btnBg: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200',
        isForcedModal: false,
      };
    }

    return {
      bgGradient: 'from-sky-600 via-indigo-600 to-blue-700',
      borderColor: 'border-sky-300',
      badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
      icon: <Info className="w-8 h-8 text-sky-100" />,
      titlePrefix: '📢 THÔNG BÁO TỪ HỆ THỐNG',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
      isForcedModal: false,
    };
  };

  const unreadCount = userRelevantBroadcasts.filter((b) => !dismissedIds.includes(b.id)).length;

  // Filter history by time range & search query
  const filteredHistoryBroadcasts = userRelevantBroadcasts.filter((b) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchMsg = b.message.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }

    // Time range filter
    if (historyTimeRange === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return (b.timestampMs || 0) >= startOfToday.getTime();
    }

    if (historyTimeRange === 'week') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return (b.timestampMs || 0) >= sevenDaysAgo;
    }

    return true;
  });

  return (
    <>
      {/* POPUP ALERT MODAL (Forced modal for urgent priority; standard modal for others) */}
      {activePopupBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
          <div className={`relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-2 ${getPriorityCategoryStyles(activePopupBroadcast).borderColor} animate-scaleUp`}>
            
            {/* Header Banner with Category Gradient */}
            <div className={`bg-gradient-to-r ${getPriorityCategoryStyles(activePopupBroadcast).bgGradient} p-6 text-white relative overflow-hidden`}>
              {/* Background Broadcast Wave Pattern */}
              <div className="absolute -right-8 -bottom-8 opacity-20 pointer-events-none">
                <Radio className="w-40 h-40 text-white" />
              </div>

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner text-2xl">
                    {activePopupBroadcast.kidoEmoji ? activePopupBroadcast.kidoEmoji : getPriorityCategoryStyles(activePopupBroadcast).icon}
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-white font-black text-[10px] tracking-wider uppercase border border-white/20 inline-block mb-1">
                      {getPriorityCategoryStyles(activePopupBroadcast).titlePrefix}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white leading-snug drop-shadow-xs">
                      {activePopupBroadcast.title}
                    </h3>
                  </div>
                </div>

                {/* Hide dismiss X if forced urgent modal to guarantee reading */}
                {!getPriorityCategoryStyles(activePopupBroadcast).isForcedModal && (
                  <button
                    onClick={() => handleAcknowledgeAndRead(activePopupBroadcast)}
                    className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-white/20"
                    title="Đóng thông báo"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              {/* Kido Emoji Display Badge if provided */}
              {(activePopupBroadcast.kidoEmoji || activePopupBroadcast.dinoEmoji) && (
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  <span className="text-xl">{activePopupBroadcast.kidoEmoji || activePopupBroadcast.dinoEmoji}</span>
                  <span>Lời nhắn sinh động từ Kido English!</span>
                </div>
              )}

              {/* Message text */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-800 text-sm font-semibold leading-relaxed whitespace-pre-wrap shadow-inner">
                {activePopupBroadcast.message}
              </div>

              {/* Image Attachment preview if available */}
              {activePopupBroadcast.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-56 bg-slate-100 flex items-center justify-center">
                  <img 
                    src={activePopupBroadcast.imageUrl} 
                    alt="Hình ảnh đính kèm" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Metadata row */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-bold gap-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-indigo-600 shrink-0" />
                  <span>Người gửi: <strong className="text-slate-800">{activePopupBroadcast.senderName || 'Ban Quản Trị'}</strong></span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-600 shrink-0" />
                  <span>{activePopupBroadcast.timestamp}</span>
                </div>
              </div>

              {/* Read Receipt notice */}
              <div className="text-[10px] text-slate-400 font-medium italic text-center">
                * Hành động xác nhận bên dưới sẽ gửi phản hồi đã đọc đến hệ thống.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handleAcknowledgeAndRead(activePopupBroadcast)}
                  className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs text-white shadow-md transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${getPriorityCategoryStyles(activePopupBroadcast).btnBg}`}
                >
                  <CheckCircle2 size={18} />
                  <span>XÁC NHẬN ĐÃ ĐỌC THÔNG BÁO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY DRAWER (Allows re-reading past broadcasts with time range filtering) */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Radio size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-base">Lịch Sử Thông Báo Phát Sóng</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Hệ thống tin nhắn tức thời & xem lại ngoại tuyến</p>
                </div>
              </div>

              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Time Range Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              {/* Search box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thông báo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Time Range Tabs */}
              <div className="flex items-center gap-1.5 text-xs font-extrabold bg-slate-200/80 p-1 rounded-xl">
                <button
                  onClick={() => setHistoryTimeRange('today')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                    historyTimeRange === 'today' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock size={12} />
                  <span>Hôm nay</span>
                </button>
                <button
                  onClick={() => setHistoryTimeRange('week')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                    historyTimeRange === 'week' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar size={12} />
                  <span>Tuần này</span>
                </button>
                <button
                  onClick={() => setHistoryTimeRange('all')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                    historyTimeRange === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Tất cả ({userRelevantBroadcasts.length})</span>
                </button>
              </div>
            </div>

            {/* List of active broadcasts */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredHistoryBroadcasts.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-bold space-y-2">
                  <Bell size={36} className="mx-auto text-slate-300" />
                  <p className="text-xs">Không tìm thấy thông báo phát sóng phù hợp.</p>
                </div>
              ) : (
                filteredHistoryBroadcasts.map((b) => {
                  const isDismissed = dismissedIds.includes(b.id) || (b.readByAccountIds || []).includes(currentUser.id);
                  const styles = getPriorityCategoryStyles(b);

                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-2xl border transition space-y-2.5 ${
                        isDismissed
                          ? 'bg-slate-50 border-slate-200 text-slate-600 opacity-85'
                          : 'bg-white border-indigo-200 shadow-xs ring-1 ring-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {b.kidoEmoji && <span className="text-base">{b.kidoEmoji}</span>}
                          <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase border ${styles.badgeBg}`}>
                            {b.priority === 'urgent' ? '🚨 KHẨN CẤP' : b.priority === 'joy' ? '🎉 TIN VUI' : b.category}
                          </span>
                          {!isDismissed && (
                            <span className="px-2 py-0.5 rounded-md font-black text-[9px] bg-rose-500 text-white animate-pulse">
                              Chưa đọc
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400">{b.timestamp}</span>
                      </div>

                      <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{b.title}</span>
                      </h4>

                      <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap">{b.message}</p>

                      {/* Image Thumbnail if available */}
                      {b.imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 max-h-36 bg-slate-100">
                          <img src={b.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
                        <span>Bởi: {b.senderName || 'Admin'}</span>
                        {isDismissed ? (
                          <span className="text-emerald-600 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCheck size={12} /> Đã xác nhận
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcknowledgeAndRead(b)}
                            className="text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} /> Xác nhận đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {userRelevantBroadcasts.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={handleDismissAll}
                  className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  <span>Xác nhận đã đọc tất cả</span>
                </button>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
