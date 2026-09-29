import React, { useState, useMemo, useEffect } from 'react';
import {
  Headphones,
  Volume2,
  RotateCcw,
  Lightbulb,
  Star,
  Flame,
  Trophy,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Play,
  LogOut,
  X,
  ArrowLeft,
  Check,
  Lock,
  Grid,
  Send,
  Zap,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { audioService } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import { UserAccount, UserProfile } from '../types';

interface DictationPracticeViewProps {
  user?: UserAccount | UserProfile;
  onAddStars?: (count: number) => void;
  onLogout?: () => void;
  onBack?: () => void;
}

export interface DictationSentence {
  id: string;
  sentenceEn: string;
  sentenceVi: string;
  timestamp: string;
  seconds: number;
  hint?: string;
}

export interface VideoDictationLesson {
  id: string;
  title: string;
  category: 'Early Learning' | 'Bluey' | 'Little Fox' | 'Vooks' | 'The Fable Cottage';
  tag: string;
  totalSentences: number;
  completedCount: number;
  thumbnail: string;
  youtubeVideoId: string;
  logoLabel?: string;
  createdAt: number;
  sentences: DictationSentence[];
}

const SAMPLE_VIDEO_LESSONS: VideoDictationLesson[] = [
  {
    id: 'v1',
    title: "Bluey, I'm just going to go for a walk along",
    category: 'Bluey',
    tag: 'Bluey',
    totalSentences: 21,
    completedCount: 0,
    createdAt: 12,
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '_3-M8I3gWQE',
    logoLabel: 'BLUEY',
    sentences: [
      {
        id: 's1-1',
        sentenceEn: "Bluey, I'm just going to go for a walk along the beach.",
        sentenceVi: 'Bluey ơi, mẹ chỉ đi dạo một lát dọc bờ biển thôi nhé.',
        timestamp: '0:05',
        seconds: 5,
        hint: 'Mẹ đi dạo dọc bờ biển.'
      },
      {
        id: 's1-2',
        sentenceEn: 'Why do you like walking by yourself?',
        sentenceVi: 'Sao mẹ lại thích đi bộ một mình thế ạ?',
        timestamp: '0:11',
        seconds: 11,
        hint: 'Sao mẹ đi một mình?'
      },
      {
        id: 's1-3',
        sentenceEn: 'Not sure, actually. I just do. See you soon, little mermaid.',
        sentenceVi: 'Mẹ cũng không rõ nữa, tự nhiên thích thôi. Hẹn gặp lại con nhé, nàng tiên cá nhỏ!',
        timestamp: '0:15',
        seconds: 15,
        hint: 'Hẹn gặp lại nàng tiên cá nhỏ.'
      },
      {
        id: 's1-4',
        sentenceEn: 'Look at the sand castle we built together.',
        sentenceVi: 'Nhìn lâu đài cát chúng ta cùng xây này.',
        timestamp: '0:25',
        seconds: 25
      },
      {
        id: 's1-5',
        sentenceEn: 'The waves are so soft and warm today.',
        sentenceVi: 'Sóng biển hôm nay thật mềm mại và ấm áp.',
        timestamp: '0:32',
        seconds: 32
      },
      {
        id: 's1-6',
        sentenceEn: 'Let us find some beautiful seashells on the shore.',
        sentenceVi: 'Chúng mình hãy đi tìm vài vỏ ốc đẹp trên bờ nhé.',
        timestamp: '0:34',
        seconds: 34
      }
    ]
  },
  {
    id: 'v2',
    title: 'boy and go.',
    category: 'Bluey',
    tag: 'Bluey',
    totalSentences: 35,
    completedCount: 0,
    createdAt: 11,
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '_3-M8I3gWQE',
    logoLabel: 'FUN WITH TURTLE BOY!',
    sentences: [
      {
        id: 's2-1',
        sentenceEn: 'Look at the cute turtle boy and go.',
        sentenceVi: 'Hãy nhìn chú rùa nhỏ đáng yêu và đi thôi.',
        timestamp: '0:02',
        seconds: 2,
        hint: 'Nhìn chú rùa nhỏ đáng yêu'
      },
      {
        id: 's2-2',
        sentenceEn: 'He loves swimming in the clear blue water.',
        sentenceVi: 'Cậu ấy thích bơi trong làn nước xanh trong.',
        timestamp: '0:10',
        seconds: 10
      }
    ]
  },
  {
    id: 'v3',
    title: 'Blue. Everyone, the queen is coming in.',
    category: 'Bluey',
    tag: 'Video Cartoon',
    totalSentences: 14,
    completedCount: 0,
    createdAt: 10,
    thumbnail: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '_3-M8I3gWQE',
    logoLabel: 'BLUEY LEGO',
    sentences: [
      {
        id: 's3-1',
        sentenceEn: 'Everyone, the queen is coming in right now.',
        sentenceVi: 'Mọi người ơi, nữ hoàng đang bước vào kìa.',
        timestamp: '0:03',
        seconds: 3
      }
    ]
  },
  {
    id: 'v4',
    title: '(bright music) - Super Simple.',
    category: 'Early Learning',
    tag: 'Video Cartoon',
    totalSentences: 20,
    completedCount: 0,
    createdAt: 9,
    thumbnail: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '_3-M8I3gWQE',
    logoLabel: '20 SUPER SIMPLE',
    sentences: [
      {
        id: 's4-1',
        sentenceEn: 'Let us sing a happy song together.',
        sentenceVi: 'Chúng mình cùng hát một bài hát vui vẻ nhé.',
        timestamp: '0:04',
        seconds: 4
      }
    ]
  }
];

export const DictationPracticeView: React.FC<DictationPracticeViewProps> = ({
  user,
  onAddStars,
  onLogout,
  onBack
}) => {
  // Library State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lessons, setLessons] = useState<VideoDictationLesson[]>(SAMPLE_VIDEO_LESSONS);

  // Active Lesson / Practice Room State
  const [activeLesson, setActiveLesson] = useState<VideoDictationLesson | null>(null);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const [selectedLevel, setSelectedLevel] = useState<'level1' | 'level2' | 'level3'>('level1');

  // Interactive Level Workspaces State
  // Level 1: Lego Blocks
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  // Level 2: Fill in Blanks
  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [blankValues, setBlankValues] = useState<{ [index: number]: string }>({});

  // Level 3: Full Typing
  const [typedText, setTypedText] = useState<string>('');

  // Checking & Feedback State
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [wordFeedbacks, setWordFeedbacks] = useState<
    { type: 'correct' | 'incorrect' | 'warning'; userWord: string; targetWord: string }[]
  >([]);

  // Dino Mascot Message Box
  const [dinoMessage, setDinoMessage] = useState<{
    title: string;
    subtitle: string;
    type: 'normal' | 'error' | 'success';
  }>({
    title: 'Dino Cố Vấn 🦖',
    subtitle: 'Nghe kỹ và chọn từ chính xác nhé!',
    type: 'normal'
  });

  // User Statistics
  const userStars = user?.stars ?? 313;
  const userLevel = user?.level ?? 7;
  const userStreak = user?.streakDays ?? 4;
  const userAvatar = user?.avatar || '🐊';

  const categories = ['Tất cả', 'Early Learning', 'Bluey', 'Little Fox', 'Vooks', 'The Fable Cottage'];

  // Current active sentence
  const currentSentence = useMemo(() => {
    if (!activeLesson || !activeLesson.sentences[activeSentenceIndex]) return null;
    return activeLesson.sentences[activeSentenceIndex];
  }, [activeLesson, activeSentenceIndex]);

  // Initialize workspace whenever active sentence or level changes
  useEffect(() => {
    if (!currentSentence) return;

    // Reset check status
    setIsChecked(false);
    setIsSuccess(false);
    setWordFeedbacks([]);
    setDinoMessage({
      title: 'Dino Cố Vấn 🦖',
      subtitle: 'Nghe kỹ và chọn từ chính xác nhé!',
      type: 'normal'
    });

    const targetWords = currentSentence.sentenceEn.trim().split(/\s+/);

    // Initialize Level 1 Lego
    const shuffled = [...targetWords].sort(() => Math.random() - 0.5);
    setAvailableBlocks(shuffled);
    setSelectedBlocks([]);

    // Initialize Level 2 Blanks (pick 2-3 indices to blank out, e.g. middle and end words)
    if (targetWords.length > 3) {
      const b1 = Math.floor(targetWords.length / 2);
      const b2 = targetWords.length - 1;
      setBlankIndices([b1, b2]);
    } else {
      setBlankIndices([targetWords.length - 1]);
    }
    setBlankValues({});

    // Initialize Level 3 Typing
    setTypedText('');
  }, [currentSentence, selectedLevel]);

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    let result = [...lessons];
    if (selectedCategory !== 'Tất cả') {
      result = result.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.tag.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => (sortOrder === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt));
    return result;
  }, [lessons, selectedCategory, searchQuery, sortOrder]);

  // Play audio for current sentence
  const handlePlayAudio = (rate: number = 0.9) => {
    if (!currentSentence) return;
    audioService.playClickSound();
    audioService.speakEnglish(currentSentence.sentenceEn, rate);
  };

  // Click Lego block to select
  const handleSelectBlock = (word: string, index: number) => {
    audioService.playClickSound();
    setSelectedBlocks((prev) => [...prev, word]);
    setAvailableBlocks((prev) => prev.filter((_, i) => i !== index));
    if (isChecked) setIsChecked(false);
  };

  // Click selected Lego block to remove back to source
  const handleDeselectBlock = (word: string, index: number) => {
    audioService.playClickSound();
    setAvailableBlocks((prev) => [...prev, word]);
    setSelectedBlocks((prev) => prev.filter((_, i) => i !== index));
    if (isChecked) setIsChecked(false);
  };

  // Hint button handler
  const handleGiveHint = () => {
    if (!currentSentence) return;
    audioService.playClickSound();

    if (onAddStars && userStars > 0) {
      onAddStars(-1);
    }

    const targetWords = currentSentence.sentenceEn.trim().split(/\s+/);

    if (selectedLevel === 'level1') {
      // Find the next correct word needed
      const nextIndex = selectedBlocks.length;
      if (nextIndex < targetWords.length) {
        const correctWord = targetWords[nextIndex];
        // Move from available to selected
        const availIdx = availableBlocks.findIndex(
          (w) => w.toLowerCase().replace(/[^\w]/g, '') === correctWord.toLowerCase().replace(/[^\w]/g, '')
        );
        if (availIdx !== -1) {
          const wordToMove = availableBlocks[availIdx];
          setSelectedBlocks((prev) => [...prev, wordToMove]);
          setAvailableBlocks((prev) => prev.filter((_, i) => i !== availIdx));
        } else {
          setSelectedBlocks((prev) => [...prev, correctWord]);
        }
      }
    } else if (selectedLevel === 'level2') {
      // Fill in the first empty blank
      for (const idx of blankIndices) {
        if (!blankValues[idx] || !blankValues[idx].trim()) {
          setBlankValues((prev) => ({ ...prev, [idx]: targetWords[idx] }));
          break;
        }
      }
    } else if (selectedLevel === 'level3') {
      setTypedText(currentSentence.sentenceEn);
    }
  };

  // Check Answer Handler
  const handleCheckAnswer = () => {
    if (!currentSentence) return;
    audioService.playClickSound();

    const targetWords = currentSentence.sentenceEn.trim().split(/\s+/);
    let userWords: string[] = [];

    if (selectedLevel === 'level1') {
      userWords = [...selectedBlocks];
    } else if (selectedLevel === 'level2') {
      userWords = targetWords.map((tw, idx) => {
        if (blankIndices.includes(idx)) {
          return blankValues[idx] || '';
        }
        return tw;
      });
    } else if (selectedLevel === 'level3') {
      userWords = typedText.trim().split(/\s+/);
    }

    // Evaluate each word
    const feedbacks: { type: 'correct' | 'incorrect' | 'warning'; userWord: string; targetWord: string }[] = [];
    let isAllCorrect = true;

    const maxLen = Math.max(userWords.length, targetWords.length);
    for (let i = 0; i < maxLen; i++) {
      const u = userWords[i] || '';
      const t = targetWords[i] || '';

      const uClean = u.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');
      const tClean = t.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');

      if (uClean === tClean && uClean.length > 0) {
        feedbacks.push({ type: 'correct', userWord: u, targetWord: t });
      } else if (uClean.length > 0 && tClean.startsWith(uClean.substring(0, 2))) {
        feedbacks.push({ type: 'warning', userWord: u, targetWord: t });
        isAllCorrect = false;
      } else {
        feedbacks.push({ type: 'incorrect', userWord: u, targetWord: t });
        isAllCorrect = false;
      }
    }

    if (userWords.length < targetWords.length) {
      isAllCorrect = false;
    }

    setWordFeedbacks(feedbacks);
    setIsChecked(true);

    if (isAllCorrect) {
      setIsSuccess(true);
      audioService.playSuccessSound();
      triggerConfetti('default');
      if (onAddStars) onAddStars(5);

      setDinoMessage({
        title: 'Xuất Sắc! 🏆 Dino Khen Bé!',
        subtitle: 'Bé nghe và chép lại câu chính xác tuyệt vời!',
        type: 'success'
      });

      // Update completed count for current lesson
      if (activeLesson) {
        setLessons((prev) =>
          prev.map((l) =>
            l.id === activeLesson.id
              ? { ...l, completedCount: Math.min(l.totalSentences, l.completedCount + 1) }
              : l
          )
        );
      }
    } else {
      setIsSuccess(false);
      audioService.playErrorSound();
      setDinoMessage({
        title: 'Cố Lên Bé Nhé! 🎧',
        subtitle: 'Bé nghe lại câu thoại một lần nữa để gõ chuẩn hơn nhé!',
        type: 'error'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#edf4ff] text-slate-800 p-3 sm:p-5 select-none font-sans space-y-4">
      {/* 1. TOP HEADER BAR (Exact to Image 1) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-sky-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="text-2xl sm:text-3xl shrink-0">🎧</div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-[#1e3a8a] tracking-tight uppercase flex items-center gap-2">
              <span>PHÒNG LUYỆN CHÉP CHÍNH TẢ YOUTUBE</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-bold">
              Bài học: {activeLesson ? activeLesson.title : "Bluey, I'm just going to go for a walk along"}
            </p>
          </div>
        </div>

        {/* Right Badges */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Level Badge */}
          <div className="bg-sky-50/90 border border-dashed border-sky-300 rounded-2xl px-3 py-1.5 flex items-center gap-2 text-sky-800 font-extrabold text-xs shadow-2xs">
            <Trophy size={16} className="text-amber-500 shrink-0" />
            <div className="flex flex-col">
              <span>Cấp độ {userLevel}</span>
              <div className="w-10 h-1 bg-sky-200 rounded-full overflow-hidden mt-0.5">
                <div className="bg-sky-500 h-full w-3/4 rounded-full" />
              </div>
            </div>
          </div>

          {/* Stars Badge */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-1.5 flex items-center gap-1.5 text-amber-900 font-black text-xs shadow-2xs">
            <Star size={16} className="text-amber-500 fill-amber-400 shrink-0" />
            <span>{userStars}</span>
          </div>

          {/* Streak Badge */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-3.5 py-1.5 flex items-center gap-1.5 text-rose-900 font-black text-xs shadow-2xs">
            <Flame size={16} className="text-rose-500 fill-rose-500 shrink-0" />
            <span>{userStreak} ngày</span>
          </div>

          {/* Avatar Circle */}
          <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-white shadow-xs flex items-center justify-center text-lg shrink-0">
            {userAvatar}
          </div>

          {/* Exit / Logout Button */}
          <button
            onClick={() => {
              audioService.playClickSound();
              if (onLogout) onLogout();
              else if (onBack) onBack();
            }}
            className="bg-[#ef4444] hover:bg-red-600 active:scale-95 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
          >
            <LogOut size={14} />
            <span>Thoát</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN PRACTICE ROOM VIEW (WHEN LESSON IS ACTIVE - Images 2 - 10) */}
      {activeLesson ? (
        <div className="space-y-4 animate-fadeIn">
          {/* BACK BAR & TITLE */}
          <div className="flex items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-blue-100 shadow-2xs">
            <button
              onClick={() => {
                audioService.playClickSound();
                setActiveLesson(null);
              }}
              className="bg-[#e0edff] hover:bg-blue-100 text-[#1d50b4] border border-[#a0c4ff] px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={16} />
              <span>Quay lại Thư viện Video</span>
            </button>

            <h2 className="text-xs sm:text-sm font-black text-slate-800 truncate max-w-xs sm:max-w-md">
              {activeLesson.title}
            </h2>
          </div>

          {/* LEVEL SELECTION TABS ROW (Exact to Images 2 - 10) */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-blue-100 shadow-2xs">
            <span className="text-xs font-black text-slate-700">Chọn Cấp Độ:</span>

            <div className="flex flex-wrap items-center gap-2">
              {/* LEVEL 1 TAB */}
              <button
                onClick={() => {
                  audioService.playClickSound();
                  setSelectedLevel('level1');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  selectedLevel === 'level1'
                    ? 'bg-[#2563eb] text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Grid size={15} />
                <span>LEVEL 1: Ghép Khối Lego</span>
              </button>

              {/* LEVEL 2 TAB */}
              <button
                onClick={() => {
                  audioService.playClickSound();
                  setSelectedLevel('level2');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  selectedLevel === 'level2'
                    ? 'bg-[#8b5cf6] text-white shadow-md'
                    : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
                }`}
              >
                <List size={15} />
                <span>LEVEL 2: Điền Từ Khuyết</span>
              </button>

              {/* LEVEL 3 TAB */}
              <button
                onClick={() => {
                  audioService.playClickSound();
                  setSelectedLevel('level3');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  selectedLevel === 'level3'
                    ? 'bg-[#10b981] text-white shadow-md'
                    : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Check size={15} />
                <span>LEVEL 3: Gõ 100%</span>
              </button>
            </div>
          </div>

          {/* MAIN TWO COLUMN GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT COLUMN: PLAYER + AUDIO CONTROLS + DICTATION INPUT WORKSPACE */}
            <div className="lg:col-span-8 space-y-3.5">
              {/* VIDEO PLAYER CONTAINER */}
              <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-md relative aspect-video group">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${activeLesson.youtubeVideoId}?autoplay=0&rel=0`}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* AUDIO & HINT ACTION BUTTONS ROW */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => handlePlayAudio(0.9)}
                  className="bg-[#2563eb] hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw size={15} />
                  <span>Phát Lại Câu</span>
                </button>

                <button
                  onClick={() => handlePlayAudio(0.65)}
                  className="bg-[#8b5cf6] hover:bg-purple-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Volume2 size={15} />
                  <span>Nghe Chậm (1x)</span>
                </button>

                <button
                  onClick={handleGiveHint}
                  className="bg-[#f59e0b] hover:bg-amber-600 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 ml-auto"
                >
                  <Lightbulb size={15} className="fill-amber-200" />
                  <span>Gợi Ý (-1 ⭐)</span>
                </button>
              </div>

              {/* DICTATION WORKSPACE BOX */}
              {currentSentence && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-2xs">
                  {/* VIETNAMESE TRANSLATION LINE */}
                  <div className="flex items-center gap-2 bg-[#f0f7ff] p-2.5 rounded-xl border border-blue-100">
                    <span className="bg-[#dbeafe] text-[#1e40af] font-black text-[11px] px-2.5 py-1 rounded-md shrink-0">
                      Nghĩa Tiếng Việt
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      {currentSentence.sentenceVi}
                    </p>
                  </div>

                  {/* LEVEL 1 WORKSPACE: LEGO BLOCKS */}
                  {selectedLevel === 'level1' && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-600">
                        1. Nhấp các khối từ phía dưới để xếp thành câu hoàn chỉnh:
                      </p>

                      {/* Dropzone Box */}
                      <div className="border-2 border-dashed border-sky-300 bg-slate-50/50 rounded-2xl p-3.5 min-h-[64px] flex flex-wrap items-center gap-2 transition">
                        {selectedBlocks.length === 0 ? (
                          <span className="text-slate-400 font-medium text-xs italic">
                            (Chạm khối từ ở dưới để thả vào đây)
                          </span>
                        ) : (
                          selectedBlocks.map((word, idx) => (
                            <button
                              key={`sel-${idx}`}
                              onClick={() => handleDeselectBlock(word, idx)}
                              className="bg-[#2563eb] hover:bg-blue-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                            >
                              {word}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Source Blocks Bank */}
                      <div className="space-y-1.5 pt-1">
                        <p className="text-xs font-bold text-slate-600">2. Kho khối từ (Bấm chọn):</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {availableBlocks.map((word, idx) => (
                            <button
                              key={`avail-${idx}`}
                              onClick={() => handleSelectBlock(word, idx)}
                              className="bg-[#8b5cf6] hover:bg-purple-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                            >
                              {word}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LEVEL 2 WORKSPACE: FILL IN BLANKS */}
                  {selectedLevel === 'level2' && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-600">
                        Điền các từ còn thiếu vào ô trống bên dưới:
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-slate-900 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 leading-loose">
                        {currentSentence.sentenceEn.split(/\s+/).map((word, idx) => {
                          const isBlank = blankIndices.includes(idx);
                          if (isBlank) {
                            return (
                              <input
                                key={`blank-${idx}`}
                                type="text"
                                placeholder="???"
                                value={blankValues[idx] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBlankValues((prev) => ({ ...prev, [idx]: val }));
                                  if (isChecked) setIsChecked(false);
                                }}
                                className="w-24 px-3 py-1 border-2 border-sky-300 focus:border-blue-500 rounded-xl text-center text-xs font-bold text-slate-900 bg-white shadow-2xs"
                              />
                            );
                          }
                          return <span key={`w-${idx}`}>{word}</span>;
                        })}
                      </div>
                    </div>
                  )}

                  {/* LEVEL 3 WORKSPACE: FULL TYPING */}
                  {selectedLevel === 'level3' && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600">
                        Nghe và gõ lại toàn bộ câu bằng bàn phím:
                      </p>

                      <textarea
                        value={typedText}
                        onChange={(e) => {
                          setTypedText(e.target.value);
                          if (isChecked) setIsChecked(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCheckAnswer();
                          }
                        }}
                        placeholder="Gõ lại toàn bộ câu bằng tiếng Anh..."
                        className="w-full border-2 border-slate-300 focus:border-blue-500 rounded-2xl p-3 text-xs font-bold text-slate-900 bg-white min-h-[85px] focus:outline-none shadow-2xs"
                      />
                    </div>
                  )}

                  {/* PER-WORD EVALUATION FEEDBACK TAGS */}
                  {isChecked && wordFeedbacks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 animate-fadeIn">
                      <p className="text-[11px] font-black text-slate-500">Phản hồi kết quả từng từ:</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {wordFeedbacks.map((fb, idx) => {
                          if (fb.type === 'correct') {
                            return (
                              <span
                                key={`fb-${idx}`}
                                className="bg-[#dcfce7] border border-[#86efac] text-[#166534] px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs"
                              >
                                ✓ {fb.userWord}
                              </span>
                            );
                          } else if (fb.type === 'warning') {
                            return (
                              <span
                                key={`fb-${idx}`}
                                className="bg-[#fef9c3] border border-[#fde047] text-[#854d0e] px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs"
                              >
                                ⚡ {fb.userWord} ({fb.targetWord})
                              </span>
                            );
                          } else {
                            return (
                              <span
                                key={`fb-${idx}`}
                                className="bg-[#ffe4e6] border border-[#fca5a5] text-[#9f1239] px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs"
                              >
                                ✗ {fb.userWord || 'undefined'} (Đúng: {fb.targetWord || 'undefined'})
                              </span>
                            );
                          }
                        })}
                      </div>
                    </div>
                  )}

                  {/* BOTTOM CHECK BUTTON */}
                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={handleCheckAnswer}
                      className="bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-2xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={16} />
                      <span>Kiểm Tra Kết Quả</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: BÀN CHÉP TIẾN TRÌNH & DINO MASCOT BANNER */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                <h3 className="font-black text-xs text-[#1e3a8a] flex items-center gap-1.5 tracking-wide border-b border-slate-100 pb-2">
                  <span>📖</span>
                  <span>BÀN CHÉP TIẾN TRÌNH</span>
                </h3>

                {/* SENTENCE LIST */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {activeLesson.sentences.map((st, idx) => {
                    const isCurrent = idx === activeSentenceIndex;

                    return (
                      <div
                        key={`side-st-${idx}`}
                        onClick={() => {
                          audioService.playClickSound();
                          setActiveSentenceIndex(idx);
                        }}
                        className={`p-3 rounded-2xl border transition cursor-pointer space-y-1 ${
                          isCurrent
                            ? 'border-2 border-[#2563eb] bg-[#eff6ff] shadow-2xs'
                            : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-500">
                          <span>
                            Câu {idx + 1} ({st.timestamp})
                          </span>
                          {isCurrent ? (
                            <Play size={12} className="fill-[#2563eb] text-[#2563eb]" />
                          ) : (
                            <Lock size={12} className="text-slate-400" />
                          )}
                        </div>

                        <p className="text-xs font-black text-slate-800 line-clamp-2">
                          {st.sentenceEn}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DINO MASCOT BANNER BOX (Exact 100% to Images) */}
              <div className="bg-[#fef9c3] border-2 border-[#fde047] rounded-3xl p-3.5 flex items-center gap-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-200/80 border border-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                  🐊
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <span>{dinoMessage.title}</span>
                  </h4>
                  <p className="text-[11px] font-bold text-amber-800 mt-0.5 leading-snug">
                    {dinoMessage.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 3. MAIN LIBRARY GRID/LIST VIEW (Image 1) */
        <div className="space-y-4 animate-fadeIn">
          {/* HERO PURPLE BANNER CARD */}
          <div className="bg-gradient-to-r from-[#2563eb] via-[#6366f1] to-[#a855f7] rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
                <Headphones size={26} className="text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black tracking-wide text-white">
                  Luyện Nghe (Nhớ- Viết Lại)
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-white/90 mt-0.5">
                  Thư viện kho Video hoạt hình phong phú giúp bé rèn phản xạ chép chính tả chuẩn 100%!
                </p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full text-xs font-black text-white flex items-center gap-1.5 shrink-0 shadow-xs">
              <Star size={16} className="text-amber-300 fill-amber-300" />
              <span>{userStars} Sao Thưởng</span>
            </div>
          </div>

          {/* SEARCH & CONTROLS ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm video theo tên bài học..."
                className="w-full bg-white border border-slate-200 text-xs font-semibold py-2.5 pl-9 pr-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-2xs"
              />
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>

            {/* Controls Right */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <span>⇅ {sortOrder === 'newest' ? 'Mới nhất' : 'Cũ nhất'}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-30 py-1">
                    <button
                      onClick={() => {
                        setSortOrder('newest');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-100 block"
                    >
                      ⇅ Mới nhất
                    </button>
                    <button
                      onClick={() => {
                        setSortOrder('oldest');
                        setIsSortDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-100 block"
                    >
                      ⇅ Cũ nhất
                    </button>
                  </div>
                )}
              </div>

              {/* View Mode Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setViewMode('grid');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'grid'
                      ? 'bg-[#2563eb] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span>Grid View</span>
                </button>

                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setViewMode('list');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'list'
                      ? 'bg-[#2563eb] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <List size={14} />
                  <span>Grid List</span>
                </button>
              </div>
            </div>
          </div>

          {/* CATEGORY PILLS BAR */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={`cat-${cat}`}
                  onClick={() => {
                    audioService.playClickSound();
                    setSelectedCategory(cat);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
                    isActive
                      ? 'bg-[#2563eb] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* VIDEO CARDS GRID */}
          {filteredLessons.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center space-y-3 shadow-2xs">
              <Headphones size={32} className="text-slate-400 mx-auto" />
              <h3 className="text-sm font-black text-slate-800">Không tìm thấy bài học</h3>
              <p className="text-xs text-slate-500 font-medium">Bé thử chọn chủ đề khác nhé!</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => {
                    audioService.playClickSound();
                    setActiveLesson(lesson);
                    setActiveSentenceIndex(0);
                  }}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                >
                  {/* Thumbnail Top */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={lesson.thumbnail}
                      alt={lesson.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Center Circular Blue Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition">
                      <div className="w-11 h-11 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                        <Play size={20} className="fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Information Bottom */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-snug">
                      {lesson.title}
                    </h3>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="bg-[#dbeafe] text-[#1e40af] text-[10px] font-black px-2.5 py-0.5 rounded-md border border-[#bfdbfe]">
                        {lesson.tag}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-400">
                        {lesson.completedCount}/{lesson.totalSentences} Câu done
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => {
                    audioService.playClickSound();
                    setActiveLesson(lesson);
                    setActiveSentenceIndex(0);
                  }}
                  className="bg-white rounded-3xl border border-slate-200 p-3 shadow-2xs hover:shadow-md transition cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-32 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                      <img src={lesson.thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-md">
                          <Play size={16} className="fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                        {lesson.title}
                      </h3>
                      <span className="inline-block bg-[#dbeafe] text-[#1e40af] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#bfdbfe]">
                        {lesson.tag}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-extrabold text-slate-400 shrink-0 pr-2">
                    {lesson.completedCount}/{lesson.totalSentences} Câu done
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
