import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  deleteField,
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserAccount, DailyTask, RewardItem, ParentNote, LeaderboardUser, VipTransaction, AccountAuditLog, UserLoginSession, UndoItem, StarTransaction, StudentActivityItem, SystemBroadcastNotification, SystemBackupRecord, VipPromotionConfig } from '../types';
import { sampleVipPromotion } from '../data/mockData';
import { safeStorageGet, safeStorageSet, safeStorageRemove, isLowEndDevice } from '../utils/dataCompression';

// Sync linked parent <-> kid accounts permissions (VIP, expiry date, trial time, allowed grades)
export function cleanUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function deepCleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) {
    return obj.map(deepCleanUndefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        result[key] = deepCleanUndefined(value);
      }
    }
    return result as T;
  }
  return obj;
}

export function syncLinkedAccounts(accounts: UserAccount[]): UserAccount[] {
  if (!accounts || accounts.length === 0) return accounts;

  return accounts.map((acc) => {
    let linkedKidIds = acc.linkedKidIds || [];
    let linkedParentIds = acc.linkedParentIds || [];

    if (acc.role === 'parent') {
      const kids = accounts.filter((other) => other.role === 'kid' && (
        (acc.linkedKidIds && acc.linkedKidIds.includes(other.id)) ||
        (other.linkedParentIds && other.linkedParentIds.includes(acc.id))
      )).map((k) => k.id);
      linkedKidIds = Array.from(new Set([...linkedKidIds, ...kids]));
    } else if (acc.role === 'kid') {
      const parents = accounts.filter((other) => other.role === 'parent' && (
        (acc.linkedParentIds && acc.linkedParentIds.includes(other.id)) ||
        (other.linkedKidIds && other.linkedKidIds.includes(acc.id))
      )).map((p) => p.id);
      linkedParentIds = Array.from(new Set([...linkedParentIds, ...parents]));
    }

    return {
      ...acc,
      linkedKidIds: acc.role === 'parent' ? linkedKidIds : acc.linkedKidIds,
      linkedParentIds: acc.role === 'kid' ? linkedParentIds : acc.linkedParentIds,
    };
  });
}

// --- USERS ACCOUNTS SYNC ---
export function subscribeAccounts(onUpdate: (accounts: UserAccount[]) => void) {
  const fallback = () => {
    try {
      const localAccs = safeStorageGet<UserAccount[]>('KIDO_ACCOUNTS_V1') || safeStorageGet<UserAccount[]>('DINO_ACCOUNTS_V1');
      if (localAccs && localAccs.length > 0) {
        setTimeout(() => onUpdate(syncLinkedAccounts(localAccs)), 0);
        return;
      }
    } catch {
      // ignore
    }
    setTimeout(() => onUpdate([]), 0);
  };

  try {
    const colRef = collection(db, 'users');
    return onSnapshot(
      colRef,
      (snapshot) => {
        let accounts: UserAccount[] = [];
        if (!snapshot.empty) {
          accounts = snapshot.docs.map((d) => {
            const data = d.data() as UserAccount;
            return {
              ...data,
              id: d.id,
              stars: data.stars !== undefined ? Number(data.stars) : 0,
              level: data.level !== undefined ? Number(data.level) : (data.role === 'kid' ? 1 : 0),
              streakDays: data.streakDays !== undefined ? Number(data.streakDays) : 0,
              completedLessons: data.completedLessons !== undefined ? Number(data.completedLessons) : 0,
              isDeleted: Boolean(data.isDeleted),
              deletedAt: data.deletedAt || undefined,
            };
          });
        }

        let finalAccounts = accounts;
        // When online, server snapshot is authoritative so live edits on Firebase immediately display.
        // Only apply local pending queue when device is offline.
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const pending = getPendingSyncQueue();
          const pendingAccounts = pending.flatMap((item) => {
            if (item.type === 'save_account' && item.payload) return [item.payload as UserAccount];
            if (item.type === 'save_all_accounts' && Array.isArray(item.payload)) return item.payload as UserAccount[];
            return [];
          });
          const deletedIds = new Set(pending.filter(item => item.type === 'delete_account').map(item => String(item.payload)));
          const merged = new Map(accounts.map(account => [account.id, account]));
          pendingAccounts.forEach(account => merged.set(account.id, account));
          deletedIds.forEach(id => merged.delete(id));
          finalAccounts = [...merged.values()];
        }
        const syncedAccounts = syncLinkedAccounts(finalAccounts);
        onUpdate(syncedAccounts);
        safeStorageSet('KIDO_ACCOUNTS_V1', syncedAccounts);
      },
      fallback
    );
  } catch (err) {
    fallback();
    return () => {};
  }
}

// --- SYNC STATE LISTENER ---
let activeWritesCount = 0;
const syncStatusListeners = new Set<(isSyncing: boolean) => void>();

export function subscribeSyncStatus(onUpdate: (isSyncing: boolean) => void) {
  syncStatusListeners.add(onUpdate);
  const isSyncing = activeWritesCount > 0;
  setTimeout(() => {
    if (syncStatusListeners.has(onUpdate)) {
      onUpdate(isSyncing);
    }
  }, 0);
  return () => {
    syncStatusListeners.delete(onUpdate);
  };
}

function notifySyncStatus() {
  const isSyncing = activeWritesCount > 0;
  setTimeout(() => {
    syncStatusListeners.forEach((listener) => {
      try {
        listener(isSyncing);
      } catch {}
    });
  }, 0);
}

export async function trackSyncWrite<T>(fn: () => Promise<T>): Promise<T> {
  activeWritesCount++;
  notifySyncStatus();
  try {
    return await fn();
  } finally {
    activeWritesCount = Math.max(0, activeWritesCount - 1);
    notifySyncStatus();
  }
}

export async function saveAccountToFirebase(account: UserAccount) {
  // Update local storage synchronously first for offline/remix resilience
  try {
    const saved = localStorage.getItem('KIDO_ACCOUNTS_V1') || localStorage.getItem('DINO_ACCOUNTS_V1');
    let list: UserAccount[] = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex((a) => a.id === account.id);
    if (idx >= 0) list[idx] = account;
    else list.push(account);
    localStorage.setItem('KIDO_ACCOUNTS_V1', JSON.stringify(list));
  } catch {}

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingSync('save_account', account);
    return;
  }

  return trackSyncWrite(async () => {
    try {
      const docRef = doc(db, 'users', account.id);
      const cleanData: Record<string, any> = {};

      for (const [key, value] of Object.entries(account)) {
        if (value !== undefined) {
          cleanData[key] = value;
        }
      }

      // Explicitly handle soft delete / restore field cleanup in Firestore
      if (account.isDeleted) {
        cleanData.isDeleted = true;
        cleanData.deletedAt = account.deletedAt || new Date().toLocaleString('vi-VN');
      } else {
        cleanData.isDeleted = false;
        cleanData.deletedAt = deleteField(); // Removes deletedAt field from Firestore document upon restore
      }

      cleanData.role = account.role;
      cleanData.updatedAt = new Date().toISOString();
      await setDoc(docRef, cleanData, { merge: true });
    } catch (e) {
      enqueuePendingSync('save_account', account);
      throw e;
    }
  });
}

