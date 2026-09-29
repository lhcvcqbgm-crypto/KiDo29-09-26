import React, { useState } from 'react';
import { 
  Trophy, 
  Star, 
  Flame, 
  LogOut, 
  ArrowLeft,
  Volume2,
  Check,
  RotateCcw,
  FileText,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types';
import { audioService } from '../utils/audio';
import { gradeUnitsData, GradeUnit } from '../data/gradeUnitsData';
import { grade1VocabList } from '../data/grade1VocabData';
import { grade2VocabList } from '../data/grade2VocabData';
import { grade3VocabList } from '../data/grade3VocabData';
import { grade4VocabList } from '../data/grade4VocabData';
import { grade5VocabList } from '../data/grade5VocabData';
import { getUnitVocabList } from '../data/unitVocabMapper';
import { StickerCardGraphic } from './StickerCardGraphic';
import { VocabIllustrationGraphic } from './VocabIllustrationGraphic';

interface FlashCardViewProps {
  user: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onAddStars?: (amount: number) => void;
  onLogout?: () => void;
}

export const FlashCardView: React.FC<FlashCardViewProps> = ({
  user,
  setActiveTab,
  onAddStars,
  onLogout,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<GradeUnit | null>(null);

  // Flashcard practice session state inside a unit
  const [cardIdx, setCardIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);

  const currentUnits = gradeUnitsData[selectedGrade] || gradeUnitsData[1];

  const handleSelectUnit = (unit: GradeUnit) => {
    audioService.playClickSound();
    setSelectedUnit(unit);
    setCardIdx(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
  };

  const handleBackToUnits = () => {
    audioService.playClickSound();
    setSelectedUnit(null);
  };

  const currentVocabList = (selectedUnit
    ? getUnitVocabList(selectedGrade, selectedUnit.unitNumber)
    : (selectedGrade === 2
      ? grade2VocabList
      : selectedGrade === 3
      ? grade3VocabList
      : selectedGrade === 4
      ? grade4VocabList
      : selectedGrade === 5
      ? grade5VocabList
      : grade1VocabList)) || [];

  const currentCard = (currentVocabList && currentVocabList.length > 0)
    ? currentVocabList[cardIdx % currentVocabList.length]
    : { id: 0, word: '', phonetic: '', meaningVi: '' };

  const handleNextCard = () => {
    if (!currentVocabList || currentVocabList.length === 0) return;
    audioService.playClickSound();
    setIsFlipped(false);
    setCardIdx((prev) => (prev < currentVocabList.length - 1 ? prev + 1 : currentVocabList.length - 1));
  };

  const handlePrevCard = () => {
    if (!currentVocabList || currentVocabList.length === 0) return;
    if (cardIdx === 0) return;
    audioService.playClickSound();
    setIsFlipped(false);
    setCardIdx((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleMarkMastered = () => {
    audioService.playSuccessSound();
    if (onAddStars) onAddStars(2);
    const newSet = new Set(masteredCards);
    newSet.add(cardIdx);
    setMasteredCards(newSet);
    setIsFlipped(false);

    if (cardIdx < currentVocabList.length - 1) {
      setCardIdx((prev) => prev + 1);
    } else {
      const unmasteredIdx = currentVocabList.findIndex((_, idx) => !newSet.has(idx));
      if (unmasteredIdx !== -1 && newSet.size < currentVocabList.length) {
        setCardIdx(unmasteredIdx);
      }
    }
  };

  const handleMarkNotMastered = () => {
    audioService.playClickSound();
    setMasteredCards((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(cardIdx);
      return nextSet;
    });
    setIsFlipped(false);
  };

  return (
    <div className="space-y-4 select-none font-sans animate-fadeIn">
      {/* Navigation Sub-bar */}
      <div className="flex items-center justify-between gap-3">
        <button 
          onClick={() => {
            audioService.playClickSound();
            if (selectedUnit) {
              setSelectedUnit(null);
            } else if (setActiveTab) {
              setActiveTab('home');
            }
          }}
          className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-[#1d50b4] rounded-2xl text-xs sm:text-sm font-extrabold border border-sky-200 cursor-pointer transition flex items-center gap-1.5 shadow-2xs active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>{selectedUnit ? 'Quay Lại bài học' : 'Quay lại trang chủ'}</span>
        </button>
      </div>

      {!selectedUnit ? (
        /* Unit Selection Grid & Grade Selection Tabs */
        <div className="space-y-4">
          {/* Grade Selector Tabs (Matching Image 1 Colors 100%) */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {/* Lớp 1 Tab */}
            <button
              onClick={() => {
                audioService.playClickSound();
                setSelectedGrade(1);
                setSelectedUnit(null);
              }}
              className={`py-2.5 sm:py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center border ${
                selectedGrade === 1
                  ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-sm'
                  : 'bg-[#fdf2f8] text-[#ec4899] border-[#fbcfe8] hover:bg-pink-100'
              }`}
            >
              Lớp 1
            </button>

            {/* Lớp 2 Tab */}
            <button
              onClick={() => {
                audioService.playClickSound();
                setSelectedGrade(2);
                setSelectedUnit(null);
              }}
              className={`py-2.5 sm:py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center border ${
                selectedGrade === 2
                  ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                  : 'bg-[#fff7ed] text-[#ea580c] border-[#ffedd5] hover:bg-orange-100'
              }`}
            >
              Lớp 2
            </button>

            {/* Lớp 3 Tab */}
            <button
              onClick={() => {
                audioService.playClickSound();
                setSelectedGrade(3);
                setSelectedUnit(null);
              }}
              className={`py-2.5 sm:py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center border ${
                selectedGrade === 3
                  ? 'bg-[#00b4d8] text-white border-[#00b4d8] shadow-sm'
                  : 'bg-[#ecfeff] text-[#0284c7] border-[#cffaff] hover:bg-cyan-100'
              }`}
            >
              Lớp 3
            </button>

            {/* Lớp 4 Tab */}
            <button
              onClick={() => {
                audioService.playClickSound();
                setSelectedGrade(4);
                setSelectedUnit(null);
              }}
              className={`py-2.5 sm:py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center border ${
                selectedGrade === 4
                  ? 'bg-[#10b981] text-white border-[#10b981] shadow-sm'
                  : 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0] hover:bg-emerald-100'
              }`}
            >
              Lớp 4
            </button>

            {/* Lớp 5 Tab */}
            <button
              onClick={() => {
                audioService.playClickSound();
                setSelectedGrade(5);
                setSelectedUnit(null);
              }}
              className={`py-2.5 sm:py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center border ${
                selectedGrade === 5
                  ? 'bg-[#9333ea] text-white border-[#9333ea] shadow-sm'
                  : 'bg-[#faf5ff] text-[#9333ea] border-[#f3e8ff] hover:bg-purple-100'
              }`}
            >
              Lớp 5
            </button>
          </div>

          <h2 className="text-sm sm:text-base font-extrabold text-slate-800 pt-1">
            Chọn chủ đề học tập Flashcard (Lớp {selectedGrade}):
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {currentUnits.map((unit, idx) => {
              let iconBg = 'bg-pink-100 text-pink-600';
              if (unit.colorType === 'yellow') iconBg = 'bg-amber-100 text-amber-600';
              else if (unit.colorType === 'green') iconBg = 'bg-emerald-100 text-emerald-600';
              else if (unit.colorType === 'blue') iconBg = 'bg-sky-100 text-sky-600';
              else if (unit.colorType === 'purple') iconBg = 'bg-purple-100 text-purple-600';
              else if (unit.colorType === 'cyan') iconBg = 'bg-cyan-100 text-cyan-600';
              else if (unit.colorType === 'rose' || unit.colorType === 'red') iconBg = 'bg-rose-100 text-rose-600';

              return (
                <div
                  key={`fc-unit-g${selectedGrade}-${unit.id}-${idx}`}
                  className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-black shrink-0 ${iconBg}`}>
                      {unit.icon || '🎒'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-extrabold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#1d50b4] transition">
                        {unit.title}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
                        {unit.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectUnit(unit)}
                    className="w-full py-2 px-3 bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Học Thẻ Bài</span>
                    <FileText size={14} className="opacity-90" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Flashcard Practice Mode matching Sample Image 2 100% */
        <div className="w-full max-w-md mx-auto py-2 space-y-4">

          {/* Main Outer Phone Frame Container with Blue Border (Matching Image 2) */}
          <div className="bg-white rounded-[2.5rem] border-4 border-[#3b82f6] shadow-md p-5 sm:p-6 space-y-4 text-center relative">
            {/* Header Box inside Phone Frame */}
            <div className="bg-[#f8fafc] border border-sky-100 rounded-2xl p-4 text-center space-y-2 shadow-2xs">
              <div className="px-4 py-1.5 rounded-full bg-[#e0f2fe] text-[#0284c7] text-xs font-black inline-block">
                {selectedUnit.subtitle || 'Thông tin cá nhân và sở thích'}
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#1e293b] tracking-tight">
                {selectedUnit.title}
              </h3>
            </div>

            {/* Sub-bar Statistics & Thin Progress Line */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700 px-1">
                <span>Thẻ {cardIdx + 1} / {currentVocabList.length}</span>
                <span>
                  Đã thuộc: <strong className="text-[#10b981] font-black">{masteredCards.size} / {currentVocabList.length}</strong>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#10b981] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (masteredCards.size / currentVocabList.length) * 100)}%` }}
                />
              </div>
            </div>

            {/* Central Interactive Flash Card or Completion View (Matching Image 4) */}
            {masteredCards.size >= currentVocabList.length && currentVocabList.length > 0 ? (
              /* Completion Screen Matching Image 4 100% */
              <div className="w-full rounded-[1.75rem] border-3 border-[#facc15] bg-[#fffdf5] p-5 sm:p-6 flex flex-col items-center justify-between text-center relative shadow-2xs space-y-4 select-none animate-fadeIn">
                {/* Trophy graphic */}
                <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center text-5xl shadow-2xs border border-amber-200">
                  🏆
                </div>

                {/* Main Heading */}
                <h2 className="text-2xl sm:text-3xl font-black text-[#1d50b4] tracking-tight">
                  Bé Học Siêu Quá!
                </h2>

                {/* Subtext */}
                <p className="text-xs sm:text-sm font-extrabold text-slate-600 max-w-xs leading-relaxed">
                  Bé yêu đã hoàn thành học và ghi nhớ tất cả thẻ bài từ vựng của bài học này!
                </p>

                {/* Yellow Dashed Reward Box */}
                <div className="w-full border-2 border-dashed border-[#facc15] bg-[#fefce8] rounded-2xl p-3.5 text-center space-y-1">
                  <p className="text-xs font-black text-amber-800">
                    Phần thưởng của bé:
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-[#d97706] flex items-center justify-center gap-1.5">
                    <span>🌟</span>
                    <span>+5 Sao Vàng</span>
                  </p>
                </div>

                {/* Main Yellow/Orange Button */}
                <button
                  onClick={() => {
                    audioService.playSuccessSound();
                    setShowRewardModal(true);
                  }}
                  className="w-full py-4 px-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:from-[#d97706] hover:to-[#ea580c] text-white font-black text-sm sm:text-base rounded-2xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-amber-400"
                >
                  <span>Nhận Quà & Quay Lại Lộ Trình</span>
                  <span className="text-lg">🎁</span>
                </button>
              </div>
            ) : (
              /* Central Interactive Flash Card with Blue Border (Matching Image 2) */
              <div
                onClick={() => {
                  audioService.playClickSound();
                  setIsFlipped(!isFlipped);
                }}
                className="w-full min-h-[310px] sm:min-h-[340px] rounded-[1.75rem] border-3 border-[#3b82f6] bg-white p-5 flex flex-col items-center justify-between text-center cursor-pointer relative shadow-2xs transition hover:shadow-md select-none"
              >
                {!isFlipped ? (
                  <div className="w-full flex-1 flex flex-col items-center justify-between my-auto space-y-3 py-2 animate-fadeIn">
                    {/* Visual Graphic Illustration Card (Matching Image 2) */}
                    <VocabIllustrationGraphic word={currentCard.word} size="md" />

                    {/* Word (Large Bold Dark Text) */}
                    <h2 className="text-3xl sm:text-4xl font-black text-[#1e293b] tracking-tight">
                      {currentCard.word}
                    </h2>
                    
                    {/* Audio Playback Buttons Row */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => audioService.playEnglishWord(currentCard.word, (currentCard as any).audioEnUrl || (currentCard as any).audioDriveId)}
                        className="rounded-xl bg-blue-100 hover:bg-blue-200 px-3 py-1.5 text-xs font-black text-blue-800 flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Nghe phát âm tiếng Anh chuẩn"
                      >
                        <Volume2 size={13} />
                        <span>Phát âm EN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => audioService.playVietnameseMeaning(currentCard.meaningVi, (currentCard as any).audioViUrl)}
                        className="rounded-xl bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 text-xs font-black text-emerald-800 flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Nghe giải nghĩa tiếng Việt"
                      >
                        <span>🇻🇳</span>
                        <span>Nghĩa VI</span>
                      </button>

                      {((currentCard as any).example || (currentCard as any).audioExampleEnUrl) && (
                        <button
                          type="button"
                          onClick={() => audioService.playEnglishSentence((currentCard as any).example || currentCard.word, (currentCard as any).audioExampleEnUrl)}
                          className="rounded-xl bg-purple-100 hover:bg-purple-200 px-2.5 py-1.5 text-xs font-bold text-purple-800 flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                          title="Nghe câu ví dụ tiếng Anh"
                        >
                          <span>💬</span>
                          <span>Ví dụ EN</span>
                        </button>
                      )}
                    </div>

                    {/* Phonetic (Bright Sky Blue) */}
                    <p className="text-sm sm:text-base font-bold text-[#0284c7]">
                      {currentCard.phonetic}
                    </p>

                    {/* Bottom Hint Pill inside Card */}
                    <div className="px-4 py-1.5 rounded-full bg-[#e0f2fe] text-[#0284c7] text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                      <span>👉</span>
                      <span>Bấm vào thẻ để xem nghĩa</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex-1 flex flex-col items-center justify-center my-auto space-y-3 animate-fadeIn">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Nghĩa Tiếng Việt
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1d50b4]">
                      {currentCard.meaningVi}
                    </h2>

                    {/* Vietnamese Audio on Back */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => audioService.playVietnameseMeaning(currentCard.meaningVi, (currentCard as any).audioViUrl)}
                        className="rounded-xl bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Volume2 size={13} />
                        <span>Đọc nghĩa tiếng Việt</span>
                      </button>

                      {((currentCard as any).example || (currentCard as any).audioExampleViUrl) && (
                        <button
                          type="button"
                          onClick={() => audioService.playVietnameseSentence((currentCard as any).example || currentCard.meaningVi, (currentCard as any).audioExampleViUrl)}
                          className="rounded-xl bg-amber-100 hover:bg-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800 flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <span>📝</span>
                          <span>Đọc ví dụ</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-600 italic bg-sky-50/80 p-2.5 rounded-xl border border-sky-100 max-w-xs leading-relaxed">
                      "{(currentCard as any).example || `Bé hãy luyện từ "${currentCard.word}" thật nhiều lần để nhớ lâu hơn nhé!`}"
                    </p>
                    <div className="mt-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                      <span>👉</span>
                      <span>Bấm để lật về mặt trước</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom 3 Action Buttons below Card (Disappears when finished, Matching Image 2) */}
            {!(masteredCards.size >= currentVocabList.length && currentVocabList.length > 0) && (
              <div className="flex items-center justify-between gap-3 pt-1 font-black text-xs sm:text-sm">
                {/* Left Arrow Button (Soft Light Orange rounded button - Matching Image 2) */}
                <button
                  onClick={handlePrevCard}
                  disabled={cardIdx === 0}
                  className={`w-12 h-12 rounded-2xl bg-[#fed7aa] text-[#9a3412] font-black text-xl flex items-center justify-center transition active:scale-95 shadow-2xs shrink-0 border border-[#fdba74] ${
                    cardIdx === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#fdba74] cursor-pointer'
                  }`}
                  title="Từ trước"
                >
                  ←
                </button>

                {/* Middle Orange Button: Chưa thuộc (Vibrant Coral Orange Pill - Matching Image 2) */}
                <button
                  onClick={handleMarkNotMastered}
                  className="flex-1 py-3.5 px-3 rounded-2xl bg-[#ff6b3d] hover:bg-[#f95722] text-white font-black text-sm sm:text-base shadow-sm transition active:scale-95 text-center cursor-pointer flex items-center justify-center"
                >
                  Chưa thuộc
                </button>

                {/* Right Green Button: Đã thuộc (Vibrant Emerald Green Pill with Checkmark - Matching Image 2) */}
                <button
                  onClick={handleMarkMastered}
                  className="flex-1 py-3.5 px-3 rounded-2xl bg-[#00b875] hover:bg-[#009e63] text-white font-black text-sm sm:text-base shadow-sm transition active:scale-95 text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Đã thuộc</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reward Success Modal (Matching Sample Image 1 100%) */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative bg-white rounded-[2rem] border-3 border-dashed border-[#3b82f6] p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4 animate-scaleUp">
            {/* Green dashed circular badge */}
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#34d399] bg-[#ecfdf5] flex items-center justify-center text-4xl mx-auto shadow-2xs">
              🏆
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
              Tuyệt vời ông mặt trời 🌟
            </h3>

            {/* Description Subtext */}
            <p className="text-xs sm:text-sm font-bold text-slate-500 leading-relaxed max-w-xs mx-auto">
              Bé đã nhận thành công 5 Sao Vàng! 🌟 Tổng số sao hiện tại:{' '}
              <span className="font-black text-amber-600">{user.stars + 5}</span>
            </p>

            {/* Confirm Blue Button */}
            <button
              onClick={() => {
                audioService.playSuccessSound();
                if (onAddStars) onAddStars(5);
                setShowRewardModal(false);
                setSelectedUnit(null);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-black text-base sm:text-lg shadow-md transition active:scale-95 cursor-pointer border border-blue-400 flex items-center justify-center gap-2"
            >
              <span>Đồng ý</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
