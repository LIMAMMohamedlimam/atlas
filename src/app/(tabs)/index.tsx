import { DiaryDayScreen } from '@/features/diary/DiaryDayScreen';
import { useDiaryDayStore } from '@/stores/diary-day';

export default function DiaryScreen() {
  const day = useDiaryDayStore((state) => state.day);
  return <DiaryDayScreen day={day} />;
}