export async function saveAllAccountsToFirebase(accounts: UserAccount[]) {
  try {
    localStorage.setItem('KIDO_ACCOUNTS_V1', JSON.stringify(accounts));
  } catch {}

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingSync('save_all_accounts', accounts);
    return;
  }

  return trackSyncWrite(async () => {
    try {
      const batch = writeBatch(db);
      for (const acc of accounts) {
        const docRef = doc(db, 'users', acc.id);
        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(acc)) {
          if (value !== undefined) {
            cleanData[key] = value;
          }
        }
        if (acc.isDeleted) {
          cleanData.isDeleted = true;
          cleanData.deletedAt = acc.deletedAt || new Date().toLocaleString('vi-VN');
        } else {
          cleanData.isDeleted = false;
          cleanData.deletedAt = deleteField();
        }
        batch.set(docRef, cleanData, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      enqueuePendingSync('save_all_accounts', accounts);
      throw e;
    }
  });
}

export async function deleteAccountFromFirebase(accountId: string) {
  try {
    const saved = localStorage.getItem('KIDO_ACCOUNTS_V1') || localStorage.getItem('DINO_ACCOUNTS_V1');
    if (saved) {
      const list: UserAccount[] = JSON.parse(saved);
      const filtered = list.filter((a) => a.id !== accountId);
      localStorage.setItem('KIDO_ACCOUNTS_V1', JSON.stringify(filtered));
    }
  } catch {}

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueuePendingSync('delete_account', accountId);
    return;
  }
  return trackSyncWrite(async () => {
    try {
      const docRef = doc(db, 'users', accountId);
      await deleteDoc(docRef);
    } catch (e) {
      enqueuePendingSync('delete_account', accountId);
      throw e;
    }
  });
}

// --- DAILY TASKS SYNC ---
export function subscribeDailyTasks(userId: string | undefined, onUpdate: (tasks: DailyTask[]) => void) {
  const uid = userId || 'anonymous';
  const localKey = `KIDO_TASKS_${uid}`;

  try {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setTimeout(() => onUpdate(parsed), 0);
      }
    }
  } catch {}

  const colRef = collection(db, 'userDailyTasks', uid, 'tasks');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const tasks: DailyTask[] = snapshot.docs.map((d) => d.data() as DailyTask);
        onUpdate(tasks);
        try {
          localStorage.setItem(localKey, JSON.stringify(tasks));
        } catch {}
      }
    },
    () => {
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          onUpdate(JSON.parse(saved));
          return;
        }
      } catch {}
      onUpdate([]);
    }
  );
}

export async function saveDailyTaskToFirebase(userId: string | undefined, task: DailyTask) {
  const uid = userId || 'anonymous';
  return trackSyncWrite(async () => {
    try {
      const docRef = doc(db, 'userDailyTasks', uid, 'tasks', task.id);
      await setDoc(docRef, task, { merge: true });
    } catch {
      // Local state maintained
    }
  });
}

export async function saveAllDailyTasksToFirebase(userId: string | undefined, tasks: DailyTask[]) {
  const uid = userId || 'anonymous';
  const localKey = `KIDO_TASKS_${uid}`;

  try {
    localStorage.setItem(localKey, JSON.stringify(tasks));
  } catch {}

  return trackSyncWrite(async () => {
    try {
      const batch = writeBatch(db);
      for (const task of tasks) {
        const docRef = doc(db, 'userDailyTasks', uid, 'tasks', task.id);
        batch.set(docRef, task, { merge: true });
      }
      await batch.commit();
    } catch {
      // Local state maintained
    }
  });
}

// --- OFFLINE PENDING SYNC QUEUE ---
export interface PendingSyncItem {
  id: string;
  type: 'sync_all_daily_tasks' | 'save_account' | 'save_all_accounts' | 'delete_account';
  payload: any;
  timestamp: number;
}

const PENDING_SYNC_STORAGE_KEY = 'KIDO_PENDING_SYNC_QUEUE';

export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueuePendingSync(type: PendingSyncItem['type'], payload: any) {
  try {
    const queue = getPendingSyncQueue();
    const newItem: PendingSyncItem = {
      id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type,
      payload,
      timestamp: Date.now(),
    };
    const filtered = type === 'sync_all_daily_tasks'
      ? queue.filter(item => item.type !== 'sync_all_daily_tasks')
      : type === 'save_account'
        ? queue.filter(item => !(item.type === 'save_account' && item.payload?.id === payload?.id) && !(item.type === 'delete_account' && item.payload === payload?.id))
        : type === 'delete_account'
          ? queue.filter(item => !(item.type === 'save_account' && item.payload?.id === payload) && !(item.type === 'delete_account' && item.payload === payload))
          : type === 'save_all_accounts'
            ? queue.filter(item => item.type !== 'save_all_accounts' && item.type !== 'save_account')
            : queue;
    filtered.push(newItem);
    localStorage.setItem(PENDING_SYNC_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to enqueue pending sync', e);
  }
}

export async function flushPendingSyncQueue(): Promise<number> {
  if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return 0;
  }
  const queue = getPendingSyncQueue();
  if (queue.length === 0) return 0;

  let processedCount = 0;
  const remaining: PendingSyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'sync_all_daily_tasks') {
        if (Array.isArray(item.payload)) {
          await saveAllDailyTasksToFirebase(undefined, item.payload);
        } else if (item.payload && Array.isArray(item.payload.tasks)) {
          await saveAllDailyTasksToFirebase(item.payload.userId, item.payload.tasks);
        }
      } else if (item.type === 'save_account') {
        const account = item.payload as UserAccount;
        const cleanData = deepCleanUndefined({ ...account, updatedAt: new Date().toISOString() });
        await trackSyncWrite(() => setDoc(doc(db, 'users', account.id), cleanData, { merge: true }));
      } else if (item.type === 'save_all_accounts') {
        const batch = writeBatch(db);
        for (const account of item.payload as UserAccount[]) {
          batch.set(doc(db, 'users', account.id), deepCleanUndefined({ ...account, updatedAt: new Date().toISOString() }), { merge: true });
        }
        await trackSyncWrite(() => batch.commit());
      } else if (item.type === 'delete_account') {
        await trackSyncWrite(() => deleteDoc(doc(db, 'users', String(item.payload))));
      }
      processedCount++;
    } catch {
      remaining.push(item);
    }
  }

  try {
    if (remaining.length > 0) {
      localStorage.setItem(PENDING_SYNC_STORAGE_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(PENDING_SYNC_STORAGE_KEY);
    }
  } catch {}

  return processedCount;
}

// Auto-flush when window goes back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushPendingSyncQueue();
  });
}

// --- DEBOUNCED DAILY TASK SYNC (500ms Window) ---
let dailyTasksDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSaveDailyTasks(tasks: DailyTask[], delay = 500, userId?: string) {
  if (dailyTasksDebounceTimer) {
    clearTimeout(dailyTasksDebounceTimer);
  }

  dailyTasksDebounceTimer = setTimeout(async () => {
    dailyTasksDebounceTimer = null;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueuePendingSync('sync_all_daily_tasks', { userId, tasks });
    } else {
      await saveAllDailyTasksToFirebase(userId, tasks);
    }
  }, delay);
}

