import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/ui/components/screen-placeholder';

export default function ProgressScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('progress.title')} message={t('progress.placeholder')} />;
}
