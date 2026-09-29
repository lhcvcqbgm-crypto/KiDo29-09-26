import React, { useState, useEffect } from 'react';
import {
  Globe,
  Clock,
  Activity,
  Rocket,
  BookOpen,
  Sparkles,
  ArrowLeft,
  Volume2,
  CheckCircle2,
  X,
  Play,
  Pause,
  RotateCcw,
  Music,
  Volume1,
  HelpCircle,
  Trophy,
  Star,
  Flame,
  Send,
  Bot,
  Info
} from 'lucide-react';
import { UserProfile, ActiveTab } from '../types';
import { audioService } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';

export type TenseKey = 'present-simple' | 'past-simple' | 'present-continuous' | 'future-simple';

export interface TenseDetail {
  id: TenseKey;
  title: string;
  enTitle: string;
  icon: 'globe' | 'clock' | 'activity' | 'rocket';
  desc: string;
  themeColor: 'blue' | 'orange' | 'teal' | 'purple';
  tip: string;
  formulas: {
    affirmative: string;
    negative: string;
    interrogative: string;
  };
  usages: string[];
  signalWords: string[];
  examples: {
    en: string;
    vi: string;
    dinoNote: string;
  }[];
  practiceQuestions: {
    id: number;
    question: string;
    answer: string;
    meaningVi: string;
    explanation: string;
    dinoKeyPoint: string;
    dinoTimeSignal: string;
    dinoVerbRule: string;
  }[];
}

