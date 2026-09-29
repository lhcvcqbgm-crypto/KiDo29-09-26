import React from 'react';
import { 
  ArrowRight, 
  Target, 
  ChevronRight, 
  BookOpen, 
  Languages, 
  Clock, 
  Pin, 
  Star, 
  Crown, 
  Ribbon, 
  Gamepad2, 
  Map, 
  Network, 
  Edit3 
} from 'lucide-react';
import { UserProfile, UnitLesson, ActiveTab } from '../types';
import { audioService } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';
import { getUserLevelAndXp } from '../utils/levelSystem';
import { RecentActivityFeed } from './RecentActivityFeed';

interface DashboardProps {
  user: UserProfile;
  units: UnitLesson[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  units,
  setActiveTab,
  onOpenReportModal,
}) => {
  const { lang, t } = useLanguage();

  const handleCardClick = (tab: ActiveTab) => {
    audioService.playClickSound();
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6 select-none font-sans w-full pb-4">
      {/* 1. HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white overflow-hidden shadow-lg border border-sky-300/30">
        {/* Background Decorative Ripples */}
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-12 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-xs font-black uppercase tracking-wider border border-white/20">
            <span>🌟</span>
            <span>{t('Học Tiếng Anh Kido', 'Kido English World')}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight uppercase drop-shadow-xs">
            {t('HỌC TIẾNG ANH THẬT VUI', 'LEARN ENGLISH WITH FUN')}
          </h1>

          <p className="text-xs sm:text-sm font-medium text-sky-100 leading-relaxed max-w-md">
            {t(
              'Cùng học từ vựng, luyện phát âm chuẩn bản xứ và khám phá các trò chơi thú vị với chú khủng long Kido nhé!',
              'Learn vocabulary, practice native pronunciation, and explore fun games with Kido the dinosaur!'
            )}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleCardClick('grade-1')}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer active:scale-95"
            >
              <span>{t('Bắt đầu học ngay', 'Start Learning Now')}</span>
              <ArrowRight size={18} className="text-slate-950" />
            </button>

            <button
              type="button"
              onClick={() => handleCardClick('roadmap')}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
            >
              <Map size={16} />
              <span>{t('Xem lộ trình', 'View Roadmap')}</span>
            </button>
          </div>
        </div>

        {/* 3D Kido Mascot Illustration */}
        <div className="absolute top-1/2 -translate-y-1/2 right-6 sm:right-8 w-36 sm:w-48 h-36 sm:h-48 pointer-events-none hidden md:flex items-center justify-center">
          <div className="w-full h-full relative flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full bg-white/25 blur-2xl animate-pulse" />
            <div className="text-7xl sm:text-8xl drop-shadow-2xl animate-bounce duration-1000">
              🦖
            </div>
            <div className="absolute bottom-2 right-2 text-3xl">
              🧱
            </div>
          </div>
        </div>
      </div>

      {/* 2. GOAL & REPORT BANNER */}
      {(() => {
        const { level: calculatedLevel, xp: currentXp, maxXp } = getUserLevelAndXp(user.stars, user.level, user.xp);
        const starsNeeded = Math.max(0, maxXp - currentXp);

        return (
          <div 
            onClick={() => {
              audioService.playClickSound();
              onOpenReportModal();
            }}
            className="bg-white border border-indigo-100 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:border-indigo-300 hover:shadow-md group shadow-xs"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Target size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                    <span>{t('Mục Tiêu & Báo Cáo Học Tập Của Bé!', 'Learning Goals & Progress Report!')}</span>
                    <span>🏆</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-300/80">
                    Cấp {calculatedLevel}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  {t(
                    `Bé đã đạt Cấp độ ${calculatedLevel} với ${user.stars} sao vàng. Chỉ còn ${starsNeeded} sao nữa là lên Cấp độ ${calculatedLevel + 1}! Nhấp để xem báo cáo chi tiết nhé!`,
                    `Reached level ${calculatedLevel} with ${user.stars} stars. Only ${starsNeeded} stars left to reach Level ${calculatedLevel + 1}! Click to view detailed report!`
                  )}
                </p>
              </div>
            </div>

            <button className="self-end sm:self-center px-4 py-2 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-extrabold text-xs transition flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span>{t('Xem Báo Cáo', 'View Report')}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        );
      })()}

      {/* 3. TIẾN ĐỘ HỌC TẬP (LEARNING PROGRESS SECTION) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block" />
            <span>{t('Tiến độ học tập', 'Learning Progress')}</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {user.completedLessonsCount}/{user.totalLessonsCount} {t('Hoàn thành', 'Completed')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Completed Lessons */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition">
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-emerald-800">
                {t('Bài học đã hoàn thành', 'Completed Lessons')}
              </p>
              <h4 className="text-2xl font-black text-emerald-950">
                {user.completedLessonsCount}/{user.totalLessonsCount}
              </h4>
              <div className="w-28 h-2 bg-emerald-200/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, (user.completedLessonsCount / (user.totalLessonsCount || 1)) * 100))}%` }}
                />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen size={22} />
            </div>
          </div>

          {/* Card 2: Vocab Learned */}
          <div className="bg-purple-50/70 border border-purple-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition">
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-purple-800">
                {t('Từ vựng đã học', 'Vocabulary Learned')}
              </p>
              <h4 className="text-2xl font-black text-purple-950">
                {user.learnedVocabCount}/{user.totalVocabCount}
              </h4>
              <div className="w-28 h-2 bg-purple-200/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, (user.learnedVocabCount / (user.totalVocabCount || 1)) * 100))}%` }}
                />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Languages size={22} />
            </div>
          </div>

          {/* Card 3: Study Time */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition">
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-amber-800">
                {t('Thời gian học tập', 'Study Time')}
              </p>
              <h4 className="text-2xl font-black text-amber-950">
                {user.studyTimeMinutes}m
              </h4>
              <div className="w-28 h-2 bg-amber-200/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: '60%' }}
                />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY FEED (REALTIME FIREBASE SYNC: LESSON COMPLETIONS & STAR AWARDS) */}
      <RecentActivityFeed user={user} setActiveTab={setActiveTab} />

      {/* 4. HỌC TIẾP BÀI TRƯỚC (CONTINUE PREVIOUS LESSONS) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-5 bg-sky-500 rounded-full inline-block" />
            <span>{t('Học tiếp bài trước', 'Continue Previous Lessons')}</span>
          </h3>
          <button 
            type="button"
            onClick={() => handleCardClick('grade-1')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition"
          >
            <span>{t('Tất cả bài học', 'All Lessons')}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {units.map((unit) => {
            const isBlue = unit.tagColor === 'blue';
            const isGreen = unit.tagColor === 'green';
            const isPurple = unit.tagColor === 'purple';

            return (
              <div
                key={unit.id}
                onClick={() => handleCardClick('grade-1')}
                className={`group rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between ${
                  isBlue ? 'bg-sky-50/50 border-sky-200 hover:border-sky-400' :
                  isGreen ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400' :
                  isPurple ? 'bg-purple-50/50 border-purple-200 hover:border-purple-400' :
                  'bg-pink-50/50 border-pink-200 hover:border-pink-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs ${
                      isBlue ? 'bg-sky-500' : isGreen ? 'bg-emerald-500' : isPurple ? 'bg-purple-500' : 'bg-pink-500'
                    }`}>
                      {unit.iconType === 'pin' && <Pin size={15} />}
                      {unit.iconType === 'star' && <Star size={15} />}
                      {unit.iconType === 'crown' && <Crown size={15} />}
                      {unit.iconType === 'ribbon' && <Ribbon size={15} />}
                    </div>

                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                      unit.progressPercent > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {unit.progressPercent}%
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition truncate">
                      {unit.title}
                    </h4>
                    <p className="text-xs font-medium text-slate-500 line-clamp-2 mt-0.5 min-h-[32px]">
                      {unit.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>{unit.completedLessons}/{unit.totalLessons} {t('bài học', 'lessons')}</span>
                  <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform font-extrabold flex items-center gap-0.5">
                    <span>Học</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. KHÁM PHÁ NỘI DUNG HỌC TẬP (EXPLORE CONTENT CARDS) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-xs">
        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span className="w-2 h-5 bg-amber-500 rounded-full inline-block" />
          <span>{t('Khám phá nội dung học tập', 'Explore Learning Content')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Trò chơi */}
          <div 
            onClick={() => handleCardClick('games')}
            className="bg-pink-50/80 hover:bg-pink-100 border border-pink-200/90 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all hover:-translate-y-0.5 shadow-2xs hover:shadow-xs group"
          >
            <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Gamepad2 size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-pink-950 group-hover:text-pink-700 transition">
                {t('Trò chơi', 'Games & Rewards')}
              </h4>
              <p className="text-xs font-semibold text-pink-700/80 mt-0.5">
                {t('Học tiếng Anh cực vui', 'Fun English Learning')}
              </p>
            </div>
          </div>

          {/* Card 2: Roadmap học tập */}
          <div 
            onClick={() => handleCardClick('roadmap')}
            className="bg-sky-50/80 hover:bg-sky-100 border border-sky-200/90 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all hover:-translate-y-0.5 shadow-2xs hover:shadow-xs group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Map size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-sky-950 group-hover:text-sky-700 transition">
                {t('Roadmap học tập', 'Learning Roadmap')}
              </h4>
              <p className="text-xs font-semibold text-sky-700/80 mt-0.5">
                {t('Lộ trình bài học các khối lớp', 'Grade curriculum roadmap')}
              </p>
            </div>
          </div>

          {/* Card 3: MindMap bài học */}
          <div 
            onClick={() => handleCardClick('mind-thinking')}
            className="bg-cyan-50/80 hover:bg-cyan-100 border border-cyan-200/90 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all hover:-translate-y-0.5 shadow-2xs hover:shadow-xs group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Network size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-cyan-950 group-hover:text-cyan-700 transition">
                {t('MindMap bài học', 'Lesson MindMap')}
              </h4>
              <p className="text-xs font-semibold text-cyan-700/80 mt-0.5">
                {t('Sơ đồ tư duy nghe & nói', 'Listening & Speaking mind map')}
              </p>
            </div>
          </div>

          {/* Card 4: Đề ôn thi */}
          <div 
            onClick={() => handleCardClick('sample-exams')}
            className="bg-amber-50/80 hover:bg-amber-100 border border-amber-200/90 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all hover:-translate-y-0.5 shadow-2xs hover:shadow-xs group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Edit3 size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 group-hover:text-amber-700 transition">
                {t('Đề ôn thi', 'Sample Exams')}
              </h4>
              <p className="text-xs font-semibold text-amber-700/80 mt-0.5">
                {t('Đề thi & bài tập ôn luyện', 'Exams & practice tests')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
