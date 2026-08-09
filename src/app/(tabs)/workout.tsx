import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/ui/components/screen-placeholder';

export default function WorkoutScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('workout.title')} message={t('workout.placeholder')} />;
}