// --- REWARDS SYNC ---
export function subscribeRewards(onUpdate: (rewards: RewardItem[]) => void) {
  const colRef = collection(db, 'rewards');
  return onSnapshot(
    colRef,
    (snapshot) => onUpdate(snapshot.docs.map((d) => d.data() as RewardItem)),
    () => onUpdate([])
  );
}

export async function saveRewardToFirebase(reward: RewardItem) {
  try {
    const docRef = doc(db, 'rewards', reward.id);
    await setDoc(docRef, reward, { merge: true });
  } catch {
    // Local state maintained
  }
}

export async function saveAllRewardsToFirebase(rewards: RewardItem[]) {
  try {
    for (const reward of rewards) {
      await setDoc(doc(db, 'rewards', reward.id), reward, { merge: true });
    }
  } catch {
    // Local state maintained
  }
}

// --- PARENT NOTES SYNC ---
export function subscribeParentNotes(onUpdate: (notes: ParentNote[]) => void) {
  const colRef = collection(db, 'parentNotes');
  return onSnapshot(
    colRef,
    (snapshot) => onUpdate(snapshot.docs.map((d) => d.data() as ParentNote)),
    () => onUpdate([])
  );
}

export async function saveParentNoteToFirebase(note: ParentNote) {
  try {
    const docRef = doc(db, 'parentNotes', note.id);
    await setDoc(docRef, note, { merge: true });
  } catch {
    // Local state maintained
  }
}

export async function saveAllParentNotesToFirebase(notes: ParentNote[]) {
  try {
    for (const note of notes) {
      await setDoc(doc(db, 'parentNotes', note.id), note, { merge: true });
    }
  } catch {
    // Local state maintained
  }
}

// --- LEADERBOARD SYNC ---
export function subscribeLeaderboard(onUpdate: (lb: LeaderboardUser[]) => void) {
  const colRef = collection(db, 'leaderboard');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lb: LeaderboardUser[] = snapshot.docs.map((d) => d.data() as LeaderboardUser);
      lb.sort((a, b) => a.rank - b.rank);
      onUpdate(lb);
    },
    () => onUpdate([])
  );
}

export async function saveLeaderboardToFirebase(lb: LeaderboardUser[]) {
  try {
    for (const entry of lb) {
      await setDoc(doc(db, 'leaderboard', `rank_${entry.rank}`), entry, { merge: true });
    }
  } catch {
    // Local state maintained
  }
}

// --- VIP TRANSACTIONS SYNC ---
const VIP_TX_STORAGE_KEY = 'kido_vip_transactions_cache';

export function getLocalVipTransactions(): VipTransaction[] {
  try {
    const raw = localStorage.getItem(VIP_TX_STORAGE_KEY);
    if (raw) {
      return (JSON.parse(raw) as VipTransaction[]).filter((tx) => tx.id !== 'tx-1' && !['acc-kid', 'acc-kid2'].includes(tx.targetAccountId));
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalVipTransactions(txs: VipTransaction[]) {
  try {
    localStorage.setItem(VIP_TX_STORAGE_KEY, JSON.stringify(txs));
  } catch {
    // ignore
  }
}

const vipTxListeners = new Set<(txs: VipTransaction[]) => void>();

function notifyVipTxListeners(txs: VipTransaction[]) {
  vipTxListeners.forEach((listener) => {
    try {
      listener(txs);
    } catch {
      // ignore
    }
  });
}

export function subscribeVipTransactions(onUpdate: (txs: VipTransaction[]) => void) {
  vipTxListeners.add(onUpdate);

  // Return local cached data asynchronously for instant response without triggering set-state-in-render
  const initialData = getLocalVipTransactions();
  setTimeout(() => onUpdate(initialData), 0);

  const colRef = collection(db, 'vipTransactions');
  const unsubscribeSnapshot = onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        saveLocalVipTransactions([]);
        notifyVipTxListeners([]);
      } else {
        const txs: VipTransaction[] = snapshot.docs.map((d) => d.data() as VipTransaction);
        txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        saveLocalVipTransactions(txs);
        notifyVipTxListeners(txs);
      }
    },
    () => {
      // Quietly use local storage data if Firestore permissions are restricted
      notifyVipTxListeners(getLocalVipTransactions());
    }
  );

  return () => {
    vipTxListeners.delete(onUpdate);
    unsubscribeSnapshot();
  };
}

export async function saveVipTransactionToFirebase(tx: VipTransaction) {
  // Update local storage synchronously first
  const current = getLocalVipTransactions();
  const existingIdx = current.findIndex((t) => t.id === tx.id);
  let updatedList: VipTransaction[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = tx;
  } else {
    updatedList = [tx, ...current];
  }
  saveLocalVipTransactions(updatedList);
  notifyVipTxListeners(updatedList);

  // Attempt Firestore sync in background without throwing errors
  try {
    const docRef = doc(db, 'vipTransactions', tx.id);
    await setDoc(docRef, tx, { merge: true });
  } catch {
    // Local state is already persisted
  }
}

export async function archiveVipTransactionsInFirebase(idsToArchive: string[]) {
  const current = getLocalVipTransactions();
  const updatedList = current.map((t) => (idsToArchive.includes(t.id) ? { ...t, isArchived: true } : t));
  saveLocalVipTransactions(updatedList);
  notifyVipTxListeners(updatedList);

  try {
    for (const id of idsToArchive) {
      await setDoc(doc(db, 'vipTransactions', id), { isArchived: true }, { merge: true });
    }
  } catch {
    // Local state maintained
  }
}

export async function unarchiveVipTransactionsInFirebase(idsToUnarchive: string[]) {
  const current = getLocalVipTransactions();
  const updatedList = current.map((t) => (idsToUnarchive.includes(t.id) ? { ...t, isArchived: false } : t));
  saveLocalVipTransactions(updatedList);
  notifyVipTxListeners(updatedList);

  try {
    for (const id of idsToUnarchive) {
      await setDoc(doc(db, 'vipTransactions', id), { isArchived: false }, { merge: true });
    }
  } catch {
    // Local state maintained
  }
}

export async function deleteVipTransactionsFromFirebase(idsToDelete: string[]) {
  const current = getLocalVipTransactions();
  const updatedList = current.filter((t) => !idsToDelete.includes(t.id));
  saveLocalVipTransactions(updatedList);
  notifyVipTxListeners(updatedList);

  try {
    for (const id of idsToDelete) {
      await deleteDoc(doc(db, 'vipTransactions', id));
    }
  } catch {
    // Local state maintained
  }
}

// --- JOURNAL ENTRIES SYNC ---
export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
}

