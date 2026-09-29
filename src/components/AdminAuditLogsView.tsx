import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Clock, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  X,
  History,
  RotateCcw
} from 'lucide-react';
import { AccountAuditLog, UserAccount } from '../types';
import { subscribeAccountAuditLogs } from '../lib/firebaseSync';
import { audioService } from '../utils/audio';

interface AdminAuditLogsViewProps {
  onClose?: () => void;
  onRevertLog?: (log: AccountAuditLog) => void;
  accounts?: UserAccount[];
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({
  onClose,
  onRevertLog,
  accounts = [],
}) => {
  const [logs, setLogs] = useState<AccountAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'role' | 'vip' | 'other'>('all');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AccountAuditLog | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('vi-VN'));
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Real-time Firestore Subscription for Account Audit Logs
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAccountAuditLogs((updatedLogs) => {
      setLogs(updatedLogs || []);
      setLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Filter helper functions
  const isRoleChange = (log: AccountAuditLog) => {
    const type = (log.actionType || '').toLowerCase();
    const title = (log.actionTitle || '').toLowerCase();
    const details = (log.details || '').toLowerCase();
    return (
      type === 'role_change' ||
      type.includes('role') ||
      title.includes('vai trò') ||
      title.includes('role') ||
      title.includes('thăng cấp') ||
      title.includes('hạ cấp') ||
      details.includes('vai trò') ||
      details.includes('role')
    );
  };

  const isVipUpdate = (log: AccountAuditLog) => {
    const type = (log.actionType || '').toLowerCase();
    const title = (log.actionTitle || '').toLowerCase();
    const details = (log.details || '').toLowerCase();
    return (
      type === 'vip_update' ||
      type.includes('vip') ||
      title.includes('vip') ||
      title.includes('gia hạn') ||
      title.includes('hết hạn') ||
      title.includes('nâng cấp vip') ||
      title.includes('hủy vip') ||
      details.includes('vip') ||
      details.includes('hạn vip')
    );
  };

  // Filtered logs calculation
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      // 1. Tab Type Filter
      if (activeFilter === 'role' && !isRoleChange(log)) return false;
      if (activeFilter === 'vip' && !isVipUpdate(log)) return false;
      if (activeFilter === 'other' && (isRoleChange(log) || isVipUpdate(log))) return false;

      // 2. Date Filter
      if (dateFilter) {
        const logDate = log.timestamp || '';
        if (!logDate.includes(dateFilter)) return false;
      }

      // 3. Search Query
      if (q) {
        const targetName = (log.targetAccountName || log.targetName || '').toLowerCase();
        const actorName = (log.actorName || log.adminName || '').toLowerCase();
        const actionTitle = (log.actionTitle || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const oldVal = (log.oldValue || '').toLowerCase();
        const newVal = (log.newValue || '').toLowerCase();

        const match =
          targetName.includes(q) ||
          actorName.includes(q) ||
          actionTitle.includes(q) ||
          details.includes(q) ||
          oldVal.includes(q) ||
          newVal.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [logs, activeFilter, dateFilter, searchQuery]);

  // Statistics
  const totalCount = logs.length;
  const roleChangeCount = useMemo(() => logs.filter(isRoleChange).length, [logs]);
  const vipUpdateCount = useMemo(() => logs.filter(isVipUpdate).length, [logs]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const currentLogs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, page, itemsPerPage]);

  const handleExportCsv = () => {
    audioService.playClickSound();
    if (filteredLogs.length === 0) return;

    const headers = ['Thời gian', 'Người thực hiện', 'Tài khoản mục tiêu', 'Hành động', 'Giá trị cũ', 'Giá trị mới', 'Chi tiết'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp || ''}"`,
      `"${l.actorName || l.adminName || 'Admin'}"`,
      `"${l.targetAccountName || l.targetName || ''}"`,
      `"${l.actionTitle || ''}"`,
      `"${(l.oldValue || '').replace(/"/g, '""')}"`,
      `"${(l.newValue || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KIDO_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (log: AccountAuditLog) => {
    if (isVipUpdate(log)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
          <Crown size={12} className="text-amber-600" />
          <span>Trạng thái VIP</span>
        </span>
      );
    }
    if (isRoleChange(log)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
          <UserCheck size={12} className="text-purple-600" />
          <span>Đổi vai trò</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <ShieldCheck size={12} className="text-slate-500" />
        <span>Quản trị chung</span>
      </span>
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/20">
            📋
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Nhật Ký Kiểm Toán Quản Trị
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Firestore
              </span>
            </div>
            <p className="text-xs text-indigo-200 font-medium mt-0.5">
              Theo dõi lịch sử thay đổi vai trò tài khoản & cập nhật trạng thái VIP tức thời từ Firestore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[11px] text-slate-300 font-medium hidden sm:inline-block">
            Cập nhật: <strong className="text-white">{lastSyncTime}</strong>
          </span>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 cursor-pointer disabled:opacity-40"
            title="Xuất file CSV"
          >
            <Download size={14} />
            <span>Xuất CSV</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition cursor-pointer"
              title="Đóng nhật ký"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="p-4 sm:p-6 bg-slate-50/80 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Sự Kiện</p>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{totalCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Lưu trữ trên Firestore</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 p-3 sm:p-4 rounded-2xl border border-purple-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Đổi Vai Trò</p>
            <UserCheck size={16} className="text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-900 mt-1">{roleChangeCount}</p>
          <p className="text-[10px] text-purple-600/80 mt-0.5">Kid ⇄ Parent ⇄ Admin</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-3 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Cập Nhật VIP</p>
            <Crown size={16} className="text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">{vipUpdateCount}</p>
          <p className="text-[10px] text-amber-700/80 mt-0.5">Kích hoạt & Gia hạn</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hiển Thị</p>
          <p className="text-xl sm:text-2xl font-black text-blue-700 mt-1">{filteredLogs.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Khớp bộ lọc hiện tại</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 sm:p-6 space-y-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                setActiveFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất Cả ({totalCount})
            </button>

            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                setActiveFilter('role');
                setPage(1);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'role'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 hover:bg-purple-100/60'
              }`}
            >
              <UserCheck size={13} />
              <span>Đổi Vai Trò ({roleChangeCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                setActiveFilter('vip');
                setPage(1);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'vip'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100/60'
              }`}
            >
              <Crown size={13} />
              <span>Cập Nhật VIP ({vipUpdateCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioService.playClickSound();
                setActiveFilter('other');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'other'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khác
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên học sinh, admin, nội dung..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Entries List / Table */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw size={32} className="animate-spin mx-auto text-indigo-600" />
            <p className="text-sm font-bold text-slate-600">Đang đồng bộ nhật ký kiểm toán từ Firestore...</p>
          </div>
        ) : currentLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-2xl mx-auto text-slate-500">
              🔍
            </div>
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy bản ghi kiểm toán</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không có sự kiện nào khớp với tiêu chí tìm kiếm hoặc chưa có thao tác thay đổi vai trò / VIP nào được ghi nhận.
            </p>
            {(searchQuery || activeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentLogs.map((log) => {
              const isRole = isRoleChange(log);
              const isVip = isVipUpdate(log);

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-2xl border transition-all duration-150 hover:shadow-md ${
                    isVip
                      ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                      : isRole
                      ? 'bg-purple-50/40 border-purple-200/80 hover:border-purple-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Badge, Action Title, Target */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getActionBadge(log)}
                        <span className="text-xs font-black text-slate-800">
                          {log.actionTitle || 'Thao tác tài khoản'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock size={11} />
                          {log.timestamp}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>
                          👤 Mục tiêu: <strong className="text-slate-900 font-extrabold">{log.targetAccountName || log.targetName || 'Tài khoản'}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          🛡️ Người thực hiện: <strong className="text-indigo-700 font-bold">{log.actorName || log.adminName || 'Admin'}</strong>
                        </span>
                      </div>

                      {/* Diff Visualization (Old Value -> New Value) */}
                      {(log.oldValue || log.newValue) && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-400 font-bold text-[11px]">Thay đổi:</span>
                          {log.oldValue && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-[11px] line-through">
                              {log.oldValue}
                            </span>
                          )}
                          <ArrowRight size={13} className="text-slate-400" />
                          {log.newValue && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                              {log.newValue}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Detail Text */}
                      {log.details && (
                        <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                          📌 {log.details}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          audioService.playClickSound();
                          setSelectedLogForDetail(log);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        title="Xem chi tiết kỹ thuật"
                      >
                        <Eye size={13} />
                        <span>Chi tiết</span>
                      </button>

                      {onRevertLog && (
                        <button
                          type="button"
                          onClick={() => {
                            audioService.playClickSound();
                            onRevertLog(log);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold transition cursor-pointer"
                          title="Hoàn tác thao tác này"
                        >
                          <RotateCcw size={13} />
                          <span>Khôi phục</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> ({filteredLogs.length} bản ghi)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <h3 className="text-base font-black text-slate-800">
                  Chi Tiết Sự Kiện Kiểm Toán
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForDetail(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <p>
                  <span className="text-slate-400 font-semibold">Mã sự kiện:</span>{' '}
                  <code className="text-slate-800 font-mono font-bold">{selectedLogForDetail.id}</code>
                </p>
                <p>
                  <span className="text-slate-400 font-semibold">Thời gian:</span>{' '}
                  <strong className="text-slate-800">{selectedLogForDetail.timestamp}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-semibold">Quản trị viên:</span>{' '}
                  <strong className="text-indigo-700">{selectedLogForDetail.actorName || selectedLogForDetail.adminName || 'Admin'}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-semibold">Tài khoản đích:</span>{' '}
                  <strong className="text-slate-900">{selectedLogForDetail.targetAccountName || selectedLogForDetail.targetName}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-semibold">Hành động:</span>{' '}
                  <strong className="text-blue-700">{selectedLogForDetail.actionTitle}</strong>
                </p>
              </div>

              {selectedLogForDetail.details && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <p className="font-bold text-blue-900 mb-1">Mô tả chi tiết:</p>
                  <p className="text-blue-800 leading-relaxed">{selectedLogForDetail.details}</p>
                </div>
              )}

              {selectedLogForDetail.adminNote && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <p className="font-bold text-amber-900 mb-1">Ghi chú quản trị viên:</p>
                  <p className="text-amber-800 leading-relaxed">{selectedLogForDetail.adminNote}</p>
                </div>
              )}

              {/* Raw JSON Payload */}
              <div>
                <p className="font-bold text-slate-700 mb-1">Dữ liệu thô (JSON Firestore):</p>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLogForDetail, null, 2)}
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedLogForDetail(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs cursor-pointer transition shadow-md"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
