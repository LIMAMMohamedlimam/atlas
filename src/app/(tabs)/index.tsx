import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/ui/components/screen-placeholder';

export default function DiaryScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('diary.title')} message={t('diary.placeholder')} />;
}