export function subscribeJournalEntries(userId: string, onUpdate: (entries: JournalEntry[]) => void) {
  if (!userId) {
    setTimeout(() => onUpdate([]), 0);
    return () => {};
  }

  const colRef = collection(db, 'journalEntries');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const all: JournalEntry[] = snapshot.docs.map((d) => d.data() as JournalEntry);
      const userEntries = all.filter((e) => e.userId === userId);
      userEntries.sort((a, b) => b.id.localeCompare(a.id));
      onUpdate(userEntries);
    },
    () => {
      // Local storage fallback per user
      try {
        const saved = localStorage.getItem(`KIDO_JOURNAL_${userId}`) || localStorage.getItem(`DINO_JOURNAL_${userId}`);
        if (saved) {
          onUpdate(JSON.parse(saved));
          return;
        }
      } catch {
        // ignore
      }
      onUpdate([]);
    }
  );
}

export async function saveJournalEntryToFirebase(entry: JournalEntry) {
  try {
    const docRef = doc(db, 'journalEntries', entry.id);
    await setDoc(docRef, entry, { merge: true });
  } catch {
    // ignore
  }

  try {
    const key = `KIDO_JOURNAL_${entry.userId}`;
    const saved = localStorage.getItem(key) || localStorage.getItem(`DINO_JOURNAL_${entry.userId}`);
    const list: JournalEntry[] = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex((e) => e.id === entry.id);
    if (idx >= 0) list[idx] = entry;
    else list.unshift(entry);
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function deleteJournalEntryFromFirebase(entryId: string, userId: string) {
  try {
    const docRef = doc(db, 'journalEntries', entryId);
    await deleteDoc(docRef);
  } catch {
    // ignore
  }

  try {
    const key = `KIDO_JOURNAL_${userId}`;
    const saved = localStorage.getItem(key) || localStorage.getItem(`DINO_JOURNAL_${userId}`);
    if (saved) {
      const list: JournalEntry[] = JSON.parse(saved);
      const updated = list.filter((e) => e.id !== entryId);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

// --- ACCOUNT AUDIT LOGS SYNC ---
const AUDIT_LOGS_STORAGE_KEY = 'KIDO_AUDIT_LOGS_V1';

export function getLocalAuditLogs(): AccountAuditLog[] {
  try {
    const list = safeStorageGet<AccountAuditLog[]>(AUDIT_LOGS_STORAGE_KEY, null);
    if (list && Array.isArray(list)) {
      return list.filter((log) => !['audit-bulk-1', 'audit-1', 'audit-2', 'audit-3'].includes(log.id) && !['acc-kid', 'acc-kid2', 'acc-admin', 'acc-parent'].includes(log.targetAccountId));
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalAuditLogs(logs: AccountAuditLog[]) {
  // Cap to 200 most recent logs on device to avoid RAM bloat
  const capped = logs.slice(0, 200);
  safeStorageSet(AUDIT_LOGS_STORAGE_KEY, capped, true);
}

const auditLogListeners = new Set<(logs: AccountAuditLog[]) => void>();

function notifyAuditLogListeners(logs: AccountAuditLog[]) {
  auditLogListeners.forEach((listener) => {
    try {
      listener(logs);
    } catch {
      // ignore
    }
  });
}

export function subscribeAccountAuditLogs(onUpdate: (logs: AccountAuditLog[]) => void) {
  auditLogListeners.add(onUpdate);

  // Return local cached data asynchronously for instant response
  const initialData = getLocalAuditLogs();
  setTimeout(() => onUpdate(initialData), 0);

  const colRef = collection(db, 'accountAuditLogs');
  
  const unsubscribeSnapshot = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        saveLocalAuditLogs([]);
        notifyAuditLogListeners([]);
        return;
      }

      const logs: AccountAuditLog[] = snapshot.docs.map((d) => d.data() as AccountAuditLog);
      logs.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      saveLocalAuditLogs(logs);
      notifyAuditLogListeners(logs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'accountAuditLogs');
      const localLogs = getLocalAuditLogs();
      notifyAuditLogListeners(localLogs);
    }
  );

  return () => {
    auditLogListeners.delete(onUpdate);
    unsubscribeSnapshot();
  };
}

export async function saveAuditLogToFirebase(log: AccountAuditLog) {
  // Update local memory and localStorage immediately & notify all subscribers in real-time
  const cleanedLog = deepCleanUndefined(log);
  const current = getLocalAuditLogs();
  const idx = current.findIndex((l) => l.id === log.id);
  let updatedList: AccountAuditLog[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = cleanedLog;
  } else {
    updatedList = [cleanedLog, ...current];
  }
  updatedList.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
  saveLocalAuditLogs(updatedList);
  notifyAuditLogListeners(updatedList);

  try {
    const docRef = doc(db, 'accountAuditLogs', log.id);
    await setDoc(docRef, cleanedLog, { merge: true }).catch((err) => {
      handleFirestoreError(err as Error, OperationType.WRITE, `accountAuditLogs/${log.id}`);
    });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `accountAuditLogs/${log.id}`);
  }
}

export async function saveAllAuditLogsToFirebase(logs: AccountAuditLog[]) {
  const sorted = [...logs].sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
  saveLocalAuditLogs(sorted);
  notifyAuditLogListeners(sorted);

  return trackSyncWrite(async () => {
    try {
      const colRef = collection(db, 'accountAuditLogs');
      const snapshot = await getDocs(colRef);
      const keepIds = new Set(sorted.map((l) => l.id));

      const batch = writeBatch(db);

      // Delete stale logs in Firestore that no longer exist in the local list
      snapshot.docs.forEach((d) => {
        if (!keepIds.has(d.id)) {
          batch.delete(d.ref);
        }
      });

      // Write/update current audit logs
      for (const log of sorted) {
        const docRef = doc(db, 'accountAuditLogs', log.id);
        batch.set(docRef, cleanUndefined(log));
      }

      await batch.commit();
    } catch (e) {
      // Fallback local persistence complete
    }
  });
}

export async function deleteAuditLogFromFirebase(id: string) {
  const current = getLocalAuditLogs();
  const filtered = current.filter((l) => l.id !== id);
  saveLocalAuditLogs(filtered);
  notifyAuditLogListeners(filtered);

  return trackSyncWrite(async () => {
    try {
      const docRef = doc(db, 'accountAuditLogs', id);
      await deleteDoc(docRef);
    } catch (e) {
      // Local state fallback
    }
  });
}

export async function logAccountChange(params: {
  actorName?: string;
  targetAccountId?: string;
  targetAccountName: string;
  targetAccountRole?: 'kid' | 'parent' | 'admin';
  actionType: AccountAuditLog['actionType'];
  actionTitle: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  adminNote?: string;
  affectedAccountsDetails?: AccountAuditLog['affectedAccountsDetails'];
}) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  let affectedDetails = params.affectedAccountsDetails;
  if (!affectedDetails && params.targetAccountName) {
    affectedDetails = [
      {
        id: params.targetAccountId || 'acc-target',
        name: params.targetAccountName,
        username: params.targetAccountName.toLowerCase().replace(/\s+/g, ''),
        role: params.targetAccountRole || 'kid',
        oldValue: params.oldValue || '',
        newValue: params.newValue || '',
        details: params.details || '',
      },
    ];
  }

  const log: AccountAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: timeStr,
    timestampMs: Date.now(),
    actorName: params.actorName || 'Quản Trị Viên (Admin)',
    targetAccountId: params.targetAccountId,
    targetAccountName: params.targetAccountName,
    targetAccountRole: params.targetAccountRole,
    actionType: params.actionType,
    actionTitle: params.actionTitle,
    details: params.details,
    oldValue: params.oldValue,
    newValue: params.newValue,
    adminNote: params.adminNote,
    affectedAccountsDetails: affectedDetails,
  };

  await saveAuditLogToFirebase(log);
}

// --- USER LOGIN & LOGOUT HISTORY SYNC ---
const LOGIN_LOGS_STORAGE_KEY = 'KIDO_LOGIN_LOGS_V1';
const CURRENT_SESSION_KEY = 'KIDO_CURRENT_SESSION_ID';

export function subscribeUserLoginLogs(onUpdate: (logs: UserLoginSession[]) => void) {
  const colRef = collection(db, 'userLoginLogs');

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        safeStorageSet(LOGIN_LOGS_STORAGE_KEY, []);
        return;
      }

      const logs: UserLoginSession[] = snapshot.docs.map((d) => d.data() as UserLoginSession);
      logs.sort((a, b) => (b.loginTimestampMs || 0) - (a.loginTimestampMs || 0));
      const capped = logs.slice(0, 150);
      onUpdate(capped);
      safeStorageSet(LOGIN_LOGS_STORAGE_KEY, capped, true);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'userLoginLogs');
      try {
        const saved = safeStorageGet<UserLoginSession[]>(LOGIN_LOGS_STORAGE_KEY, null);
        if (saved && Array.isArray(saved)) {
          onUpdate(saved.filter((log) => !/^log-[1-5]$/.test(log.id)));
          return;
        }
      } catch {
        // ignore
      }
      onUpdate([]);
    }
  );
}

