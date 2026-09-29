export type UserRole = 'kid' | 'parent' | 'admin';
export type Language = 'en' | 'vi';
export type ActiveTab = string;

export interface UserProfile {
  id?: string;
  name: string;
  role: UserRole;
  level: number;
  stars: number;
  xp?: number;
  streakDays: number;
  avatar: string;
  completedLessonsCount: number;
  totalLessonsCount?: number;
  learnedVocabCount: number;
  totalVocabCount?: number;
  studyTimeMinutes: number;
  checkedInToday: boolean;
  trialTimeSeconds: number;
  isVip?: boolean;
  vipExpiryDate?: string;
  allowedGrades?: string[];
  username?: string;
  email?: string;
  linkedKidIds?: string[];
  linkedParentIds?: string[];
  pendingParentRequests?: any[];
  [key: string]: any;
}

export interface UserAccount {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  avatar?: string;
  stars?: number;
  level?: number;
  xp?: number;
  streakDays?: number;
  streak?: number;
  completedLessons?: number;
  studyTimeMinutes?: number;
  learnedVocabCount?: number;
  checkedInToday?: boolean;
  trialTimeSeconds?: number;
  isVip?: boolean;
  vipExpiryDate?: string;
  allowedGrades?: string[];
  email?: string;
  linkedKidIds?: string[];
  linkedParentIds?: string[];
  pendingParentRequests?: any[];
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  status?: string;
  passwordHash?: string;
  [key: string]: any;
}

export interface UnitLesson {
  id: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  tagColor?: string;
  iconType?: string;
  description?: string;
  isUnlocked?: boolean;
}

export interface VocabItem {
  id: string;
  word: string;
  phonetic: string;
  meaningVi: string;
  meaningEn: string;
  example: string;
  category: string;
  imageUrl?: string;
  mastered: boolean;
  audioDriveId?: string;
  audioEnUrl?: string; // Link audio phát âm tiếng Anh
  audioViUrl?: string; // Link audio phát âm tiếng Việt
  audioExampleEnUrl?: string; // Link audio phát âm câu ví dụ tiếng Anh
  audioExampleViUrl?: string; // Link audio phát âm câu ví dụ tiếng Việt
}

export interface DailyTask {
  id: string;
  title: string;
  rewardStars: number;
  completed: boolean;
  icon?: string;
  category?: string;
  progress?: number;
  target?: number;
  current?: number;
  claimed?: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  starCost?: number;
  cost?: number;
  unlocked?: boolean;
  icon?: string;
  claimed?: boolean;
  category?: string;
  description?: string;
  [key: string]: any;
}

export interface ParentNote {
  id: string;
  content: string;
  date: string;
  from?: string;
  authorName?: string;
  authorRole?: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  stars?: number;
  points?: number;
  avatar?: string;
  streakDays?: number;
  speakingScore?: number;
  isCurrentUser?: boolean;
  level?: number;
}

export interface VipTransaction {
  id: string;
  userId?: string;
  amount?: number;
  timestamp: string;
  planName?: string;
  status?: string;
  targetUsername?: string;
  targetAccountId?: string;
  packageType?: string;
  [key: string]: any;
}

export interface AccountAuditLog {
  id: string;
  actionTitle: string;
  timestamp: string;
  timestampMs?: number;
  adminId?: string;
  adminName?: string;
  targetId?: string;
  targetName?: string;
  targetAccountId?: string;
  actionType?: string;
  affectedAccountsDetails?: any;
  details?: string;
  [key: string]: any;
}

export interface UserLoginSession {
  id: string;
  userId: string;
  username?: string;
  userName?: string;
  role?: string;
  loginTime?: string;
  loginTimestampMs?: number;
  logoutTime?: string;
  logoutTimestampMs?: number;
  status: string;
  deviceInfo?: string;
  [key: string]: any;
}

export type BroadcastCategory = 'general' | 'maintenance' | 'vip' | 'event' | 'alert' | string;
export type BroadcastPriority = 'low' | 'normal' | 'high' | 'urgent' | string;
export type BroadcastTargetAudience = 'all' | 'online' | 'kid' | 'parent' | 'non_vip' | string;

