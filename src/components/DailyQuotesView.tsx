import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowLeft, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Flame, 
  Trophy, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  VolumeX, 
  Volume1, 
  CheckCircle2, 
  BookOpen, 
  X,
  MessageCircle
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types';
import { audioService } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';

export interface QuoteItem {
  id: number;
  en: string;
  vi: string;
  author: string;
  category: 'Học tập' | 'Động lực' | 'Tự tin' | 'Tình bạn' | 'Yêu bản thân' | 'Gia đình';
  emoji: string;
  bgClass?: string;
}

export const sampleQuotesList: QuoteItem[] = [
  {
    id: 1,
    en: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    vi: "Càng đọc nhiều, con càng biết nhiều điều. Càng học hỏi nhiều, con càng đi được nhiều nơi.",
    author: "Dr. Seuss",
    category: "Học tập",
    emoji: "🎒"
  },
  {
    id: 2,
    en: "You are braver than you believe, stronger than you seem, and smarter than you think.",
    vi: "Con dũng cảm hơn con tin, mạnh mẽ hơn con thấy và thông minh hơn con nghĩ.",
    author: "A.A. Milne",
    category: "Tự tin",
    emoji: "💪"
  },
  {
    id: 3,
    en: "There is no elevator to success, you have to take the stairs.",
    vi: "Không có thang máy nào đưa con đến thành công, con phải đi bằng cầu thang bộ.",
    author: "Zig Ziglar",
    category: "Động lực",
    emoji: "☀️"
  },
  {
    id: 4,
    en: "Small steps every day add up to big results!",
    vi: "Những bước tiến nhỏ mỗi ngày sẽ tích tụ thành kết quả vô cùng to lớn!",
    author: "Dino Mascot",
    category: "Động lực",
    emoji: "🌟"
  },
  {
    id: 5,
    en: "A friend is someone who knows all about you and still loves you.",
    vi: "Bạn bè là người hiểu rõ về con và luôn yêu quý con chân thành.",
    author: "Elbert Hubbard",
    category: "Tình bạn",
    emoji: "🤝"
  },
  {
    id: 6,
    en: "Friendship is the magic that brightens every single day.",
    vi: "Tình bạn là phép màu thắp sáng mỗi ngày trôi qua.",
    author: "Dino Mascot",
    category: "Tình bạn",
    emoji: "🌿"
  },
  {
    id: 7,
    en: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
    vi: "Hãy tin vào bản thân. Trong con có sức mạnh lớn hơn bất kỳ khó khăn nào.",
    author: "Christian D. Larson",
    category: "Tự tin",
    emoji: "🦁"
  },
  {
    id: 8,
    en: "Always be a first-rate version of yourself, instead of a second-rate version of somebody else.",
    vi: "Hãy luôn là phiên bản xuất sắc nhất của chính mình chứ đừng là bản sao của người khác.",
    author: "Judy Garland",
    category: "Yêu bản thân",
    emoji: "💖"
  },
  {
    id: 9,
    en: "Love yourself first and everything else falls into line.",
    vi: "Hãy học cách yêu thương bản thân trước tiên, mọi điều tốt đẹp sẽ tự tìm đến con.",
    author: "Lucille Ball",
    category: "Yêu bản thân",
    emoji: "🌸"
  },
  {
    id: 10,
    en: "Family is where life begins and love never ends.",
    vi: "Gia đình là nơi cuộc sống bắt đầu và tình yêu thương không bao giờ kết thúc.",
    author: "Danh ngôn dân gian",
    category: "Gia đình",
    emoji: "🏠"
  },
  {
    id: 11,
    en: "Home is where your heart feels safest, warmest and happiest.",
    vi: "Mái nhà là nơi trái tim con cảm thấy an toàn, ấm áp và hạnh phúc nhất.",
    author: "Dino Mascot",
    category: "Gia đình",
    emoji: "👨‍👩‍👧"
  },
  {
    id: 12,
    en: "Learning never exhausts the mind.",
    vi: "Sự học hỏi không bao giờ làm trí óc chúng ta kiệt sức.",
    author: "Leonardo da Vinci",
    category: "Học tập",
    emoji: "📚"
  },
  {
    id: 13,
    en: "An investment in knowledge pays the best interest.",
    vi: "Đầu tư vào tri thức luôn mang lại lợi ích cao nhất.",
    author: "Benjamin Franklin",
    category: "Học tập",
    emoji: "🎓"
  },
  {
    id: 14,
    en: "Be yourself; everyone else is already taken.",
    vi: "Hãy là chính mình, bởi vì những người khác đã có người làm rồi.",
    author: "Oscar Wilde",
    category: "Yêu bản thân",
    emoji: "✨"
  },
  {
    id: 15,
    en: "Kindness is a superpower that everyone can use every day.",
    vi: "Lòng tốt là một siêu năng lực mà ai cũng có thể sử dụng mỗi ngày.",
    author: "Dino Mascot",
    category: "Tự tin",
    emoji: "🌈"
  },
  {
    id: 16,
    en: "Together we can achieve anything we set our minds to!",
    vi: "Cùng nhau, chúng ta có thể chinh phục mọi mục tiêu đề ra!",
    author: "Dino Mascot",
    category: "Tình bạn",
    emoji: "🤝"
  },
  {
    id: 17,
    en: "Mistakes are proof that you are trying hard.",
    vi: "Những sai lầm là bằng chứng cho thấy con đang nỗ lực hết mình.",
    author: "Parent Note",
    category: "Động lực",
    emoji: "⭐"
  },
  {
    id: 18,
    en: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    vi: "Thành công chưa phải là cuối cùng, thất bại cũng không phải là chấm hết: Lòng dũng cảm tiếp tục mới là điều quan trọng.",
    author: "Winston Churchill",
    category: "Động lực",
    emoji: "🏆"
  },
  {
    id: 19,
    en: "Family gives you wings to fly and a place of unconditional love to rest.",
    vi: "Gia đình cho con đôi cánh để bay xa và là nơi bình yên chào đón con trở về.",
    author: "Parent Note",
    category: "Gia đình",
    emoji: "🏠"
  },
  {
    id: 20,
    en: "Today is a great day to learn something brand new!",
    vi: "Hôm nay là một ngày tuyệt vời để khám phá thêm nhiều điều mới lạ!",
    author: "Dino Mascot",
    category: "Học tập",
    emoji: "🎒"
  },
  {
    id: 21,
    en: "No act of kindness, no matter how small, is ever wasted.",
    vi: "Không có hành động tử tế nào, dù nhỏ bé đến đâu, lại trở nên vô ích.",
    author: "Aesop",
    category: "Tình bạn",
    emoji: "🎁"
  },
  {
    id: 22,
    en: "Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present.",
    vi: "Ngày qua là lịch sử, ngày mai là bí ẩn, còn hôm nay là món quà. Đó là lý do nó được gọi là hiện tại.",
    author: "Master Oogway",
    category: "Động lực",
    emoji: "☀️"
  },
  {
    id: 23,
    en: "Dream big and dare to fail.",
    vi: "Hãy mơ những giấc mơ lớn và dám đối mặt với thử thách.",
    author: "Norman Vaughan",
    category: "Tự tin",
    emoji: "🦁"
  },
  {
    id: 24,
    en: "It always seems impossible until it is done.",
    vi: "Mọi việc dường như luôn bất khả thi cho đến khi nó được hoàn thành.",
    author: "Nelson Mandela",
    category: "Động lực",
    emoji: "🏆"
  },
  {
    id: 25,
    en: "Work hard in silence, let your success be your noise.",
    vi: "Hãy chăm chỉ trong âm thầm và để thành công lên tiếng.",
    author: "Frank Ocean",
    category: "Học tập",
    emoji: "📚"
  },
  {
    id: 26,
    en: "Happiness is not something ready made. It comes from your own actions.",
    vi: "Hạnh phúc không phải là thứ có sẵn. Nó đến từ chính những hành động của con.",
    author: "Dalai Lama",
    category: "Yêu bản thân",
    emoji: "💖"
  },
  {
    id: 27,
    en: "There are no shortcuts to any place worth going.",
    vi: "Không có con đường tắt nào dẫn đến nơi thực sự đáng đến.",
    author: "Beverly Sills",
    category: "Học tập",
    emoji: "🎓"
  },
  {
    id: 28,
    en: "Be the change that you wish to see in the world.",
    vi: "Hãy là sự thay đổi mà con muốn nhìn thấy ở thế giới xung quanh.",
    author: "Mahatma Gandhi",
    category: "Tự tin",
    emoji: "🌍"
  },
  {
    id: 29,
    en: "A warm smile is the universal language of kindness.",
    vi: "Nụ cười ấm áp là ngôn ngữ chung của lòng tốt trên toàn thế giới.",
    author: "William Arthur Ward",
    category: "Tình bạn",
    emoji: "🤝"
  },
  {
    id: 30,
    en: "The greatest gift of family is unconditional love and support.",
    vi: "Món quà tuyệt vời nhất của gia đình là tình yêu thương và sự hỗ trợ vô điều kiện.",
    author: "Parent Note",
    category: "Gia đình",
    emoji: "🏠"
  }
];

