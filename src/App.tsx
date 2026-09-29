import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { RightSidebar } from './components/RightSidebar';
import { Dashboard } from './components/Dashboard';
import { ViewSkeleton } from './components/ViewSkeleton';

const GradeView = React.lazy(() => import('./components/GradeView').then((m) => ({ default: m.GradeView })));
const RoadmapView = React.lazy(() => import('./components/RoadmapView').then((m) => ({ default: m.RoadmapView })));
const SkillPracticeView = React.lazy(() => import('./components/SkillPracticeView').then((m) => ({ default: m.SkillPracticeView })));
const LinearMindmapView = React.lazy(() => import('./components/LinearMindmapView').then((m) => ({ default: m.LinearMindmapView })));
const GamesAndRewardsView = React.lazy(() => import('./components/GamesAndRewardsView').then((m) => ({ default: m.GamesAndRewardsView })));
const ParentCornerView = React.lazy(() => import('./components/ParentCornerView').then((m) => ({ default: m.ParentCornerView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));
const ThemeView = React.lazy(() => import('./components/ThemeView').then((m) => ({ default: m.ThemeView })));
const JournalView = React.lazy(() => import('./components/JournalView').then((m) => ({ default: m.JournalView })));
const ImageListeningSpeakingView = React.lazy(() => import('./components/ImageListeningSpeakingView').then((m) => ({ default: m.ImageListeningSpeakingView })));
const ImageReadingWritingView = React.lazy(() => import('./components/ImageReadingWritingView').then((m) => ({ default: m.ImageReadingWritingView })));
const TopicSpeakingAIView = React.lazy(() => import('./components/TopicSpeakingAIView').then((m) => ({ default: m.TopicSpeakingAIView })));
const TopicWritingAIView = React.lazy(() => import('./components/TopicWritingAIView').then((m) => ({ default: m.TopicWritingAIView })));
const PracticeExerciseView = React.lazy(() => import('./components/PracticeExerciseView').then((m) => ({ default: m.PracticeExerciseView })));
const SampleExamsView = React.lazy(() => import('./components/SampleExamsView').then((m) => ({ default: m.SampleExamsView })));
const ReportView = React.lazy(() => import('./components/ReportView').then((m) => ({ default: m.ReportView })));
const FlashCardView = React.lazy(() => import('./components/FlashCardView').then((m) => ({ default: m.FlashCardView })));
const QuizView = React.lazy(() => import('./components/QuizView').then((m) => ({ default: m.QuizView })));
import { KidoAIOrb } from './components/KidoAIOrb';
import { LoginView } from './components/LoginView';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { ClickBubbleEffect } from './components/ClickBubbleEffect';
import { OfflineNoticeBanner } from './components/OfflineNoticeBanner';
import { StreakLostModal } from './components/StreakLostModal';
import { BroadcastAlertModal } from './components/BroadcastAlertModal';
import { VipPromotionBanner } from './components/VipPromotionBanner';
import { VipPromotionModal } from './components/VipPromotionModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { triggerConfetti } from './utils/confetti';

import { 
  UserProfile, 
  ActiveTab, 
  Language, 
  DailyTask, 
  LeaderboardUser, 
  RewardItem, 
  ParentNote,
  UserAccount,
  UserRole,
  VipTransaction,
  SystemBroadcastNotification,
  ToastType,
  VipPromotionConfig,
  AppNotification
} from './types';

import { 
  initialUserProfile, 
  sampleUnits, 
} from './data/mockData';

import { encryptData, decryptData } from './utils/crypto';
import { audioService } from './utils/audio';
import { calculateLevelAndXpFromStars, getStarsRequiredForLevel } from './utils/levelSystem';
import { testFirestoreConnection, auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { isTrustedAdmin } from './lib/adminAccess';
import { 
  subscribeAccounts, 
  subscribeDailyTasks, 
  subscribeRewards, 
  subscribeParentNotes, 
  subscribeLeaderboard, 
  subscribeVipTransactions,
  subscribeSystemBroadcasts,
  subscribeVipPromotion,
  saveVipPromotionToFirebase,
  getLocalVipTransactions,
  saveAccountToFirebase, 
  saveDailyTaskToFirebase, 
  saveAllDailyTasksToFirebase,
  debouncedSaveDailyTasks,
  flushPendingSyncQueue,
  saveRewardToFirebase, 
  saveParentNoteToFirebase, 
  saveAllAccountsToFirebase,
  deleteAccountFromFirebase,
  saveVipTransactionToFirebase,
  logAccountChange,
  syncLinkedAccounts,
  recordUserLogin,
  recordUserLogout,
  recordStudentActivityToFirebase
} from './lib/firebaseSync';
import { StudentErrorBoundary } from './components/StudentErrorBoundary';
import { DriveMediaAdmin } from './components/DriveMediaAdmin';
import { PageMediaPopup, PageMediaSlot } from './components/PageMediaSlot';
import { MEDIA_PAGES, subscribePageMedia, type PageMediaItem } from './lib/driveMedia';
import { DEFAULT_MENU_CONFIG, subscribeCustomPages, subscribeMenuConfig, type CustomPage, type MenuConfig } from './lib/siteContent';
import { subscribeVocabularyContent, type ManagedVocabularyItem } from './lib/pageContent';
import { useVipManagement } from './hooks/useVipManagement';
import { useAccountManagement } from './hooks/useAccountManagement';
import { useNotificationSystem } from './hooks/useNotificationSystem';
import { preloadAllPagesData } from './lib/pageContentService';
import { runWhenIdle, isLowEndDevice } from './utils/dataCompression';

const STORAGE_KEY = 'KIDO_ENGLISH_STATE_V1';
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(({ AdminDashboard }) => ({ default: AdminDashboard })));

export default function App() {
  // Test Firestore Connection & subscribe to real-time sync
  useEffect(() => {
    testFirestoreConnection().catch(() => {});
    flushPendingSyncQueue().catch(() => {});
    // Auto-preload compressed page data during idle time
    preloadAllPagesData();

    // Idle-prefetch core view chunks so tab switching is instantaneous
    runWhenIdle(() => {
      import('./components/RoadmapView');
      import('./components/GradeView');
      import('./components/SkillPracticeView');
      import('./components/FlashCardView');
      import('./components/GamesAndRewardsView');
      import('./components/SettingsView');
    }, 1500);

    const unsubAccounts = subscribeAccounts((updatedAccounts) => {
      {
        setAccounts(updatedAccounts);
        setUser((prevUser) => {
          const activeId = localStorage.getItem('KIDO_ACTIVE_ACCOUNT_ID');
          const activeAcc = (activeId ? updatedAccounts.find((a) => a.id === activeId) : null)
            || (prevUser.id ? updatedAccounts.find((a) => a.id === prevUser.id) : null)
            || (prevUser.username ? updatedAccounts.find((a) => a.username && a.username.toLowerCase() === prevUser.username.toLowerCase()) : null)
            || (prevUser.name ? updatedAccounts.find((a) => a.name && a.name.toLowerCase() === prevUser.name.toLowerCase()) : null);

          if (!activeAcc) return prevUser;

          const wasActiveVip = Boolean(prevUser.isVip && (!prevUser.vipExpiryDate || new Date(prevUser.vipExpiryDate.replace(' ', 'T')).getTime() > Date.now()));
          const isNowActiveVip = Boolean(activeAcc.isVip && (!activeAcc.vipExpiryDate || new Date(activeAcc.vipExpiryDate.replace(' ', 'T')).getTime() > Date.now()));

          let currentSeconds = prevUser.trialTimeSeconds;
          if (isNowActiveVip) {
            if (activeAcc.vipExpiryDate) {
              const parsed = new Date(activeAcc.vipExpiryDate.replace(' ', 'T'));
              if (!isNaN(parsed.getTime()) && parsed > new Date()) {
                currentSeconds = Math.floor((parsed.getTime() - Date.now()) / 1000);
              } else {
                currentSeconds = activeAcc.trialTimeSeconds || 31536000;
              }
            } else {
              currentSeconds = activeAcc.trialTimeSeconds || 31536000;
            }
          } else {
            // Free account: use Firestore trialTimeSeconds if available, but respect local countdown progress
            if (activeAcc.trialTimeSeconds !== undefined) {
              if (prevUser.trialTimeSeconds !== undefined && prevUser.trialTimeSeconds < activeAcc.trialTimeSeconds) {
                currentSeconds = prevUser.trialTimeSeconds;
              } else {
                currentSeconds = activeAcc.trialTimeSeconds;
              }
            } else {
              currentSeconds = prevUser.trialTimeSeconds !== undefined ? prevUser.trialTimeSeconds : 300;
            }
          }

          if (wasActiveVip && !isNowActiveVip) {
            audioService.playClickSound();
            setTimeout(() => {
              setVipDowngradeModalData({
                isOpen: true,
                accountName: activeAcc.name || prevUser.name,
                previousExpiry: prevUser.vipExpiryDate || 'Gói VIP Active',
                reason: activeAcc.vipExpiryDate
                  ? `VIP đã hết hạn sử dụng (${activeAcc.vipExpiryDate})`
                  : 'Quản trị viên đã hủy gói VIP hoặc điều chỉnh giảm',
              });
            }, 0);
          }

          const nextStars = activeAcc.stars !== undefined ? activeAcc.stars : prevUser.stars;
          const nextLevel = activeAcc.level !== undefined ? activeAcc.level : prevUser.level;
          const nextStreak = activeAcc.streakDays !== undefined ? activeAcc.streakDays : prevUser.streakDays;
          const nextLessons = activeAcc.completedLessons !== undefined ? activeAcc.completedLessons : prevUser.completedLessonsCount;
          const nextStudyTime = activeAcc.studyTimeMinutes !== undefined ? activeAcc.studyTimeMinutes : prevUser.studyTimeMinutes;
          const nextVocab = activeAcc.learnedVocabCount !== undefined ? activeAcc.learnedVocabCount : prevUser.learnedVocabCount;
          const nextCheckedIn = activeAcc.checkedInToday !== undefined ? activeAcc.checkedInToday : prevUser.checkedInToday;
          const nextAllowedGrades = activeAcc.allowedGrades || prevUser.allowedGrades;
          const nextLinkedKidIds = activeAcc.linkedKidIds || [];
          const nextLinkedParentIds = activeAcc.linkedParentIds || [];
          const nextPendingRequests = activeAcc.pendingParentRequests || [];

          // Check if state actually changed to avoid redundant re-renders
          if (
            prevUser.id === (activeAcc.id || prevUser.id) &&
            prevUser.role === (activeAcc.role || prevUser.role) &&
            prevUser.name === (activeAcc.name || prevUser.name) &&
            prevUser.username === (activeAcc.username || prevUser.username) &&
            prevUser.isVip === isNowActiveVip &&
            prevUser.vipExpiryDate === (activeAcc.vipExpiryDate ?? prevUser.vipExpiryDate) &&
            prevUser.trialTimeSeconds === currentSeconds &&
            prevUser.stars === nextStars &&
            prevUser.level === nextLevel &&
            prevUser.streakDays === nextStreak &&
            prevUser.completedLessonsCount === nextLessons &&
            prevUser.studyTimeMinutes === nextStudyTime &&
            prevUser.learnedVocabCount === nextVocab &&
            prevUser.checkedInToday === nextCheckedIn &&
            prevUser.avatar === (activeAcc.avatar || prevUser.avatar) &&
            JSON.stringify(prevUser.allowedGrades) === JSON.stringify(nextAllowedGrades) &&
            JSON.stringify(prevUser.linkedKidIds) === JSON.stringify(nextLinkedKidIds) &&
            JSON.stringify(prevUser.linkedParentIds) === JSON.stringify(nextLinkedParentIds) &&
            JSON.stringify(prevUser.pendingParentRequests) === JSON.stringify(nextPendingRequests)
          ) {
            return prevUser;
          }

          if (prevUser.streakDays > 0 && nextStreak === 0) {
            const lostVal = prevUser.streakDays;
            setTimeout(() => {
              setLostStreakCount(lostVal);
              setShowStreakLostModal(true);
            }, 50);
          }

          return {
            ...prevUser,
            id: activeAcc.id || prevUser.id,
            role: activeAcc.role || prevUser.role,
            name: activeAcc.name || prevUser.name,
            username: activeAcc.username || prevUser.username,
            stars: nextStars,
            level: nextLevel,
            streakDays: nextStreak,
            completedLessonsCount: nextLessons,
            studyTimeMinutes: nextStudyTime,
            learnedVocabCount: nextVocab,
            checkedInToday: nextCheckedIn,
            avatar: activeAcc.avatar || prevUser.avatar,
            isVip: isNowActiveVip,
            vipExpiryDate: activeAcc.vipExpiryDate ?? prevUser.vipExpiryDate,
            trialTimeSeconds: currentSeconds,
            allowedGrades: nextAllowedGrades,
            linkedKidIds: nextLinkedKidIds,
            linkedParentIds: nextLinkedParentIds,
            pendingParentRequests: nextPendingRequests,
          };
        });
      }
    });
    const currentUserId = user.id || user.username || 'anonymous';
    const unsubTasks = subscribeDailyTasks(currentUserId, (updatedTasks) => {
      setDailyTasks(updatedTasks);
    });
    const unsubRewards = subscribeRewards((updatedRewards) => {
      setRewards(updatedRewards);
    });
    const unsubParentNotes = subscribeParentNotes((updatedNotes) => {
      setParentNotes(updatedNotes);
    });
    const unsubLeaderboard = subscribeLeaderboard((updatedLb) => {
      setLeaderboard(updatedLb);
    });
    const unsubVipTx = subscribeVipTransactions((updatedTxs) => {
      setVipTransactions(updatedTxs);
    });
    const unsubBroadcasts = subscribeSystemBroadcasts((updatedBroadcasts) => {
      setSystemBroadcasts(updatedBroadcasts);
    });
    const unsubVipPromo = subscribeVipPromotion((promo) => {
      setVipPromotion(promo);
    });

    return () => {
      unsubAccounts();
      unsubTasks();
      unsubRewards();
      unsubParentNotes();
      unsubLeaderboard();
      unsubVipTx();
      unsubBroadcasts();
      unsubVipPromo();
    };
  }, []);

  // System Broadcast Notifications State
  const [systemBroadcasts, setSystemBroadcasts] = useState<SystemBroadcastNotification[]>([]);
  // VIP Promotion State
  const [vipPromotion, setVipPromotion] = useState<VipPromotionConfig | null>(null);
  const [showVipUpgradeModal, setShowVipUpgradeModal] = useState(false);
  // Accounts state management with localStorage persistence
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('KIDO_ACCOUNTS_V1') || localStorage.getItem('DINO_ACCOUNTS_V1');
      if (saved) {
        const parsed: UserAccount[] = JSON.parse(saved);
        // Ensure all accounts have level, completed lessons and stars reset to 0 as requested
        return parsed.filter((acc) => !['acc-admin', 'acc-parent', 'acc-kid', 'acc-kid2'].includes(acc.id)).map((acc) => {
          const avatarStr = typeof acc.avatar === 'string' ? acc.avatar : '';
          let avatar = acc.avatar;
          if (acc.role === 'admin' && (!avatarStr || avatarStr.startsWith('http'))) {
            avatar = '🛡️';
          }
          if (acc.role === 'parent' && (!avatarStr || avatarStr.startsWith('http'))) {
            avatar = '👨‍👩‍👧';
          }
          return {
            ...acc,
            avatar,
            stars: acc.stars !== undefined ? acc.stars : 0,
            level: acc.level !== undefined ? acc.level : 1,
            completedLessons: acc.completedLessons !== undefined ? acc.completedLessons : 0,
          };
        });
      }
    } catch (e) {
      console.warn('Failed to load saved accounts', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('KIDO_ACCOUNTS_V1', JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to save accounts', e);
    }
  }, [accounts]);

  // Encrypted state persistence initialization
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const activeId = localStorage.getItem('KIDO_ACTIVE_ACCOUNT_ID') || localStorage.getItem('DINO_ACTIVE_ACCOUNT_ID');
      const savedAccountsRaw = localStorage.getItem('KIDO_ACCOUNTS_V1') || localStorage.getItem('DINO_ACCOUNTS_V1');
      let accList: UserAccount[] = [];
      if (savedAccountsRaw) {
        try {
          accList = (JSON.parse(savedAccountsRaw) as UserAccount[]).filter((acc) => !['acc-admin', 'acc-parent', 'acc-kid', 'acc-kid2'].includes(acc.id));
        } catch {}
      }

      const activeAcc = activeId ? accList.find((a) => a.id === activeId) : null;
      if (activeAcc) {
      const isNowActiveVip = Boolean(activeAcc.isVip && (!activeAcc.vipExpiryDate || new Date(activeAcc.vipExpiryDate.replace(' ', 'T')).getTime() > Date.now()));
      let secs = 300;
      if (isNowActiveVip) {
        if (activeAcc.vipExpiryDate) {
          const parsed = new Date(activeAcc.vipExpiryDate.replace(' ', 'T'));
          if (!isNaN(parsed.getTime()) && parsed > new Date()) {
            secs = Math.floor((parsed.getTime() - Date.now()) / 1000);
          } else {
            secs = activeAcc.trialTimeSeconds || 31536000;
          }
        } else {
          secs = activeAcc.trialTimeSeconds || 31536000;
        }
      } else {
        secs = activeAcc.trialTimeSeconds !== undefined && activeAcc.trialTimeSeconds <= 300 ? activeAcc.trialTimeSeconds : 300;
      }
        return {
          ...initialUserProfile,
          id: activeAcc.id,
          name: activeAcc.name,
          username: activeAcc.username,
          role: activeAcc.role,
          avatar: activeAcc.avatar || (activeAcc.role === 'admin' ? '🛡️' : activeAcc.role === 'parent' ? '👨‍👩‍👧' : '🦖'),
          stars: activeAcc.stars !== undefined ? activeAcc.stars : 0,
          level: activeAcc.level !== undefined ? activeAcc.level : 0,
          completedLessonsCount: activeAcc.completedLessons !== undefined ? activeAcc.completedLessons : 0,
          isVip: activeAcc.isVip,
          vipExpiryDate: activeAcc.vipExpiryDate,
          allowedGrades: activeAcc.allowedGrades || ['all'],
          trialTimeSeconds: secs !== undefined ? secs : initialUserProfile.trialTimeSeconds,
          checkedInToday: activeAcc.checkedInToday ?? false,
          streakDays: activeAcc.streakDays !== undefined ? activeAcc.streakDays : initialUserProfile.streakDays,
          studyTimeMinutes: activeAcc.studyTimeMinutes !== undefined ? activeAcc.studyTimeMinutes : initialUserProfile.studyTimeMinutes,
          learnedVocabCount: activeAcc.learnedVocabCount !== undefined ? activeAcc.learnedVocabCount : initialUserProfile.learnedVocabCount,
        };
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const decrypted = decryptData<UserProfile>(saved, initialUserProfile);
        return { ...initialUserProfile, ...decrypted };
      }
    } catch (e) {
      console.warn("User state read error", e);
    }
    return initialUserProfile;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [pageMedia, setPageMedia] = useState<PageMediaItem[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [menuConfig, setMenuConfig] = useState<MenuConfig>(DEFAULT_MENU_CONFIG);
  const [managedVocabulary, setManagedVocabulary] = useState<ManagedVocabularyItem[]>([]);
  useEffect(() => subscribeCustomPages(setCustomPages), []);
  useEffect(() => subscribeMenuConfig(setMenuConfig), []);
  useEffect(() => subscribeVocabularyContent(setManagedVocabulary), []);
  useEffect(() => {
    setPageMedia([]);
    return subscribePageMedia(activeTab, setPageMedia);
  }, [activeTab]);
  const [reportSubTab, setReportSubTab] = useState<'overview' | 'map' | 'parent' | 'tips'>('overview');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('KIDO_IS_LOGGED_IN') || localStorage.getItem('DINO_IS_LOGGED_IN');
      if (!saved || !JSON.parse(saved)) return false;
      const activeId = localStorage.getItem('KIDO_ACTIVE_ACCOUNT_ID') || localStorage.getItem('DINO_ACTIVE_ACCOUNT_ID');
      return Boolean(activeId && !['acc-admin', 'acc-parent', 'acc-kid', 'acc-kid2'].includes(activeId));
    } catch {
      return false;
    }
  });
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showStreakLostModal, setShowStreakLostModal] = useState<boolean>(false);
  const [lostStreakCount, setLostStreakCount] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('KIDO_IS_LOGGED_IN', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  // A saved browser flag cannot restore a session without Firebase Auth if logged in via Google.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!user.id?.startsWith('google:')) return;
    const linkedAccount = accounts.find((account) => account.id === user.id || (user.email && account.email?.toLowerCase() === user.email.toLowerCase()));
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.emailVerified) {
        setIsLoggedIn(false);
        return;
      }
      const accountEmail = linkedAccount?.email || user.email;
      if (!accountEmail || firebaseUser.email?.trim().toLowerCase() !== accountEmail.trim().toLowerCase()) {
        setIsLoggedIn(false);
        return;
      }
      if (user.role === 'admin' && !(await isTrustedAdmin(firebaseUser))) {
        if (linkedAccount?.role === 'admin') return;
        setIsLoggedIn(false);
      }
    });
  }, [isLoggedIn, user.role, user.id, user.email, accounts]);

  // Auto detect new day & broken streak
  useEffect(() => {
    if (!user.id && !user.username) return;
    const userKey = user.id || user.username || 'default';
    const todayStr = new Date().toISOString().split('T')[0];
    const lastCheckIn = localStorage.getItem('last_checkin_date_' + userKey);
    const lastNotified = localStorage.getItem('streak_lost_notified_' + userKey);

    if (lastCheckIn) {
      const d1 = new Date(lastCheckIn);
      const d2 = new Date(todayStr);
      const diffMs = d2.getTime() - d1.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));

      if (diffDays >= 2) {
        // Missed at least 1 whole day!
        const oldStreak = user.streakDays > 0 ? user.streakDays : 3;
        setLostStreakCount(oldStreak);
        setUser((prev) => ({
          ...prev,
          checkedInToday: false,
          streakDays: 0,
        }));

        if (lastNotified !== todayStr) {
          setShowStreakLostModal(true);
          localStorage.setItem('streak_lost_notified_' + userKey, todayStr);
        }
      } else if (diffDays === 1) {
        // New consecutive day! Reset checkedInToday so user can check in today
        if (user.checkedInToday) {
          setUser((prev) => ({
            ...prev,
            checkedInToday: false,
          }));
        }
      }
    }
  }, [user.id, user.username]);

  const handleSimulateNewDayLostStreak = () => {
    const oldStreak = user.streakDays > 0 ? user.streakDays : 3;
    setLostStreakCount(oldStreak);
    setUser((prev) => ({
      ...prev,
      checkedInToday: false,
      streakDays: 0,
    }));
    setShowStreakLostModal(true);
  };

  const handleSimulateLostStreakForAccount = (targetAcc: UserAccount & { previousStreak?: number }) => {
    const oldStreak = targetAcc.previousStreak || (targetAcc.streakDays && targetAcc.streakDays > 0 ? targetAcc.streakDays : 3);
    setLostStreakCount(oldStreak);
    setUser((prev) => {
      if (prev.id === targetAcc.id || prev.username === targetAcc.username) {
        return {
          ...prev,
          checkedInToday: false,
          streakDays: 0,
        };
      }
      return {
        ...prev,
        checkedInToday: false,
        streakDays: 0,
      };
    });
    setShowStreakLostModal(true);
  };

  const [lang, setLang] = useState<Language>('vi');
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  // Network status listener ("Khủng long đang ngủ")
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      audioService.playSuccessSound();
      triggerNotification('🌐 Đã khôi phục kết nối!', 'Khủng long đã thức giấc! Dữ liệu được đồng bộ trực tuyến.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      audioService.playClickSound();
      triggerNotification('💤 Khủng long đang ngủ zZz', 'Mất kết nối Internet! Bé vẫn có thể tiếp tục học tập & luyện tập ở chế độ ngoại tuyến.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // App data state
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [quizProgress, setQuizProgress] = useState<{ current: number; total: number; difficulty: string; isPlaying?: boolean }>({
    current: 1,
    total: 8,
    difficulty: 'Dễ thương 🧸',
    isPlaying: false,
  });
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [parentNotes, setParentNotes] = useState<ParentNote[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notificationsHistory, setNotificationsHistory] = useState<AppNotification[]>(() => {
    try {
      const keysToTry = [
        `KIDO_NOTIFICATIONS_V1_${user.id}`,
        `KIDO_NOTIFICATIONS_V1_${user.username}`,
      ];
      if (user.role === 'kid') keysToTry.push(`KIDO_NOTIFICATIONS_V1_user-kid`);

      for (const k of keysToTry) {
        if (!k) continue;
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading notifications history:', e);
    }
    return [
      {
        id: `notif-init-${Date.now()}`,
        title: '🎉 Đăng nhập thành công',
        message: `Chào mừng ${user.name} đến với KIDOEnglish! Hãy cùng học tập và tích lũy Sao nhé!`,
        type: 'success',
        createdAt: new Date().toISOString(),
        read: false,
        targetUserId: user.id || user.username || 'default',
      },
    ];
  });

  // Reload notification history when user account switches
  useEffect(() => {
    try {
      const keysToTry = [
        `KIDO_NOTIFICATIONS_V1_${user.id}`,
        `KIDO_NOTIFICATIONS_V1_${user.username}`,
      ];
      if (user.role === 'kid') keysToTry.push(`KIDO_NOTIFICATIONS_V1_user-kid`);

      let loaded: AppNotification[] | null = null;
      for (const k of keysToTry) {
        if (!k) continue;
        const saved = localStorage.getItem(k);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loaded = parsed;
              break;
            }
          } catch (e) {}
        }
      }

      if (loaded) {
        setNotificationsHistory(loaded);
      } else {
        setNotificationsHistory([
          {
            id: `notif-init-${Date.now()}`,
            title: '🎉 Đăng nhập thành công',
            message: `Chào mừng ${user.name} đến với KIDOEnglish!`,
            type: 'success',
            createdAt: new Date().toISOString(),
            read: false,
            targetUserId: user.id || user.username || 'default',
          },
        ]);
      }
    } catch (e) {
      console.error('Error reloading notifications:', e);
    }
  }, [user.id, user.username, user.name, user.role]);

  // Persist notification history for current logged in account
  useEffect(() => {
    try {
      if (user.id) {
        localStorage.setItem(`KIDO_NOTIFICATIONS_V1_${user.id}`, JSON.stringify(notificationsHistory));
      }
      if (user.username) {
        localStorage.setItem(`KIDO_NOTIFICATIONS_V1_${user.username}`, JSON.stringify(notificationsHistory));
      }
      if (user.role === 'kid') {
        localStorage.setItem(`KIDO_NOTIFICATIONS_V1_user-kid`, JSON.stringify(notificationsHistory));
      }
    } catch (e) {
      console.error('Error saving notifications history:', e);
    }
  }, [notificationsHistory, user.id, user.username, user.role]);

  // Sync real-time system broadcasts into notification center history (chuông thông báo)
  useEffect(() => {
    if (!systemBroadcasts || systemBroadcasts.length === 0) return;

    setNotificationsHistory((prev) => {
      let updated = [...prev];
      let hasChanges = false;

      systemBroadcasts.forEach((broadcast) => {
        if (!broadcast.isActive) return;

        const targetAudienceStr = String(broadcast.targetAudience || 'all');
        const isTargetMatch =
          targetAudienceStr === 'all' ||
          targetAudienceStr === 'all_accounts' ||
          targetAudienceStr === 'all_students' ||
          targetAudienceStr === 'online_students' ||
          broadcast.targetAccountId === user.id ||
          broadcast.targetAccountId === user.username;

        if (!isTargetMatch) return;

        const broadcastNotifId = `broadcast-${broadcast.id}`;
        const alreadyExists = updated.some(
          (n) => n.id === broadcastNotifId || (n.title === broadcast.title && n.message === broadcast.message)
        );

        if (!alreadyExists) {
          hasChanges = true;
          const notifItem: AppNotification = {
            id: broadcastNotifId,
            title: broadcast.title,
            message: broadcast.message,
            type: (broadcast.toastType as any) || (broadcast.priority === 'urgent' ? 'error' : 'broadcast'),
            createdAt: broadcast.timestamp || (broadcast.timestampMs ? new Date(broadcast.timestampMs).toISOString() : new Date().toISOString()),
            read: false,
            userId: user.id || user.username || 'default',
            targetUserId: user.id || user.username || 'default',
            actionTab: broadcast.actionTab,
          };
          updated = [notifItem, ...updated];
        }
      });

      return hasChanges ? updated.slice(0, 100) : prev;
    });
  }, [systemBroadcasts, user.id, user.username, user.role]);

  // Filter notification history so each account only sees notifications targeted to itself
  const userFilteredNotifications = useMemo(() => {
    return notificationsHistory.filter((n) => {
      const target = n.targetUserId || n.userId;
      if (target) {
        if (target === 'all') return true;
        const matchesUser =
          target === user.id ||
          target === user.username ||
          (user.role === 'kid' && (target === 'user-kid' || target === 'kid')) ||
          (user.role === 'admin' && (target === 'admin' || target === 'user-admin'));
        if (matchesUser) return true;
        return false;
      }

      // Fallback for older items without targetUserId:
      if (user.role === 'admin') {
        const msg = (n.title + ' ' + n.message).toLowerCase();
        // If the notification title/message is about updating another user (e.g., "Cao Quốc Minh"), filter it out from Admin's bell list
        if (
          msg.includes('cao quốc minh') ||
          (msg.includes('tài khoản ') && !msg.includes(`tài khoản ${user.name.toLowerCase()}`))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [notificationsHistory, user.id, user.username, user.name, user.role]);

  const unreadNotifCount = useMemo(() => {
    return userFilteredNotifications.filter((n) => !n.read).length;
  }, [userFilteredNotifications]);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotificationsHistory((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    setNotificationsHistory([]);
  }, []);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotificationsHistory((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const [vipTransactions, setVipTransactions] = useState<VipTransaction[]>(() => getLocalVipTransactions());
  const [vipDowngradeModalData, setVipDowngradeModalData] = useState<{
    isOpen: boolean;
    accountName: string;
    previousExpiry?: string;
    reason: string;
  }>({
    isOpen: false,
    accountName: '',
    previousExpiry: '',
    reason: '',
  });

  // Toast helper & Notification History Logger
  const triggerNotification = useCallback((
    title: string,
    message: string,
    type?: ToastType,
    actionTab?: string,
    targetAccountId?: string
  ) => {
    if (!notificationsEnabled) return;

    // 1. Trigger transient toast banner popup on screen for current session
    setToasts((prev) => {
      if (prev.some((t) => t.title === title && t.message === message)) {
        return prev;
      }
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, title, message, type: type || 'default' };
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
      }, 5000);
      return [newToast, ...prev];
    });

    // 2. Log persistent item to notification bell history for target user
    const targetId = targetAccountId || user.id || user.username || 'default';
    const notifItem: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      message,
      type: type || 'default',
      createdAt: new Date().toISOString(),
      read: false,
      userId: targetId,
      targetUserId: targetId,
      actionTab,
    };

    const currentUserId = user.id || user.username || 'default';
    const isTargetingCurrent =
      !targetAccountId ||
      targetAccountId === currentUserId ||
      targetAccountId === user.id ||
      targetAccountId === user.username ||
      targetAccountId === 'all';

    if (isTargetingCurrent) {
      setNotificationsHistory((prev) => {
        const isDup = prev.some(
          (n) => n.title === title && n.message === message && Date.now() - new Date(n.createdAt).getTime() < 2500
        );
        if (isDup) return prev;
        return [notifItem, ...prev].slice(0, 100);
      });
    } else {
      // Save notification specifically to targetAccountId's localStorage history!
      try {
        const targetKeys = [`KIDO_NOTIFICATIONS_V1_${targetAccountId}`];
        const matchedAcc = accounts.find((a) => a.id === targetAccountId || a.username === targetAccountId);
        if (matchedAcc) {
          if (matchedAcc.id) targetKeys.push(`KIDO_NOTIFICATIONS_V1_${matchedAcc.id}`);
          if (matchedAcc.username) targetKeys.push(`KIDO_NOTIFICATIONS_V1_${matchedAcc.username}`);
          if (matchedAcc.role === 'kid') targetKeys.push(`KIDO_NOTIFICATIONS_V1_user-kid`);
        }

        const uniqueKeys = Array.from(new Set(targetKeys));
        uniqueKeys.forEach((key) => {
          let existing: AppNotification[] = [];
          const saved = localStorage.getItem(key);
          if (saved) {
            try {
              existing = JSON.parse(saved);
            } catch (e) {}
          }
          const isDup = existing.some(
            (n) => n.title === title && n.message === message && Date.now() - new Date(n.createdAt).getTime() < 2500
          );
          if (!isDup) {
            const updated = [notifItem, ...existing].slice(0, 100);
            localStorage.setItem(key, JSON.stringify(updated));
          }
        });
      } catch (e) {
        console.error('Error saving target notification to localStorage:', e);
      }
    }
  }, [notificationsEnabled, user.id, user.username, accounts]);

  // Effect to trigger lost streak toast notification whenever Streak Lost Modal opens
  useEffect(() => {
    if (showStreakLostModal) {
      triggerNotification(
        '💔 MẤT CHUỖI HỌC TẬP!',
        `Ôi không! Chuỗi ${lostStreakCount > 0 ? lostStreakCount : 3} ngày học tập đã bị gián đoạn do quên điểm danh. Đừng nản lòng, hãy bắt đầu chuỗi mới ngay!`,
        'urgent',
        'home',
        user.id
      );
    }
  }, [showStreakLostModal, lostStreakCount, user.id, triggerNotification]);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const hasWarnedVipExpiringSoonRef = React.useRef<boolean>(false);
  const hasWarnedTrialEndingSoonRef = React.useRef<boolean>(false);

  // Synchronous real-time VIP check for instant UI locking
  const isEffectiveVip = useMemo(() => {
    if (!user.isVip) return false;
    if (!user.vipExpiryDate) return true; // Permanent VIP
    const parsed = new Date(user.vipExpiryDate.replace(' ', 'T'));
    return !isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
  }, [user.isVip, user.vipExpiryDate]);

  // Real-time immediate downgrade if VIP time passes
  useEffect(() => {
    if (user.isVip && !isEffectiveVip) {
      audioService.playClickSound();
      setUser((prev) => ({
        ...prev,
        isVip: false,
        vipExpiryDate: '',
        trialTimeSeconds: 0,
      }));
      setVipDowngradeModalData({
        isOpen: true,
        accountName: user.name,
        previousExpiry: user.vipExpiryDate,
        reason: 'Thời gian gia hạn VIP đã tự động hết hạn',
      });
      triggerNotification('⚠️ Gói VIP đã hết hạn', 'Tài khoản VIP của bạn đã hết hạn. Đã chuyển về gói Miễn Phí.');
      const existing = accounts.find((a) => a.id === user.id || (user.username && a.username === user.username));
      if (existing) {
        saveAccountToFirebase({
          ...existing,
          isVip: false,
          vipExpiryDate: '',
          trialTimeSeconds: 0,
        }).catch(() => {});
      }
    }
  }, [user.isVip, isEffectiveVip, user.name, user.vipExpiryDate, user.id, user.username, accounts]);

  // Strictly guard admin-panel access from URL parameters, hash or state injection
  useEffect(() => {
    const checkUrlTab = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab') || window.location.hash.replace('#', '');
        if (urlTab === 'admin-panel') {
          if (user.role !== 'admin') {
            setActiveTab('home');
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('tab');
              window.history.replaceState({}, '', url.pathname + url.search);
            }
          }
        }
      } catch (e) {}
    };

    checkUrlTab();
    window.addEventListener('popstate', checkUrlTab);
    window.addEventListener('hashchange', checkUrlTab);
    return () => {
      window.removeEventListener('popstate', checkUrlTab);
      window.removeEventListener('hashchange', checkUrlTab);
    };
  }, [user.role]);

  // Ensure activeTab is strictly guarded based on user role - resets to 'home' if unauthorized
  useEffect(() => {
    if (user.role !== 'admin' && activeTab === 'admin-panel') {
      setActiveTab('home');
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.get('tab') === 'admin-panel') {
            url.searchParams.delete('tab');
            window.history.replaceState({}, '', url.pathname + url.search);
          }
        } catch (e) {}
      }
    } else if (user.role === 'kid' && activeTab === 'parent-corner') {
      setActiveTab('home');
    }
  }, [user.role, activeTab]);

  // Unified high-precision timer for VIP expiry & trial countdown (updates state pure every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setUser((prev) => {
        // Active VIP User Timer logic
        if (prev.isVip) {
          if (prev.vipExpiryDate) {
            const parsed = new Date(prev.vipExpiryDate.replace(' ', 'T'));
            if (!isNaN(parsed.getTime())) {
              const remainingSecs = Math.max(0, Math.floor((parsed.getTime() - Date.now()) / 1000));
              if (remainingSecs <= 0) {
                return {
                  ...prev,
                  isVip: false,
                  vipExpiryDate: '',
                  trialTimeSeconds: 0,
                };
              }
              return { ...prev, trialTimeSeconds: remainingSecs };
            }
          }
          return prev;
        }

        // Free Trial User Timer logic
        if (prev.trialTimeSeconds <= 0) return prev; // Stay locked at 0
        const nextSecs = Math.max(0, prev.trialTimeSeconds - 1);
        return { ...prev, trialTimeSeconds: nextSecs };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Monitor VIP Expiring Soon (< 1 hour warning)
  useEffect(() => {
    if (!user.isVip || !user.vipExpiryDate) return;
    const parsed = new Date(user.vipExpiryDate.replace(' ', 'T'));
    if (isNaN(parsed.getTime())) return;
    const remainingSecs = Math.max(0, Math.floor((parsed.getTime() - Date.now()) / 1000));
    if (remainingSecs <= 3600 && remainingSecs > 0 && !hasWarnedVipExpiringSoonRef.current) {
      hasWarnedVipExpiringSoonRef.current = true;
      triggerNotification(
        '⏳ Cảnh báo VIP sắp hết hạn!',
        `Thời gian VIP của bạn còn dưới 1 giờ (${Math.ceil(remainingSecs / 60)} phút). Vui lòng gia hạn để không bị gián đoạn!`
      );
    }
  }, [user.isVip, user.vipExpiryDate, user.trialTimeSeconds, triggerNotification]);

  // Monitor Free Trial Warnings & Expiration
  useEffect(() => {
    if (user.isVip) return;

    // 1-minute remaining warning for free trial
    if (user.trialTimeSeconds === 60 && !hasWarnedTrialEndingSoonRef.current) {
      hasWarnedTrialEndingSoonRef.current = true;
      audioService.playClickSound();
      triggerNotification(
        '⚠️ Chỉ còn 1 phút dùng thử!',
        'Thời gian dùng thử 5 phút sắp kết thúc. Nâng cấp VIP để không gián đoạn trải nghiệm!'
      );
    }

    // Trial expired (reached 0)
    if (user.trialTimeSeconds === 0 && hasWarnedTrialEndingSoonRef.current) {
      hasWarnedTrialEndingSoonRef.current = false;
      audioService.playClickSound();
      triggerNotification(
        '⏳ Hết thời gian dùng thử!',
        'Thời gian 5 phút dùng thử đã hết. Vui lòng nâng cấp VIP để tiếp tục sử dụng tất cả tính năng cao cấp!'
      );
      const existing = accounts.find((a) => a.id === user.id || (user.username && a.username === user.username));
      if (existing) {
        saveAccountToFirebase({
          ...existing,
          trialTimeSeconds: 0,
        }).catch(() => {});
      }
    }
  }, [user.isVip, user.trialTimeSeconds, user.id, user.username, accounts, triggerNotification]);

  // Save state encrypted whenever user object updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, encryptData(user));
    } catch (e) {
      console.warn("Storage write error", e);
    }
  }, [user]);

  // Persist meaningful profile changes immediately. The visible VIP/free-trial
  // countdown changes every second, so checkpoint free-trial time every 30s
  // instead of turning the global sync indicator on and off every second.
  useEffect(() => {
    if (!isLoggedIn || !user.id) return;
    const existing = accounts.find((account) => account.id === user.id || (user.username && account.username === user.username));
    if (!existing) return;

    // When Firestore sends an external update for any account field, immediately sync it down to user state without overwriting Firestore
    const hasExternalUpdates =
      (existing.role && existing.role !== user.role) ||
      (existing.name && existing.name !== user.name) ||
      (existing.stars !== undefined && existing.stars !== user.stars) ||
      (existing.level !== undefined && existing.level !== user.level) ||
      (existing.isVip !== undefined && existing.isVip !== user.isVip) ||
      (existing.vipExpiryDate !== undefined && existing.vipExpiryDate !== user.vipExpiryDate) ||
      (existing.avatar && existing.avatar !== user.avatar) ||
      (existing.allowedGrades && JSON.stringify(existing.allowedGrades) !== JSON.stringify(user.allowedGrades)) ||
      (existing.streakDays !== undefined && existing.streakDays !== user.streakDays) ||
      (existing.completedLessons !== undefined && existing.completedLessons !== user.completedLessonsCount) ||
      (existing.studyTimeMinutes !== undefined && existing.studyTimeMinutes !== user.studyTimeMinutes) ||
      (existing.learnedVocabCount !== undefined && existing.learnedVocabCount !== user.learnedVocabCount);

    if (hasExternalUpdates) {
      setUser((prev) => ({
        ...prev,
        role: existing.role || prev.role,
        name: existing.name || prev.name,
        stars: existing.stars !== undefined ? existing.stars : prev.stars,
        level: existing.level !== undefined ? existing.level : prev.level,
        isVip: existing.isVip !== undefined ? existing.isVip : prev.isVip,
        vipExpiryDate: existing.vipExpiryDate !== undefined ? existing.vipExpiryDate : prev.vipExpiryDate,
        avatar: existing.avatar || prev.avatar,
        allowedGrades: existing.allowedGrades || prev.allowedGrades,
        streakDays: existing.streakDays !== undefined ? existing.streakDays : prev.streakDays,
        completedLessonsCount: existing.completedLessons !== undefined ? existing.completedLessons : prev.completedLessonsCount,
        studyTimeMinutes: existing.studyTimeMinutes !== undefined ? existing.studyTimeMinutes : prev.studyTimeMinutes,
        learnedVocabCount: existing.learnedVocabCount !== undefined ? existing.learnedVocabCount : prev.learnedVocabCount,
      }));
      return;
    }

    const checkpointTrialSeconds = user.isVip
      ? existing.trialTimeSeconds
      : user.trialTimeSeconds <= 0
        ? 0
        : Math.floor(user.trialTimeSeconds / 30) * 30;
    const profilePatch = {
      name: user.name, username: user.username || existing.username, role: user.role, avatar: user.avatar,
      stars: user.stars, level: user.level, completedLessons: user.completedLessonsCount,
      isVip: user.isVip, vipExpiryDate: user.vipExpiryDate, allowedGrades: user.allowedGrades,
      trialTimeSeconds: checkpointTrialSeconds, checkedInToday: user.checkedInToday,
      streakDays: user.streakDays, studyTimeMinutes: user.studyTimeMinutes,
      learnedVocabCount: user.learnedVocabCount,
    };
    const hasChanges = Object.entries(profilePatch).some(([key, value]) => JSON.stringify(existing[key as keyof UserAccount]) !== JSON.stringify(value));
    if (!hasChanges) return;
    const timer = window.setTimeout(() => {
      saveAccountToFirebase({
        ...existing,
        ...profilePatch,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn, user, accounts]);

  useEffect(() => {
    const flush = () => { flushPendingSyncQueue().catch(() => {}); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // 100% Real Leaderboard sync from actual student accounts
  useEffect(() => {
    const kidAccounts = accounts.filter((a) => a.role === 'kid');
    if (isLoggedIn && user.role === 'kid') {
      const exists = kidAccounts.some((a) => a.name === user.name || a.username === user.username);
      if (!exists) {
        kidAccounts.push({
          id: user.id || user.username || 'unknown',
          username: user.username || user.name,
          passwordHash: '',
          role: 'kid',
          name: user.name,
          avatar: user.avatar,
          vipExpiryDate: '',
          isVip: false,
          createdAt: new Date().toISOString(),
          stars: user.stars,
        });
      }
    }

    const sorted = [...kidAccounts].sort((a, b) => (b.stars || 0) - (a.stars || 0));
    const realLb: LeaderboardUser[] = sorted.map((acc, index) => ({
      rank: index + 1,
      name: acc.name || acc.username,
      avatar: (acc.name === user.name || acc.username === user.username) ? user.avatar : (acc.avatar || '🦖'),
      points: (acc.name === user.name || acc.username === user.username) ? user.stars : (acc.stars || 0),
    }));

    setLeaderboard(realLb);
  }, [accounts, user.stars, user.name, user.avatar, user.role, user.username, user.id, isLoggedIn]);

  // Synchronize active user data with accounts list in real time
  const handleUpdateAccounts = (newAccounts: UserAccount[]) => {
    const syncedAccounts = syncLinkedAccounts(newAccounts);

    // Update React state synchronously and immediately
    setAccounts(syncedAccounts);

    try {
      localStorage.setItem('KIDO_ACCOUNTS_V1', JSON.stringify(syncedAccounts));
    } catch {
      // ignore
    }

    saveAllAccountsToFirebase(syncedAccounts).catch(() => {});

    // Detect deleted account IDs to delete from Firestore asynchronously
    const currentIds = new Set<string>(accounts.map((a) => a.id));
    const nextIds = new Set<string>(syncedAccounts.map((a) => a.id));
    for (const oldId of currentIds) {
      if (!nextIds.has(oldId)) {
        deleteAccountFromFirebase(oldId).catch(() => {});
      }
    }

    const activeAcc = syncedAccounts.find(
      (a) =>
        (user.id && a.id === user.id) ||
        (user.username && a.username && a.username.toLowerCase() === user.username.toLowerCase()) ||
        (user.name && a.name && a.name.toLowerCase() === user.name.toLowerCase() && a.role === user.role)
    );
    if (activeAcc) {
      const isNowActiveVip = Boolean(activeAcc.isVip && (!activeAcc.vipExpiryDate || new Date(activeAcc.vipExpiryDate.replace(' ', 'T')).getTime() > Date.now()));
      let currentSeconds = 300;
      if (isNowActiveVip) {
        if (activeAcc.vipExpiryDate) {
          const parsed = new Date(activeAcc.vipExpiryDate.replace(' ', 'T'));
          if (!isNaN(parsed.getTime()) && parsed > new Date()) {
            currentSeconds = Math.floor((parsed.getTime() - Date.now()) / 1000);
          } else {
            currentSeconds = activeAcc.trialTimeSeconds || 31536000;
          }
        } else {
          currentSeconds = activeAcc.trialTimeSeconds || 31536000;
        }
      } else {
        currentSeconds = activeAcc.trialTimeSeconds !== undefined && activeAcc.trialTimeSeconds <= 300 ? activeAcc.trialTimeSeconds : 300;
      }

      setUser((prev) => ({
        ...prev,
        id: activeAcc.id || prev.id,
        name: activeAcc.name || prev.name,
        username: activeAcc.username || prev.username,
        role: activeAcc.role || prev.role,
        stars: activeAcc.stars !== undefined ? Number(activeAcc.stars) : prev.stars,
        level: activeAcc.level !== undefined ? Number(activeAcc.level) : prev.level,
        xp: activeAcc.xp !== undefined ? Number(activeAcc.xp) : prev.xp,
        streakDays: activeAcc.streakDays !== undefined ? Number(activeAcc.streakDays) : prev.streakDays,
        avatar: activeAcc.avatar || prev.avatar,
        isVip: activeAcc.isVip ?? prev.isVip,
        vipExpiryDate: activeAcc.vipExpiryDate ?? prev.vipExpiryDate,
        allowedGrades: activeAcc.allowedGrades ?? prev.allowedGrades,
        trialTimeSeconds: currentSeconds !== undefined ? currentSeconds : prev.trialTimeSeconds,
        linkedKidIds: activeAcc.linkedKidIds || [],
        linkedParentIds: activeAcc.linkedParentIds || [],
        pendingParentRequests: activeAcc.pendingParentRequests || [],
      }));
    }
  };

  const handleAddStars = (amount: number, reason?: string) => {
    let levelUpNewLevel: number | null = null;
    let starsAwarded = false;

    if (amount > 0) {
      recordStudentActivityToFirebase({
        studentId: user.id || user.username || user.name || 'default',
        studentName: user.name,
        type: 'star_awarded',
        title: `Nhận thưởng +${amount} ⭐`,
        subtitle: reason || 'Hoàn thành bài tập & thử thách học tập',
        starsEarned: amount,
        icon: '⭐',
        badge: `+${amount} Sao`,
      });
    }

    setUser((prev) => {
      const newStars = Math.max(0, prev.stars + amount);
      const currentLvl = prev.level !== undefined && prev.level >= 0 ? prev.level : 0;
      const currentXp = prev.xp !== undefined ? prev.xp : 0;
      let newXp = currentXp + amount;
      let newLvl = currentLvl;
      let reqXp = getStarsRequiredForLevel(newLvl);

      while (newXp >= reqXp && reqXp > 0) {
        newXp -= reqXp;
        newLvl += 1;
        reqXp = getStarsRequiredForLevel(newLvl);
      }

      if (newLvl > prev.level) {
        levelUpNewLevel = newLvl;
      } else if (amount > 0) {
        starsAwarded = true;
      }
      return { ...prev, stars: newStars, level: newLvl, xp: newXp };
    });

    if (levelUpNewLevel !== null) {
      const newLvl = levelUpNewLevel;
      audioService.playSuccessSound();
      triggerConfetti('levelUp');
      triggerNotification('🎉 LÊN CẤP ĐỘ MỚI!', `Chúc mừng bé đã đạt Cấp độ ${newLvl}!`);
    } else if (starsAwarded) {
      triggerConfetti('starsAwarded');
    }

    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        const isMatch = (acc.id && user.id && acc.id === user.id) ||
          (acc.username && user.username && acc.username.toLowerCase() === user.username.toLowerCase()) ||
          (acc.role === user.role && acc.name === user.name);
        if (isMatch) {
          const newStars = Math.max(0, (acc.stars || 0) + amount);
          const currentLvl = acc.level !== undefined && acc.level >= 0 ? acc.level : 0;
          const currentXp = acc.xp !== undefined ? acc.xp : 0;
          let newXp = currentXp + amount;
          let newLvl = currentLvl;
          let reqXp = getStarsRequiredForLevel(newLvl);

          while (newXp >= reqXp && reqXp > 0) {
            newXp -= reqXp;
            newLvl += 1;
            reqXp = getStarsRequiredForLevel(newLvl);
          }

          const updatedAcc = {
            ...acc,
            stars: newStars,
            level: newLvl,
            xp: newXp,
          };
          saveAccountToFirebase(updatedAcc);
          return updatedAcc;
        }
        return acc;
      })
    );
  };

  const handleAddStarsToAccount = (accountId: string, amount: number) => {
    const target = accounts.find((a) => a.id === accountId || a.username === accountId);
    if (!target) return;

    const currentStars = target.stars || 0;
    const nextStars = Math.max(0, currentStars + amount);
    const nextLevel = target.level !== undefined ? target.level : 1;

    const updated = {
      ...target,
      stars: nextStars,
      level: nextLevel,
    };

    const newAccounts = accounts.map((a) => (a.id === target.id ? updated : a));
    handleUpdateAccounts(newAccounts);
    saveAccountToFirebase(updated);

    // If target is currently logged in user, update user state
    setUser((prev) => {
      const isUserMatch =
        (target.username && prev.username === target.username) ||
        (target.name && prev.name === target.name && target.role === prev.role) ||
        target.id === 'user-kid';

      if (isUserMatch) {
        return {
          ...prev,
          stars: nextStars,
          level: nextLevel,
        };
      }
      return prev;
    });

    const actionText = amount >= 0 ? `+${amount} Sao` : `${amount} Sao`;
    triggerNotification(
      '⭐ Cộng Sao thành công',
      `Tài khoản ${target.name} hiện có ${nextStars} Sao!`,
      'stars',
      undefined,
      target.id
    );
  };

  const handleCompleteLesson = (lessonTitle: string, unitTitle?: string, gradeNumber?: number) => {
    const nextCompleted = (user.completedLessonsCount || 0) + 1;
    setUser((prev) => ({
      ...prev,
      completedLessonsCount: nextCompleted,
    }));

    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        const isMatch = (acc.id && user.id && acc.id === user.id) ||
          (acc.username && user.username && acc.username.toLowerCase() === user.username.toLowerCase()) ||
          (acc.role === user.role && acc.name === user.name);
        if (isMatch) {
          const updated = {
            ...acc,
            completedLessons: nextCompleted,
          };
          saveAccountToFirebase(updated);
          return updated;
        }
        return acc;
      })
    );

    recordStudentActivityToFirebase({
      studentId: user.id || user.username || user.name || 'default',
      studentName: user.name,
      type: 'lesson_completed',
      title: `Hoàn thành bài: ${lessonTitle}`,
      subtitle: unitTitle || `Bài học khối Lớp ${gradeNumber || 1}`,
      starsEarned: 2,
      lessonName: lessonTitle,
      unitName: unitTitle,
      grade: gradeNumber,
      icon: '📚',
      badge: 'Bài học',
    });

    handleAddStars(2, `Hoàn thành bài học "${lessonTitle}"`);
    triggerNotification('🎉 Hoàn thành bài học!', `Bé đã hoàn thành "${lessonTitle}" và nhận +2 Sao thưởng ⭐!`);
  };

  const handleExtendVip = (
    accountId: string,
    amount: number,
    unit: 'minute' | 'day' | 'week' | 'month' | 'year' = 'month',
    customNote?: string
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;

    const nowStr = new Date().toLocaleString('sv-SE').replace('T', ' ');

    if (amount === 0) {
      // Hủy VIP
      const updatedList = accounts.map((a) => {
        if (
          a.id === accountId ||
          (target.linkedKidIds || []).includes(a.id) ||
          (target.linkedParentIds || []).includes(a.id)
        ) {
          return {
            ...a,
            isVip: false,
            vipExpiryDate: '',
            trialTimeSeconds: 0,
          };
        }
        return a;
      });
      handleUpdateAccounts(updatedList);

      const newTx: VipTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: nowStr,
        adminName: user.role === 'admin' ? user.name : 'Quản Trị Viên (Admin)',
        adminUsername: user.username || 'admin',
        targetAccountId: target.id,
        targetAccountName: target.name,
        action: 'cancel',
        amountText: 'Hủy gói VIP',
        previousExpiry: target.vipExpiryDate || 'Chưa có VIP',
        newExpiry: 'Đã hủy (Gói Miễn phí)',
        note: customNote || 'Hủy gói VIP bởi Admin',
      };
      saveVipTransactionToFirebase(newTx);
      setVipTransactions((prev) => [newTx, ...prev]);

      // Record Audit Log
      logAccountChange({
        actionType: 'vip',
        actionTitle: '❌ Hủy gói VIP',
        targetAccountId: target.id,
        targetAccountName: target.name,
        targetAccountRole: target.role,
        oldValue: target.vipExpiryDate || (target.isVip ? 'VIP PRO' : 'Miễn phí'),
        newValue: 'Đã hủy (Gói Miễn phí)',
        details: customNote || `Admin đã chuyển tài khoản ${target.name} về gói Miễn Phí (đồng bộ các TK liên kết).`,
        affectedAccountsDetails: updatedList
          .filter(
            (a) =>
              a.id === accountId ||
              (target.linkedKidIds || []).includes(a.id) ||
              (target.linkedParentIds || []).includes(a.id)
          )
          .map((a) => ({
            id: a.id,
            name: a.name,
            username: a.username,
            role: a.role,
            oldValue: target.vipExpiryDate || (target.isVip ? 'VIP PRO' : 'Miễn phí'),
            newValue: 'Đã hủy (Gói Miễn phí)',
            details: 'Hủy VIP ➔ Miễn phí (Đồng bộ PH-HS)',
          })),
      });

      setUser((prev) => {
        const isUserMatch =
          (target.username && prev.username === target.username) ||
          (target.name && prev.name === target.name) ||
          accountId === 'user-kid' ||
          target.id === 'user-kid' ||
          prev.role === target.role;

        if (isUserMatch) {
          return {
            ...prev,
            isVip: false,
            vipExpiryDate: '',
            trialTimeSeconds: 0,
          };
        }
        return prev;
      });

      triggerNotification(
        'FREE Đã chuyển về tài khoản Miễn phí',
        `Tài khoản ${target.name} đã chuyển về Miễn phí với 5 phút dùng thử!`,
        'vip',
        undefined,
        target.id
      );
      return;
    }

    let baseDate = new Date();
    if (target.vipExpiryDate) {
      const parsed = new Date(target.vipExpiryDate.replace(' ', 'T'));
      if (!isNaN(parsed.getTime())) {
        baseDate = parsed;
      }
    }

    const res = new Date(baseDate.getTime());
    if (unit === 'minute') res.setMinutes(res.getMinutes() + amount);
    else if (unit === 'day') res.setDate(res.getDate() + amount);
    else if (unit === 'week') res.setDate(res.getDate() + amount * 7);
    else if (unit === 'month') res.setMonth(res.getMonth() + amount);
    else if (unit === 'year') res.setFullYear(res.getFullYear() + amount);

    const isStillVip = res.getTime() > Date.now();
    const yyyy = res.getFullYear();
    const mm = String(res.getMonth() + 1).padStart(2, '0');
    const dd = String(res.getDate()).padStart(2, '0');
    const hh = String(res.getHours()).padStart(2, '0');
    const min = String(res.getMinutes()).padStart(2, '0');
    const newExpiry = isStillVip ? `${yyyy}-${mm}-${dd} ${hh}:${min}` : '';

    const newTrialSeconds = Math.max(0, Math.floor((res.getTime() - Date.now()) / 1000));

    const updatedList = accounts.map((a) => {
      if (
        a.id === accountId ||
        (target.linkedKidIds || []).includes(a.id) ||
        (target.linkedParentIds || []).includes(a.id)
      ) {
        return {
          ...a,
          isVip: isStillVip,
          vipExpiryDate: newExpiry,
          trialTimeSeconds: newTrialSeconds,
        };
      }
      return a;
    });

    handleUpdateAccounts(updatedList);

    const unitLabel = unit === 'minute' ? 'phút' : unit === 'day' ? 'ngày' : unit === 'week' ? 'tuần' : unit === 'month' ? 'tháng' : 'năm';
    const amountText = `${amount > 0 ? '+' : ''}${amount} ${unitLabel}`;
    const actionType: 'add' | 'subtract' = amount > 0 ? 'add' : 'subtract';

    const affectedAccountsDetails = updatedList
      .filter(
        (a) =>
          a.id === accountId ||
          (target.linkedKidIds || []).includes(a.id) ||
          (target.linkedParentIds || []).includes(a.id)
      )
      .map((a) => ({
        id: a.id,
        name: a.name,
        username: a.username,
        role: a.role,
        previousExpiry: target.vipExpiryDate || 'Chưa có VIP',
        newExpiry: a.isVip ? (a.vipExpiryDate || 'VIP PRO') : 'Hết hạn (Miễn phí)',
        relationship: a.id === target.id ? 'Tài khoản chính' : (a.role === 'parent' ? 'Phụ huynh liên kết' : 'Học sinh liên kết'),
      }));

    const newTx: VipTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowStr,
      adminName: user.role === 'admin' ? user.name : 'Quản Trị Viên (Admin)',
      adminUsername: user.username || 'admin',
      targetAccountId: target.id,
      targetAccountName: target.name,
      action: actionType,
      amountText: amountText,
      previousExpiry: target.vipExpiryDate || 'Chưa có VIP',
      newExpiry: newExpiry || 'Hết hạn (Miễn phí)',
      note: customNote || (amount > 0 ? `Cộng ${amount} ${unitLabel} VIP` : `Trừ ${Math.abs(amount)} ${unitLabel} VIP`),
      affectedAccountsDetails: affectedAccountsDetails,
    };
    saveVipTransactionToFirebase(newTx);
    setVipTransactions((prev) => [newTx, ...prev]);

    // Record Audit Log
    logAccountChange({
      actionType: 'vip',
      actionTitle: amount > 0 ? '👑 Gia hạn / Cộng VIP PRO' : '🔻 Trừ thời gian VIP',
      targetAccountId: target.id,
      targetAccountName: target.name,
      targetAccountRole: target.role,
      oldValue: target.vipExpiryDate || (target.isVip ? 'VIP PRO' : 'Miễn phí'),
      newValue: newExpiry || 'Hết hạn (Miễn phí)',
      details: customNote || `Admin đã ${amount > 0 ? 'cộng' : 'trừ'} ${Math.abs(amount)} ${unitLabel} VIP cho ${target.name} (Đồng bộ các TK liên kết). Hạn mới: ${newExpiry || 'Miễn phí'}`,
      affectedAccountsDetails: updatedList
        .filter(
          (a) =>
            a.id === accountId ||
            (target.linkedKidIds || []).includes(a.id) ||
            (target.linkedParentIds || []).includes(a.id)
        )
        .map((a) => ({
          id: a.id,
          name: a.name,
          username: a.username,
          role: a.role,
          oldValue: target.vipExpiryDate || (target.isVip ? 'VIP PRO' : 'Miễn phí'),
          newValue: a.isVip ? (a.vipExpiryDate || 'VIP PRO') : 'Miễn phí',
          details: `${amountText} • Hạn mới: ${a.vipExpiryDate || 'Miễn phí'}`,
        })),
    });

    // Immediately update logged in user state if account matches
    setUser((prev) => {
      const isUserMatch =
        (target.username && prev.username === target.username) ||
        (target.name && prev.name === target.name) ||
        accountId === 'user-kid' ||
        target.id === 'user-kid' ||
        prev.role === target.role;

      if (isUserMatch) {
        return {
          ...prev,
          isVip: isStillVip,
          vipExpiryDate: newExpiry,
          trialTimeSeconds: newTrialSeconds,
        };
      }
      return prev;
    });

    const unitText =
      unit === 'minute' ? 'phút' : unit === 'day' ? 'ngày' : unit === 'week' ? 'tuần' : unit === 'month' ? 'tháng' : 'năm';
    
    const actionTitle = amount > 0 ? '⭐ Gia hạn VIP thành công!' : '🔻 Giảm VIP thành công!';
    const actionDesc = amount > 0
      ? `Tài khoản ${target.name} đã được gia hạn thêm +${amount} ${unitText} (Hạn mới: ${newExpiry})!`
      : `Tài khoản ${target.name} đã bị trừ -${Math.abs(amount)} ${unitText} (${isStillVip ? 'Hạn mới: ' + newExpiry : 'Đã hết hạn VIP'})!`;

    triggerNotification(actionTitle, actionDesc, 'vip', undefined, target.id);
  };

  const handleSwitchAccount = (account: UserAccount) => {
    // Check for duplicate username or email across other existing accounts
    const trimmedUsername = account.username ? account.username.trim().toLowerCase() : '';
    const trimmedEmail = account.email ? account.email.trim().toLowerCase() : '';

    const isDuplicateUsername = trimmedUsername
      ? accounts.some((a) => a.id !== account.id && a.username && a.username.trim().toLowerCase() === trimmedUsername)
      : false;
    const isDuplicateEmail = trimmedEmail
      ? accounts.some((a) => a.id !== account.id && a.email && a.email.trim().toLowerCase() === trimmedEmail)
      : false;

    if (isDuplicateUsername || isDuplicateEmail) {
      audioService.playErrorSound();
      const dupMsg = isDuplicateUsername
        ? `Tên người dùng "@${account.username}" bị phát hiện trùng lặp với một tài khoản khác trong hệ thống!`
        : `Địa chỉ email "${account.email}" đã được đăng ký bởi tài khoản khác trong hệ thống!`;

      triggerNotification('⚠️ Trùng lặp thông tin tài khoản', dupMsg, 'urgent');
      return;
    }

    try {
      localStorage.setItem('KIDO_ACTIVE_ACCOUNT_ID', account.id);
    } catch (e) {
      console.warn('Failed to save active account ID', e);
    }

    recordUserLogin(account);

    const isNowActiveVip = Boolean(account.isVip && (!account.vipExpiryDate || new Date(account.vipExpiryDate.replace(' ', 'T')).getTime() > Date.now()));
    let secs = 300;
    if (isNowActiveVip) {
      if (account.vipExpiryDate) {
        const parsed = new Date(account.vipExpiryDate.replace(' ', 'T'));
        if (!isNaN(parsed.getTime()) && parsed > new Date()) {
          secs = Math.floor((parsed.getTime() - Date.now()) / 1000);
        } else {
          secs = account.trialTimeSeconds || 31536000;
        }
      } else {
        secs = account.trialTimeSeconds || 31536000;
      }
    } else {
      secs = account.trialTimeSeconds !== undefined && account.trialTimeSeconds <= 300 ? account.trialTimeSeconds : 300;
    }

    setUser((prev) => ({
      ...prev,
      id: account.id,
      name: account.name,
      username: account.username,
      role: account.role,
      avatar: account.avatar || (account.role === 'admin' ? '🛡️' : account.role === 'parent' ? '👨‍👩‍👧' : '🎒'),
      stars: account.stars !== undefined ? account.stars : 0,
      level: account.level !== undefined ? account.level : 0,
      completedLessonsCount: account.completedLessons !== undefined ? account.completedLessons : 0,
      isVip: account.isVip,
      vipExpiryDate: account.vipExpiryDate,
      allowedGrades: account.allowedGrades || ['all'],
      trialTimeSeconds: secs !== undefined ? secs : prev.trialTimeSeconds,
      checkedInToday: account.checkedInToday ?? false,
      streakDays: account.streakDays !== undefined ? account.streakDays : prev.streakDays,
      studyTimeMinutes: account.studyTimeMinutes !== undefined ? account.studyTimeMinutes : prev.studyTimeMinutes,
      learnedVocabCount: account.learnedVocabCount !== undefined ? account.learnedVocabCount : prev.learnedVocabCount,
    }));
    triggerNotification('🔄 Đã chuyển tài khoản', `Đang xem ứng dụng với quyền ${account.role === 'admin' ? 'Admin' : account.role === 'parent' ? 'Phụ Huynh' : 'Học Sinh'}`);
    if (account.role === 'admin') {
      setActiveTab('admin-panel');
    } else if (account.role === 'parent') {
      setActiveTab('parent-corner');
    } else {
      setActiveTab('home');
    }
  };

  const handleClaimCheckIn = () => {
    if (user.checkedInToday) return;
    audioService.playSuccessSound();
    
    setUser((prev) => {
      const newStreak = (prev.streakDays || 0) + 1;
      const updatedUser = { 
        ...prev, 
        checkedInToday: true,
        streakDays: newStreak,
      };

      const todayStr = new Date().toISOString().split('T')[0];
      const userKey = prev.id || prev.username || 'default';
      try {
        localStorage.setItem('last_checkin_date_' + userKey, todayStr);
      } catch {}

      // Save check-in status & streak specifically to the currently logged in account
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          const isMatch = (acc.id && prev.id && acc.id === prev.id) ||
            (acc.username && prev.username && acc.username.toLowerCase() === prev.username.toLowerCase()) ||
            (acc.role === prev.role && acc.name === prev.name);
          if (isMatch) {
            const updatedAcc = { 
              ...acc, 
              checkedInToday: true,
              streakDays: newStreak,
            };
            saveAccountToFirebase(updatedAcc);
            return updatedAcc;
          }
          return acc;
        })
      );
      
      return updatedUser;
    });

    // Award exactly +5 Stars and +5 XP
    handleAddStars(5, 'Điểm danh chuyên cần mỗi ngày');
  };

  const handleClaimTask = (taskId: string) => {
    setDailyTasks((prev) => {
      const targetTask = prev.find((t) => t.id === taskId);
      if (!targetTask || targetTask.claimed || targetTask.current < targetTask.target) {
        return prev;
      }

      const updatedTasks = prev.map((t) => (t.id === taskId ? { ...t, claimed: true } : t));
      debouncedSaveDailyTasks(updatedTasks, 500, user.id || user.username || 'anonymous');
      handleAddStars(targetTask.rewardStars, `Nhiệm vụ: ${targetTask.title}`);
      audioService.playSuccessSound();
      triggerNotification('✅ Hoàn thành nhiệm vụ!', `Bé đã hoàn thành "${targetTask.title}" và nhận +${targetTask.rewardStars} Sao!`);
      return updatedTasks;
    });
  };

  const handleClaimAllTasks = () => {
    setDailyTasks((prev) => {
      const claimable = prev.filter((t) => !t.claimed && t.current >= t.target);
      if (claimable.length === 0) return prev;

      let totalStars = 0;
      const updatedTasks = prev.map((t) => {
        if (!t.claimed && t.current >= t.target) {
          totalStars += t.rewardStars;
          return { ...t, claimed: true };
        }
        return t;
      });

      // Debounced batch update for all claimed tasks in Firestore (500ms window)
      debouncedSaveDailyTasks(updatedTasks, 500, user.id || user.username || 'anonymous');

      handleAddStars(totalStars);
      audioService.playSuccessSound();
      triggerNotification(
        '🎉 Hoàn thành tất cả nhiệm vụ!',
        `Bé đã nhận tất cả phần thưởng (+${totalStars} Sao)!`
      );

      return updatedTasks;
    });
  };

  const handleUnlockReward = (rewardId: string, cost: number) => {
    if (user.stars < cost) return;
    handleAddStars(-cost);
    setRewards((prev) =>
      prev.map((r) => {
        if (r.id === rewardId) {
          const updated = { ...r, unlocked: true };
          saveRewardToFirebase(updated);
          return updated;
        }
        return r;
      })
    );
    triggerNotification('🎁 Đổi quà thành công!', 'Vật phẩm đã được mở khóa trong tủ đồ của bé!');
  };

  const handleAddParentNote = (note: ParentNote) => {
    setParentNotes((prev) => [note, ...prev]);
    saveParentNoteToFirebase(note);
    triggerNotification('💬 Lời nhắn mới từ Phụ Huynh', `Phụ huynh (${note.from}): "${note.content}"`);
  };

  // Render view router based on activeTab
  const renderMainContent = () => {
    if (activeTab.startsWith('custom-')) {
      const page = customPages.find((entry) => entry.id === activeTab && entry.enabled);
      if (!page) return <section className="rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-2xl font-black">Trang không tồn tại</h1></section>;
      return <section className="min-h-[20rem] rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-5 text-4xl">{page.icon}</div><h1 className="text-3xl font-black text-slate-900">{page.title}</h1>
        {page.description && <p className="mt-3 whitespace-pre-wrap text-slate-600">{page.description}</p>}
      </section>;
    }
    if (activeTab === 'admin-panel') {
      if (user.role !== 'admin') {
        // Absolute refusal to render AdminDashboard & redirect/reset to 'home'
        setTimeout(() => setActiveTab('home'), 0);
        return (
          <Dashboard
            user={user}
            units={sampleUnits}
            setActiveTab={setActiveTab}
            onOpenReportModal={() => setActiveTab('reports')}
          />
        );
      }
      return (
        <div className="space-y-4 min-w-0">
        <DriveMediaAdmin />
        <React.Suspense fallback={<p className="p-4 text-slate-600">Đang tải trang quản trị…</p>}><AdminDashboard
          currentUser={user}
          accounts={accounts}
          vipTransactions={vipTransactions}
          vipPromotion={vipPromotion}
          onSaveVipPromotion={(p) => saveVipPromotionToFirebase(p)}
          onUpdateAccounts={handleUpdateAccounts}
          onAddStarsToAccount={handleAddStarsToAccount}
          onExtendVip={handleExtendVip}
          onSwitchToUser={handleSwitchAccount}
          onTriggerNotification={triggerNotification}
        /></React.Suspense>
        </div>
      );
    }

    if (activeTab === 'home') {
      return (
        <Dashboard
          user={user}
          units={sampleUnits}
          setActiveTab={setActiveTab}
          onOpenReportModal={() => setActiveTab('reports')}
        />
      );
    }

    if (activeTab === 'roadmap') {
      return (
        <RoadmapView
          user={user}
          setActiveTab={setActiveTab}
          onAddStars={handleAddStars}
          onBack={() => setActiveTab('grade-1')}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
        />
      );
    }

    if (activeTab === 'listening-speaking-img') {
      return (
        <ImageListeningSpeakingView
          key="listening-speaking-img"
          user={user}
          onBack={() => setActiveTab('home')}
          onAddStars={handleAddStars}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab === 'reading-writing-img') {
      return (
        <ImageReadingWritingView
          key="reading-writing-img"
          user={user}
          onBack={() => setActiveTab('home')}
          onAddStars={handleAddStars}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab.startsWith('grade-')) {
      const gradeNum = parseInt(activeTab.replace('grade-', ''), 10) || 1;
      return (
        <GradeView
          gradeNumber={gradeNum}
          user={user}
          setActiveTab={setActiveTab}
          onAddStars={handleAddStars}
          onBack={() => setActiveTab('home')}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
          onCompleteLesson={handleCompleteLesson}
        />
      );
    }

    if (activeTab === 'speaking-topic-ai') {
      return (
        <TopicSpeakingAIView
          key="speaking-topic-ai"
          user={user}
          onBack={() => setActiveTab('home')}
          onAddStars={handleAddStars}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab === 'writing-topic-ai') {
      return (
        <TopicWritingAIView
          key="writing-topic-ai"
          user={user}
          onBack={() => setActiveTab('home')}
          onAddStars={handleAddStars}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab === 'practice-ex') {
      return (
        <PracticeExerciseView
          user={user}
          onBack={() => setActiveTab('home')}
          onAddStars={handleAddStars}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab === 'sample-exams') {
      return (
        <SampleExamsView
          onAddStars={handleAddStars}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab === 'reports') {
      return (
        <ReportView
          user={user}
          setActiveTab={(tab: string) => setActiveTab(tab as ActiveTab)}
          reportSubTab={reportSubTab}
          setReportSubTab={setReportSubTab}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
        />
      );
    }

    if (activeTab === 'flashcards') {
      return (
        <FlashCardView
          user={user}
          setActiveTab={setActiveTab}
          onAddStars={handleAddStars}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
        />
      );
    }

    if (activeTab === 'quiz') {
      return (
        <QuizView
          user={user}
          setActiveTab={setActiveTab}
          onAddStars={handleAddStars}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
          onQuizProgressChange={setQuizProgress}
        />
      );
    }

    if (['vocab', 'flashcards', 'quiz', 'listening', 'speaking', 'story', 'reading', 'daily-quotes', 'grammar-tenses'].includes(activeTab)) {
      return (
        <SkillPracticeView
          key={activeTab}
          initialSubTab={activeTab}
          vocabList={managedVocabulary}
          onAddStars={handleAddStars}
          user={user}
          setActiveTab={setActiveTab}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
        />
      );
    }

    if (['mind-thinking', 'shadowing', 'storyboard-shadowing', 'dictation', 'task-station', 'video-lectures'].includes(activeTab)) {
      return (
        <LinearMindmapView
          key={activeTab}
          initialTab={activeTab}
          onAddStars={handleAddStars}
          user={user}
          onBack={() => setActiveTab('home')}
          onLogout={() => {
            audioService.playClickSound();
            setShowLogoutModal(true);
          }}
        />
      );
    }

    if (activeTab === 'games' || activeTab === 'rewards') {
      return (
        <GamesAndRewardsView
          initialTab={activeTab === 'rewards' ? 'rewards' : 'games'}
          stars={user.stars}
          rewards={rewards}
          onUnlockReward={handleUnlockReward}
        />
      );
    }

    if (activeTab === 'journal') {
      return (
        <JournalView
          user={user}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab === 'theme-settings') {
      return (
        <ThemeView
          onGoHome={() => setActiveTab('home')}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab === 'settings') {
      return (
        <SettingsView
          userAvatar={user.avatar}
          setUserAvatar={(avatarUrl) => {
            setUser((prev) => ({ ...prev, avatar: avatarUrl }));
            setAccounts((prevAccounts) =>
              prevAccounts.map((acc) => {
                if (
                  (user.id && acc.id === user.id) ||
                  (acc.role === user.role && (acc.name === user.name || acc.username === user.username))
                ) {
                  const updated = { ...acc, avatar: avatarUrl };
                  saveAccountToFirebase(updated);
                  return updated;
                }
                return acc;
              })
            );
          }}
          onTriggerNotification={triggerNotification}
        />
      );
    }

    if (activeTab === 'parent-corner') {
      if (user.role === 'kid') {
        return (
          <Dashboard
            user={user}
            units={sampleUnits}
            setActiveTab={setActiveTab}
            onOpenReportModal={() => setActiveTab('reports')}
          />
        );
      }
      return (
        <ParentCornerView
          user={user}
          accounts={accounts}
          onUpdateAccounts={handleUpdateAccounts}
          onTriggerNotification={triggerNotification}
          onLogout={() => {
            signOut(auth).catch(console.error);
            setIsLoggedIn(false);
            triggerNotification('🔒 Đã đăng xuất', 'Bạn có thể quay lại bất kỳ lúc nào!');
          }}
        />
      );
    }

    // Default Fallback: Dashboard
    return (
      <Dashboard
        user={user}
        units={sampleUnits}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setActiveTab('reports')}
      />
    );
  };

  // Find current active student account for pending linking requests
  const currentStudentAccount = accounts.find(
    (a) => a.role === 'kid' && user.role === 'kid' && (a.name === user.name || a.username === user.username)
  );
  const pendingLinkRequests = currentStudentAccount?.pendingParentRequests || [];

  const handleAcceptParentLink = (req: { parentId: string; parentName: string; parentEmail?: string }) => {
    if (!currentStudentAccount) return;
    audioService.playSuccessSound();

    const updatedStudent: UserAccount = {
      ...currentStudentAccount,
      linkedParentIds: Array.from(new Set([...(currentStudentAccount.linkedParentIds || []), req.parentId])),
      pendingParentRequests: (currentStudentAccount.pendingParentRequests || []).filter((r) => r.parentId !== req.parentId),
    };

    const parentAcc = accounts.find((a) => a.id === req.parentId);
    let updatedParent: UserAccount | null = null;
    if (parentAcc) {
      updatedParent = {
        ...parentAcc,
        linkedKidIds: Array.from(new Set([...(parentAcc.linkedKidIds || []), currentStudentAccount.id])),
      };
    }

    const updatedAccounts = accounts.map((a) => {
      if (a.id === currentStudentAccount.id) return updatedStudent;
      if (updatedParent && a.id === parentAcc?.id) return updatedParent;
      return a;
    });

    handleUpdateAccounts(updatedAccounts);

    triggerNotification('🎉 Đã xác nhận liên kết!', `Đã liên kết thành công với tài khoản Phụ huynh ${req.parentName}! Đã tự động đồng bộ quyền VIP & phân quyền lớp học.`);
  };

  const handleDeclineParentLink = (req: { parentId: string }) => {
    if (!currentStudentAccount) return;
    audioService.playClickSound();

    const updatedStudent: UserAccount = {
      ...currentStudentAccount,
      pendingParentRequests: (currentStudentAccount.pendingParentRequests || []).filter((r) => r.parentId !== req.parentId),
    };

    const updatedAccounts = accounts.map((a) => (a.id === currentStudentAccount.id ? updatedStudent : a));
    handleUpdateAccounts(updatedAccounts);

    triggerNotification('⊗ Đã hủy yêu cầu', 'Bạn đã hủy bỏ yêu cầu liên kết từ phụ huynh.');
  };

  const isVipExpiringSoon = useMemo(() => {
    if (!user.isVip || !user.vipExpiryDate) return false;
    const parsed = new Date(user.vipExpiryDate.replace(' ', 'T'));
    if (isNaN(parsed.getTime())) return false;
    const diffMs = parsed.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  }, [user.isVip, user.vipExpiryDate]);

  if (!isLoggedIn) {
    return (
      <>
        <LoginView
          accounts={accounts}
          onLoginSuccess={(account) => {
            setAccounts((prev) => {
              const exists = prev.some((a) => a.id === account.id || a.username.toLowerCase() === account.username.toLowerCase());
              if (!exists) {
                return [...prev, account];
              }
              return prev;
            });
            setIsLoggedIn(true);
            handleSwitchAccount(account);
            triggerNotification('🎉 Đăng nhập thành công', `Chào mừng ${account.name} đến với KIDOEnglish!`);
          }}
          onContactClick={() => {
            audioService.playClickSound();
            setShowContactModal(true);
          }}
        />

        {/* Contact Info Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-sky-200 text-center space-y-4 font-sans select-none">
              <div className="w-16 h-16 rounded-full bg-sky-100 text-[#1d50b4] flex items-center justify-center text-3xl mx-auto shadow-inner">
                📞
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Liên Hệ Ban Quản Trị</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Hỗ trợ Phụ Huynh & Học Sinh 24/7</p>
              </div>

              <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 text-xs font-bold text-slate-700 space-y-2 text-left">
                <p className="flex items-center gap-2">
                  <span>📱 Hotline/Zalo:</span>
                  <span className="text-[#1d50b4] font-extrabold">0988.888.888</span>
                </p>
                <p className="flex items-center gap-2">
                  <span>✉️ Email:</span>
                  <span className="text-[#1d50b4] font-extrabold">hotro@kidoenglish.edu.vn</span>
                </p>
                <p className="flex items-center gap-2">
                  <span>🌐 Website:</span>
                  <span className="text-[#1d50b4] font-extrabold">kidoenglish.edu.vn</span>
                </p>
              </div>

              <button
                onClick={() => setShowContactModal(false)}
                className="w-full py-2.5 rounded-2xl bg-[#1d50b4] hover:bg-blue-700 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f3f7fe] text-slate-800 flex flex-col lg:flex-row items-stretch font-sans relative selection:bg-[#1d50b4] selection:text-white">
      {/* Global Click Bubble Effect */}
      <ClickBubbleEffect />

      {/* Toast Push Notifications */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        trialTimeSeconds={user.trialTimeSeconds}
        userRole={user.role}
        isVip={user.isVip}
        vipExpiryDate={user.vipExpiryDate}
        allowedGrades={user.allowedGrades}
        userName={user.name}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline((prev) => !prev)}
        onTriggerNotification={triggerNotification}
        customPages={customPages}
        menuConfig={menuConfig}
      />

      {/* Main App Workspace Area */}
      <main className="flex-1 p-2 sm:p-3 lg:p-4 pb-24 sm:pb-28 flex flex-col justify-between w-full min-w-0">
        <div className="w-full">
          {/* Main Layout Grid (Center Content + Right Widgets) */}
          <div className="flex flex-col xl:flex-row gap-4 items-start min-w-0">
            <div className="flex-1 w-full min-w-0 space-y-3">
              {/* Header Bar - horizontally aligned with the banner below */}
              <Header
                user={user}
                lang={lang}
                setLang={setLang}
                isOnline={isOnline}
                onToggleOnline={() => setIsOnline((prev) => !prev)}
                onLogout={() => {
                  audioService.playClickSound();
                  setShowLogoutModal(true);
                }}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onTriggerNotification={triggerNotification}
                notifications={userFilteredNotifications}
                unreadCount={unreadNotifCount}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onClearAllNotifications={handleClearAllNotifications}
                onMarkNotificationAsRead={handleMarkNotificationRead}
              />

              {/* Offline Status Notice Banner ("Khủng long đang ngủ") */}
              <OfflineNoticeBanner
                isOnline={isOnline}
                onToggleOfflineSimulation={() => setIsOnline((prev) => !prev)}
              />

              {/* VIP PROMOTION BANNER FOR NON-VIP USERS */}
              <VipPromotionBanner
                promotion={vipPromotion}
                isVip={user.isVip}
                onOpenUpgradeModal={() => setShowVipUpgradeModal(true)}
              />

              {/* ⚠️ NEAR EXPIRATION VIP ALERT BANNER (WITHIN 24 HOURS) */}
              {isVipExpiringSoon && (
                <div className="mt-3 mb-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-2xl p-3 px-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 border border-amber-300/60 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0 font-bold">
                      ⚠️
                    </div>
                    <div>
                      <p className="font-extrabold text-xs sm:text-sm tracking-tight leading-snug">
                        {user.role === 'parent' ? 'Gói VIP của bé' : 'Gói VIP của bạn'} sắp hết hạn trong vòng 24 giờ tới!
                      </p>
                      <p className="text-[11px] text-amber-100 font-semibold">
                        Hạn dùng: <strong className="text-white underline">{user.vipExpiryDate}</strong>. Hãy liên hệ Admin để gia hạn ngay, giữ trọn vẹn tiến trình học!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      if (user.role === 'admin') {
                        setActiveTab('admin-panel');
                      } else {
                        triggerNotification(
                          '💬 Đã gửi yêu cầu gia hạn VIP',
                          'Yêu cầu đã được gửi đến Admin. Chúng tôi sẽ liên hệ hỗ trợ bạn sớm nhất!'
                        );
                      }
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-amber-50 text-slate-900 font-black text-xs rounded-xl shadow-md transition transform active:scale-95 shrink-0 cursor-pointer"
                  >
                    {user.role === 'admin' ? '⚙️ Quản Trị VIP' : '👑 Gửi Yêu Cầu Gia Hạn VIP'}
                  </button>
                </div>
              )}

              <StudentErrorBoundary
                userRole={user.role}
                userName={user.name}
                userId={user.username || user.name}
                activeTab={activeTab}
                onGoHome={() => setActiveTab('home')}
              >
                <PageMediaSlot items={pageMedia} position="top" />
                <React.Suspense fallback={<ViewSkeleton />}>
                  {renderMainContent()}
                </React.Suspense>
                <PageMediaSlot items={pageMedia} position="bottom" />
                <PageMediaPopup pageKey={activeTab} items={pageMedia} />
              </StudentErrorBoundary>
            </div>

            {/* Right Panel Widgets (Timer, Clock, Daily Checkin, Tasks, Leaderboard) */}
            {activeTab !== 'admin-panel' && <RightSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              reportSubTab={reportSubTab}
              checkedInToday={user.checkedInToday}
              onClaimCheckIn={handleClaimCheckIn}
              dailyTasks={dailyTasks}
              onClaimTask={handleClaimTask}
              onClaimAllTasks={handleClaimAllTasks}
              leaderboard={leaderboard}
              accounts={accounts}
              userRole={user.role}
              onTriggerNotification={triggerNotification}
              userAvatar={user.avatar}
              userName={user.name}
              quizProgress={quizProgress}
            />}
          </div>
        </div>
      </main>

      {/* Floating AI Kido Mascot Tutor Helper Orb - Always anchored fixed bottom-right */}
      <KidoAIOrb userName={user.name} />

      {/* LOST STREAK POPUP MODAL */}
      <StreakLostModal
        isOpen={showStreakLostModal}
        onClose={() => setShowStreakLostModal(false)}
        previousStreak={lostStreakCount}
        onStartCheckIn={() => {
          setActiveTab('home');
        }}
      />

      {/* IMAGE 5: LOGOUT CONFIRMATION MODAL ("Kido hỏi bé") */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] max-w-xs w-full p-6 shadow-2xl border-2 border-dashed border-[#3b82f6] text-center space-y-4 font-sans select-none">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-200 bg-indigo-50 text-[#4f46e5] flex items-center justify-center text-2xl font-black mx-auto shadow-inner">
              ❓
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Kido hỏi bé</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                {user.name} có muốn đăng xuất khỏi ứng dụng không?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-400 hover:bg-slate-500 text-white font-black text-xs cursor-pointer transition"
              >
                Hủy bỏ
              </button>

              <button
                onClick={() => {
                  audioService.playClickSound();
                  setShowLogoutModal(false);
                  recordUserLogout(undefined, { id: user.id, username: user.username, name: user.name, role: user.role } as any);
                  signOut(auth).catch(console.error);
                  setIsLoggedIn(false);
                  triggerNotification('🔒 Đã đăng xuất', 'Bạn có thể quay lại đăng nhập bất kỳ lúc nào!');
                }}
                className="flex-1 py-2.5 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs shadow-md cursor-pointer transition flex items-center justify-center gap-1"
              >
                <span>Đồng ý</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PENDING PARENT LINK REQUEST MODAL FOR KID ACCOUNT */}
      {pendingLinkRequests.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-[#1d50b4] text-center space-y-4 font-sans select-none">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#1d50b4] flex items-center justify-center text-3xl mx-auto shadow-inner">
              📩
            </div>

            <div>
              <h3 className="text-base font-black text-slate-800">Yêu Cầu Liên Kết Từ Phụ Huynh</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Tài khoản Phụ huynh <span className="text-[#1d50b4] font-extrabold">{pendingLinkRequests[0].parentName}</span> ({pendingLinkRequests[0].parentEmail}) muốn gửi yêu cầu liên kết với tài khoản của bé <span className="font-bold">{user.name}</span>.
              </p>
            </div>

            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-left text-xs font-bold text-slate-700 space-y-1">
              <p>👤 Phụ huynh: <span className="text-slate-900">{pendingLinkRequests[0].parentName}</span></p>
              <p>✉️ Email: <span className="text-slate-900">{pendingLinkRequests[0].parentEmail}</span></p>
              <p>🕒 Ngày gửi: <span className="text-slate-900">{pendingLinkRequests[0].requestedAt || 'Hôm nay'}</span></p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleDeclineParentLink(pendingLinkRequests[0])}
                className="flex-1 py-2.5 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-extrabold text-xs cursor-pointer transition border border-rose-200"
              >
                Hủy bỏ
              </button>

              <button
                onClick={() => handleAcceptParentLink(pendingLinkRequests[0])}
                className="flex-1 py-2.5 rounded-2xl bg-[#1d50b4] hover:bg-blue-700 text-white font-black text-xs shadow-md cursor-pointer transition flex items-center justify-center gap-1"
              >
                <span>Xác nhận</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME VIP STATUS DOWNGRADE WARNING MODAL */}
      {vipDowngradeModalData.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-amber-500 text-center space-y-4 font-sans select-none">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              ⚠️
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800">Thông Báo Giảm Cấp VIP</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                Tài khoản <span className="font-extrabold text-slate-800">{vipDowngradeModalData.accountName}</span> đã hết hạn hoặc bị điều chỉnh giảm cấp độ VIP.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs font-semibold text-amber-900 space-y-1">
              <p className="flex justify-between">
                <span>Hạn VIP trước đó:</span>
                <span className="font-bold">{vipDowngradeModalData.previousExpiry || 'Đã hoạt động'}</span>
              </p>
              <p className="flex justify-between text-rose-700">
                <span>Trạng thái hiện tại:</span>
                <span className="font-black">❌ Hết hạn / Miễn phí</span>
              </p>
              <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60 font-medium">
                📌 Lý do: {vipDowngradeModalData.reason}
              </p>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Vui lòng liên hệ Quản trị viên nếu bé/phụ huynh cần gia hạn lại gói VIP KIDOEnglish.
            </p>

            <button
              onClick={() => {
                audioService.playClickSound();
                setVipDowngradeModalData((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md cursor-pointer transition"
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* System Realtime Broadcast Alert Modal & History Drawer */}
      <BroadcastAlertModal
        broadcasts={systemBroadcasts}
        currentUser={user}
      />

      {/* VIP PROMOTION DETAIL / REGISTER MODAL */}
      <VipPromotionModal
        isOpen={showVipUpgradeModal}
        onClose={() => setShowVipUpgradeModal(false)}
        promotion={vipPromotion}
        user={user}
        onRequestUpgradeSuccess={() => {
          triggerNotification('⚡ Đã gửi yêu cầu VIP', 'Cảm ơn bạn! BQT sẽ liên hệ để kích hoạt VIP trong thời gian sớm nhất!');
        }}
      />

      {/* Mobile Bottom Tab Navigation for Students */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={user.role}
        userStars={user.stars}
      />
    </div>
  );
}