export interface SystemBroadcastNotification {
  id: string;
  title: string;
  message: string;
  category: BroadcastCategory;
  targetAudience: BroadcastTargetAudience;
  priority?: BroadcastPriority;
  senderName?: string;
  timestamp: string;
  timestampMs?: number;
  isActive: boolean;
  linkTab?: string;
  icon?: string;
  toastType?: string;
  targetAccountId?: string;
  actionTab?: string;
  readReceipts?: any;
  readByAccountIds?: string[];
  [key: string]: any;
}

export interface VipPromotionConfig {
  id: string;
  title: string;
  description: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  bannerText: string;
  ctaText: string;
  isEnabled: boolean;
  bgGradient: string;
  targetAudience?: string;
  featuresList?: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface UndoItem {
  id: string;
  timestamp: number;
  description: string;
  isRestored?: boolean;
  expiresAt?: number;
  previousAccounts?: UserAccount[];
  updatedAccounts?: UserAccount[];
  snapshot?: any;
  [key: string]: any;
}

export interface StarTransaction {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number;
  reason?: string;
  timestamp?: string;
  timestampMs?: number;
  adminId?: string;
  adminName?: string;
  actorName?: string;
  [key: string]: any;
}

export interface StudentActivityItem {
  id: string;
  studentId: string;
  studentName?: string;
  type: 'lesson_completed' | 'star_awarded' | 'quiz_passed' | 'checkin' | 'task_completed';
  title: string;
  subtitle?: string;
  starsEarned?: number;
  lessonName?: string;
  unitName?: string;
  grade?: number;
  timestamp: string;
  timestampMs: number;
  icon?: string;
  badge?: string;
  [key: string]: any;
}

export interface SystemBackupRecord {
  id: string;
  name?: string;
  timestamp?: string;
  timestampMs: number;
  sizeBytes?: number;
  exportSizeKb?: number;
  accountsCount?: number;
  status?: string;
  description?: string;
  summary?: any;
  dataSnapshot?: any;
  notes?: string;
  authorName?: string;
  backupType?: string;
  [key: string]: any;
}

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'manual' | string;
  intervalMinutes?: number;
  retentionDays?: number;
  lastBackupTime?: string;
  autoDownload?: boolean;
  autoDownloadJson?: boolean;
  [key: string]: any;
}

export interface AdminErrorReport {
  id: string;
  timestamp: string;
  userRole: string;
  userName: string;
  userId?: string;
  activeTab: string;
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
}

export interface WeeklyGoalConfig {
  targetLessons: number;
  targetStudyMinutes: number;
  targetStars: number;
  autoEmailAlerts: boolean;
  parentEmail: string;
  reminderFrequency: 'always' | 'weekly' | 'custom' | string;
}

export interface StudentWeeklyGoalReport {
  studentId: string;
  studentName: string;
  studentUsername?: string;
  avatar?: string;
  parentEmail: string;
  parentName: string;
  targetLessons: number;
  completedLessons: number;
  lessonsProgressPercent: number;
  targetMinutes: number;
  studyMinutes: number;
  minutesProgressPercent: number;
  targetStars: number;
  starsEarned: number;
  starsProgressPercent: number;
  overallScorePercent: number;
  status: 'achieved' | 'needs_effort' | 'missed' | string;
  statusText: string;
  missingLessons: number;
  missingMinutes: number;
  missingStars: number;
  isGoalMet: boolean;
  kidoAdvice: string;
  dinoAdvice?: string;
}

export interface ParentEmailRecord {
  id: string;
  studentId: string;
  studentName: string;
  parentEmail: string;
  parentName: string;
  subject: string;
  content: string;
  sentAt: string;
  sentAtMs: number;
  reason: string;
  status: string;
  weeklyMetrics?: {
    completedLessons: number;
    targetLessons: number;
    studyMinutes: number;
    targetMinutes: number;
    stars: number;
    targetStars: number;
  };
}

export type ToastType = 'default' | 'success' | 'warning' | 'error' | 'vip' | 'stars' | 'streak' | 'broadcast' | 'goal' | 'email' | string;

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
  userId?: string;
  targetUserId?: string;
  actionTab?: string;
}

export interface ManagedToastItem {
  id: string;
  code: string;
  title: string;
  message: string;
  type: string;
  category: string;
  badgeText: string;
  iconEmoji: string;
  actionLabel?: string;
  actionTab?: string;
  soundEffect?: string;
  durationMs: number;
  isSystemPreset: boolean;
  isEnabled: boolean;
  description: string;
}