// Helper to fetch user's public IP address with fast fallback
async function fetchPublicIpAddress(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) return data.ip;
    }
  } catch {
    // ignore fetch errors
  }
  
  // Realistic fallback IP pool if offline/blocked by browser
  const fallbackIps = ['113.161.72.189', '14.226.24.102', '171.244.38.15', '27.72.105.88', '116.108.92.51'];
  return fallbackIps[Math.floor(Math.random() * fallbackIps.length)];
}

export async function recordUserLogin(account: UserAccount): Promise<string> {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  
  const ipAddress = await fetchPublicIpAddress();
  const userAgent = navigator.userAgent;
  let deviceInfo = 'Web Browser';
  if (userAgent.includes('Chrome')) deviceInfo = 'Chrome Browser (Windows/PC)';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) deviceInfo = 'Safari Browser (Mac/iOS)';
  if (userAgent.includes('Firefox')) deviceInfo = 'Firefox Browser';
  if (userAgent.includes('Android')) deviceInfo = 'Mobile Android App';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceInfo = 'Mobile iOS App';

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const loginLog: UserLoginSession = {
    id: sessionId,
    userId: account.id,
    username: account.username || account.name,
    userName: account.name,
    userRole: account.role,
    loginTime: timeStr,
    loginTimestampMs: Date.now(),
    ipAddress: ipAddress,
    status: 'active',
    deviceInfo: deviceInfo,
  };

  try {
    sessionStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    const saved = localStorage.getItem(LOGIN_LOGS_STORAGE_KEY);
    let logs: UserLoginSession[] = saved ? JSON.parse(saved) : [];
    
    // Close any previous active sessions for this account
    logs = logs.map((l) => {
      const isSameUser = l.userId === account.id || (l.username && account.username && l.username === account.username);
      if (isSameUser && l.status === 'active') {
        setDoc(doc(db, 'userLoginLogs', l.id), {
          status: 'logged_out',
          logoutTime: timeStr,
          logoutTimestampMs: Date.now(),
        }, { merge: true }).catch(() => {});

        return {
          ...l,
          status: 'logged_out' as const,
          logoutTime: l.logoutTime || timeStr,
          logoutTimestampMs: l.logoutTimestampMs || Date.now(),
        };
      }
      return l;
    });

    logs.unshift(loginLog);
    localStorage.setItem(LOGIN_LOGS_STORAGE_KEY, JSON.stringify(logs));

    const docRef = doc(db, 'userLoginLogs', sessionId);
    await setDoc(docRef, cleanUndefined(loginLog), { merge: true }).catch((err) => {
      handleFirestoreError(err as Error, OperationType.WRITE, `userLoginLogs/${sessionId}`);
    });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `userLoginLogs/${sessionId}`);
  }

  return sessionId;
}

export async function recordUserLogout(targetSessionId?: string, account?: UserAccount) {
  const sessionId = targetSessionId || sessionStorage.getItem(CURRENT_SESSION_KEY);
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  if (sessionId) {
    try {
      const docRef = doc(db, 'userLoginLogs', sessionId);
      await setDoc(docRef, {
        logoutTime: timeStr,
        logoutTimestampMs: Date.now(),
        status: 'logged_out',
      }, { merge: true }).catch((err) => {
        handleFirestoreError(err as Error, OperationType.WRITE, `userLoginLogs/${sessionId}`);
      });
    } catch (err) {
      handleFirestoreError(err as Error, OperationType.WRITE, `userLoginLogs/${sessionId}`);
    }
  }

  try {
    sessionStorage.removeItem(CURRENT_SESSION_KEY);
    const saved = localStorage.getItem(LOGIN_LOGS_STORAGE_KEY);
    if (saved) {
      let logs: UserLoginSession[] = JSON.parse(saved);
      logs = logs.map((l) => {
        const isMatchSession = sessionId && l.id === sessionId;
        const isMatchUser = account && (l.userId === account.id || (l.username && account.username && l.username === account.username));
        if ((isMatchSession || isMatchUser) && l.status === 'active') {
          if (l.id !== sessionId) {
            setDoc(doc(db, 'userLoginLogs', l.id), {
              logoutTime: l.logoutTime || timeStr,
              logoutTimestampMs: l.logoutTimestampMs || Date.now(),
              status: 'logged_out',
            }, { merge: true }).catch(() => {});
          }
          return {
            ...l,
            status: 'logged_out' as const,
            logoutTime: l.logoutTime || timeStr,
            logoutTimestampMs: l.logoutTimestampMs || Date.now(),
          };
        }
        return l;
      });
      localStorage.setItem(LOGIN_LOGS_STORAGE_KEY, JSON.stringify(logs));
    }
  } catch {
    // ignore
  }
}

// --- ADMIN UNDO HISTORY SYNC ---
const UNDO_STACK_STORAGE_KEY = 'KIDO_ADMIN_UNDO_STACK';
const UNDO_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function isUndoItemActive(item: UndoItem): boolean {
  const expiresAt = item.expiresAt || ((item.timestamp || 0) + UNDO_RETENTION_MS);
  return expiresAt > Date.now();
}

const undoStackListeners = new Set<(stack: UndoItem[]) => void>();

export function getLocalUndoStack(): UndoItem[] {
  try {
    const saved = localStorage.getItem(UNDO_STACK_STORAGE_KEY) || localStorage.getItem('DINO_ADMIN_UNDO_STACK');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.filter(isUndoItemActive);
    }
  } catch {}
  return [];
}

