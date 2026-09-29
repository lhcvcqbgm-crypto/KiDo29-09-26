import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Trophy, 
  Flame, 
  Star, 
  LogOut, 
  BookOpen, 
  Brain, 
  HelpCircle, 
  Play, 
  Zap,
  Lock,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, ActiveTab } from '../types';
import { audioService } from '../utils/audio';
import { hasGradeAccess } from '../utils/permissions';
import { UserAvatar } from './UserAvatar';
import { useLanguage } from '../context/LanguageContext';
import { AchievementCardModal } from './AchievementCardModal';

interface GradeViewProps {
  gradeNumber: number;
  user?: UserProfile;
  setActiveTab?: (tab: ActiveTab) => void;
  onAddStars: (amount: number) => void;
  onBack: () => void;
  onLogout?: () => void;
  onCompleteLesson?: (lessonTitle: string, unitTitle?: string, gradeNumber?: number) => void;
}

interface UnitItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  progress: number;
  colorType: 'pink' | 'yellow' | 'green' | 'blue' | 'purple' | 'cyan';
  icon: string;
}

export const GradeView: React.FC<GradeViewProps> = ({
  gradeNumber,
  user,
  setActiveTab,
  onAddStars,
  onBack,
  onLogout,
  onCompleteLesson,
}) => {
  const { lang, t } = useLanguage();

  // Currently expanded unit card ID (default to 1 so Unit 1 is open as shown in reference image 3)
  const [expandedUnitId, setExpandedUnitId] = useState<number | null>(1);
  const [activeSubLessonModal, setActiveSubLessonModal] = useState<{ unitTitle: string; lessonName: string } | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState<boolean>(false);

  // Dynamically load Units based on gradeNumber
  const getUnitsForGrade = (grade: number): UnitItem[] => {
    if (grade === 4) {
      return [
        {
          id: 1,
          title: 'Starter: My Classroom & Activities',
          subtitle: 'Chào hỏi và ôn tập hoạt động',
          description: 'Chủ đề: Chào hỏi và ôn tập hoạt động. Mẫu câu: Kido is my best ... in school. / We have a ... contest today. / Our ... is big and bright.',
          progress: 0,
          colorType: 'green',
          icon: '🏫',
        },
        {
          id: 2,
          title: 'Unit 1: My Friends',
          subtitle: 'Những người bạn của tớ (Các quốc gia)',
          description: 'Chủ đề: Những người bạn của tớ (Các quốc gia). Mẫu câu: Washington D.C. is in .... / Canberra is the capital of .... / London is the capital of ....',
          progress: 0,
          colorType: 'blue',
          icon: '💙',
        },
        {
          id: 3,
          title: 'Unit 2: Time and Daily Routines',
          subtitle: 'Thời gian & Thói quen hàng ngày',
          description: 'Chủ đề: Thời gian & Thói quen hàng ngày. Mẫu câu: It is seven ... in the morning. / I see ... birds in the tree. / There are ... students in my class.',
          progress: 0,
          colorType: 'green',
          icon: '⏰',
        },
        {
          id: 4,
          title: 'Unit 3: My Week',
          subtitle: 'Tuần lễ của tớ (Các thứ & Hoạt động)',
          description: 'Chủ đề: Tuần lễ của tớ (Các thứ & Hoạt động). Mẫu câu: I go to school on .... / We have English on .... / I play football on ....',
          progress: 0,
          colorType: 'purple',
          icon: '📅',
        },
        {
          id: 5,
          title: 'Unit 4: My Birthday Party',
          subtitle: 'Bữa tiệc sinh nhật (Tháng & Đồ ăn)',
          description: 'Chủ đề: Bữa tiệc sinh nhật (Tháng & Đồ ăn). Mẫu câu: My birthday is in .... / ... is the shortest month. / We go camping in ....',
          progress: 0,
          colorType: 'pink',
          icon: '🎂',
        },
        {
          id: 6,
          title: 'Unit 5: Things We Can Do',
          subtitle: 'Những khả năng của chúng ta (Động từ năng khiếu)',
          description: 'Chủ đề: Những khả năng của chúng ta (Động từ năng khiếu). Mẫu câu: My mom is a great .... / I love to ... colorful flowers. / My brother can ... very well.',
          progress: 0,
          colorType: 'yellow',
          icon: '🎨',
        },
        {
          id: 7,
          title: 'Unit 6: Our School Facilities',
          subtitle: 'Cơ sở vật chất trường học (Địa điểm & Phòng ốc)',
          description: 'Chủ đề: Cơ sở vật chất trường học (Địa điểm & Phòng ốc). Mẫu câu: Ho Chi Minh is a very big .... / We love to hike in the .... / It is a quiet and peaceful ....',
          progress: 0,
          colorType: 'cyan',
          icon: '🏫',
        },
        {
          id: 8,
          title: 'Unit 7: Our Timetables',
          subtitle: 'Thời khóa biểu của chúng ta (Các môn học)',
          description: 'Chủ đề: Thời khóa biểu của chúng ta (Các môn học). Mẫu câu: We draw and paint in the ... class. / I can speak ... with my teacher. / We learn about countries in ....',
          progress: 0,
          colorType: 'pink',
          icon: '📚',
        },
        {
          id: 9,
          title: 'Unit 8: My Favourite Subjects',
          subtitle: 'Môn học yêu thích của tớ',
          description: 'Chủ đề: Môn học yêu thích của tớ. Mẫu câu: We learn to use computers in IT class. / We play sports and run in PE class. / Our English teacher is very kind.',
          progress: 0,
          colorType: 'purple',
          icon: '🎨',
        },
        {
          id: 10,
          title: 'Unit 9: Our Sports Day',
          subtitle: 'Ngày hội thể thao (Tháng & Sự kiện)',
          description: 'Chủ đề: Ngày hội thể thao (Tháng & Sự kiện). Mẫu câu: We have summer holidays in .... / ... is usually very hot. / School starts in ....',
          progress: 0,
          colorType: 'cyan',
          icon: '🏅',
        },
        {
          id: 11,
          title: 'Unit 10: Our Summer Holidays',
          subtitle: 'Kỳ nghỉ hè của chúng ta (Thì quá khứ đơn)',
          description: 'Chủ đề: Kỳ nghỉ hè của chúng ta (Thì quá khứ đơn). Mẫu câu: We build sandcastles on the .... / The ... is near a beautiful lake. / My grandparents live in the ....',
          progress: 0,
          colorType: 'yellow',
          icon: '🏖️',
        },
        {
          id: 12,
          title: 'Unit 11: My Home',
          subtitle: 'Nhà của tớ (Đặc điểm & Nơi ở)',
          description: 'Chủ đề: Nhà của tớ (Đặc điểm & Nơi ở). Mẫu câu: There is a car on the .... / Our house is on a quiet .... / An elephant is very ....',
          progress: 0,
          colorType: 'blue',
          icon: '🏠',
        },
        {
          id: 13,
          title: 'Unit 12: Jobs',
          subtitle: 'Nghề nghiệp & Nơi làm việc',
          description: 'Chủ đề: Nghề nghiệp & Nơi làm việc. Mẫu câu: He wants to be a famous .... / The ... works in the field. / The ... gives me medicine.',
          progress: 0,
          colorType: 'green',
          icon: '👨‍⚕️',
        },
        {
          id: 14,
          title: 'Unit 13: Appearance',
          subtitle: 'Ngoại hình (Miêu tả hình dáng & khuôn mặt)',
          description: 'Chủ đề: Ngoại hình (Miêu tả hình dáng & khuôn mặt). Mẫu câu: An elephant is very .... / He is ... but he can jump very high. / She is ... and very active.',
          progress: 0,
          colorType: 'pink',
          icon: '👤',
        },
        {
          id: 15,
          title: 'Unit 14: Daily Activities',
          subtitle: 'Hoạt động hàng ngày (Các buổi trong ngày)',
          description: 'Chủ đề: Hoạt động hàng ngày (Các buổi trong ngày). Mẫu câu: We have lunch at .... / I eat an egg and drink milk in the .... / We play badminton in the ....',
          progress: 0,
          colorType: 'yellow',
          icon: '☀️',
        },
        {
          id: 16,
          title: 'Unit 15: My Family\'s Weekends',
          subtitle: 'Cuối tuần của gia đình tớ',
          description: 'Chủ đề: Cuối tuần của gia đình tớ. Mẫu câu: We watch a funny cartoon at the .... / My mom buys new clothes at the .... / We play basketball at the ....',
          progress: 0,
          colorType: 'green',
          icon: '👨‍👩‍👧',
        },
        {
          id: 17,
          title: 'Unit 16: Weather',
          subtitle: 'Thời tiết (Tính từ thời tiết & Địa điểm đi chơi)',
          description: 'Chủ đề: Thời tiết (Tính từ thời tiết & Địa điểm đi chơi). Mẫu câu: It is ... and cool today. / I take an umbrella on a ... day. / The weather is ... and warm.',
          progress: 0,
          colorType: 'cyan',
          icon: '🌤️',
        },
        {
          id: 18,
          title: 'Unit 17: In the City',
          subtitle: 'Trong thành phố (Hỏi đường & Biển báo)',
          description: 'Chủ đề: Trong thành phố (Hỏi đường & Biển báo). Mẫu câu: How can I get to the supermarket? / ... and turn right. / The bookshop is on your ....',
          progress: 0,
          colorType: 'green',
          icon: '🏙️',
        },
        {
          id: 19,
          title: 'Unit 18: At the Shopping Centre',
          subtitle: 'Tại trung tâm mua sắm (Vị trí & Giá cả)',
          description: 'Chủ đề: Tại trung tâm mua sắm (Vị trí & Giá cả). Mẫu câu: The cat is hiding ... the door. / The shop is ... the bakery and the cinema. / The blanket is ... the tent.',
          progress: 0,
          colorType: 'yellow',
          icon: '🛍️',
        },
        {
          id: 20,
          title: 'Unit 19: The Animal World',
          subtitle: 'Thế giới động vật (Hành động động vật)',
          description: 'Chủ đề: Thế giới động vật (Hành động động vật). Mẫu câu: Be careful! The ... has sharp teeth. / The ... eats leaves from tall trees. / The ... loves to stay in the water.',
          progress: 0,
          colorType: 'purple',
          icon: '🦁',
        },
        {
          id: 21,
          title: 'Unit 20: At Summer Camp',
          subtitle: 'Tại trại hè (Hoạt động cảm trại tiếp diễn)',
          description: 'Chủ đề: Tại trại hè (Hoạt động cảm trại tiếp diễn). Mẫu câu: We ... in the evening. / We ... together. / We ... together when it rains.',
          progress: 0,
          colorType: 'blue',
          icon: '⛺',
        },
      ];
    }

    if (grade === 3) {
      return [
        {
          id: 1,
          title: 'Unit 1: Hello',
          subtitle: 'Chào hỏi và tự giới thiệu',
          description: 'Chủ đề: Chào hỏi và tự giới thiệu. Mẫu câu: Hello. / Hi. I\'m ...; How are you? - Fine, thank you.',
          progress: 0,
          colorType: 'green',
          icon: '👋',
        },
        {
          id: 2,
          title: 'Unit 2: Our names',
          subtitle: 'Hỏi và trả lời về tên và tuổi',
          description: 'Chủ đề: Hỏi và trả lời về tên và tuổi. Mẫu câu: What\'s your name? - My name\'s ...; How old are you? - I\'m ... years old.',
          progress: 0,
          colorType: 'purple',
          icon: '📛',
        },
        {
          id: 3,
          title: 'Unit 3: Our friends',
          subtitle: 'Giới thiệu người khác',
          description: 'Chủ đề: Giới thiệu người khác. Mẫu câu: This is ... / That\'s ...; Is this / that ...? - Yes, it is. / No, it isn\'t.',
          progress: 0,
          colorType: 'yellow',
          icon: '🤝',
        },
        {
          id: 4,
          title: 'Unit 4: Our bodies',
          subtitle: 'Bộ phận cơ thể và chỉ dẫn',
          description: 'Chủ đề: Bộ phận cơ thể và chỉ dẫn. Mẫu câu: What\'s this? - It\'s ...; Touch / Open your ...!',
          progress: 0,
          colorType: 'cyan',
          icon: '👁️',
        },
        {
          id: 5,
          title: 'Unit 5: My hobbies',
          subtitle: 'Sở thích',
          description: 'Chủ đề: Sở thích. Mẫu câu: What\'s your hobby? - It\'s ...; I like ...',
          progress: 0,
          colorType: 'pink',
          icon: '🎨',
        },
        {
          id: 6,
          title: 'Unit 6: Our school',
          subtitle: 'Trường học và các phòng chức năng',
          description: 'Chủ đề: Trường học và các phòng chức năng. Mẫu câu: Is this our ...? - Yes, it is. / No, it isn\'t.; Let\'s go to the ... - OK, let\'s go.',
          progress: 0,
          colorType: 'yellow',
          icon: '🏫',
        },
        {
          id: 7,
          title: 'Unit 7: Classroom instructions',
          subtitle: 'Mệnh lệnh và xin phép trong lớp',
          description: 'Chủ đề: Mệnh lệnh và xin phép trong lớp. Mẫu câu: ..., please!; May I ...? - Yes, you can. / No, you can\'t.',
          progress: 0,
          colorType: 'blue',
          icon: '📢',
        },
        {
          id: 8,
          title: 'Unit 8: My school things',
          subtitle: 'Đồ dùng học tập',
          description: 'Chủ đề: Đồ dùng học tập. Mẫu câu: I have ...; Do you have ...? - Yes, I do. / No, I don\'t.',
          progress: 0,
          colorType: 'green',
          icon: '✏️',
        },
        {
          id: 9,
          title: 'Unit 9: Colours',
          subtitle: 'Màu sắc',
          description: 'Chủ đề: Màu sắc. Mẫu câu: What colour is it? - It\'s ...; What colour are they? - They\'re ...',
          progress: 0,
          colorType: 'purple',
          icon: '🌈',
        },
        {
          id: 10,
          title: 'Unit 10: Break time activities',
          subtitle: 'Các hoạt động giờ ra chơi',
          description: 'Chủ đề: Các hoạt động giờ ra chơi. Mẫu câu: I ... at break time.; What do you do at break time? - I ...',
          progress: 0,
          colorType: 'yellow',
          icon: '⚽',
        },
        {
          id: 11,
          title: 'Unit 11: My family',
          subtitle: 'Gia đình',
          description: 'Chủ đề: Gia đình. Mẫu câu: Who\'s this / that? - It\'s my ...; How old is he / she? - He\'s / She\'s ...',
          progress: 0,
          colorType: 'cyan',
          icon: '👨‍👩‍👧',
        },
        {
          id: 12,
          title: 'Unit 12: Jobs',
          subtitle: 'Nghề nghiệp',
          description: 'Chủ đề: Nghề nghiệp. Mẫu câu: What\'s his / her job? - He\'s / She\'s a ...; Is he / she a ...? - Yes, he / she is.',
          progress: 0,
          colorType: 'pink',
          icon: '👩‍⚕️',
        },
        {
          id: 13,
          title: 'Unit 13: My house',
          subtitle: 'Ngôi nhà và vị trí đồ vật',
          description: 'Chủ đề: Ngôi nhà và vị trí đồ vật. Mẫu câu: Where\'s the ...? - It\'s here / there.; Where are the ...? - They\'re ...',
          progress: 0,
          colorType: 'yellow',
          icon: '🏡',
        },
        {
          id: 14,
          title: 'Unit 14: My bedroom',
          subtitle: 'Phòng ngủ và số lượng vật dụng',
          description: 'Chủ đề: Phòng ngủ và số lượng vật dụng. Mẫu câu: There\'s / There are ... in the room.; The ... is / are ...',
          progress: 0,
          colorType: 'blue',
          icon: '🛏️',
        },
        {
          id: 15,
          title: 'Unit 15: At the dining table',
          subtitle: 'Đồ ăn và thức uống',
          description: 'Chủ đề: Đồ ăn và thức uống. Mẫu câu: Would you like some ...? - Yes, please / No, thanks.; What would you like to eat/drink?',
          progress: 0,
          colorType: 'green',
          icon: '🍲',
        },
        {
          id: 16,
          title: 'Unit 16: My pets',
          subtitle: 'Thú cưng',
          description: 'Chủ đề: Thú cưng. Mẫu câu: Do you have any ...? - Yes, I do / No, I don\'t.; How many ... do you have?',
          progress: 0,
          colorType: 'purple',
          icon: '🐶',
        },
        {
          id: 17,
          title: 'Unit 17: Our toys',
          subtitle: 'Đồ chơi',
          description: 'Chủ đề: Đồ chơi. Mẫu câu: He / She has ...; They have ...',
          progress: 0,
          colorType: 'yellow',
          icon: '🧸',
        },
        {
          id: 18,
          title: 'Unit 18: Playing and doing',
          subtitle: 'Hoạt động đang diễn ra',
          description: 'Chủ đề: Hoạt động đang diễn ra. Mẫu câu: I\'m ...; What are you doing? - I\'m ...',
          progress: 0,
          colorType: 'cyan',
          icon: '🏃',
        },
        {
          id: 19,
          title: 'Unit 19: Outdoor activities',
          subtitle: 'Hoạt động ngoài trời',
          description: 'Chủ đề: Hoạt động ngoài trời. Mẫu câu: He\'s / She\'s ...; What\'s he / she doing? - He\'s / She\'s ...',
          progress: 0,
          colorType: 'pink',
          icon: '🚴',
        },
        {
          id: 20,
          title: 'Unit 20: At the zoo',
          subtitle: 'Tại vườn thú',
          description: 'Chủ đề: Tại vườn thú. Mẫu câu: What can you see? - I can see ...; What\'s the ... doing? - It\'s ...',
          progress: 0,
          colorType: 'yellow',
          icon: '🦁',
        },
      ];
    }

    if (grade === 5) {
      return [
        {
          id: 1,
          title: 'Unit 1: All about me!',
          subtitle: 'Thông tin cá nhân và sở thích',
          description: 'Chủ đề: Thông tin cá nhân và sở thích. Mẫu câu: I often play with my .... / I study in this .... / I live in the ....',
          progress: 14,
          colorType: 'blue',
          icon: '💙',
        },
        {
          id: 2,
          title: 'Unit 2: Our homes: Nơi ở và địa chỉ',
          subtitle: 'Nơi ở và địa chỉ',
          description: 'Chủ đề: Nơi ở và địa chỉ. Mẫu câu: I live in this .... / His grandfather is ninety-three years old. / The room number is one hundred and sixteen.',
          progress: 0,
          colorType: 'green',
          icon: '🏡',
        },
        {
          id: 3,
          title: 'Unit 3: My foreign friends: Quốc tịch và tính cách',
          subtitle: 'Quốc tịch và tính cách',
          description: 'Chủ đề: Quốc tịch và tính cách. Mẫu câu: He is .... / She has a beautiful .... / Vietnam is a beautiful ....',
          progress: 0,
          colorType: 'purple',
          icon: '🌍',
        },
        {
          id: 4,
          title: 'Unit 4: Our free-time activities: Hoạt động trong thời gian rảnh',
          subtitle: 'Hoạt động trong thời gian rảnh',
          description: 'Chủ đề: Hoạt động trong thời gian rảnh. Mẫu câu: I ... study in my free time. / I like ... in my free time. / I often send ...s to my friends.',
          progress: 0,
          colorType: 'pink',
          icon: '🎮',
        },
        {
          id: 5,
          title: 'Unit 5: My future job: Nghề nghiệp tương lai',
          subtitle: 'Nghề nghiệp tương lai',
          description: 'Chủ đề: Nghề nghiệp tương lai. Mẫu câu: I want to be a .... / We should think about our .... / I like to watch the ... on TV.',
          progress: 0,
          colorType: 'yellow',
          icon: '🚀',
        },
        {
          id: 6,
          title: 'Unit 6: Our school rooms: Các phòng học và vị trí',
          subtitle: 'Các phòng học và vị trí',
          description: 'Chủ đề: Các phòng học và vị trí. Mẫu câu: Walk ... the street to find the store. / The classroom is at the end of the .... / Walk ... to find the playground.',
          progress: 0,
          colorType: 'cyan',
          icon: '🏫',
        },
        {
          id: 7,
          title: 'Unit 7: Our favourite school activities: Hoạt động yêu thích tại trường',
          subtitle: 'Hoạt động yêu thích tại trường',
          description: 'Chủ đề: Hoạt động yêu thích tại trường. Mẫu câu: I like to watch ...s at home. / Math is a ... subject for me. / We ... in groups.',
          progress: 0,
          colorType: 'pink',
          icon: '🎨',
        },
        {
          id: 8,
          title: 'Unit 8: In our classroom: Đồ vật trong lớp học',
          subtitle: 'Đồ vật trong lớp học',
          description: 'Chủ đề: Đồ vật trong lớp học. Mẫu câu: The fan is ... my head. / The books are ... the table. / The teacher writes new words on the ....',
          progress: 0,
          colorType: 'green',
          icon: '✏️',
        },
        {
          id: 9,
          title: 'Unit 9: Our outdoor activities: Hoạt động ngoài trời trong quá khứ',
          subtitle: 'Hoạt động ngoài trời trong quá khứ',
          description: 'Chủ đề: Hoạt động ngoài trời trong quá khứ. Mẫu câu: We were at the ... yesterday. / We ...d a lot yesterday. / I visited my grandparents ... month.',
          progress: 0,
          colorType: 'yellow',
          icon: '🌳',
        },
        {
          id: 10,
          title: 'Unit 10: Our school trip: Chuyến tham quan của trường',
          subtitle: 'Chuyến tham quan của trường',
          description: 'Chủ đề: Chuyến tham quan của trường. Mẫu câu: They traveled ... the country last week. / They climbed up a green ... last week. / They walked around the ... last week.',
          progress: 0,
          colorType: 'purple',
          icon: '🚌',
        },
        {
          id: 11,
          title: 'Unit 11: Family time: Hoạt động gia đình trong quá khứ',
          subtitle: 'Hoạt động gia đình trong quá khứ',
          description: 'Chủ đề: Hoạt động gia đình trong quá khứ. Mẫu câu: We ...d at the airport very early. / My friends and I always play .... / My family loves to ... to different countries.',
          progress: 0,
          colorType: 'blue',
          icon: '👨‍👩‍👧‍👦',
        },
        {
          id: 12,
          title: 'Unit 12: Our Tet holiday: Kế hoạch cho ngày Tết',
          subtitle: 'Kế hoạch cho ngày Tết',
          description: 'Chủ đề: Kế hoạch cho ngày Tết. Mẫu câu: We will visit the ... for Tet. / We will ... gifts to our grandparents for Tet. / We will ... our house for Tet.',
          progress: 0,
          colorType: 'green',
          icon: '🏮',
        },
        {
          id: 13,
          title: 'Unit 13: Our special days: Các ngày lễ đặc biệt và ăn uống',
          subtitle: 'Các ngày lễ đặc biệt và ăn uống',
          description: 'Chủ đề: Các ngày lễ đặc biệt và ăn uống. Mẫu câu: We will eat delicious ... at the party. / We will drink ... at the party. / We will have a party in ....',
          progress: 0,
          colorType: 'purple',
          icon: '🎉',
        },
        {
          id: 14,
          title: 'Unit 14: Staying healthy: Lối sống lành mạnh và tần suất',
          subtitle: 'Lối sống lành mạnh và tần suất',
          description: 'Chủ đề: Lối sống lành mạnh và tần suất. Mẫu câu: He runs ... every day to stay healthy. / He does morning exercise to stay healthy. / He does yoga to stay healthy.',
          progress: 0,
          colorType: 'pink',
          icon: '🍎',
        },
        {
          id: 15,
          title: 'Unit 15: Our health: Các vấn đề sức khỏe và lời khuyên',
          subtitle: 'Các vấn đề sức khỏe và lời khuyên',
          description: 'Chủ đề: Các vấn đề sức khỏe và lời khuyên. Mẫu câu: You should go to the doctor .... / You should ... if you are tired. / I have a ....',
          progress: 0,
          colorType: 'yellow',
          icon: '🩺',
        },
        {
          id: 16,
          title: 'Unit 16: Seasons and the weather: Thời tiết và trang phục theo mùa',
          subtitle: 'Thời tiết và trang phục theo mùa',
          description: 'Chủ đề: Thời tiết và trang phục theo mùa. Mẫu câu: My new bike is so ...! / The ... shines brightly today. / She wears a warm ... under her coat.',
          progress: 0,
          colorType: 'cyan',
          icon: '🌤️',
        },
        {
          id: 17,
          title: 'Unit 17: Stories for children: Nhân vật và đặc điểm trong truyện',
          subtitle: 'Nhân vật và đặc điểm trong truyện',
          description: 'Chủ đề: Nhân vật và đặc điểm trong truyện. Mẫu câu: She sings .... / I ... want to play. / The ... works hard.',
          progress: 0,
          colorType: 'pink',
          icon: '📖',
        },
        {
          id: 18,
          title: 'Unit 18: Means of transport: Địa điểm du lịch và phương tiện giao thông',
          subtitle: 'Địa điểm du lịch và phương tiện giao thông',
          description: 'Chủ đề: Địa điểm du lịch và phương tiện giao thông. Mẫu câu: We walked across the .... / Let\'s go to school by .... / A ... is a big, mythical creature.',
          progress: 0,
          colorType: 'green',
          icon: '🚀',
        },
        {
          id: 19,
          title: 'Unit 19: Places of interest: Ý kiến về địa danh và khoảng cách',
          subtitle: 'Ý kiến về địa danh và khoảng cách',
          description: 'Chủ đề: Ý kiến về địa danh và khoảng cách. Mẫu câu: Ha Long ... is a very beautiful place. / I think it is very .... / We walk from home to school every day.',
          progress: 0,
          colorType: 'yellow',
          icon: '🏞️',
        },
        {
          id: 20,
          title: 'Unit 20: Our summer holidays: Dự định cho kỳ nghỉ hè',
          subtitle: 'Dự định cho kỳ nghỉ hè',
          description: 'Chủ đề: Dự định cho kỳ nghỉ hè. Mẫu câu: We can visit a big ... on our trip. / My family wants to visit an ... this summer. / Let\'s ... the forest together.',
          progress: 0,
          colorType: 'blue',
          icon: '🏖️',
        },
      ];
    }

    if (grade === 2) {
      return [
        {
          id: 1,
          title: 'Unit 1: At my birthday party',
          subtitle: 'Tại bữa tiệc sinh nhật',
          description: 'Chủ đề: Tại bữa tiệc sinh nhật. Mẫu câu: I like eating .... / We share a big .... / The ... is yummy.',
          progress: 0,
          colorType: 'pink',
          icon: '🎂',
        },
        {
          id: 2,
          title: 'Unit 2: In the backyard',
          subtitle: 'Trong sân sau',
          description: 'Chủ đề: Trong sân sau. Mẫu câu: He rides his ... in the backyard. / The ... flies high in the sky. / The little ... is sleeping.',
          progress: 0,
          colorType: 'yellow',
          icon: '🏡',
        },
        {
          id: 3,
          title: 'Unit 3: At the seaside',
          subtitle: 'Ở bãi biển',
          description: 'Chủ đề: Ở bãi biển. Mẫu câu: I can see a white .... / We play on the warm .... / Let\'s look at the blue ...!',
          progress: 0,
          colorType: 'green',
          icon: '🏖️',
        },
        {
          id: 4,
          title: 'Unit 4: In the countryside',
          subtitle: 'Ở nông thôn',
          description: 'Chủ đề: Ở nông thôn. Mẫu câu: Look at the beautiful ...! / The ... is long and clear. / There is a car on the ....',
          progress: 0,
          colorType: 'blue',
          icon: '🌾',
        },
        {
          id: 5,
          title: 'Unit 5: In the classroom',
          subtitle: 'Trong lớp học',
          description: 'Chủ đề: Trong lớp học. Mẫu câu: I have a ... for teacher. / We do a fun ... today. / A clock is a ....',
          progress: 0,
          colorType: 'purple',
          icon: '🏫',
        },
        {
          id: 6,
          title: 'Unit 6: On the farm',
          subtitle: 'Trên trang trại',
          description: 'Chủ đề: Trên trang trại. Mẫu câu: Put the toys in the .... / The orange ... runs fast. / An ... is working on the farm.',
          progress: 0,
          colorType: 'cyan',
          icon: '🚜',
        },
        {
          id: 7,
          title: 'Unit 7: In the kitchen',
          subtitle: 'Trong nhà bếp',
          description: 'Chủ đề: Trong nhà bếp. Mẫu câu: Pass me the ..., please. / I love eating sweet .... / Would you like some orange ...?',
          progress: 0,
          colorType: 'pink',
          icon: '🍳',
        },
        {
          id: 8,
          title: 'Unit 8: In the village',
          subtitle: 'Trong làng',
          description: 'Chủ đề: Trong làng. Mẫu câu: The blue ... goes into the village. / My ... is peaceful and green. / We play ... together.',
          progress: 0,
          colorType: 'yellow',
          icon: '🏘️',
        },
        {
          id: 9,
          title: 'Unit 9: In the grocery store',
          subtitle: 'Trong cửa hàng tạp hóa',
          description: 'Chủ đề: Trong cửa hàng tạp hóa. Mẫu câu: I eat some sweet ...s. / Look at my new red ...! / ... is very good for kids.',
          progress: 0,
          colorType: 'green',
          icon: '🛒',
        },
        {
          id: 10,
          title: 'Unit 10: At the zoo',
          subtitle: 'Tại sở thú',
          description: 'Chủ đề: Tại sở thú. Mẫu câu: The ... has black and white stripes. / Look at the big ... over there. / Do you like going to the ...?',
          progress: 0,
          colorType: 'blue',
          icon: '🦁',
        },
        {
          id: 11,
          title: 'Unit 11: In the playground',
          subtitle: 'Trên sân chơi',
          description: 'Chủ đề: Trên sân chơi. Mẫu câu: They are driving toy cars. / She ...s her bike in the park. / We like playing on the ....',
          progress: 0,
          colorType: 'purple',
          icon: '🛝',
        },
        {
          id: 12,
          title: 'Unit 12: At the café',
          subtitle: 'Tại quán cà phê',
          description: 'Chủ đề: Tại quán cà phê. Mẫu câu: The ... is sweet and soft. / I want to eat purple ...s. / The grapes are on the ....',
          progress: 0,
          colorType: 'cyan',
          icon: '☕',
        },
        {
          id: 13,
          title: 'Unit 13: In the maths class',
          subtitle: 'Giờ học Toán',
          description: 'Chủ đề: Giờ học Toán. Mẫu câu: I can count to .... / There are ... months in a year. / My brother is ... years old.',
          progress: 0,
          colorType: 'pink',
          icon: '📐',
        },
        {
          id: 14,
          title: 'Unit 14: At home',
          subtitle: 'Ở nhà',
          description: 'Chủ đề: Ở nhà. Mẫu câu: This is my little .... / My ... plays with a doll. / My ... tells me stories.',
          progress: 0,
          colorType: 'yellow',
          icon: '🏠',
        },
        {
          id: 15,
          title: 'Unit 15: In the clothes shop',
          subtitle: 'Trong cửa hàng quần áo',
          description: 'Chủ đề: Trong cửa hàng quần áo. Mẫu câu: I wear a clean .... / My ... are blue and white. / He wears brown ....',
          progress: 0,
          colorType: 'green',
          icon: '👕',
        },
        {
          id: 16,
          title: 'Unit 16: At the campsite',
          subtitle: 'Tại khu cắm trại',
          description: 'Chủ đề: Tại khu cắm trại. Mẫu câu: The ... keeps me warm. / The blanket is ... the tent. / The ... is on the table.',
          progress: 0,
          colorType: 'blue',
          icon: '⛺',
        },
      ];
    }

    // Default Grade 1 Units
    return [
      {
        id: 1,
        title: 'Unit 1: In the school playground',
        subtitle: 'Trong sân trường',
        description: 'Chủ đề: Trong sân trường. Mẫu câu: I have a big .... / This is my blue .... / Open your English ....',
        progress: 0,
        colorType: 'pink',
        icon: '🏫',
      },
      {
        id: 2,
        title: 'Unit 2: In the dining room',
        subtitle: 'Trong phòng ăn',
        description: 'Chủ đề: Trong phòng ăn. Mẫu câu: I like this sweet .... / I have a fast toy .... / The ... is so cute.',
        progress: 0,
        colorType: 'yellow',
        icon: '🍽️',
      },
      {
        id: 3,
        title: 'Unit 3: At the street market',
        subtitle: 'Tại chợ đường phố',
        description: 'Chủ đề: Tại chợ đường phố. Mẫu câu: I eat a red .... / This is my new school .... / I see a soda ....',
        progress: 0,
        colorType: 'green',
        icon: '🏪',
      },
      {
        id: 4,
        title: 'Unit 4: In the bedroom',
        subtitle: 'Trong phòng ngủ',
        description: 'Chủ đề: Trong phòng ngủ. Mẫu câu: The ... is very clean. / The ... can bark. / Close the bedroom ....',
        progress: 0,
        colorType: 'blue',
        icon: '🛏️',
      },
      {
        id: 5,
        title: 'Unit 5: At the fish and chip shop',
        subtitle: 'Cửa hàng ăn nhanh',
        description: 'Chủ đề: Cửa hàng ăn nhanh. Mẫu câu: I want to eat .... / Do you like yummy ...? / The ... can swim fast.',
        progress: 0,
        colorType: 'purple',
        icon: '🍟',
      },
      {
        id: 6,
        title: 'Unit 6: In the classroom',
        subtitle: 'Trong lớp học',
        description: 'Chủ đề: Trong lớp học. Mẫu câu: The school ... rings. / This ... is very nice. / Draw with a ....',
        progress: 0,
        colorType: 'cyan',
        icon: '📚',
      },
      {
        id: 7,
        title: 'Unit 7: In the garden',
        subtitle: 'Trong khu vườn',
        description: 'Chủ đề: Trong khu vườn. Mẫu câu: We play in the .... / Open the garden .... / She is a good ....',
        progress: 0,
        colorType: 'pink',
        icon: '🏡',
      },
      {
        id: 8,
        title: 'Unit 8: In the park',
        subtitle: 'Trong công viên',
        description: 'Chủ đề: Trong công viên. Mẫu câu: She has long .... / Show me your .... / Shake your ....',
        progress: 0,
        colorType: 'yellow',
        icon: '🌳',
      },
      {
        id: 9,
        title: 'Unit 9: In the shop',
        subtitle: 'Trong cửa hàng',
        description: 'Chủ đề: Trong cửa hàng. Mẫu câu: The ... is round. / This is a strong .... / Clean the floor with a ....',
        progress: 0,
        colorType: 'green',
        icon: '🛍️',
      },
      {
        id: 10,
        title: 'Unit 10: At the zoo',
        subtitle: 'Tại sở thú',
        description: 'Chủ đề: Tại sở thú. Mẫu câu: This ... is very sweet. / The ... eats bananas. / I love my ....',
        progress: 0,
        colorType: 'blue',
        icon: '🦁',
      },
      {
        id: 11,
        title: 'Unit 11: At the bus stop',
        subtitle: 'Tại điểm dừng xe buýt',
        description: 'Chủ đề: Tại điểm dừng xe buýt. Mẫu câu: The ... is coming. / Let\'s ... together. / The ... is bright yellow.',
        progress: 0,
        colorType: 'purple',
        icon: '🚏',
      },
      {
        id: 12,
        title: 'Unit 12: At the lake',
        subtitle: 'Ở hồ nước',
        description: 'Chủ đề: Ở hồ nước. Mẫu câu: The ... is cold. / This green ... is small. / A ... is yellow.',
        progress: 0,
        colorType: 'cyan',
        icon: '🏞️',
      },
      {
        id: 13,
        title: 'Unit 13: In the school canteen',
        subtitle: 'Trong căn tin trường',
        description: 'Chủ đề: Trong căn tin trường. Mẫu câu: I love sweet ...s. / I eat ... for lunch. / The ... is crunchy.',
        progress: 0,
        colorType: 'pink',
        icon: '🥪',
      },
      {
        id: 14,
        title: 'Unit 14: In the toy shop',
        subtitle: 'Trong cửa hàng đồ chơi',
        description: 'Chủ đề: Trong cửa hàng đồ chơi. Mẫu câu: I sleep with my .... / The ... has stripes. / Look at the spinning ....',
        progress: 0,
        colorType: 'yellow',
        icon: '🧸',
      },
      {
        id: 15,
        title: 'Unit 15: At the football match',
        subtitle: 'Trận thi đấu bóng đá',
        description: 'Chủ đề: Trận thi đấu bóng đá. Mẫu câu: She has a happy .... / My ... plays football. / Kick with your ....',
        progress: 0,
        colorType: 'green',
        icon: '⚽',
      },
      {
        id: 16,
        title: 'Unit 16: At home',
        subtitle: 'Ở nhà',
        description: 'Chủ đề: Ở nhà. Mẫu câu: ... your hands with soap. / Drink some fresh .... / The ... is open.',
        progress: 0,
        colorType: 'blue',
        icon: '🏠',
      },
    ];
  };

  const currentUnits = getUnitsForGrade(gradeNumber);

  const subLessons = [
    { id: 1, title: t('1. Học Từ vựng', '1. Learn Vocabulary') },
    { id: 2, title: t('2. Luyện Thẻ ghi nhớ', '2. Practice Flashcards') },
    { id: 3, title: t('3. Luyện nghe tinh anh', '3. Smart Listening Practice') },
    { id: 4, title: t('4. Luyện nói tự tin', '4. Confident Speaking Practice') },
    { id: 5, title: t('5. Học Mindmap Unit (Quan Trọng)', '5. Learn Unit Mindmap (Important)'), highlighted: true },
    { id: 6, title: t('6. Đọc truyện cùng Kido', '6. Read Stories with Kido') },
    { id: 7, title: t('7. Đố vui bài học (Quiz)', '7. Lesson Quiz') },
    { id: 8, title: '8. ' + t('Trò chơi ôn tập (Review)', 'Review Games') },
  ];

  const toggleUnitExpand = (unitId: number) => {
    audioService.playClickSound();
    setExpandedUnitId((prev) => (prev === unitId ? null : unitId));
  };

  const handleStartSubLesson = (unitTitle: string, lessonTitle: string) => {
    audioService.playClickSound();
    setActiveSubLessonModal({ unitTitle, lessonName: lessonTitle });
    if (onCompleteLesson) {
      onCompleteLesson(lessonTitle, unitTitle, gradeNumber);
    } else {
      onAddStars(2);
    }
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  const getColorClasses = (colorType: string, isExpanded: boolean) => {
    switch (colorType) {
      case 'pink':
        return {
          bg: 'bg-[#fdf2f8]',
          border: isExpanded ? 'border-2 border-pink-400 shadow-md' : 'border border-pink-200/90 hover:border-pink-300',
          badgeBg: 'bg-pink-100 text-pink-700',
          tagBg: 'bg-pink-100 text-pink-700',
          iconBg: 'bg-pink-500 text-white',
        };
      case 'yellow':
        return {
          bg: 'bg-[#fffbeb]',
          border: isExpanded ? 'border-2 border-amber-400 shadow-md' : 'border border-amber-200/90 hover:border-amber-300',
          badgeBg: 'bg-amber-100 text-amber-800',
          tagBg: 'bg-amber-100 text-amber-800',
          iconBg: 'bg-amber-500 text-white',
        };
      case 'green':
        return {
          bg: 'bg-[#f0fdf4]',
          border: isExpanded ? 'border-2 border-emerald-400 shadow-md' : 'border border-emerald-200/90 hover:border-emerald-300',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          tagBg: 'bg-emerald-100 text-emerald-800',
          iconBg: 'bg-emerald-500 text-white',
        };
      case 'blue':
        return {
          bg: 'bg-[#f0f9ff]',
          border: isExpanded ? 'border-2 border-sky-400 shadow-md' : 'border border-sky-200/90 hover:border-sky-300',
          badgeBg: 'bg-sky-100 text-sky-800',
          tagBg: 'bg-sky-100 text-sky-800',
          iconBg: 'bg-sky-500 text-white',
        };
      case 'purple':
        return {
          bg: 'bg-[#faf5ff]',
          border: isExpanded ? 'border-2 border-purple-400 shadow-md' : 'border border-purple-200/90 hover:border-purple-300',
          badgeBg: 'bg-purple-100 text-purple-800',
          tagBg: 'bg-purple-100 text-purple-800',
          iconBg: 'bg-purple-500 text-white',
        };
      case 'cyan':
      default:
        return {
          bg: 'bg-[#ecfeff]',
          border: isExpanded ? 'border-2 border-cyan-400 shadow-md' : 'border border-cyan-200/90 hover:border-cyan-300',
          badgeBg: 'bg-cyan-100 text-cyan-800',
          tagBg: 'bg-cyan-100 text-cyan-800',
          iconBg: 'bg-cyan-500 text-white',
        };
    }
  };

  const isGradeAllowed = hasGradeAccess(user?.allowedGrades, `grade-${gradeNumber}`, user?.role);

  if (!isGradeAllowed) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xl select-none">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
          🔒
        </div>
        <h2 className="text-xl font-black text-slate-800">Lớp {gradeNumber} Chưa Được Mở</h2>
        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
          Tài khoản <strong>{user?.name || 'học sinh'}</strong> hiện chưa được Admin cấp quyền học Lớp {gradeNumber}. Vui lòng liên hệ Admin để mở khóa thêm lớp học!
        </p>
        <div className="pt-3">
          <button
            onClick={() => {
              audioService.playClickSound();
              if (setActiveTab) setActiveTab('home');
            }}
            className="px-5 py-2.5 bg-[#1d50b4] hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition"
          >
            Quay Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none font-sans">
      {/* 2. TOP GRADE SELECTOR TABS (Grade 1 to 5) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5].map((gNum) => {
          const isActive = gNum === gradeNumber;
          let activeBgClass = 'bg-[#ec4899] text-white border-transparent shadow-md scale-[1.02]';
          if (gNum === 2) activeBgClass = 'bg-[#f97316] text-white border-transparent shadow-md scale-[1.02]';
          if (gNum === 3) activeBgClass = 'bg-[#0284c7] text-white border-transparent shadow-md scale-[1.02]';
          if (gNum === 4) activeBgClass = 'bg-[#10b981] text-white border-transparent shadow-md scale-[1.02]';
          if (gNum === 5) activeBgClass = 'bg-[#8b5cf6] text-white border-transparent shadow-md scale-[1.02]';

          return (
            <button
              key={gNum}
              onClick={() => {
                audioService.playClickSound();
                if (setActiveTab) {
                  setActiveTab(`grade-${gNum}` as ActiveTab);
                }
              }}
              className={`flex-1 sm:flex-1 shrink-0 min-w-[100px] sm:min-w-[120px] whitespace-nowrap py-2.5 px-3 rounded-2xl font-black text-xs transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border-2 ${
                isActive
                  ? activeBgClass
                  : gNum === 1
                  ? 'bg-[#fce7f3] text-[#be185d] border-dashed border-pink-300 hover:bg-pink-200'
                  : gNum === 2
                  ? 'bg-[#ffedd5] text-[#9a3412] border-dashed border-orange-300 hover:bg-orange-200'
                  : gNum === 3
                  ? 'bg-[#e0f2fe] text-[#075985] border-dashed border-sky-300 hover:bg-sky-200'
                  : gNum === 4
                  ? 'bg-[#dcfce7] text-[#166534] border-dashed border-emerald-300 hover:bg-emerald-200'
                  : 'bg-[#f3e8ff] text-[#6b21a8] border-dashed border-purple-300 hover:bg-purple-200'
              }`}
            >
              <span>{isActive ? '🌸' : '🔒'}</span>
              <span>{t(`Lớp ${gNum}`, `Grade ${gNum}`)}</span>
            </button>
          );
        })}
      </div>

      {/* 3. HERO BANNER */}
      <div className={`relative rounded-2xl p-5 sm:p-6 text-white overflow-hidden shadow-md border border-white/20 ${
        gradeNumber === 2
          ? 'bg-gradient-to-r from-[#f97316] via-[#f59e0b] to-[#ea580c]'
          : gradeNumber === 3
          ? 'bg-gradient-to-r from-[#0284c7] via-[#06b6d4] to-[#3b82f6]'
          : gradeNumber === 4
          ? 'bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857]'
          : gradeNumber === 5
          ? 'bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]'
          : 'bg-gradient-to-r from-[#ec4899] via-[#f43f5e] to-[#fb7185]'
      }`}>
        <div className="relative z-10 space-y-2 max-w-lg">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            {t(`Chinh phục Tiếng Anh Lớp ${gradeNumber}!`, `Conquer Grade ${gradeNumber} English!`)}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                audioService.playClickSound();
                setExpandedUnitId(1);
              }}
              className="px-4 py-2 bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-extrabold text-xs sm:text-sm rounded-full shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>{t('Học Ngay Thôi', 'Start Learning')}</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={() => {
                audioService.playClickSound();
                setShowAchievementModal(true);
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-1.5 border border-white/40 backdrop-blur-xs"
              title="Tạo Thẻ Thành Tích xuất sắc và chia sẻ qua Web Share API (Zalo/Facebook)"
            >
              <Trophy size={15} className="text-amber-300" />
              <span>{t('Thẻ Thành Tích 🏆', 'Achievement Card 🏆')}</span>
            </button>
          </div>
        </div>

        {/* Mascot Mascot Image on Right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white/20 p-2 flex items-center justify-center backdrop-blur-xs shadow-inner pointer-events-none">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-300 to-sky-400 flex items-center justify-center text-5xl shadow-md border-2 border-white/60">
            🦕
          </div>
        </div>
      </div>

      {/* 4. 16 UNITS LIST */}
      <div className="space-y-3">
        {currentUnits.map((unit) => {
          const isExpanded = expandedUnitId === unit.id;
          const colorStyles = getColorClasses(unit.colorType, isExpanded);

          return (
            <div
              key={unit.id}
              className={`rounded-3xl transition-all duration-200 overflow-hidden ${colorStyles.bg} ${colorStyles.border}`}
            >
              {/* Unit Card Header Row */}
              <div
                onClick={() => toggleUnitExpand(unit.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl ${colorStyles.iconBg} flex items-center justify-center text-lg font-black shrink-0 shadow-xs`}>
                    {unit.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-slate-800 truncate">
                        {unit.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${colorStyles.tagBg}`}>
                        {unit.subtitle}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                      {unit.description}
                    </p>
                  </div>
                </div>

                {/* Right Progress Badge & Expand Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-slate-500 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                    0%
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-2xs">
                    {isExpanded ? <ChevronUp size={18} /> : <ArrowRight size={16} />}
                  </div>
                </div>
              </div>

              {/* Expanded Unit Content (Action Buttons + Sub-Lessons) */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-1 space-y-4 border-t border-slate-200/60 animate-fadeIn">
                  {/* Row of 4 Action Buttons matching reference image 3 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {/* Action 1: Flashcards */}
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        if (setActiveTab) setActiveTab('flashcards');
                      }}
                      className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-sm transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🎴</span>
                      <span>Học Flashcards</span>
                    </button>

                    {/* Action 2: Roadmap Khoa Học */}
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        if (setActiveTab) setActiveTab('roadmap');
                      }}
                      className="py-2.5 px-3 rounded-2xl bg-[#a17a63] hover:bg-[#8d6952] text-white font-black text-xs border-2 border-dashed border-white/40 shadow-sm transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>📖</span>
                      <span>Học Roadmap Khoa Học</span>
                    </button>

                    {/* Action 3: Mindmap */}
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        if (setActiveTab) setActiveTab('mind-thinking');
                      }}
                      className="py-2.5 px-3 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs shadow-sm transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🌿</span>
                      <span>Học Mindmap (Quan Trọng)</span>
                    </button>

                    {/* Action 4: Quiz */}
                    <button
                      onClick={() => {
                        audioService.playClickSound();
                        if (setActiveTab) setActiveTab('quiz');
                      }}
                      className="py-2.5 px-3 rounded-2xl bg-[#38bdf8] hover:bg-[#0284c7] text-white font-black text-xs shadow-sm transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>❓</span>
                      <span>Đố vui (Quiz)</span>
                    </button>
                  </div>

                  {/* List of 8 Sub-Lessons */}
                  <div className="space-y-2 pt-1">
                    {subLessons.map((lesson) => {
                      if (lesson.highlighted) {
                        return (
                          <div
                            key={lesson.id}
                            className="bg-orange-50/80 border-2 border-dashed border-orange-400 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs hover:bg-orange-100/80 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-amber-500 font-bold">⚡</span>
                              <span className="text-xs font-black text-slate-800">
                                {lesson.title}
                              </span>
                            </div>
                            <button
                              onClick={() => handleStartSubLesson(unit.title, lesson.title)}
                              className="text-xs font-black text-[#1d50b4] hover:text-blue-800 hover:underline cursor-pointer px-2 py-1 bg-white rounded-xl shadow-2xs"
                            >
                              Học ngay
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={lesson.id}
                          className="bg-white/80 rounded-2xl p-3 flex items-center justify-between gap-2 border border-slate-100 hover:bg-white transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sky-500 font-bold">⚡</span>
                            <span className="text-xs font-bold text-slate-700">
                              {lesson.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleStartSubLesson(unit.title, lesson.title)}
                            className="text-xs font-extrabold text-[#1d50b4] hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            Học ngay
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Sub-Lesson Practice Modal */}
      {activeSubLessonModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sky-200 text-center space-y-4 font-sans select-none">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              ⚡
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-sky-600 uppercase tracking-wider">
                {activeSubLessonModal.unitTitle}
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-1">
                {activeSubLessonModal.lessonName}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Bé đã bắt đầu bài học thành công! Thưởng +2 Sao Vàng ⭐.
              </p>
            </div>

            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 text-xs font-bold text-slate-700 text-center">
              🎉 Sẵn sàng luyện tập từ vựng & mẫu câu chuẩn bản xứ cùng Kido!
            </div>

            <button
              onClick={() => setActiveSubLessonModal(null)}
              className="w-full py-2.5 rounded-2xl bg-[#1d50b4] hover:bg-blue-700 text-white font-black text-xs shadow-md transition cursor-pointer"
            >
              Hoàn thành bài học
            </button>
          </div>
        </div>
      )}

      {/* Achievement Card Generator & Share Modal */}
      <AchievementCardModal
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
        user={user}
      />
    </div>
  );
};
