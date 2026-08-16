import { useCallback } from 'react';

import { diaryRepository } from '@/data/repositories';

export type DiaryEntryRemoval = {
  readonly softDelete: (id: string) => void;
  readonly restore: (id: string) => void;
};

/**
 * CA-5 — Suppression logique et annulation, via le repository. Les composants
 * n'appellent jamais `softDelete`/`restore` directement (ADR-0004).
 */
export const useDeleteDiaryEntry = (): DiaryEntryRemoval => {
  const softDelete = useCallback((id: string) => diaryRepository.softDelete(id), []);
  const restore = useCallback((id: string) => diaryRepository.restore(id), []);

  return { softDelete, restore };
};