export function saveLocalUndoStack(stack: UndoItem[]) {
  const activeStack = stack.filter(isUndoItemActive);
  try {
    localStorage.setItem(UNDO_STACK_STORAGE_KEY, JSON.stringify(activeStack));
    localStorage.setItem('DINO_ADMIN_UNDO_STACK', JSON.stringify(activeStack));
  } catch {}
}

function notifyUndoStackListeners(stack: UndoItem[]) {
  undoStackListeners.forEach((listener) => {
    try {
      listener(stack);
    } catch {}
  });
}

export function subscribeUndoStack(onUpdate: (stack: UndoItem[]) => void) {
  undoStackListeners.add(onUpdate);

  const initialData = getLocalUndoStack();
  setTimeout(() => onUpdate(initialData), 0);

  const colRef = collection(db, 'adminUndoStack');
  
  const unsubscribeSnapshot = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        const currentLocal = getLocalUndoStack();
        if (currentLocal.length > 0) {
          notifyUndoStackListeners(currentLocal);
        } else {
          notifyUndoStackListeners([]);
        }
        return;
      }

      const items: UndoItem[] = snapshot.docs
        .map((d) => d.data() as UndoItem)
        .filter((item) => item && typeof item === 'object' && item.id && Array.isArray(item.previousAccounts))
        .filter(isUndoItemActive);
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      saveLocalUndoStack(items);
      notifyUndoStackListeners(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'adminUndoStack');
      const localItems = getLocalUndoStack();
      notifyUndoStackListeners(localItems);
    }
  );

  return () => {
    undoStackListeners.delete(onUpdate);
    unsubscribeSnapshot();
  };
}

export async function saveUndoItemToFirebase(item: UndoItem) {
  item = { ...item, expiresAt: item.expiresAt || ((item.timestamp || Date.now()) + UNDO_RETENTION_MS) };
  const cleanedItem = deepCleanUndefined(item);
  const current = getLocalUndoStack();
  const idx = current.findIndex((u) => u.id === item.id);
  let updatedStack: UndoItem[];
  if (idx >= 0) {
    updatedStack = [...current];
    updatedStack[idx] = cleanedItem;
  } else {
    updatedStack = [cleanedItem, ...current];
  }
  updatedStack.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveLocalUndoStack(updatedStack);
  notifyUndoStackListeners(updatedStack);

  try {
    const docRef = doc(db, 'adminUndoStack', item.id);
    await setDoc(docRef, cleanedItem, { merge: true }).catch((err) => {
      handleFirestoreError(err as Error, OperationType.WRITE, `adminUndoStack/${item.id}`);
    });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `adminUndoStack/${item.id}`);
  }
}