export const tensesData: Record<TenseKey, TenseDetail> = {
  'present-simple': {
    id: 'present-simple',
    title: 'Thì Hiện Tại Đơn',
    enTitle: 'Present Simple Tense',
    icon: 'globe',
    desc: 'Nhấn mạnh tính thường xuyên, thói quen & chân lý',
    themeColor: 'blue',
    tip: "Mẹo thông minh của Dino: 'Chủ ngữ số ít (He, She, It, Danh từ số ít như Dino, My cat) rất thích chữ 's' hoặc 'es' ở đuôi động từ nhé! Còn I, You, We, They và Danh từ số nhiều thì động từ thích giữ nguyên thể nhé!'",
    formulas: {
      affirmative: 'S + V(s/es) + O',
      negative: 'S + do/does + not + V(bare) + O',
      interrogative: 'Do/Does + S + V(bare) + O?',
    },
    usages: [
      'Diễn tả thói quen hoặc hành động xảy ra thường xuyên ở hiện tại (Ví dụ: I brush my teeth every day - Tớ đánh răng mỗi ngày).',
      'Diễn tả sự thật hiển nhiên, một chân lý trong tự nhiên (Ví dụ: The sun rises in the east - Mặt trời mọc ở hướng Đông).',
    ],
    signalWords: ['every day', 'every morning', 'always', 'usually', 'often', 'sometimes', 'never'],
    examples: [
      {
        en: 'I read books every night.',
        vi: 'Tớ đọc sách mỗi tối.',
        dinoNote: 'Thói quen đọc sách trước khi đi ngủ.',
      },
      {
        en: 'The sun rises in the east.',
        vi: 'Mặt trời mọc ở hướng Đông.',
        dinoNote: 'Sự thật tự nhiên hiển nhiên.',
      },
      {
        en: 'Dino likes fresh apples.',
        vi: 'Dino thích những quả táo tươi.',
        dinoNote: 'Sở thích hoặc sự thật hiện tại.',
      },
      {
        en: 'My cat sleeps on the sofa.',
        vi: 'Chú mèo của tớ ngủ trên ghế sofa.',
        dinoNote: 'Thói quen thường xuyên của chú mèo.',
      },
      {
        en: 'They do not drink coffee.',
        vi: 'Họ không uống cà phê.',
        dinoNote: 'Phủ định một thói quen ở hiện tại.',
      },
      {
        en: 'Does she speak English?',
        vi: 'Cô ấy có nói tiếng Anh không?',
        dinoNote: 'Hỏi về khả năng hoặc thói quen.',
      },
    ],
    practiceQuestions: [
      {
        id: 1,
        question: 'My dog (bark) _______ loudly when someone knocks.',
        answer: 'barks',
        meaningVi: 'Chú chó của tớ sủa rất to khi có ai gõ cửa.',
        explanation: 'Chủ ngữ "My dog" là danh từ số ít nên động từ "bark" phải thêm "s" thành "barks" đó bé yêu!',
        dinoKeyPoint: "Trong thì Hiện tại đơn, khi chủ ngữ là danh từ số ít (chỉ 1 người hoặc 1 vật), động từ theo sau bắt buộc phải thêm đuôi 's' hoặc 'es' đó con yêu ơi.",
        dinoTimeSignal: "Con hãy nhìn vào ngữ cảnh thói quen tự nhiên khi ai đó gõ cửa, dùng để diễn tả sự thật đặc điểm tự nhiên của chú chó đấy.",
        dinoVerbRule: "Vì 'My dog' chỉ có một chú chó thôi (chủ ngữ số ít), nên động từ 'bark' không thể đứng một mình được mà phải thêm chữ 's' ở cuối để trở thành 'barks' mới đúng ngữ pháp nè!",
      },
      {
        id: 2,
        question: 'She (like) _______ eating ice cream on hot days.',
        answer: 'likes',
        meaningVi: 'Cô ấy thích ăn kem vào những ngày nắng nóng.',
        explanation: 'Chủ ngữ "She" thuộc nhóm số ít (He, She, It), động từ "like" thêm "s" thành "likes"!',
        dinoKeyPoint: "Chủ ngữ 'She' là ngôi thứ 3 số ít nên động từ 'like' phải thêm đuôi 's'.",
        dinoTimeSignal: "Dùng diễn tả sở thích cá nhân thường xuyến ở hiện tại.",
        dinoVerbRule: "Quy tắc: She + V(s) -> She likes.",
      },
      {
        id: 3,
        question: 'They (play) _______ football every Saturday afternoon.',
        answer: 'play',
        meaningVi: 'Họ chơi bóng đá vào mỗi chiều thứ Bảy.',
        explanation: 'Chủ ngữ "They" là số nhiều nên động từ "play" giữ nguyên thể không chia!',
        dinoKeyPoint: "Khi chủ ngữ là They (số nhiều), động từ đi sau giữ nguyên không thêm s/es.",
        dinoTimeSignal: "Dấu hiệu 'every Saturday' nhắc bé đây là thói quen lặp đi lặp lại.",
        dinoVerbRule: "They + V(bare) -> They play.",
      },
      {
        id: 4,
        question: 'We (have) _______ breakfast at 7 o\'clock.',
        answer: 'have',
        meaningVi: 'Chúng tớ ăn sáng lúc 7 giờ.',
        explanation: 'Chủ ngữ "We" là số nhiều, nên ta dùng động từ "have" ở dạng nguyên thể!',
        dinoKeyPoint: "Chủ ngữ We đi với động từ nguyên thể 'have'.",
        dinoTimeSignal: "Diễn tả lịch trình thói quen hàng ngày.",
        dinoVerbRule: "We + have (nguyên thể).",
      },
      {
        id: 5,
        question: 'A lion (roar) _______ loudly when it is angry.',
        answer: 'roars',
        meaningVi: 'Chú sư tử gầm rất to khi tức giận.',
        explanation: 'Chủ ngữ "A lion" là một chú sư tử dũng mãnh (số ít) nên động từ gầm "roar" phải thêm chữ "s" thành "roars" đó bé yêu!',
        dinoKeyPoint: "Trong thì Hiện tại đơn, khi chủ ngữ là danh từ số ít (chỉ 1 người hoặc 1 vật), động từ theo sau bắt buộc phải thêm đuôi 's' hoặc 'es' đó con yêu ơi.",
        dinoTimeSignal: "Con hãy nhìn vào cụm 'when it is angry' nhé, chữ 'is' chính là dấu hiệu của thì Hiện tại đơn, dùng để diễn tả một sự thật hiển nhiên, một đặc điểm tự nhiên của chú sư tử đấy.",
        dinoVerbRule: "Vì 'A lion' chỉ có một chú sư tử thôi (chủ ngữ số ít), nên động từ 'roar' (gầm) không thể đứng một mình được mà phải thêm chữ 's' ở cuối để trở thành 'roars' mới đúng ngữ pháp nè!",
      },
      {
        id: 6,
        question: 'Water (boil) _______ at 100 degrees Celsius.',
        answer: 'boils',
        meaningVi: 'Nước sôi ở 100 độ C.',
        explanation: 'Water là danh từ không đếm được (tương đương số ít), nên "boil" thêm "s" thành "boils".',
        dinoKeyPoint: "Danh từ không đếm được như Water xem như số ít, động từ chia đuôi 's'.",
        dinoTimeSignal: "Đây là một sự thật khoa học hiển nhiên.",
        dinoVerbRule: "Water + boils.",
      },
      {
        id: 7,
        question: 'He (not watch) _______ TV in the morning.',
        answer: 'does not watch',
        meaningVi: 'Cậu ấy không xem TV vào buổi sáng.',
        explanation: 'Câu phủ định với chủ ngữ "He" ta dùng trợ động từ "does not" + động từ nguyên thể "watch"!',
        dinoKeyPoint: "Dạng phủ định với He/She/It: S + does not + V(bare).",
        dinoTimeSignal: "Diễn tả thói quen không làm vào buổi sáng.",
        dinoVerbRule: "does not watch (hoặc doesn't watch).",
      },
      {
        id: 8,
        question: 'Cats (hate) _______ water.',
        answer: 'hate',
        meaningVi: 'Mèo rất ghét nước.',
        explanation: 'Chủ ngữ "Cats" có "s" là số nhiều nên động từ "hate" giữ nguyên thể.',
        dinoKeyPoint: "Danh từ số nhiều Cats + động từ nguyên thể.",
        dinoTimeSignal: "Sự thật tự nhiên về loài mèo.",
        dinoVerbRule: "Cats + hate.",
      },
      {
        id: 9,
        question: 'My mother (cook) _______ delicious food every day.',
        answer: 'cooks',
        meaningVi: 'Mẹ tớ nấu thức ăn rất ngon mỗi ngày.',
        explanation: 'Chủ ngữ "My mother" là số ít (ngôi 3 số ít) nên "cook" thêm "s" thành "cooks".',
        dinoKeyPoint: "My mother = She (số ít) -> V + s.",
        dinoTimeSignal: "Dấu hiệu 'every day'.",
        dinoVerbRule: "My mother cooks.",
      },
      {
        id: 10,
        question: 'The Earth (go) _______ around the Sun.',
        answer: 'goes',
        meaningVi: 'Trái Đất quay quanh Mặt Trời.',
        explanation: 'Chủ ngữ "The Earth" là số ít, động từ tận cùng bằng "o" (go) phải thêm "es" thành "goes"!',
        dinoKeyPoint: "Động từ kết thúc bằng o, ch, s, x, z, sh thì thêm 'es' khi đi với chủ ngữ số ít.",
        dinoTimeSignal: "Chân lý khoa học bất biến.",
        dinoVerbRule: "The Earth + goes.",
      },
    ],
  },
  'past-simple': {
    id: 'past-simple',
    title: 'Thì Quá Khứ Đơn',
    enTitle: 'Past Simple Tense',
    icon: 'clock',
    desc: 'Hành động đã bắt đầu & kết thúc hoàn toàn trong quá khứ',
    themeColor: 'orange',
    tip: '"Quá quá khứ là chuyện đã qua! Ta chỉ cần thêm đuôi \'-ed\' vào sau động từ có quy tắc (ví dụ: play -> played). Nhưng bé hãy cẩn thận với các động từ bất quy tắc \'biến hình\' hoàn toàn nhé (ví dụ: go -> went, eat -> ate, see -> saw)! Khi có trợ động từ did/didn\'t, động từ chính được giải phóng về nguyên thể nha!"',
    formulas: {
      affirmative: 'S + V2/ed + O',
      negative: 'S + did + not + V(bare) + O',
      interrogative: 'Did + S + V(bare) + O?',
    },
    usages: [
      'Diễn tả một hành động đã xảy ra và chấm dứt hoàn toàn trong quá khứ, có thời gian xác định (Ví dụ: I watched a movie yesterday - Tớ đã xem phim hôm qua).',
    ],
    signalWords: ['yesterday', 'last night', 'last week', 'last year', 'two days ago', 'in 2025'],
    examples: [
      {
        en: 'We visited the zoo last Sunday.',
        vi: 'Chúng tớ đã đi thăm sở thú vào Chủ Nhật tuần trước.',
        dinoNote: 'Hành động đi thăm sở thú đã kết thúc.',
      },
      {
        en: 'He did not play with the robot yesterday.',
        vi: 'Hôm qua em ấy đã không chơi với rô-bốt.',
        dinoNote: 'Phủ định sự việc đã xảy ra hôm qua.',
      },
      {
        en: 'Did you buy a new book last month?',
        vi: 'Tháng trước câu đã mua một cuốn sách mới à?',
        dinoNote: 'Hỏi về sự việc mua sách trong quá khứ.',
      },
      {
        en: 'My family went to the beach two days ago.',
        vi: 'Gia đình tớ đã đi biển hai ngày trước.',
        dinoNote: 'Động từ bất quy tắc go chuyên thành went.',
      },
      {
        en: 'I saw a big elephant at the circus.',
        vi: 'Tớ đã nhìn thấy một chú voi to ở rạp xiếc.',
        dinoNote: 'Động từ bất quy tắc see chuyên thành saw.',
      },
      {
        en: 'The dog was very friendly last night.',
        vi: 'Tối qua chú chó đó rất thân thiện.',
        dinoNote: 'Động từ To Be ở quá khứ số ít là was.',
      },
    ],
    practiceQuestions: [
      {
        id: 1,
        question: 'Yesterday, I (visit) _______ my grandparents in the countryside.',
        answer: 'visited',
        meaningVi: 'Hôm qua tớ đã đi thăm ông bà ở quê.',
        explanation: 'Từ nhận biết "Yesterday" chỉ quá khứ. Động từ "visit" có quy tắc nên ta thêm "-ed" thành "visited".',
        dinoKeyPoint: 'Động từ có quy tắc trong quá khứ đơn chỉ cần thêm đuôi -ed.',
        dinoTimeSignal: 'Dấu hiệu "Yesterday" rõ ràng chỉ quá khứ đã qua.',
        dinoVerbRule: 'visit -> visited.',
      },
      {
        id: 2,
        question: 'Dino (eat) _______ a delicious cake last night.',
        answer: 'ate',
        meaningVi: 'Tối qua Dino đã ăn một chiếc bánh kem rất ngon.',
        explanation: 'Động từ "eat" là động từ bất quy tắc, dạng quá khứ của "eat" là "ate"!',
        dinoKeyPoint: 'Động từ bất quy tắc eat biến đổi thành ate.',
        dinoTimeSignal: 'Dấu hiệu "last night".',
        dinoVerbRule: 'eat -> ate.',
      },
      {
        id: 3,
        question: 'They (go) _______ to the park two days ago.',
        answer: 'went',
        meaningVi: 'Họ đã đi đến công viên hai ngày trước.',
        explanation: 'Động từ "go" dạng quá khứ biến hình thành "went"!',
        dinoKeyPoint: 'Go biến thành went trong quá khứ.',
        dinoTimeSignal: 'Dấu hiệu "two days ago".',
        dinoVerbRule: 'go -> went.',
      },
      {
        id: 4,
        question: 'We (not play) _______ video games yesterday.',
        answer: 'did not play',
        meaningVi: 'Hôm qua chúng tớ đã không chơi trò chơi điện tử.',
        explanation: 'Dạng phủ định quá khứ: dùng "did not" + động từ nguyên thể "play".',
        dinoKeyPoint: 'Phủ định quá khứ dùng did not (didn\'t) + V(bare).',
        dinoTimeSignal: 'Yesterday chỉ quá khứ.',
        dinoVerbRule: 'did not play.',
      },
      {
        id: 5,
        question: 'She (buy) _______ a nice hat last week.',
        answer: 'bought',
        meaningVi: 'Tháng trước cô ấy đã mua một chiếc mũ rất đẹp.',
        explanation: 'Động từ "buy" dạng quá khứ bất quy tắc là "bought"!',
        dinoKeyPoint: 'Buy biến thành bought.',
        dinoTimeSignal: 'Dấu hiệu "last week".',
        dinoVerbRule: 'buy -> bought.',
      },
    ],
  },
  'present-continuous': {
    id: 'present-continuous',
    title: 'Thì Hiện Tại Tiếp Diễn',
    enTitle: 'Present Continuous Tense',
    icon: 'activity',
    desc: 'Diễn tả hành động đang diễn ra ngay tại thời điểm nói',
    themeColor: 'teal',
    tip: '"Đang làm gì đó thì bắt buộc phải có hai bạn đi liền nhau: động từ To Be (am/is/are) và động từ chính thêm đuôi \'-ing\' nha! Thiếu một trong hai bạn là câu bị sai đó con!"',
    formulas: {
      affirmative: 'S + am/is/are + V-ing + O',
      negative: 'S + am/is/are + not + V-ing + O',
      interrogative: 'Am/Is/Are + S + V-ing + O?',
    },
    usages: [
      'Diễn tả hành động đang thực sự diễn ra ngay tại thời điểm nói (Ví dụ: Dino is sleeping now - Bây giờ Dino đang ngủ).',
    ],
    signalWords: ['now', 'right now', 'at the moment', 'Look!', 'Listen!'],
    examples: [
      {
        en: 'Dino is eating a fresh banana now.',
        vi: 'Bây giờ Dino đang ăn một quả chuối tươi.',
        dinoNote: 'Hành động ăn chuối đang xảy ra ngay lúc này.',
      },
      {
        en: 'Look! The birds are singing on the tree.',
        vi: 'Nhìn kìa! Những chú chim đang hót trên cành cây.',
        dinoNote: 'Hành động hót đang xảy ra ngay khi gọi xem.',
      },
      {
        en: 'Are they drawing a beautiful picture?',
        vi: 'Có phải họ đang vẽ một bức tranh đẹp không?',
        dinoNote: 'Hỏi về hành động đang thực hiện lúc này.',
      },
      {
        en: 'Listen! Someone is knocking at the door.',
        vi: 'Nghe kìa! Có ai đó đang gõ cửa.',
        dinoNote: 'Hành động gõ cửa đang diễn ra lúc này.',
      },
      {
        en: 'I am not playing video games at the moment.',
        vi: 'Hiện tại tớ đang không chơi trò chơi điện tử.',
        dinoNote: 'Phủ định hành động đang thực hiện lúc này.',
      },
      {
        en: 'Is she reading a comic book now?',
        vi: 'Bây giờ cô ấy đang đọc truyện tranh à?',
        dinoNote: 'Hỏi về hành động đọc sách lúc này.',
      },
    ],
    practiceQuestions: [
      {
        id: 1,
        question: 'Look! The train (come) _______.',
        answer: 'is coming',
        meaningVi: 'Nhìn kìa! Đoàn tàu đang tiến đến.',
        explanation: 'Dấu hiệu "Look!" cho biết sự việc đang xảy ra. "The train" số ít đi với "is", "come" bỏ "e" thêm "-ing" thành "is coming".',
        dinoKeyPoint: 'Look! chỉ sự việc đang diễn ra ngay lúc nói.',
        dinoTimeSignal: 'Dấu hiệu gây chú ý "Look!"',
        dinoVerbRule: 'is coming (bỏ e thêm ing).',
      },
      {
        id: 2,
        question: 'Listen! The baby (cry) _______ in the bedroom.',
        answer: 'is crying',
        meaningVi: 'Lắng nghe kìa! Em bé đang khóc trong phòng ngủ.',
        explanation: 'Dấu hiệu "Listen!". Chủ ngữ "The baby" số ít đi với "is crying".',
        dinoKeyPoint: 'Listen! chỉ âm thanh đang phát ra ngay lúc này.',
        dinoTimeSignal: 'Dấu hiệu "Listen!".',
        dinoVerbRule: 'is crying.',
      },
      {
        id: 3,
        question: 'At the moment, we (study) _______ English with Dino.',
        answer: 'are studying',
        meaningVi: 'Hiện tại, chúng tớ đang học tiếng Anh cùng Dino.',
        explanation: 'Dấu hiệu "At the moment". Chủ ngữ "We" đi với "are studying".',
        dinoKeyPoint: 'We đi với are + V-ing.',
        dinoTimeSignal: 'At the moment.',
        dinoVerbRule: 'are studying.',
      },
      {
        id: 4,
        question: 'I (not watch) _______ TV right now.',
        answer: 'am not watching',
        meaningVi: 'Bây giờ tớ đang không xem ti vi.',
        explanation: 'Chủ ngữ "I" đi với "am not watching".',
        dinoKeyPoint: 'I + am not + V-ing.',
        dinoTimeSignal: 'right now.',
        dinoVerbRule: 'am not watching.',
      },
      {
        id: 5,
        question: 'They (run) _______ in the playground at the moment.',
        answer: 'are running',
        meaningVi: 'Hiện tại họ đang chạy trong sân chơi.',
        explanation: 'Động từ "run" nhân đôi phụ âm n thành "running" -> "are running".',
        dinoKeyPoint: 'Động từ 1 âm tiết tận cùng bằng 1 phụ âm trước đó là 1 nguyên âm thì gấp đôi phụ âm cuối trước khi thêm ing.',
        dinoTimeSignal: 'at the moment.',
        dinoVerbRule: 'are running.',
      },
    ],
  },
  'future-simple': {
    id: 'future-simple',
    title: 'Thì Tương Lai Đơn',
    enTitle: 'Future Simple Tense',
    icon: 'rocket',
    desc: 'Diễn tả hành động sẽ xảy ra hoặc quyết định tức thời',
    themeColor: 'purple',
    tip: '"Tương lai hứa hẹn sẽ đến! Bé chỉ cần dùng trợ động từ \'will\' (hoặc \'won\'t\' nếu là không làm) đứng trước động từ nguyên thể là xong! Rất đơn giản vì \'will\' dùng được cho tất cả các chủ ngữ luôn nè!"',
    formulas: {
      affirmative: 'S + will + V(bare) + O',
      negative: 'S + will not (won\'t) + V(bare) + O',
      interrogative: 'Will + S + V(bare) + O?',
    },
    usages: [
      'Diễn tả một quyết định, dự định đột xuất xảy ra ngay tại thời điểm nói.',
      'Dự đoán một sự việc sẽ xảy ra trong tương lai dựa trên ý kiến cá nhân (Ví dụ: It will rain tomorrow - Trời sẽ mưa vào ngày mai).',
      'Đưa ra lời hứa hoặc đề nghị giúp đỡ.',
    ],
    signalWords: ['tomorrow', 'next week', 'next month', 'soon', 'in the future', 'tonight'],
    examples: [
      {
        en: 'I will call you tomorrow morning.',
        vi: 'Tớ sẽ gọi cho cậu vào sáng mai nhé.',
        dinoNote: 'Hành động sẽ thực hiện vào sáng mai.',
      },
      {
        en: 'Dino won\'t eat candies tonight.',
        vi: 'Tối nay Dino sẽ không ăn kẹo đâu.',
        dinoNote: 'Quyết định đột xuất từ bỏ thói quen ăn kẹo tối nay.',
      },
      {
        en: 'Will we visit the farm next week?',
        vi: 'Tuần sau chúng mình sẽ đi thăm trang trại chứ?',
        dinoNote: 'Hỏi về kế hoạch trong tuần sau.',
      },
      {
        en: 'I think it will be sunny tomorrow.',
        vi: 'Tớ nghĩ ngày mai trời sẽ nắng ấm.',
        dinoNote: 'Ý kiến dự đoán thời tiết ngày mai.',
      },
      {
        en: 'I will help you carry this heavy school bag.',
        vi: 'Tớ sẽ giúp câu xách chiếc cặp sách nặng này nhé.',
        dinoNote: 'Lời đề nghị giúp đỡ tức thì.',
      },
      {
        en: 'They will build a new playground soon.',
        vi: 'Họ sẽ sớm xây dựng một sân chơi mới.',
        dinoNote: 'Hành động sẽ xảy ra trong tương lai gần.',
      },
    ],
    practiceQuestions: [
      {
        id: 1,
        question: 'Tomorrow, we (go) _______ on a school trip.',
        answer: 'will go',
        meaningVi: 'Ngày mai, chúng tớ sẽ đi tham quan cùng trường.',
        explanation: 'Dấu hiệu "Tomorrow" chỉ tương lai. Cấu trúc: will + động từ nguyên thể "go" -> "will go".',
        dinoKeyPoint: 'Thì tương lai đơn dùng will + V(bare) cho tất cả chủ ngữ.',
        dinoTimeSignal: 'Tomorrow chỉ ngày mai.',
        dinoVerbRule: 'will go.',
      },
      {
        id: 2,
        question: 'I think Dino (win) _______ the race next week.',
        answer: 'will win',
        meaningVi: 'Tớ nghĩ Dino sẽ chiến thắng cuộc đua vào tuần tới.',
        explanation: 'Dự đoán tương lai với "I think" + "will win".',
        dinoKeyPoint: 'Dự đoán tương lai dùng will win.',
        dinoTimeSignal: 'next week.',
        dinoVerbRule: 'will win.',
      },
      {
        id: 3,
        question: 'She (not come) _______ to the party tonight.',
        answer: 'will not come',
        meaningVi: 'Cô ấy sẽ không đến buổi tiệc tối nay.',
        explanation: 'Phủ định tương lai dùng "will not come" (hoặc "won\'t come").',
        dinoKeyPoint: 'Will not = won\'t + V(bare).',
        dinoTimeSignal: 'tonight.',
        dinoVerbRule: 'will not come / won\'t come.',
      },
      {
        id: 4,
        question: 'Don\'t worry, I (help) _______ you with your homework.',
        answer: 'will help',
        meaningVi: 'Đừng lo lắng, tớ sẽ giúp cậu làm bài tập về nhà.',
        explanation: 'Đưa ra lời hứa / trợ giúp tức thì: "will help".',
        dinoKeyPoint: 'Lời hứa trợ giúp dùng will help.',
        dinoTimeSignal: 'Quyết định ngay lúc nói.',
        dinoVerbRule: 'will help.',
      },
      {
        id: 5,
        question: 'They (travel) _______ to London next month.',
        answer: 'will travel',
        meaningVi: 'Họ sẽ đi du lịch đến Luân Đôn vào tháng sau.',
        explanation: 'Dấu hiệu "next month" dùng "will travel".',
        dinoKeyPoint: 'Kế hoạch sự việc tháng tới: will travel.',
        dinoTimeSignal: 'next month.',
        dinoVerbRule: 'will travel.',
      },
    ],
  },
};

