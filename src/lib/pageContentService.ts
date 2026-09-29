import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isTrustedAdmin } from './adminAccess';
import type { ActiveTab } from '../types';

export interface PageDataItem {
  id: string;
  pageKey: string;
  title: string;
  subtitle?: string;
  content?: string;
  category?: string;
  grade?: 1 | 2 | 3 | 4 | 5;
  level?: 'easy' | 'medium' | 'hard';
  icon?: string;
  badge?: string;
  imageDriveId?: string;
  audioDriveId?: string;
  audioEnUrl?: string; // Link phát âm tiếng Anh
  audioViUrl?: string; // Link phát âm tiếng Việt
  audioExampleEnUrl?: string; // Link phát âm câu ví dụ tiếng Anh
  audioExampleViUrl?: string; // Link phát âm câu ví dụ tiếng Việt
  videoDriveId?: string;
  actionUrl?: string;
  tags?: string[];
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  order: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

import { safeStorageGet, safeStorageSet, runWhenIdle, isLowEndDevice } from '../utils/dataCompression';

const STORAGE_PREFIX = 'KIDO_PAGE_CONTENT_CACHE_V1_';

export function getLocalPageData(pageKey: string): PageDataItem[] {
  const cached = safeStorageGet<PageDataItem[]>(`${STORAGE_PREFIX}${pageKey}`, null);
  if (cached && Array.isArray(cached)) {
    return cached;
  }
  return [];
}

export function saveLocalPageData(pageKey: string, items: PageDataItem[]) {
  safeStorageSet(`${STORAGE_PREFIX}${pageKey}`, items, true);
}

// In-memory cache for loaded page data to avoid repeated JSON parsing
const runtimePageCache = new Map<string, PageDataItem[]>();

// Preload queue list of standard app pages
const PRELOAD_PAGES: ActiveTab[] = [
  'roadmap',
  'grade-1',
  'grade-2',
  'grade-3',
  'grade-4',
  'grade-5',
  'flashcards',
  'vocab',
  'practice-ex',
  'sample-exams',
  'daily-quotes',
  'story',
  'reading',
  'listening',
  'speaking',
  'games',
  'rewards',
  'parent-corner',
  'video-lectures'
];

/**
 * Automatically pre-loads and caches data for all key pages during browser idle time
 * Prevents UI lag and eliminates waiting spinners on slow connections or weak devices
 */
export function preloadAllPagesData(): void {
  if (typeof window === 'undefined') return;

  runWhenIdle(() => {
    let index = 0;

    function step() {
      if (index >= PRELOAD_PAGES.length) return;
      const pageKey = PRELOAD_PAGES[index++];

      // If not yet in runtime cache, read from compressed storage or default
      if (!runtimePageCache.has(pageKey)) {
        const local = getLocalPageData(pageKey);
        if (local.length > 0) {
          runtimePageCache.set(pageKey, local);
        } else {
          const defaults = getDefaultPageData(pageKey);
          runtimePageCache.set(pageKey, defaults);
          saveLocalPageData(pageKey, defaults);
        }
      }

      // Schedule next item non-blocking
      runWhenIdle(step, 100);
    }

    step();
  }, 1000);
}

export function subscribePageData(
  pageKey: ActiveTab,
  onChange: (items: PageDataItem[]) => void
): () => void {
  // 1. Instant Synchronous/Memory Return (0ms latency)
  const cached = runtimePageCache.get(pageKey);
  if (cached && cached.length > 0) {
    onChange(cached);
  } else {
    const local = getLocalPageData(pageKey);
    if (local.length > 0) {
      runtimePageCache.set(pageKey, local);
      onChange(local);
    } else {
      const defaults = getDefaultPageData(pageKey);
      runtimePageCache.set(pageKey, defaults);
      onChange(defaults);
    }
  }

  // 2. Real-time background sync with Firestore
  const docRef = doc(db, 'pageContent', pageKey);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const rawItems = Array.isArray(data?.items) ? data.items : [];
        const items = rawItems.length > 0 ? rawItems : getDefaultPageData(pageKey);
        runtimePageCache.set(pageKey, items);
        saveLocalPageData(pageKey, items);
        onChange(items);
      } else {
        const localCached = getLocalPageData(pageKey);
        const finalItems = localCached.length > 0 ? localCached : getDefaultPageData(pageKey);
        runtimePageCache.set(pageKey, finalItems);
        onChange(finalItems);
      }
    },
    (err) => {
      // Graceful fallback for offline / low-end devices
      const fallback = runtimePageCache.get(pageKey) || getLocalPageData(pageKey) || getDefaultPageData(pageKey);
      onChange(fallback);
    }
  );
}

