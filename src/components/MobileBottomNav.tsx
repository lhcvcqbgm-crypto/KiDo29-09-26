import React from 'react';
import { Home, Map, Trophy, User } from 'lucide-react';
import { ActiveTab, UserRole } from '../types';
import { audioService } from '../utils/audio';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole?: UserRole;
  userStars?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  userRole = 'kid',
  userStars = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Bảng điều khiển',
      shortLabel: 'Bảng ĐK',
      icon: Home,
      isActive: activeTab === 'dashboard' || activeTab === 'home',
      badge: null,
    },
    {
      id: 'roadmap',
      label: 'Lộ trình',
      shortLabel: 'Lộ trình',
      icon: Map,
      isActive: activeTab === 'roadmap' || activeTab.startsWith('grade-'),
      badge: null,
    },
    {
      id: 'games',
      label: 'Phần thưởng',
      shortLabel: 'Thưởng',
      icon: Trophy,
      isActive: activeTab === 'games' || activeTab === 'rewards',
      badge: userStars > 0 ? `⭐${userStars}` : null,
    },
    {
      id: 'settings',
      label: 'Hồ sơ',
      shortLabel: 'Hồ sơ',
      icon: User,
      isActive: activeTab === 'settings' || activeTab === 'profile',
      badge: null,
    },
  ];

  const handleTabClick = (tabId: string) => {
    audioService.playClickSound();
    setActiveTab(tabId);
  };

  return (
    <nav
      aria-label="Điều hướng di động"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] transition-all select-none pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto px-3 py-1 flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
                active
                  ? 'text-[#1d50b4] font-black'
                  : 'text-slate-500 hover:text-slate-700 font-semibold'
              }`}
            >
              {/* Active Background Glow / Indicator */}
              {active && (
                <span className="absolute inset-0 bg-blue-50/90 rounded-2xl border border-blue-200/60 -z-10 shadow-xs animate-fadeIn" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    active ? 'scale-110 stroke-[2.6px]' : 'stroke-[1.9px]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 text-[9px] font-black px-1 py-0.2 rounded-full bg-amber-400 text-amber-950 shadow-xs border border-white">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Tab Title Label */}
              <span className="text-[10px] sm:text-[11px] mt-1 leading-tight tracking-tight text-center">
                {tab.label}
              </span>

              {/* Active Dot Pip */}
              {active && (
                <span className="w-1.5 h-1.5 bg-[#1d50b4] rounded-full mt-0.5 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