interface GrammarTensesViewProps {
  user: UserProfile;
  onAddStars: (amount: number) => void;
  setActiveTab?: (tab: ActiveTab) => void;
}

export const GrammarTensesView: React.FC<GrammarTensesViewProps> = ({
  user,
  onAddStars,
  setActiveTab,
}) => {
  // Navigation & Screen View State
  const [viewMode, setViewMode] = useState<
    'select' | 'practice' | 'cheat-sheet' | 'ai-quiz-prompt' | 'ai-quiz-loading' | 'ai-quiz-questions'
  >('select');
  const [selectedTense, setSelectedTense] = useState<TenseKey>('present-simple');

  // Practice Mode State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>('');
  const [questionChecked, setQuestionChecked] = useState<boolean>(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean>(false);

  // AI Quiz Generator State
  const [aiTopicInput, setAiTopicInput] = useState<string>('');
  const [generatedAiQuestions, setGeneratedAiQuestions] = useState<
    {
      id: number;
      question: string;
      answer: string;
      meaningVi: string;
      explanation: string;
      dinoKeyPoint: string;
      dinoTimeSignal: string;
      dinoVerbRule: string;
      userAns?: string;
      isChecked?: boolean;
      isCorrect?: boolean;
    }[]
  >([]);

  // Dino Explanation Modal State
  const [showDinoModal, setShowDinoModal] = useState<boolean>(false);
  const [isDinoModalLoading, setIsDinoModalLoading] = useState<boolean>(false);
  const [activeModalData, setActiveModalData] = useState<{
    question: string;
    userAns: string;
    correctAns: string;
    keyPoint: string;
    timeSignal: string;
    verbRule: string;
  } | null>(null);

  // Sidebar Clock & Timer State
  const [studySeconds, setStudySeconds] = useState<number>(1836); // 00:30:36
  const [alarmSeconds, setAlarmSeconds] = useState<number>(900); // 15:00
  const [isAlarmRunning, setIsAlarmRunning] = useState<boolean>(true);

  // Sidebar Music Player State
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<string>('english-adventure');
  const [volume, setVolume] = useState<number>(80);

  // Progress counter
  const [completedTensesCount, setCompletedTensesCount] = useState<number>(0);
  const [earnedStarsTotal, setEarnedStarsTotal] = useState<number>(0);

  // Study timer effect
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

  const formatClock = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatAlarm = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const tenseObj = tensesData[selectedTense];
  const currentPracticeQ = tenseObj.practiceQuestions[currentQuestionIdx] || tenseObj.practiceQuestions[0];

  // Handlers for Practice Mode
  const handleCheckPracticeAnswer = () => {
    if (!userInput.trim()) return;
    audioService.playClickSound();
    setQuestionChecked(true);
    const cleanedUser = userInput.trim().toLowerCase();
    const cleanedTarget = currentPracticeQ.answer.toLowerCase();

    if (cleanedUser === cleanedTarget || cleanedTarget.includes(cleanedUser)) {
      setIsCorrectAnswer(true);
      audioService.playApplauseSound();
      onAddStars(2);
      setEarnedStarsTotal((prev) => prev + 2);
      triggerConfetti('default');
    } else {
      setIsCorrectAnswer(false);
    }
  };

  const handleNextPracticeQuestion = () => {
    audioService.playClickSound();
    if (currentQuestionIdx < tenseObj.practiceQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setUserInput('');
      setQuestionChecked(false);
      setIsCorrectAnswer(false);
    } else {
      // Completed all questions in practice!
      setCompletedTensesCount((prev) => Math.min(4, prev + 1));
      setViewMode('select');
      setUserInput('');
      setQuestionChecked(false);
    }
  };

  const handlePrevPracticeQuestion = () => {
    audioService.playClickSound();
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setUserInput('');
      setQuestionChecked(false);
      setIsCorrectAnswer(false);
    }
  };

  // Handlers for Dino AI Explanation Popup Modal
  const handleOpenDinoExplanation = (
    qText: string,
    uAns: string,
    cAns: string,
    kp: string,
    ts: string,
    vr: string
  ) => {
    audioService.playClickSound();
    setActiveModalData({
      question: qText,
      userAns: uAns,
      correctAns: cAns,
      keyPoint: kp,
      timeSignal: ts,
      verbRule: vr,
    });
    setIsDinoModalLoading(true);
    setShowDinoModal(true);

    setTimeout(() => {
      setIsDinoModalLoading(false);
    }, 800);
  };

  // Handlers for AI Quiz Generation
  const handleGenerateAiQuiz = () => {
    if (!aiTopicInput.trim()) return;
    audioService.playClickSound();
    setViewMode('ai-quiz-loading');

    setTimeout(() => {
      const topic = aiTopicInput.trim();
      const mockAiGenerated = [
        {
          id: 1,
          question: `A cute cat (${selectedTense === 'past-simple' ? 'sleep' : selectedTense === 'present-continuous' ? 'sleep' : 'sleep'}) _______ on the sofa every day.`,
          answer: selectedTense === 'past-simple' ? 'slept' : selectedTense === 'present-continuous' ? 'is sleeping' : selectedTense === 'future-simple' ? 'will sleep' : 'sleeps',
          meaningVi: `Một chú mèo đáng yêu đang ngủ trên sofa theo chủ đề ${topic}.`,
          explanation: `Trong thì này, chủ ngữ số ít đi với dạng động từ tương ứng chuẩn ngữ pháp.`,
          dinoKeyPoint: `Chủ ngữ số ít (A cute cat) tương ứng ngôi thứ 3 số ít.`,
          dinoTimeSignal: `Ngữ cảnh về chủ đề ${topic}.`,
          dinoVerbRule: `Chủ ngữ số ít đi với dạng động từ thích hợp.`,
        },
        {
          id: 2,
          question: `Monkeys (eat) _______ bananas for breakfast.`,
          answer: selectedTense === 'past-simple' ? 'ate' : selectedTense === 'present-continuous' ? 'are eating' : selectedTense === 'future-simple' ? 'will eat' : 'eat',
          meaningVi: `Những chú khỉ ăn chuối cho bữa sáng.`,
          explanation: `Chủ ngữ Monkeys số nhiều nên động từ nguyên thể thích hợp.`,
          dinoKeyPoint: `Monkeys là số nhiều.`,
          dinoTimeSignal: `Thói quen tự nhiên.`,
          dinoVerbRule: `Số nhiều giữ nguyên hoặc dạng thích hợp.`,
        },
        {
          id: 3,
          question: `An elephant (have) _______ a very long trunk.`,
          answer: selectedTense === 'past-simple' ? 'had' : selectedTense === 'present-continuous' ? 'is having' : selectedTense === 'future-simple' ? 'will have' : 'has',
          meaningVi: `Chú voi có một chiếc vòi rất dài.`,
          explanation: `Chủ ngữ An elephant số ít đi với động từ has / had / is having.`,
          dinoKeyPoint: `An elephant = số ít.`,
          dinoTimeSignal: `Chân lý tự nhiên.`,
          dinoVerbRule: `have chuyển đổi tương ứng.`,
        },
        {
          id: 4,
          question: `Penguins (not fly) _______ in the sky.`,
          answer: selectedTense === 'past-simple' ? 'did not fly' : selectedTense === 'present-continuous' ? 'are not flying' : selectedTense === 'future-simple' ? 'will not fly' : 'do not fly',
          meaningVi: `Chim cánh cụt không bay trên bầu trời.`,
          explanation: `Phủ định với chủ ngữ số nhiều Penguins.`,
          dinoKeyPoint: `Dạng phủ định cho danh từ số nhiều.`,
          dinoTimeSignal: `Sự thật tự nhiên.`,
          dinoVerbRule: `do not fly / did not fly.`,
        },
        {
          id: 5,
          question: `A lion (roar) _______ loudly when it is angry.`,
          answer: selectedTense === 'past-simple' ? 'roared' : selectedTense === 'present-continuous' ? 'is roaring' : selectedTense === 'future-simple' ? 'will roar' : 'roars',
          meaningVi: `Chú sư tử gầm rất to khi tức giận.`,
          explanation: `Chủ ngữ "A lion" là số ít.`,
          dinoKeyPoint: `A lion = số ít.`,
          dinoTimeSignal: `Chân lý tự nhiên.`,
          dinoVerbRule: `A lion roars / roared / is roaring.`,
        },
      ];

      setGeneratedAiQuestions(mockAiGenerated);
      setViewMode('ai-quiz-questions');
    }, 1200);
  };

  const handleCheckSingleAiQuestion = (qId: number, val: string) => {
    audioService.playClickSound();
    setGeneratedAiQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const isOk = val.trim().toLowerCase() === q.answer.toLowerCase();
          if (isOk) {
            audioService.playApplauseSound();
            onAddStars(2);
            triggerConfetti('default');
          }
          return {
            ...q,
            userAns: val,
            isChecked: true,
            isCorrect: isOk,
          };
        }
        return q;
      })
    );
  };

  return (
    <div className="space-y-5 select-none font-sans max-w-7xl mx-auto animate-fadeIn">
      <div className="space-y-5">
        {/* VIEW MODE 1: MAIN LESSON SELECTION SCREEN (IMAGE 1) */}
          {viewMode === 'select' && (
            <div className="space-y-6">
              {/* TOP WELCOME BOX (LIGHT BLUE CONTAINER WITH DINO MASCOT) */}
              <div className="bg-[#e0f2fe]/80 border border-[#93c5fd] rounded-2xl p-5 sm:p-6 text-center space-y-2 shadow-xs relative">
                <div className="w-16 h-16 bg-white rounded-full border-2 border-sky-300 mx-auto flex items-center justify-center text-3xl shadow-sm -mt-2">
                  🦖
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#1e40af]">
                  Chào mừng bé đến với lộ trình Ngữ Pháp! 🦕
                </h2>
                <p className="text-xs sm:text-sm font-bold text-[#1e3a8a]/80 max-w-2xl mx-auto leading-relaxed">
                  Lộ trình này chứa các kiến thức ngữ pháp về thì trong Tiếng Anh được thiết kế siêu trực quan cho trẻ em lớp 3. Hãy chọn một thì bên dưới để ôn tập và kiểm tra nhé!
                </p>
              </div>

              {/* SECTION HEADER */}
              <div className="text-center space-y-1 pt-1">
                <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-wide flex items-center justify-center gap-2">
                  <span>🎯</span>
                  <span>CHỌN BÀI HỌC HÔM NAY</span>
                </h3>
                <p className="text-xs font-bold text-slate-500">
                  Học kiến thức, thực hành tự luận và thử thách AI để nhận sao thưởng nhé bé yêu!
                </p>
              </div>

              {/* 2X2 GRID OF 4 TENSE CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. PRESENT SIMPLE CARD */}
                <div className="border-2 border-dashed border-[#60a5fa] bg-[#eff6ff]/60 rounded-3xl p-5 space-y-4 shadow-xs hover:shadow-md transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-200 text-sky-800 flex items-center justify-center text-sm font-bold">
                        🌐
                      </div>
                      <h4 className="font-black text-slate-900 text-base sm:text-lg">Thì Hiện Tại Đơn</h4>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 italic pl-9">Present Simple Tense</p>
                    <p className="text-xs font-extrabold text-slate-700 pt-2">
                      Nhấn mạnh tính thường xuyên, thói quen & chân lý
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      setSelectedTense('present-simple');
                      setViewMode('practice');
                      setCurrentQuestionIdx(0);
                      setUserInput('');
                      setQuestionChecked(false);
                    }}
                    className="w-full py-3 bg-[#1d50b4] hover:bg-[#153e90] text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>▷ Luyện tập ngay</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTense('present-simple');
                        setViewMode('cheat-sheet');
                      }}
                      className="py-2.5 bg-white hover:bg-sky-50 text-[#1d50b4] border-2 border-sky-300 font-extrabold rounded-2xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      <span>📖 Bí kíp Dino</span>
                    </button>
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTense('present-simple');
                        setViewMode('ai-quiz-prompt');
                        setAiTopicInput('');
                      }}
                      className="py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-400 font-extrabold rounded-2xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      <span>AI riêng</span>
                    </button>
                  </div>
                </div>

                {/* 2. PAST SIMPLE CARD */}
                <div className="border-2 border-dashed border-[#f97316] bg-[#fff7ed]/60 rounded-3xl p-5 space-y-4 shadow-xs hover:shadow-md transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-200 text-orange-800 flex items-center justify-center text-sm font-bold">
                        🕒
                      </div>
                      <h4 className="font-black text-slate-900 text-base sm:text-lg">Thì Quá Khứ Đơn</h4>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 italic pl-9">Past Simple Tense</p>
                    <p className="text-xs font-extrabold text-slate-700 pt-2">
                      Hành động đã bắt đầu & kết thúc hoàn toàn trong quá khứ
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      setSelectedTense('past-simple');
                      setViewMode('practice');
                      setCurrentQuestionIdx(0);
                      setUserInput('');
                      setQuestionChecked(false);
                    }}
                    className="w-full py-3 bg-[#d94600] hover:bg-[#b33900] text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>▷ Luyện tập ngay</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTense('past-simple');
                        setViewMode('cheat-sheet');
                      }}
                      className="py-2.5 bg-white hover:bg-orange-50 text-[#d94600] border-2 border-orange-300 font-extrabold rounded-2xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      <span>📖 Bí kíp Dino</span>
                    </button>
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTense('past-simple');
                        setViewMode('ai-quiz-prompt');
                        setAiTopicInput('');
                      }}
                      className="py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-400 font-extrabold rounded-2xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      <span>AI riêng</span>
                    </button>
                  </div>
                </div>

                {/* 3. PRESENT CONTINUOUS CARD */}
                <div className="border-2 border-dashed border-[#14b8a6] bg-[#f0fdf4]/60 rounded-3xl p-5 space-y-4 shadow-xs hover:shadow-md transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-200 text-teal-800 flex items-center justify-center text-sm font-bold">
                        📈
                      </div>
                      <h4 className="font-black text-slate-900 text-base sm:text-lg">Thì Hiện Tại Tiếp Diễn</h4>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 italic pl-9">Present Continuous Tense</p>
                    <p className="text-xs font-extrabold text-slate-700 pt-2">
                      Diễn tả hành động đang diễn ra ngay tại thời điểm nói
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      setSelectedTense('present-continuous');
                      setViewMode('practice');
                      setCurrentQuestionIdx(0);
                      setUserInput('');
                      setQuestionChecked(false);
                    }}
                    className="w-full py-3 bg-[#008ba3] hover:bg-[#006e82] text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>▷ Luyện tập ngay</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTense('present-continuous');
                        setViewMode('cheat-sheet');
                      }}
                      className="py-2.5 bg-white hover:bg-teal-50 text-[#008ba3] border-2 border-teal-300 font-extrabold rounded-2xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      <span>📖 Bí kíp Dino</span>
                    </button>
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTense('present-continuous');
                        setViewMode('ai-quiz-prompt');
                        setAiTopicInput('');
                      }}
                      className="py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-400 font-extrabold rounded-2xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      <span>AI riêng</span>
                    </button>
                  </div>
                </div>

                {/* 4. FUTURE SIMPLE CARD */}
                <div className="border-2 border-dashed border-[#a855f7] bg-[#faf5ff]/60 rounded-3xl p-5 space-y-4 shadow-xs hover:shadow-md transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-200 text-purple-800 flex items-center justify-center text-sm font-bold">
                        🚀
                      </div>
                      <h4 className="font-black text-slate-900 text-base sm:text-lg">Thì Tương Lai Đơn</h4>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 italic pl-9">Future Simple Tense</p>
                    <p className="text-xs font-extrabold text-slate-700 pt-2">
                      Diễn tả hành động sẽ xảy ra hoặc quyết định tức thời
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      audioService.playClickSound();
                      setSelectedTense('future-simple');
                      setViewMode('practice');
                      setCurrentQuestionIdx(0);
                      setUserInput('');
                      setQuestionChecked(false);
                    }}
                    className="w-full py-3 bg-[#6b21a8] hover:bg-[#581c87] text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <span>▷ Luyện tập ngay</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTense('future-simple');
                        setViewMode('cheat-sheet');
                      }}
                      className="py-2.5 bg-white hover:bg-purple-50 text-[#6b21a8] border-2 border-purple-300 font-extrabold rounded-2xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      <span>📖 Bí kíp Dino</span>
                    </button>
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedTense('future-simple');
                        setViewMode('ai-quiz-prompt');
                        setAiTopicInput('');
                      }}
                      className="py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-400 font-extrabold rounded-2xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                    >
                      <span>AI riêng</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: PRACTICE MODE ("Làm bài ngay: Thì...") (IMAGE 2, 6, 7) */}
          {viewMode === 'practice' && (
            <div className="space-y-4">
              {/* Sub bar: Back button & question counter */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setViewMode('select');
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <ArrowLeft size={14} />
                  <span>← Thoát luyện tập</span>
                </button>

                <span className="font-extrabold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  Câu tự luận: {currentQuestionIdx + 1} / {tenseObj.practiceQuestions.length}
                </span>
              </div>

              {/* Main Question Card */}
              <div
                className={`bg-white p-5 sm:p-6 rounded-3xl border-2 transition space-y-4 shadow-sm ${
                  questionChecked
                    ? isCorrectAnswer
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-rose-500 bg-rose-50/20'
                    : 'border-sky-300'
                }`}
              >
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Câu hỏi {currentQuestionIdx + 1}: {currentPracticeQ.question}
                  </h3>
                </div>

                {/* Input field & Check button */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCheckPracticeAnswer();
                    }}
                    placeholder="Nhập đáp án của bé..."
                    className="flex-1 px-4 py-3 bg-white border-2 border-sky-300 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-600 shadow-2xs"
                  />

                  <button
                    onClick={handleCheckPracticeAnswer}
                    className="px-5 py-3 bg-[#1d50b4] hover:bg-[#153e90] text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-95 shrink-0"
                  >
                    Kiểm tra kết quả
                  </button>
                </div>

                {!questionChecked && (
                  <p className="text-[11px] font-bold text-slate-400 italic">
                    Vui lòng kiểm tra đáp án để tiếp tục...
                  </p>
                )}

                {/* Checked Feedback Banner (Image 6 & Image 7) */}
                {questionChecked && (
                  <div className="space-y-3 pt-2 animate-fadeIn">
                    {isCorrectAnswer ? (
                      <p className="text-xs sm:text-sm font-black text-emerald-700 flex items-center gap-1.5">
                        <span>🎉</span>
                        <span>Tuyệt vời! Bé điền hoàn toàn chính xác! (+2 Sao ⭐)</span>
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm font-black text-rose-600 flex items-center gap-1.5">
                        <span>❌</span>
                        <span>Chưa đúng rồi bé ơi! (Đáp án đúng: {currentPracticeQ.answer})</span>
                      </p>
                    )}

                    {/* Explanation Box */}
                    <div className="bg-amber-50/90 border-2 border-dashed border-amber-300 p-4 rounded-2xl space-y-2 text-xs font-bold text-amber-900">
                      <p>💡 <span className="font-black">Giải thích:</span> {currentPracticeQ.explanation}</p>

                      <button
                        onClick={() =>
                          handleOpenDinoExplanation(
                            currentPracticeQ.question,
                            userInput,
                            currentPracticeQ.answer,
                            currentPracticeQ.dinoKeyPoint,
                            currentPracticeQ.dinoTimeSignal,
                            currentPracticeQ.dinoVerbRule
                          )
                        }
                        className="mt-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl border border-indigo-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                      >
                        <span>🦖</span>
                        <span>Hỏi Dino tại sao {isCorrectAnswer ? 'đúng?' : 'sai?'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={handlePrevPracticeQuestion}
                  className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-extrabold rounded-2xl text-xs border border-slate-200 transition cursor-pointer"
                >
                  ← Câu trước
                </button>

                <button
                  onClick={handleNextPracticeQuestion}
                  className="px-5 py-2.5 bg-[#1d50b4] hover:bg-[#153e90] text-white font-black rounded-2xl text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  {currentQuestionIdx < tenseObj.practiceQuestions.length - 1 ? 'Tiếp theo ➔' : 'Hoàn thành bài ➔'}
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: CHEAT SHEET ("Bí kíp Dino") (IMAGE 3, 9, 10, 11) */}
          {viewMode === 'cheat-sheet' && (
            <div className="space-y-5">
              {/* Back button */}
              <div>
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setViewMode('select');
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <ArrowLeft size={14} />
                  <span>← Quay lại Chọn bài học</span>
                </button>
              </div>

              {/* Top Yellow Smart Tip Banner */}
              <div className="bg-amber-50 border-2 border-dashed border-amber-300 p-4 sm:p-5 rounded-2xl space-y-1 text-xs sm:text-sm font-extrabold text-amber-900 shadow-2xs">
                <p className="text-amber-800">
                  <span className="font-black text-amber-950">Mẹo thông minh của Dino:</span> "{tenseObj.tip}"
                </p>
              </div>

              {/* Section 1: Cấu trúc & Công thức */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-sky-200 shadow-xs space-y-3">
                <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                  <span>&#123;&#125;</span>
                  <span>Cấu trúc & Công thức</span>
                </h3>

                <div className="space-y-2 text-xs sm:text-sm font-black">
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-sky-600 text-white rounded-md text-[10px] uppercase tracking-wider">
                      KHẲNG ĐỊNH (+)
                    </span>
                    <span className="font-mono text-sky-900">{tenseObj.formulas.affirmative}</span>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] uppercase tracking-wider">
                      PHỦ ĐỊNH (-)
                    </span>
                    <span className="font-mono text-rose-900">{tenseObj.formulas.negative}</span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-amber-600 text-white rounded-md text-[10px] uppercase tracking-wider">
                      NGHI VẤN (?)
                    </span>
                    <span className="font-mono text-amber-900">{tenseObj.formulas.interrogative}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Cách dùng & Dấu hiệu */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-teal-200 shadow-xs space-y-3">
                <h3 className="text-sm sm:text-base font-black text-slate-800">Cách dùng & Dấu hiệu</h3>

                <div className="space-y-2">
                  <p className="text-xs font-black text-teal-800 flex items-center gap-1">
                    <span>💡</span>
                    <span>Khi nào bé dùng thì này?</span>
                  </p>
                  <div className="space-y-1.5 pl-2">
                    {tenseObj.usages.map((use, idx) => (
                      <div key={idx} className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-100 text-xs font-bold text-slate-800">
                        {use}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs font-black text-slate-700 flex items-center gap-1">
                    <span>🔍</span>
                    <span>Từ nhận biết (Signal words):</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tenseObj.signalWords.map((word) => (
                      <span key={word} className="px-3 py-1 bg-teal-50 border border-teal-300 text-teal-900 rounded-full text-xs font-black">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Các ví dụ sinh động */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-200 shadow-xs space-y-3">
                <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                  <span>📖</span>
                  <span>Các ví dụ sinh động</span>
                </h3>

                <div className="space-y-2.5">
                  {tenseObj.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">{ex.en}</p>
                        <p className="text-xs font-bold text-purple-800">— {ex.vi}</p>
                        <p className="text-[11px] font-semibold text-slate-500">💡 Dino giải thích: {ex.dinoNote}</p>
                      </div>

                      <button
                        onClick={() => {
                          audioService.playClickSound();
                          audioService.speakText(ex.en);
                        }}
                        className="p-2 bg-white hover:bg-purple-50 text-purple-700 rounded-xl border border-slate-200 transition cursor-pointer shrink-0 shadow-2xs"
                        title="Nghe phát âm"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Big Action Button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setViewMode('practice');
                    setCurrentQuestionIdx(0);
                    setUserInput('');
                    setQuestionChecked(false);
                  }}
                  className="px-8 py-3.5 bg-[#1d50b4] hover:bg-[#153e90] text-white font-black rounded-full text-sm shadow-md transition cursor-pointer active:scale-95"
                >
                  Làm bài ngay thôi ➔
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 4: AI QUIZ PROMPT (IMAGE 4) */}
          {viewMode === 'ai-quiz-prompt' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-200 shadow-md text-center space-y-5 max-w-xl mx-auto my-4">
              <div>
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setViewMode('select');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  <span>← Quay lại Chọn bài học</span>
                </button>
              </div>

              <div className="w-20 h-20 bg-sky-100 rounded-full border-2 border-sky-300 mx-auto flex items-center justify-center text-4xl shadow-sm">
                🦖
              </div>

              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-800">
                  🤖 Dino tạo thử thách tự luận đặc biệt
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-600">
                  Bé muốn làm bài tự luận về chủ đề gì nào? Dino sẽ tạo ra 5 câu điền vào chỗ trống theo đúng ngữ pháp này!
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={aiTopicInput}
                  onChange={(e) => setAiTopicInput(e.target.value)}
                  placeholder="Ví dụ: dinosaurs, animals, fruits, family, football..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />

                <button
                  onClick={handleGenerateAiQuiz}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-95 border-2 border-emerald-500"
                >
                  ✨ Tạo đề bài tự luận bằng AI ➔
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 5: AI QUIZ LOADING STATE (IMAGE 5) */}
          {viewMode === 'ai-quiz-loading' && (
            <div className="bg-white p-8 rounded-3xl border border-sky-200 shadow-md text-center space-y-5 max-w-xl mx-auto my-4">
              <div className="w-20 h-20 bg-sky-100 rounded-full border-2 border-sky-300 mx-auto flex items-center justify-center text-4xl shadow-sm">
                🦖
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-slate-800">
                  🤖 Dino tạo thử thách tự luận đặc biệt
                </h2>
                <p className="text-xs font-bold text-slate-600">
                  Bé muốn làm bài tự luận về chủ đề gì nào? Dino sẽ tạo ra 5 câu điền vào chỗ trống theo đúng ngữ pháp này!
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 uppercase">
                  {aiTopicInput || 'ANIMO'}
                </div>

                <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-800 font-black text-xs">
                  ⏳ Dino đang viết đề bài...
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 pt-2 text-xs font-extrabold text-emerald-700">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p>Dino đang dùng trí tuệ nhân tạo để viết 5 câu hỏi... 🦕</p>
              </div>
            </div>
          )}

          {/* VIEW MODE 6: AI GENERATED QUESTIONS LIST (IMAGE 6) */}
          {viewMode === 'ai-quiz-questions' && (
            <div className="space-y-4">
              {/* Header Bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setViewMode('ai-quiz-prompt');
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <ArrowLeft size={14} />
                  <span>← Tạo chủ đề khác</span>
                </button>

                <span className="px-3.5 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-black border border-emerald-300">
                  Chủ đề: {aiTopicInput || 'ANIMO'}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>CÂU HỎI AI RIÊNG (5 CÂU TỰ LUẬN)</span>
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Bé hãy tự điền đáp án chuẩn vào từng ô trống bên dưới, sau đó bấm nút để đối chiếu kết quả nhé!
                </p>
              </div>

              {/* 5 AI Questions Cards */}
              <div className="space-y-3">
                {generatedAiQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`bg-white p-4 rounded-2xl border-2 space-y-3 transition shadow-2xs ${
                      q.isChecked
                        ? q.isCorrect
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : 'border-rose-500 bg-rose-50/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      Câu {q.id}: {q.question}
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={q.userAns || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGeneratedAiQuestions((prev) =>
                            prev.map((item) => (item.id === q.id ? { ...item, userAns: val } : item))
                          );
                        }}
                        placeholder="Nhập đáp án của bé..."
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                      />

                      <button
                        onClick={() => handleCheckSingleAiQuestion(q.id, q.userAns || '')}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-2xs"
                      >
                        Kiểm tra
                      </button>
                    </div>

                    {q.isChecked && (
                      <div className="space-y-2 pt-1 border-t border-slate-100 text-xs font-bold">
                        {q.isCorrect ? (
                          <p className="text-emerald-700 font-black">🎉 Chính xác! (+2 Sao ⭐)</p>
                        ) : (
                          <p className="text-rose-600 font-black">❌ Chưa đúng rồi bé ơi! (Đáp án đúng: {q.answer})</p>
                        )}

                        <div className="bg-amber-50 p-3 rounded-xl border border-dashed border-amber-300 text-amber-900 space-y-1">
                          <p>💡 Giải thích: {q.explanation}</p>
                          <button
                            onClick={() =>
                              handleOpenDinoExplanation(
                                q.question,
                                q.userAns || '',
                                q.answer,
                                q.dinoKeyPoint,
                                q.dinoTimeSignal,
                                q.dinoVerbRule
                              )
                            }
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-black border border-indigo-200 transition cursor-pointer"
                          >
                            🦕 Hỏi Dino tại sao {q.isCorrect ? 'đúng?' : 'sai?'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center pt-3">
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setViewMode('select');
                  }}
                  className="px-6 py-2.5 bg-[#1d50b4] hover:bg-[#153e90] text-white font-black rounded-2xl text-xs shadow-md transition cursor-pointer"
                >
                  Hoàn thành & Quay lại ➔
                </button>
              </div>
            </div>
          )}
      </div>

      {/* DINO AI EXPLANATION POPUP MODAL (IMAGE 8 & IMAGE 8-POPUP) */}
      {showDinoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          {isDinoModalLoading ? (
            /* Loading Modal State (Image 8) */
            <div className="bg-white rounded-3xl p-8 border-4 border-emerald-500 shadow-2xl text-center space-y-4 max-w-sm w-full animate-scaleUp">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-emerald-700">
                Dino đang chuẩn bị lời giải thích cực kỳ dễ hiểu nhé... 🦕
              </p>
            </div>
          ) : (
            /* Full Dino Explanation Dialog (Image 8-popup) */
            <div className="bg-white rounded-3xl p-6 border-4 border-emerald-500 shadow-2xl max-w-xl w-full space-y-4 relative animate-scaleUp text-left">
              <button
                onClick={() => setShowDinoModal(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 text-emerald-700 font-black text-base border-b border-dashed border-emerald-200 pb-3">
                <span>🦕</span>
                <span>Khủng long Dino giải đáp</span>
              </div>

              {/* Encouraging Quote Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 italic text-xs font-bold text-slate-800 leading-relaxed">
                "Roar! Khủng long Dino chào bạn nhỏ siêu cấp đáng yêu của ta! Con đã rất giỏi khi tự mình làm bài tập này rồi đó, tuy thiếu một chút xíu xiu nữa thôi là hoàn hảo rồi. Đừng nản chí nha, có Dino ở đây luôn đồng hành và cổ vũ con nè! Cố lên bé ơi!"
              </div>

              {/* Box 1: Green Background - Key Point */}
              <div className="p-3.5 bg-emerald-100/70 border-l-4 border-emerald-500 rounded-2xl space-y-1">
                <p className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Trọng tâm em cần nhớ</span>
                </p>
                <p className="text-xs font-extrabold text-emerald-800 leading-snug">
                  {activeModalData?.keyPoint ||
                    "Trong thì Hiện tại đơn, khi chủ ngữ là danh từ số ít (chỉ 1 người hoặc 1 vật), động từ theo sau bắt buộc phải thêm đuôi 's' hoặc 'es' đó con yêu ơi."}
                </p>
              </div>

              {/* Grid 2 Column for Signals & Verb Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Box 2: Yellow Background - Time Signal */}
                <div className="p-3 bg-amber-100/70 border-l-4 border-amber-500 rounded-2xl space-y-1">
                  <p className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                    <span>📅 🗓️</span>
                    <span>Dấu hiệu thời gian</span>
                  </p>
                  <p className="text-[11px] font-bold text-amber-800 leading-snug">
                    {activeModalData?.timeSignal ||
                      "Con hãy nhìn vào ngữ cảnh câu hỏi nhé, dấu hiệu ngữ pháp giúp con chọn đúng dạng động từ nè!"}
                  </p>
                </div>

                {/* Box 3: Blue Background - Verb Rule */}
                <div className="p-3 bg-blue-100/70 border-l-4 border-blue-500 rounded-2xl space-y-1">
                  <p className="text-[11px] font-black text-blue-900 flex items-center gap-1">
                    <span>⚙️ ⚙️</span>
                    <span>Quy tắc động từ</span>
                  </p>
                  <p className="text-[11px] font-bold text-blue-800 leading-snug">
                    {activeModalData?.verbRule ||
                      "Vì chủ ngữ số ít nên động từ phải biến đổi phù hợp quy tắc ngữ pháp nè!"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