export async function savePageData(pageKey: ActiveTab, items: PageDataItem[]): Promise<void> {
  saveLocalPageData(pageKey, items);
  const cleanItems = items.map((item, index) => {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(item)) {
      if (v !== undefined) cleaned[k] = v;
    }
    cleaned.order = index;
    cleaned.pageKey = pageKey;
    return cleaned;
  });

  const docRef = doc(db, 'pageContent', pageKey);
  await setDoc(docRef, {
    pageKey,
    items: cleanItems,
    updatedAt: serverTimestamp(),
    count: cleanItems.length,
  });
}

/** Pre-built rich default data tailored specifically for each distinct page */
export function getDefaultPageData(pageKey: string): PageDataItem[] {
  switch (pageKey) {
    case 'home':
      return [
        {
          id: 'home-1',
          pageKey: 'home',
          title: 'Chào mừng các bạn nhỏ đến với DinoEnglish! 🦖',
          subtitle: 'Learn • Play • Grow - Vừa học vừa chơi mỗi ngày',
          content: 'Khám phá thế giới tiếng Anh sinh động qua các bài học tương tác, nhiệm vụ nhận sao thưởng và thi đua bảng xếp hạng cùng bạn bè!',
          icon: '🌟',
          badge: 'Nổi bật',
          order: 0,
          enabled: true,
          actionUrl: '#roadmap',
        },
        {
          id: 'home-2',
          pageKey: 'home',
          title: 'Nhiệm vụ nhận sao vàng hôm nay ⭐',
          subtitle: 'Hoàn thành 1 bài luyện nghe và 1 bài kiểm tra từ vựng',
          content: 'Nhận ngay +15 Sao thưởng và duy trì chuỗi học tập (Streak) rực rỡ.',
          icon: '🎯',
          badge: 'Hàng ngày',
          order: 1,
          enabled: true,
        },
        {
          id: 'home-3',
          pageKey: 'home',
          title: 'Mẹo học phát âm chuẩn bản xứ 🗣️',
          subtitle: 'Phương pháp Shadowing & Luyện nói cùng AI',
          content: 'Nghe kĩ âm thanh của người bản ngữ, lặp lại ngữ điệu và ghi âm để AI chấm điểm độ chính xác.',
          icon: '💡',
          badge: 'Mẹo hay',
          order: 2,
          enabled: true,
        }
      ];

    case 'grade-1':
      return [
        {
          id: 'g1-1',
          pageKey: 'grade-1',
          title: 'Unit 1: All About Me! 👋',
          subtitle: 'Làm quen, chào hỏi và giới thiệu tên tuổi',
          content: 'Học sinh làm quen với các câu giao tiếp cơ bản: "Hello, my name is...", "I am 6 years old."',
          grade: 1,
          category: 'Chủ đề bài học',
          icon: '👋',
          badge: 'Cốt lõi',
          order: 0,
          enabled: true,
        },
        {
          id: 'g1-2',
          pageKey: 'grade-1',
          title: 'Unit 2: My Family & Home 👨‍👩‍👧',
          subtitle: 'Từ vựng về các thành viên gia đình và ngôi nhà',
          content: 'Từ vựng trọng tâm: Dad, Mom, Brother, Sister, Baby, House.',
          grade: 1,
          category: 'Chủ đề bài học',
          icon: '🏡',
          badge: 'Bài học 2',
          order: 1,
          enabled: true,
        },
        {
          id: 'g1-3',
          pageKey: 'grade-1',
          title: 'Unit 3: Colors and Numbers 🎨',
          subtitle: 'Màu sắc cầu vồng và đếm số từ 1 đến 10',
          content: 'Red, Blue, Green, Yellow, Pink. One, Two, Three, Four, Five...',
          grade: 1,
          category: 'Chủ đề bài học',
          icon: '🎨',
          badge: 'Bài học 3',
          order: 2,
          enabled: true,
        }
      ];

    case 'grade-2':
      return [
        {
          id: 'g2-1',
          pageKey: 'grade-2',
          title: 'Unit 1: Animals Around Us 🐶',
          subtitle: 'Thế giới động vật thân quen và sở thích',
          content: 'Dog, Cat, Bird, Fish, Elephant, Lion, Monkey. Cấu trúc: "I like dogs.", "It is big."',
          grade: 2,
          category: 'Khối Lớp 2',
          icon: '🦁',
          badge: 'Chủ đề chính',
          order: 0,
          enabled: true,
        },
        {
          id: 'g2-2',
          pageKey: 'grade-2',
          title: 'Unit 2: In My Classroom 🎒',
          subtitle: 'Đồ dùng học tập và lớp học thân thương',
          content: 'Book, Pencil, Eraser, Ruler, Backpack, Desk. Cấu trúc: "This is my pencil."',
          grade: 2,
          category: 'Khối Lớp 2',
          icon: '✏️',
          badge: 'Bài 2',
          order: 1,
          enabled: true,
        }
      ];

    case 'grade-3':
      return [
        {
          id: 'g3-1',
          pageKey: 'grade-3',
          title: 'Unit 1: Daily Activities & Time ⏰',
          subtitle: 'Thói quen hằng ngày và nói về thời gian',
          content: 'Wake up, brush teeth, have breakfast, go to school. "What time do you get up? - I get up at 6 AM."',
          grade: 3,
          category: 'Khối Lớp 3',
          icon: '⏰',
          badge: 'Trọng tâm',
          order: 0,
          enabled: true,
        },
        {
          id: 'g3-2',
          pageKey: 'grade-3',
          title: 'Unit 2: Delicious Food & Drinks 🍕',
          subtitle: 'Món ăn yêu thích và hỏi đáp lịch sự',
          content: 'Pizza, Milk, Apple, Chicken, Rice. "Would you like some milk? - Yes, please!"',
          grade: 3,
          category: 'Khối Lớp 3',
          icon: '🍎',
          badge: 'Bài 2',
          order: 1,
          enabled: true,
        }
      ];

    case 'grade-4':
      return [
        {
          id: 'g4-1',
          pageKey: 'grade-4',
          title: 'Unit 1: Places in Town & Directions 🗺️',
          subtitle: 'Chỉ đường và địa điểm trong thành phố',
          content: 'Supermarket, Cinema, School, Hospital, Park. "Excuse me, where is the library?"',
          grade: 4,
          category: 'Khối Lớp 4',
          icon: '🏙️',
          badge: 'Trọng tâm',
          order: 0,
          enabled: true,
        },
        {
          id: 'g4-2',
          pageKey: 'grade-4',
          title: 'Unit 2: Dream Jobs & Future 👩‍⚕️',
          subtitle: 'Nghề nghiệp mơ ước và lý do yêu thích',
          content: 'Doctor, Teacher, Engineer, Pilot, Artist. "What would you like to be in the future?"',
          grade: 4,
          category: 'Khối Lớp 4',
          icon: '🚀',
          badge: 'Bài 2',
          order: 1,
          enabled: true,
        }
      ];

    case 'grade-5':
      return [
        {
          id: 'g5-1',
          pageKey: 'grade-5',
          title: 'Unit 1: Wonders of Nature & Environment 🌿',
          subtitle: 'Bảo vệ môi trường và cảnh quan thế giới',
          content: 'Rainforest, Mountain, Ocean, River. "We should protect our planet by planting trees."',
          grade: 5,
          category: 'Khối Lớp 5',
          icon: '🌍',
          badge: 'Nâng cao',
          order: 0,
          enabled: true,
        },
        {
          id: 'g5-2',
          pageKey: 'grade-5',
          title: 'Unit 2: Exploring World Cultures 🎎',
          subtitle: 'Văn hóa các nước và ngày hội truyền thống',
          content: 'Festival, Traditional costume, Greeting customs, Famous landmarks around the world.',
          grade: 5,
          category: 'Khối Lớp 5',
          icon: '⛩️',
          badge: 'Bài 2',
          order: 1,
          enabled: true,
        }
      ];

    case 'listening':
      return [
        {
          id: 'lis-1',
          pageKey: 'listening',
          title: 'Bài nghe 1: A Fun Day at the Zoo 🐘',
          subtitle: 'Luyện nghe miêu tả động vật và âm thanh sở thú',
          content: 'Transcript: Look at the big elephant! It has large ears and a long trunk. The little monkeys are eating bananas.',
          level: 'easy',
          category: 'Luyện Nghe',
          icon: '🎧',
          badge: 'Cơ bản',
          order: 0,
          enabled: true,
          options: ['Elephant', 'Lion', 'Tiger', 'Giraffe'],
          correctAnswer: 'Elephant',
          explanation: 'Trong bài nghe, con vật được miêu tả có tai to và vòi dài là con voi (elephant).'
        },
        {
          id: 'lis-2',
          pageKey: 'listening',
          title: 'Bài nghe 2: In the English Classroom 🏫',
          subtitle: 'Lắng nghe chỉ dẫn của cô giáo và đáp lại',
          content: 'Transcript: Good morning class! Open your books to page ten. Please listen carefully and repeat after me.',
          level: 'medium',
          category: 'Luyện Nghe',
          icon: '📚',
          badge: 'Thực hành',
          order: 1,
          enabled: true,
        }
      ];

    case 'speaking':
      return [
        {
          id: 'spk-1',
          pageKey: 'speaking',
          title: 'Luyện nói 1: Giới thiệu bản thân trong 30 giây 🎙️',
          subtitle: 'Mẫu câu tự tin: Tên, tuổi, sở thích và ước mơ',
          content: '"Hello everyone! My name is Nam. I am 8 years old. I love playing football and reading comic books."',
          level: 'easy',
          category: 'Luyện Nói',
          icon: '🎤',
          badge: 'Tự tin',
          order: 0,
          enabled: true,
        },
        {
          id: 'spk-2',
          pageKey: 'speaking',
          title: 'Luyện nói 2: Miêu tả đồ vật em yêu thích 🧸',
          subtitle: 'Mẫu câu diễn đạt màu sắc, kích thước và lý do yêu thích',
          content: '"This is my favorite teddy bear. It is brown and very soft. My mom gave it to me on my birthday."',
          level: 'medium',
          category: 'Luyện Nói',
          icon: '🧸',
          badge: 'Hấp dẫn',
          order: 1,
          enabled: true,
        }
      ];

    case 'story':
      return [
        {
          id: 'story-1',
          pageKey: 'story',
          title: 'Truyện: The Clever Little Fox 🦊',
          subtitle: 'Câu chuyện chú cáo thông minh và bài học chia sẻ',
          content: 'Once upon a time in a green forest, there lived a quick-witted fox named Toby. One day, he found a basket of shiny red apples...',
          category: 'Kho Truyện',
          icon: '📖',
          badge: 'Truyện hay',
          order: 0,
          enabled: true,
        },
        {
          id: 'story-2',
          pageKey: 'story',
          title: 'Truyện: The Lion and the Kind Mouse 🦁',
          subtitle: 'Lòng tốt luôn được đền đáp xứng đáng',
          content: 'A fierce lion was caught in a hunter trap. A tiny mouse heard his roar and chewed through the thick ropes to set him free.',
          category: 'Kho Truyện',
          icon: '🐭',
          badge: 'Bài học ý nghĩa',
          order: 1,
          enabled: true,
        }
      ];

    case 'reading':
      return [
        {
          id: 'rd-1',
          pageKey: 'reading',
          title: 'Bài đọc: Healthy Habits for Champions 🥗',
          subtitle: 'Đoạn văn ngắn về thói quen ăn uống lành mạnh và tập thể dục',
          content: 'Eating fruits, vegetables, and drinking plenty of water keeps our body energetic. Getting eight hours of sleep helps our brain grow strong.',
          level: 'easy',
          category: 'Luyện Đọc',
          icon: '📑',
          badge: 'Sức khỏe',
          order: 0,
          enabled: true,
        },
        {
          id: 'rd-2',
          pageKey: 'reading',
          title: 'Bài đọc: Journey into Space 🚀',
          subtitle: 'Khám phá mặt trăng và các vì sao trong vũ trụ',
          content: 'Astronauts travel to space in mighty rockets. In zero gravity, everything floats gently in the cabin like feathers!',
          level: 'medium',
          category: 'Luyện Đọc',
          icon: '🛸',
          badge: 'Khoa học',
          order: 1,
          enabled: true,
        }
      ];

    case 'flashcards':
      return [
        {
          id: 'fc-1',
          pageKey: 'flashcards',
          title: 'Elephant (/ˈel.ə.fənt/)',
          subtitle: 'Con voi 🐘',
          content: 'Ví dụ: The elephant is the largest land animal in the world.',
          category: 'Động vật',
          icon: '🐘',
          badge: 'Từ vựng thẻ',
          order: 0,
          enabled: true,
        },
        {
          id: 'fc-2',
          pageKey: 'flashcards',
          title: 'Rainbow (/ˈreɪn.boʊ/)',
          subtitle: 'Cầu vồng 🌈',
          content: 'Ví dụ: Look at the beautiful rainbow after the spring rain.',
          category: 'Thiên nhiên',
          icon: '🌈',
          badge: 'Từ vựng thẻ',
          order: 1,
          enabled: true,
        },
        {
          id: 'fc-3',
          pageKey: 'flashcards',
          title: 'Astronaut (/ˈæs.trə.nɑːt/)',
          subtitle: 'Phi hành gia 👨‍🚀',
          content: 'Ví dụ: He dreams of becoming an astronaut and landing on Mars.',
          category: 'Nghề nghiệp',
          icon: '👨‍🚀',
          badge: 'Từ vựng thẻ',
          order: 2,
          enabled: true,
        }
      ];

    case 'quiz':
      return [
        {
          id: 'qz-1',
          pageKey: 'quiz',
          title: 'What color is formed by mixing blue and yellow? 🎨',
          subtitle: 'Câu hỏi trắc nghiệm màu sắc',
          content: 'Chọn câu trả lời chính xác nhất:',
          category: 'Đố Vui',
          icon: '❓',
          badge: 'Câu 1',
          order: 0,
          enabled: true,
          options: ['Green (Xanh lá)', 'Red (Màu đỏ)', 'Purple (Màu tím)', 'Orange (Màu cam)'],
          correctAnswer: 'Green (Xanh lá)',
          explanation: 'Khi trộn màu xanh dương (Blue) và màu vàng (Yellow), ta sẽ được màu xanh lá cây (Green).'
        },
        {
          id: 'qz-2',
          pageKey: 'quiz',
          title: 'Which animal says "Meow, meow"? 🐱',
          subtitle: 'Âm thanh của loài vật',
          content: 'Hãy chọn loài vật phát ra tiếng kêu này:',
          category: 'Đố Vui',
          icon: '🐾',
          badge: 'Câu 2',
          order: 1,
          enabled: true,
          options: ['Cat (Con mèo)', 'Dog (Con chó)', 'Duck (Con vịt)', 'Cow (Con bò)'],
          correctAnswer: 'Cat (Con mèo)',
          explanation: 'Con mèo (Cat) kêu "meow meow".'
        }
      ];

    case 'grammar-tenses':
      return [
        {
          id: 'gr-1',
          pageKey: 'grammar-tenses',
          title: 'Thì Hiện Tại Đơn (Present Simple Tense) ⏳',
          subtitle: 'Diễn tả thói quen, chân lý hoặc sự thật hiển nhiên',
          content: 'Cấu trúc:\n(+) S + V(s/es) + O\n(-) S + do/does not + V_inf\n(?) Do/Does + S + V_inf?\nVí dụ: She plays piano every Sunday.',
          category: 'Ngữ Pháp',
          icon: '📘',
          badge: 'Căn bản',
          order: 0,
          enabled: true,
        },
        {
          id: 'gr-2',
          pageKey: 'grammar-tenses',
          title: 'Thì Hiện Tại Tiếp Diễn (Present Continuous) 🏃',
          subtitle: 'Diễn tả hành động đang diễn ra tại thời điểm nói',
          content: 'Cấu trúc:\n(+) S + am/is/are + V-ing\n(-) S + am/is/are not + V-ing\n(?) Am/Is/Are + S + V-ing?\nVí dụ: Look! The birds are singing.',
          category: 'Ngữ Pháp',
          icon: '🏃',
          badge: 'Quan trọng',
          order: 1,
          enabled: true,
        }
      ];

    case 'daily-quotes':
      return [
        {
          id: 'dq-1',
          pageKey: 'daily-quotes',
          title: '"A journey of a thousand miles begins with a single step."',
          subtitle: 'Hành trình vạn dặm bắt đầu từ một bước chân đầu tiên.',
          content: 'Tác giả: Lão Tử (Lao Tzu) · Hãy kiên trì học từng từ vựng mỗi ngày, thành công lớn sẽ đến với em!',
          category: 'Danh Ngôn',
          icon: '✨',
          badge: 'Hôm nay',
          order: 0,
          enabled: true,
        },
        {
          id: 'dq-2',
          pageKey: 'daily-quotes',
          title: '"Practice makes perfect."',
          subtitle: 'Có công mài sắt, có ngày nên kim.',
          content: 'Luyện tập chăm chỉ mỗi ngày sẽ giúp em nói tiếng Anh trôi chảy và tự tin như tiếng mẹ đẻ.',
          category: 'Danh Ngôn',
          icon: '💪',
          badge: 'Động lực',
          order: 1,
          enabled: true,
        }
      ];

    case 'practice-ex':
      return [
        {
          id: 'pe-1',
          pageKey: 'practice-ex',
          title: 'Bài tập 1: Điền mạo từ "a" hoặc "an" ✏️',
          subtitle: 'Phân biệt nguyên âm u, e, o, a, i',
          content: 'Question: She is eating ___ apple in the garden.',
          options: ['an', 'a', 'the', 'none'],
          correctAnswer: 'an',
          explanation: 'Từ "apple" bắt đầu bằng nguyên âm "a" nên ta dùng mạo từ "an".',
          category: 'Bài Tập',
          icon: '📝',
          badge: 'Khởi động',
          order: 0,
          enabled: true,
        }
      ];

    case 'sample-exams':
      return [
        {
          id: 'se-1',
          pageKey: 'sample-exams',
          title: 'Đề Khảo Sát Năng Lực Học Kỳ I - Chuẩn Cambridge Starter 🏆',
          subtitle: 'Thời gian: 35 phút · 25 câu hỏi Nghe, Đọc và Viết',
          content: 'Đề thi bao gồm 3 phần: Listening (Nghe tranh tô màu), Reading (Đọc nối từ) và Writing (Điền từ hoàn chỉnh).',
          category: 'Đề Thi Mẫu',
          icon: '📜',
          badge: 'Đề Chuẩn',
          order: 0,
          enabled: true,
        }
      ];

    case 'roadmap':
      return [
        {
          id: 'rm-1',
          pageKey: 'roadmap',
          title: 'Chặng 1: Nảy Mầm (Phát Âm & 200 Từ Cơ Bản) 🌱',
          subtitle: 'Thời lượng: 4 tuần · Cấp độ Level 1 - 5',
          content: 'Làm quen bảng chữ cái tiếng Anh, ngữ âm phonics chuẩn, ghi nhớ 200 từ vựng gần gũi về gia đình, màu sắc và đồ chơi.',
          icon: '🌱',
          badge: 'Chặng 1',
          order: 0,
          enabled: true,
        },
        {
          id: 'rm-2',
          pageKey: 'roadmap',
          title: 'Chặng 2: Vươn Chồi (Giao Tiếp Tự Nhiên & 500 Từ) 🌿',
          subtitle: 'Thời lượng: 8 tuần · Cấp độ Level 6 - 15',
          content: 'Tự tin trả lời các câu hỏi giao tiếp đời sống, miêu tả tranh vẽ, luyện nói trôi chảy các chủ đề trường học và động vật.',
          icon: '🌿',
          badge: 'Chặng 2',
          order: 1,
          enabled: true,
        },
        {
          id: 'rm-3',
          pageKey: 'roadmap',
          title: 'Chặng 3: Đơm Hoa (Thuyết Trình & Tư Duy Tiếng Anh) 🌺',
          subtitle: 'Thời lượng: 12 tuần · Cấp độ Level 16+',
          content: 'Hình thành tư duy phản xạ tiếng Anh trực tiếp, làm bài tập đọc hiểu và kể lại câu chuyện ngắn bằng ngôn ngữ của riêng mình.',
          icon: '🌺',
          badge: 'Chặng 3',
          order: 2,
          enabled: true,
        }
      ];

    case 'video-lectures':
      return [
        {
          id: 'vl-1',
          pageKey: 'video-lectures',
          title: 'Video 1: Bí kíp phát âm chuẩn nguyên âm đôi tiếng Anh 🎬',
          subtitle: 'Giáo viên: Ms. Sarah · Thời lượng: 12 phút',
          content: 'Hướng dẫn khẩu hình miệng chi tiết cho các âm /eɪ/, /aɪ/, /ɔɪ/. Bài tập luyện phát âm tương tác kèm bài hát vui nhộn.',
          category: 'Video Bài Giảng',
          icon: '🎥',
          badge: 'Video Hot',
          order: 0,
          enabled: true,
        }
      ];

    case 'parent-corner':
      return [
        {
          id: 'pc-1',
          pageKey: 'parent-corner',
          title: 'Cẩm nang: 15 phút học tiếng Anh hiệu quả cùng con mỗi ngày 👨‍👩‍👧',
          subtitle: 'Bí quyết giúp bé hình thành thói quen học tập vui vẻ tự nhiên',
          content: 'Không cần tạo áp lực kiểm tra điểm số; hãy cùng con chơi đố vui, hát bài hát tiếng Anh và khen ngợi sự nỗ lực khi bé tích lũy thêm sao.',
          category: 'Góc Phụ Huynh',
          icon: '💖',
          badge: 'Lời khuyên',
          order: 0,
          enabled: true,
        }
      ];

    default:
      return [
        {
          id: `item-${pageKey}-1`,
          pageKey,
          title: `Nội dung chuyên biệt trang ${pageKey}`,
          subtitle: `Dữ liệu và cấu hình dành riêng cho trang ${pageKey}`,
          content: `Đây là dữ liệu chuyên biệt của trang ${pageKey}. Bạn có thể thêm, sửa, xóa hoặc cập nhật các khối dữ liệu riêng của trang này mà không bị gộp chung với các trang khác.`,
          icon: '📄',
          badge: 'Trang riêng',
          order: 0,
          enabled: true,
        }
      ];
  }
}