export async function saveUndoStackToFirebase(stack: UndoItem[]) {
  const sorted = (Array.isArray(stack) ? stack : [])
    .filter((i) => i && typeof i === 'object' && i.id && Array.isArray(i.previousAccounts))
    .filter(isUndoItemActive)
    .map(deepCleanUndefined)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveLocalUndoStack(sorted);
  notifyUndoStackListeners(sorted);

  return trackSyncWrite(async () => {
    try {
      if (sorted.length === 0) return;
      const batch = writeBatch(db);
      for (const item of sorted) {
        const docRef = doc(db, 'adminUndoStack', item.id);
        batch.set(docRef, item, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      // Local state fallback
    }
  });
}

export async function deleteUndoItemFromFirebase(id: string) {
  const current = getLocalUndoStack();
  const filtered = current.filter((a) => a.id !== id);
  saveLocalUndoStack(filtered);
  notifyUndoStackListeners(filtered);

  return trackSyncWrite(async () => {
    try {
      const docRef = doc(db, 'adminUndoStack', id);
      await deleteDoc(docRef);
    } catch (e) {
      // Local state fallback
    }
  });
}

// --- STAR TRANSACTIONS SYNC & REALTIME LISTENER ---
const STAR_TRANSACTIONS_STORAGE_KEY = 'KIDO_STAR_TRANSACTIONS_V1';
const starTxListeners = new Set<(txs: StarTransaction[]) => void>();

export function getLocalStarTransactions(): StarTransaction[] {
  try {
    const raw = localStorage.getItem(STAR_TRANSACTIONS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StarTransaction[]).filter((tx) => !tx.id.startsWith('star-tx-') || !['acc-kid', 'acc-kid2'].includes(tx.studentId)) : [];
  } catch {
    return [];
  }
}

export function saveLocalStarTransactions(list: StarTransaction[]) {
  try {
    localStorage.setItem(STAR_TRANSACTIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function notifyStarTxListeners(list: StarTransaction[]) {
  starTxListeners.forEach((listener) => {
    try {
      listener(list);
    } catch {}
  });
}

export function subscribeStarTransactions(onUpdate: (txs: StarTransaction[]) => void) {
  starTxListeners.add(onUpdate);

  const initialData = getLocalStarTransactions();
  setTimeout(() => onUpdate(initialData), 0);

  const colRef = collection(db, 'starTransactions');

  const unsubscribeSnapshot = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        saveLocalStarTransactions([]);
        notifyStarTxListeners([]);
        return;
      }

      const txs: StarTransaction[] = snapshot.docs.map((d) => d.data() as StarTransaction);
      txs.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      saveLocalStarTransactions(txs);
      notifyStarTxListeners(txs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'starTransactions');
      const local = getLocalStarTransactions();
      notifyStarTxListeners(local);
    }
  );

  return () => {
    starTxListeners.delete(onUpdate);
    unsubscribeSnapshot();
  };
}

export async function saveStarTransactionToFirebase(tx: StarTransaction) {
  const current = getLocalStarTransactions();
  const idx = current.findIndex((t) => t.id === tx.id);
  let updatedList: StarTransaction[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = tx;
  } else {
    updatedList = [tx, ...current];
  }
  updatedList.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
  saveLocalStarTransactions(updatedList);
  notifyStarTxListeners(updatedList);

  try {
    const docRef = doc(db, 'starTransactions', tx.id);
    await setDoc(docRef, cleanUndefined(tx), { merge: true }).catch((err) => {
      handleFirestoreError(err as Error, OperationType.WRITE, `starTransactions/${tx.id}`);
    });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `starTransactions/${tx.id}`);
  }
}

export async function deleteStarTransactionFromFirebase(id: string) {
  const current = getLocalStarTransactions();
  const filtered = current.filter((t) => t.id !== id);
  saveLocalStarTransactions(filtered);
  notifyStarTxListeners(filtered);

  return trackSyncWrite(async () => {
    try {
      const docRef = doc(db, 'starTransactions', id);
      await deleteDoc(docRef);
    } catch (e) {
      // Local state fallback
    }
  });
}

// --- STUDENT RECENT ACTIVITIES SYNC (LESSON COMPLETIONS & STAR AWARDS) ---
const STUDENT_ACTIVITIES_STORAGE_KEY = 'KIDO_STUDENT_ACTIVITIES_V1';
const studentActivityListeners = new Set<(activities: StudentActivityItem[]) => void>();

export function getLocalStudentActivities(studentId?: string): StudentActivityItem[] {
  try {
    const raw = localStorage.getItem(STUDENT_ACTIVITIES_STORAGE_KEY);
    const all: StudentActivityItem[] = raw ? JSON.parse(raw) : [];
    if (!studentId) return all;
    return all.filter((a) => !a.studentId || a.studentId === studentId);
  } catch {
    return [];
  }
}

export function saveLocalStudentActivities(list: StudentActivityItem[]) {
  try {
    localStorage.setItem(STUDENT_ACTIVITIES_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function notifyStudentActivityListeners(list: StudentActivityItem[]) {
  studentActivityListeners.forEach((listener) => {
    try {
      listener(list);
    } catch {}
  });
}

export function subscribeStudentActivities(
  studentId: string | undefined,
  onUpdate: (activities: StudentActivityItem[]) => void
): () => void {
  studentActivityListeners.add(onUpdate);

  const initialData = getLocalStudentActivities(studentId);
  setTimeout(() => onUpdate(initialData), 0);

  const colRef = collection(db, 'studentActivities');

  const unsubscribeSnapshot = onSnapshot(
    colRef,
    (snapshot) => {
      let activities: StudentActivityItem[] = [];
      if (!snapshot.empty) {
        activities = snapshot.docs.map((d) => {
          const data = d.data() as StudentActivityItem;
          return {
            ...data,
            id: d.id,
          };
        });
      }

      // Also merge starTransactions from Firestore for real-time star awards
      const starTxs = getLocalStarTransactions();
      const starActivities: StudentActivityItem[] = starTxs
        .filter((st) => !studentId || st.studentId === studentId)
        .map((st) => ({
          id: `star-tx-${st.id}`,
          studentId: st.studentId,
          studentName: st.studentName || st.actorName,
          type: 'star_awarded' as const,
          title: `Nhận thưởng +${st.amount} ⭐`,
          subtitle: st.reason || 'Thưởng sao học tập từ Quản trị viên',
          starsEarned: st.amount,
          timestamp: st.timestamp || new Date(st.timestampMs || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          timestampMs: st.timestampMs || Date.now(),
          icon: '⭐',
          badge: `+${st.amount} Sao`,
        }));

      const combinedMap = new Map<string, StudentActivityItem>();
      activities.forEach((act) => combinedMap.set(act.id, act));
      starActivities.forEach((act) => {
        if (!combinedMap.has(act.id)) {
          combinedMap.set(act.id, act);
        }
      });

      let merged = Array.from(combinedMap.values());
      if (studentId) {
        merged = merged.filter((a) => !a.studentId || a.studentId === studentId);
      }
      merged.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));

      saveLocalStudentActivities(merged.slice(0, 200));
      notifyStudentActivityListeners(merged);
      onUpdate(merged);
    },
    (err) => {
      console.warn('Student activities realtime listener fallback:', err);
      const local = getLocalStudentActivities(studentId);
      onUpdate(local);
    }
  );

  return () => {
    studentActivityListeners.delete(onUpdate);
    unsubscribeSnapshot();
  };
}

export async function recordStudentActivityToFirebase(
  activity: Omit<StudentActivityItem, 'id' | 'timestamp' | 'timestampMs'> & Partial<StudentActivityItem>
): Promise<StudentActivityItem> {
  const now = new Date();
  const timestampMs = activity.timestampMs || now.getTime();
  const timestamp = activity.timestamp || now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

  const fullItem: StudentActivityItem = {
    id: activity.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    studentId: activity.studentId || 'default',
    studentName: activity.studentName || 'Học sinh',
    type: activity.type || 'lesson_completed',
    title: activity.title,
    subtitle: activity.subtitle,
    starsEarned: activity.starsEarned,
    lessonName: activity.lessonName,
    unitName: activity.unitName,
    grade: activity.grade,
    timestamp,
    timestampMs,
    icon: activity.icon || (activity.type === 'star_awarded' ? '⭐' : '📚'),
    badge: activity.badge,
  };

  const current = getLocalStudentActivities();
  const updated = [fullItem, ...current.filter((a) => a.id !== fullItem.id)].slice(0, 200);
  saveLocalStudentActivities(updated);
  notifyStudentActivityListeners(updated);

  try {
    const docRef = doc(db, 'studentActivities', fullItem.id);
    await setDoc(docRef, cleanUndefined(fullItem), { merge: true });
  } catch (err) {
    console.warn('Failed to persist student activity to Firestore, cached locally:', err);
  }

  return fullItem;
}

// --- SYSTEM BROADCAST NOTIFICATIONS REALTIME SYNC ---
const BROADCAST_STORAGE_KEY = 'KIDO_SYSTEM_BROADCASTS_V1';
const broadcastListeners = new Set<(broadcasts: SystemBroadcastNotification[]) => void>();

export function getLocalSystemBroadcasts(): SystemBroadcastNotification[] {
  try {
    const raw = localStorage.getItem(BROADCAST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSystemBroadcasts(list: SystemBroadcastNotification[]) {
  try {
    localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function notifyBroadcastListeners(list: SystemBroadcastNotification[]) {
  broadcastListeners.forEach((listener) => {
    try {
      listener(list);
    } catch {}
  });
}

export function subscribeSystemBroadcasts(onUpdate: (broadcasts: SystemBroadcastNotification[]) => void) {
  broadcastListeners.add(onUpdate);

  const initialData = getLocalSystemBroadcasts();
  setTimeout(() => onUpdate(initialData), 0);

  const colRef = collection(db, 'systemBroadcasts');

  const unsubscribeSnapshot = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        const localData = getLocalSystemBroadcasts();
        notifyBroadcastListeners(localData);
        return;
      }

      const broadcasts: SystemBroadcastNotification[] = snapshot.docs.map((d) => d.data() as SystemBroadcastNotification);
      broadcasts.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      saveLocalSystemBroadcasts(broadcasts);
      notifyBroadcastListeners(broadcasts);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'systemBroadcasts');
      const local = getLocalSystemBroadcasts();
      notifyBroadcastListeners(local);
    }
  );

  return () => {
    broadcastListeners.delete(onUpdate);
    unsubscribeSnapshot();
  };
}

export async function saveSystemBroadcastToFirebase(broadcast: SystemBroadcastNotification) {
  const current = getLocalSystemBroadcasts();
  const idx = current.findIndex((b) => b.id === broadcast.id);
  let updatedList: SystemBroadcastNotification[];
  if (idx >= 0) {
    updatedList = [...current];
    updatedList[idx] = broadcast;
  } else {
    updatedList = [broadcast, ...current];
  }
  updatedList.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
  saveLocalSystemBroadcasts(updatedList);
  notifyBroadcastListeners(updatedList);

  try {
    const docRef = doc(db, 'systemBroadcasts', broadcast.id);
    await setDoc(docRef, cleanUndefined(broadcast), { merge: true }).catch((err) => {
      handleFirestoreError(err as Error, OperationType.WRITE, `systemBroadcasts/${broadcast.id}`);
    });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `systemBroadcasts/${broadcast.id}`);
  }
}

export async function updateBroadcastStatusInFirebase(id: string, isActive: boolean) {
  const current = getLocalSystemBroadcasts();
  const updatedList = current.map((b) => (b.id === id ? { ...b, isActive } : b));
  saveLocalSystemBroadcasts(updatedList);
  notifyBroadcastListeners(updatedList);

  try {
    const docRef = doc(db, 'systemBroadcasts', id);
    await setDoc(docRef, { isActive }, { merge: true });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `systemBroadcasts/${id}`);
  }
}

export async function updateBroadcastProcessedInFirebase(id: string, isProcessed: boolean) {
  const current = getLocalSystemBroadcasts();
  const nowStr = new Date().toISOString();
  const updatedList = current.map((b) =>
    b.id === id
      ? { ...b, isProcessed, processedAt: isProcessed ? nowStr : undefined }
      : b
  );
  saveLocalSystemBroadcasts(updatedList);
  notifyBroadcastListeners(updatedList);

  try {
    const docRef = doc(db, 'systemBroadcasts', id);
    await setDoc(
      docRef,
      { isProcessed, processedAt: isProcessed ? nowStr : null },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `systemBroadcasts/${id}`);
  }
}

export async function deleteBroadcastFromFirebase(id: string) {
  const current = getLocalSystemBroadcasts();
  const filtered = current.filter((b) => b.id !== id);
  saveLocalSystemBroadcasts(filtered);
  notifyBroadcastListeners(filtered);

  try {
    const docRef = doc(db, 'systemBroadcasts', id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `systemBroadcasts/${id}`);
  }
}

export async function recordBroadcastReadReceiptInFirebase(
  broadcastId: string,
  accountId: string,
  accountName: string
) {
  if (!broadcastId || !accountId) return;
  const current = getLocalSystemBroadcasts();
  const target = current.find((b) => b.id === broadcastId);
  if (!target) return;

  const existingReceipts = target.readReceipts || [];
  const existingAccountIds = target.readByAccountIds || [];

  if (existingAccountIds.includes(accountId)) return;

  const newReceipt = {
    accountId,
    accountName,
    readAt: new Date().toISOString(),
  };

  const updatedReceipts = [...existingReceipts, newReceipt];
  const updatedAccountIds = [...existingAccountIds, accountId];

  const updatedBroadcast: SystemBroadcastNotification = {
    ...target,
    readReceipts: updatedReceipts,
    readByAccountIds: updatedAccountIds,
  };

  const updatedList = current.map((b) => (b.id === broadcastId ? updatedBroadcast : b));
  saveLocalSystemBroadcasts(updatedList);
  notifyBroadcastListeners(updatedList);

  try {
    const docRef = doc(db, 'systemBroadcasts', broadcastId);
    await setDoc(docRef, {
      readReceipts: updatedReceipts,
      readByAccountIds: updatedAccountIds
    }, { merge: true }).catch((err) => {
      handleFirestoreError(err as Error, OperationType.WRITE, `systemBroadcasts/${broadcastId}`);
    });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `systemBroadcasts/${broadcastId}`);
  }
}

// --- SYSTEM BACKUP & PERIODIC AUDIT LOG EXPORT SYNC ---
const SYSTEM_BACKUPS_STORAGE_KEY = 'KIDO_SYSTEM_BACKUPS_V1';

export function getLocalSystemBackups(): SystemBackupRecord[] {
  try {
    const saved = localStorage.getItem(SYSTEM_BACKUPS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveLocalSystemBackups(backups: SystemBackupRecord[]) {
  try {
    localStorage.setItem(SYSTEM_BACKUPS_STORAGE_KEY, JSON.stringify(backups));
  } catch (err) {
    console.error('Failed to save backups to localStorage', err);
  }
}

export function subscribeSystemBackups(onUpdate: (backups: SystemBackupRecord[]) => void) {
  const colRef = collection(db, 'systemBackups');

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        const local = getLocalSystemBackups();
        onUpdate(local);
        return;
      }

      const backups: SystemBackupRecord[] = snapshot.docs.map((d) => d.data() as SystemBackupRecord);
      backups.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
      saveLocalSystemBackups(backups);
      onUpdate(backups);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'systemBackups');
      const local = getLocalSystemBackups();
      onUpdate(local);
    }
  );
}