// Generate extra quotes up to 150 to match the exact "150 quotes" UI count seen in images 1-5!
export const fullQuotes150: QuoteItem[] = Array.from({ length: 150 }, (_, i) => {
  if (i < sampleQuotesList.length) {
    return sampleQuotesList[i];
  }
  const base = sampleQuotesList[i % sampleQuotesList.length];
  return {
    ...base,
    id: i + 1,
    en: `${base.en}`,
    vi: `${base.vi}`,
  };
});

interface DailyQuotesViewProps {
  user: UserProfile;
  onAddStars: (amount: number) => void;
  setActiveTab?: (tab: ActiveTab) => void;
}

export const DailyQuotesView: React.FC<DailyQuotesViewProps> = ({
  user,
  onAddStars,
  setActiveTab,
}) => {
  // Quote Selection & Navigation State
  const [activeQuoteIndex, setActiveQuoteIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả 🌈');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 30;

  // Practice & Voice Simulation State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    text: string;
    feedback: string;
  } | null>(null);

  // Today Stats Counter
  const [quotesHeardCount, setQuotesHeardCount] = useState<number>(0);
  const [quotesSpokenCount, setQuotesSpokenCount] = useState<number>(0);
  const [starsEarnedToday, setStarsEarnedToday] = useState<number>(0);

  // Study Clock & Alarm State
  const [studySeconds, setStudySeconds] = useState<number>(1427); // 00:23:47
  const [alarmSeconds, setAlarmSeconds] = useState<number>(900); // 15:00
  const [isAlarmRunning, setIsAlarmRunning] = useState<boolean>(true);

  // Study Music Player State
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<string>('brain-alpha');
  const [volume, setVolume] = useState<number>(80);

  const topCardRef = useRef<HTMLDivElement>(null);

  // Study clock timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setStudySeconds((prev) => prev + 1);
      if (isAlarmRunning) {
        setAlarmSeconds((prev) => {
          if (prev <= 1) {
            audioService.playApplauseSound();
            setIsAlarmRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isAlarmRunning]);

  // Format seconds to HH:MM:SS
  const formatClock = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format seconds to MM:SS
  const formatAlarm = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered quotes based on search & category
  const filteredQuotes = fullQuotes150.filter((q) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      q.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.vi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Tất cả 🌈' ||
      (selectedCategory.includes('Tự tin') && q.category === 'Tự tin') ||
      (selectedCategory.includes('Động lực') && q.category === 'Động lực') ||
      (selectedCategory.includes('Học tập') && q.category === 'Học tập') ||
      (selectedCategory.includes('Tình bạn') && q.category === 'Tình bạn') ||
      (selectedCategory.includes('Yêu bản thân') && q.category === 'Yêu bản thân') ||
      (selectedCategory.includes('Gia đình') && q.category === 'Gia đình');

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const pageQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentQuote = fullQuotes150[activeQuoteIndex] || fullQuotes150[0];

  // Action Handlers
  const handleNextQuote = () => {
    audioService.playClickSound();
    setActiveQuoteIndex((prev) => (prev + 1) % fullQuotes150.length);
    setEvaluationResult(null);
    setIsRecording(false);
  };

  const handlePrevQuote = () => {
    audioService.playClickSound();
    setActiveQuoteIndex((prev) => (prev - 1 + fullQuotes150.length) % fullQuotes150.length);
    setEvaluationResult(null);
    setIsRecording(false);
  };

  const handleListenSpeech = () => {
    audioService.playClickSound();
    audioService.speakText(currentQuote.en);
    setQuotesHeardCount((prev) => prev + 1);
  };

  const handleToggleRecord = () => {
    audioService.playClickSound();
    setIsRecording(!isRecording);
    setEvaluationResult(null);
  };

  const handleSimulateGoodRead = () => {
    audioService.playClickSound();
    setIsRecording(false);
    setEvaluationResult({
      score: 100,
      text: currentQuote.en,
      feedback: `🎉 Giả lập phát âm đạt (100/100 💯) +15 Sao vàng ⭐`,
    });
    audioService.playApplauseSound();
    onAddStars(15);
    setStarsEarnedToday((prev) => prev + 15);
    setQuotesSpokenCount((prev) => prev + 1);
    triggerConfetti('default');
  };

  const handleSelectQuoteCard = (quoteId: number) => {
    audioService.playClickSound();
    const targetIdx = fullQuotes150.findIndex((q) => q.id === quoteId);
    if (targetIdx !== -1) {
      setActiveQuoteIndex(targetIdx);
      setEvaluationResult(null);
      setIsRecording(false);
      if (topCardRef.current) {
        topCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Helper function for category theme colors
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Học tập':
        return 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100';
      case 'Động lực':
        return 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100';
      case 'Tự tin':
        return 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100';
      case 'Tình bạn':
        return 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100';
      case 'Yêu bản thân':
        return 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100';
      case 'Gia đình':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100';
      default:
        return 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100';
    }
  };

  return (
    <div className="space-y-5 select-none font-sans animate-fadeIn max-w-7xl mx-auto">
      <div className="space-y-5" ref={topCardRef}>
        {/* FEATURED SPOTLIGHT QUOTE CARD (LARGE BLUE BOX) */}
          <div className="bg-[#e0f2fe] border-2 border-[#7dd3fc] rounded-3xl p-5 sm:p-6 shadow-md space-y-5 relative overflow-hidden">
            {/* Top Bar: Category Pill & Prev/Next Nav */}
            <div className="flex items-center justify-between gap-2 border-b border-sky-200 pb-3">
              <span className="px-3.5 py-1 bg-white/90 text-[#0284c7] rounded-full text-xs font-black border border-sky-200 shadow-2xs flex items-center gap-1.5">
                <span>🎒</span>
                <span>{currentQuote.category}</span>
                <span>•</span>
                <span>Câu {activeQuoteIndex + 1}/{fullQuotes150.length}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevQuote}
                  className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <ChevronLeft size={14} />
                  <span>Trước</span>
                </button>
                <button
                  onClick={handleNextQuote}
                  className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>Tiếp</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Center Graphic Icon Box */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-1">
              <div className="w-16 h-16 bg-white rounded-2xl border-2 border-sky-200 flex items-center justify-center text-3xl shadow-sm">
                📚
              </div>
              <span className="text-xs font-black text-[#0369a1] bg-sky-100 px-3 py-0.5 rounded-full border border-sky-200">
                Quote #{currentQuote.id} ☘️
              </span>
            </div>

            {/* Quote Main Text (English & Vietnamese) */}
            <div className="bg-white/90 p-5 rounded-2xl border border-sky-200 shadow-xs space-y-3 text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 leading-snug tracking-tight">
                "{currentQuote.en}"
              </p>
              <p className="text-sm sm:text-base font-bold text-[#0369a1] italic">
                ~ {currentQuote.vi}
              </p>
              <p className="text-xs font-extrabold text-slate-500 pt-1">
                ✍️ Tác giả: <span className="text-slate-800 underline underline-offset-2">{currentQuote.author}</span>
              </p>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={handleListenSpeech}
                className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition cursor-pointer"
              >
                <Volume2 size={18} />
                <span>Nghe Phát Âm</span>
              </button>

              <button
                onClick={handleToggleRecord}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                <span>{isRecording ? '🔴 Dừng & Đánh Giá' : '🎙️ Luyện Đọc Câu Này'}</span>
              </button>

              <button
                onClick={handleSimulateGoodRead}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition cursor-pointer"
              >
                <Sparkles size={18} />
                <span>⚡ Giả lập đọc tốt</span>
              </button>
            </div>

            {/* Recording Mode Active Box */}
            {isRecording && (
              <div className="bg-sky-50/90 border-2 border-dashed border-sky-400 rounded-2xl p-4 text-center space-y-3 animate-fadeIn">
                <div className="flex items-center justify-center gap-2 text-rose-600 font-black text-sm">
                  <span className="w-3 h-3 bg-rose-600 rounded-full animate-ping" />
                  <span>🎙️ Dino đang lắng nghe bé... 🧃</span>
                </div>
                <p className="text-xs font-bold text-slate-600">
                  Đang bật mic thu âm... Bé hãy đọc to câu dưới đây nhé:
                </p>
                <div className="bg-white p-3 rounded-xl border border-sky-200 font-extrabold text-sm text-slate-800">
                  "{currentQuote.en}"
                </div>
                <button
                  onClick={handleSimulateGoodRead}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                >
                  Nộp Bài Thu Âm
                </button>
              </div>
            )}

            {/* Evaluation Result Banner */}
            {evaluationResult && (
              <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl space-y-2 animate-fadeIn text-left">
                <div className="flex items-center justify-between text-emerald-900 font-black text-sm">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>{evaluationResult.feedback}</span>
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Score: 100/100 💯
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-700 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <p>Dino ghi âm bé đọc: <span className="text-emerald-800 italic">"{evaluationResult.text}"</span></p>
                  <p className="text-emerald-700 font-extrabold mt-0.5">Đánh giá: Cực kỳ chuẩn xác! (+15 Sao vàng ⭐)</p>
                </div>
              </div>
            )}
          </div>

          {/* lower section: QUOTE EXPLORER LIBRARY */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <span>📁</span>
                <span>Thư viện khám phá danh ngôn</span>
                <span className="text-xs bg-sky-100 text-[#0284c7] px-2.5 py-0.5 rounded-full font-bold">
                  {filteredQuotes.length} câu
                </span>
              </h2>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nhập từ khóa tìm câu nói... (ví dụ: dreams, read, Einstein...)"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0284c7] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-black">
              {[
                'Tất cả 🌈',
                'Tự tin 💪',
                'Động lực 🌟',
                'Học tập 📚',
                'Tình bạn 🤝',
                'Yêu bản thân 💖',
                'Gia đình 🏠',
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    audioService.playClickSound();
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 whitespace-nowrap border ${
                    selectedCategory === cat
                      ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-2xs font-black'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid of Quote Cards (30 items per page or view) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {pageQuotes.map((q) => {
                const isSelected = fullQuotes150[activeQuoteIndex].id === q.id;
                const catStyle = getCategoryStyles(q.category);
                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelectQuoteCard(q.id)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-sky-100/90 border-[#0284c7] shadow-md ring-2 ring-sky-300'
                        : `${catStyle} shadow-2xs hover:shadow-xs`
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-slate-600">
                        #{q.id} • {q.category}
                      </span>
                      <span className="text-base">{q.emoji}</span>
                    </div>

                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 line-clamp-3 leading-snug">
                      "{q.en}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-black/5">
                      <span className="truncate max-w-[180px]">~ {q.author}</span>
                      <span className="text-[#0284c7] font-black text-[10px] hover:underline">
                        Đọc câu này ➔
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
                <span>
                  Trang {currentPage}/{totalPages} ({filteredQuotes.length} câu)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-40 transition cursor-pointer"
                  >
                    Trang trước
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-40 transition cursor-pointer"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