export async function saveSystemBackupToFirebase(backup: SystemBackupRecord) {
  const current = getLocalSystemBackups();
  const filtered = current.filter((b) => b.id !== backup.id);
  const updatedList = [backup, ...filtered].sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
  saveLocalSystemBackups(updatedList);

  try {
    const docRef = doc(db, 'systemBackups', backup.id);
    await setDoc(docRef, cleanUndefined(backup), { merge: true }).catch((err) => {
      handleFirestoreError(err as Error, OperationType.WRITE, `systemBackups/${backup.id}`);
    });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `systemBackup/${backup.id}`);
  }
}

export async function deleteSystemBackupFromFirebase(id: string) {
  const current = getLocalSystemBackups();
  const filtered = current.filter((b) => b.id !== id);
  saveLocalSystemBackups(filtered);

  try {
    const docRef = doc(db, 'systemBackups', id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, `systemBackups/${id}`);
  }
}

export function triggerDownloadBackupFile(backupRecord: SystemBackupRecord, fullPayload: any) {
  try {
    const jsonStr = JSON.stringify(fullPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateTag = new Date(backupRecord.timestampMs).toISOString().slice(0, 10);
    const fileName = `KIDO_SystemBackup_${backupRecord.backupType === 'auto_periodic' ? 'AUTO' : 'MANUAL'}_${dateTag}_${backupRecord.id.slice(-6)}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download backup failed:', err);
  }
}

// --- VIP PROMOTION SYNC ---
const VIP_PROMOTION_STORAGE_KEY = 'KIDO_VIP_PROMOTION_CONFIG_V1';

export function getLocalVipPromotion(): VipPromotionConfig {
  try {
    const saved = localStorage.getItem(VIP_PROMOTION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : sampleVipPromotion;
  } catch {
    return sampleVipPromotion;
  }
}

export function saveLocalVipPromotion(promo: VipPromotionConfig) {
  try {
    localStorage.setItem(VIP_PROMOTION_STORAGE_KEY, JSON.stringify(promo));
  } catch (err) {
    console.error('Failed to save VIP promotion to localStorage', err);
  }
}

export function subscribeVipPromotion(onUpdate: (promo: VipPromotionConfig) => void) {
  const docRef = doc(db, 'systemConfigs', 'vipPromotion');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        const local = getLocalVipPromotion();
        onUpdate(local);
        return;
      }

      const promo = snapshot.data() as VipPromotionConfig;
      saveLocalVipPromotion(promo);
      onUpdate(promo);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'systemConfigs/vipPromotion');
      const local = getLocalVipPromotion();
      onUpdate(local);
    }
  );
}

export async function saveVipPromotionToFirebase(promo: VipPromotionConfig) {
  saveLocalVipPromotion(promo);
  try {
    const docRef = doc(db, 'systemConfigs', 'vipPromotion');
    await setDoc(docRef, cleanUndefined(promo), { merge: true }).catch((err) => {
      handleFirestoreError(err as Error, OperationType.WRITE, 'systemConfigs/vipPromotion');
    });
  } catch (err) {
    handleFirestoreError(err as Error, OperationType.WRITE, 'systemConfigs/vipPromotion');
  }
}
