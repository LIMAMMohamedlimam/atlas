import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';

import type { DiaryEntryRecord, MealSlot } from '@/data/repositories/diary.repository';
import { addDays, isFutureDay, todayLocalDay, type LocalDay } from '@/lib/date';
import { useDiaryDayStore } from '@/stores/diary-day';
import { MIN_TOUCH_TARGET, radius, spacing, typography, useTheme } from '@/ui/theme';

import { DiaryEntryRow } from './DiaryEntryRow';
import { MacroBar } from './MacroBar';
import { MacroRing } from './MacroRing';
import { MealSection } from './MealSection';
import { WaterTracker } from './WaterTracker';
import { formatAmount, formatDay } from './format';
import { useDeleteDiaryEntry } from './hooks/use-delete-diary-entry';
import { useDiaryDay } from './hooks/use-diary-day';

type Props = {
  day: LocalDay;
};

type DiaryListItem =
  | {
      readonly kind: 'meal';
      readonly mealSlot: MealSlot;
      readonly kcal: number;
      readonly hasEntries: boolean;
    }
  | { readonly kind: 'entry'; readonly entry: DiaryEntryRecord }
  | { readonly kind: 'add'; readonly mealSlot: MealSlot };

const UNDO_DURATION_MS = 5000;

/**
 * Écran du journal d'un jour : anneau de calories, barres de macros, quatre
 * créneaux de repas, navigation entre jours (CA-7) et suppression avec annulation
 * (CA-5). Affiche uniquement — toute donnée vient de `useDiaryDay`.
 */
export function DiaryDayScreen({ day }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { setDay, goToToday } = useDiaryDayStore();
  const diary = useDiaryDay(day);
  const { softDelete, restore } = useDeleteDiaryEntry();

  const [deletedId, setDeletedId] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = useCallback(() => {
    if (undoTimer.current !== null) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      softDelete(id);
      setDeletedId(id);
      clearUndoTimer();
      undoTimer.current = setTimeout(() => setDeletedId(null), UNDO_DURATION_MS);
    },
    [clearUndoTimer, softDelete],
  );

  const handleUndo = useCallback(() => {
    if (deletedId !== null) restore(deletedId);
    clearUndoTimer();
    setDeletedId(null);
  }, [clearUndoTimer, deletedId, restore]);

  useEffect(() => clearUndoTimer, [clearUndoTimer]);

  const today = todayLocalDay();
  const canGoNext = !isFutureDay(addDays(day, 1));
  const isToday = day === today;

  const goPrevious = useCallback(() => setDay(addDays(day, -1)), [day, setDay]);
  const goNext = useCallback(() => {
    if (canGoNext) setDay(addDays(day, 1));
  }, [canGoNext, day, setDay]);

  const swipeGesture = useMemo(
    () =>
      Gesture.Exclusive(
        Gesture.Fling()
          .direction(Directions.RIGHT)
          .onEnd((_event, success) => {
            if (success) goPrevious();
          }),
        Gesture.Fling()
          .direction(Directions.LEFT)
          .onEnd((_event, success) => {
            if (success) goNext();
          }),
      ),
    [goNext, goPrevious],
  );

  const openNewFood = useCallback(
    (mealSlot: MealSlot) => router.push({ pathname: '/food/new', params: { mealSlot, day } }),
    [day],
  );
  const openEdit = useCallback(
    (entryId: string) => router.push({ pathname: '/diary/edit', params: { entryId } }),
    [],
  );

  // RG-9 — le futur est bloqué au jour même. La navigation l'empêche, mais on
  // garde un état défensif pour un `day` futur reçu par un autre chemin.
  if (isFutureDay(day)) {
    return (
      <View style={[styles.blocked, { backgroundColor: colors.background }]}>
        <Text style={[styles.blockedText, { color: colors.textMuted }]}>
          {t('diary.futureBlocked')}
        </Text>
        <Pressable onPress={goToToday} accessibilityRole="button" style={styles.todayButton}>
          <Text style={[styles.todayLabel, { color: colors.accent }]}>{t('diary.today')}</Text>
        </Pressable>
      </View>
    );
  }

  if (diary.state === 'error') {
    return (
      <View style={[styles.blocked, { backgroundColor: colors.background }]}>
        <Text style={[styles.blockedText, { color: colors.textMuted }]}>
          {t('diary.loadError')}
        </Text>
      </View>
    );
  }

  // Lecture locale : < 1 ms. Aucun indicateur de chargement à afficher.
  if (diary.state === 'loading') {
    return <View style={[styles.screen, { backgroundColor: colors.background }]} />;
  }

  const { meals, totals, target } = diary;
  const hasAnyEntry = meals.some((meal) => meal.entries.length > 0);

  const items: DiaryListItem[] = [];
  for (const meal of meals) {
    items.push({
      kind: 'meal',
      mealSlot: meal.mealSlot,
      kcal: meal.kcal,
      hasEntries: meal.entries.length > 0,
    });
    for (const entry of meal.entries) {
      items.push({ kind: 'entry', entry });
    }
    items.push({ kind: 'add', mealSlot: meal.mealSlot });
  }

  const header = (
    <GestureDetector gesture={swipeGesture}>
      <View>
        <View style={styles.dayNav}>
          <Pressable
            onPress={goPrevious}
            accessibilityRole="button"
            accessibilityLabel={t('diary.previousDay')}
            style={styles.navButton}
          >
            <Text style={[styles.navArrow, { color: colors.text }]}>‹</Text>
          </Pressable>
          <Text style={[styles.dateTitle, { color: colors.text }]}>{formatDay(day)}</Text>
          <Pressable
            onPress={goNext}
            disabled={!canGoNext}
            accessibilityRole="button"
            accessibilityLabel={t('diary.nextDay')}
            style={styles.navButton}
          >
            <Text style={[styles.navArrow, { color: canGoNext ? colors.text : colors.textFaint }]}>
              ›
            </Text>
          </Pressable>
          <Pressable
            onPress={goToToday}
            disabled={isToday}
            accessibilityRole="button"
            style={styles.todayButton}
          >
            <Text
              style={[styles.todayLabel, { color: isToday ? colors.textFaint : colors.accent }]}
            >
              {t('diary.today')}
            </Text>
          </Pressable>
        </View>

        {target ? (
          <>
            <View style={styles.ringWrap}>
              <MacroRing consumedKcal={totals.kcal} targetKcal={target.kcal} />
            </View>
            <View style={styles.macroList}>
              <MacroBar
                label={t('diary.protein')}
                color={colors.protein}
                value={totals.proteinG}
                target={target.proteinG}
              />
              <MacroBar
                label={t('diary.carbs')}
                color={colors.carbs}
                value={totals.carbsG}
                target={target.carbsG}
              />
              <MacroBar
                label={t('diary.fat')}
                color={colors.fat}
                value={totals.fatG}
                target={target.fatG}
              />
            </View>
          </>
        ) : (
          <View style={styles.noTarget}>
            <Text style={[styles.noTargetTitle, { color: colors.text }]}>
              {t('diary.noTarget')}
            </Text>
            <Text style={[styles.noTargetHint, { color: colors.textMuted }]}>
              {t('diary.noTargetHint')}
            </Text>
          </View>
        )}

        {totals.hasIncompleteData && (
          <Text style={[styles.incomplete, { color: colors.textFaint }]}>
            {t('diary.incompleteData')}
          </Text>
        )}

        {!hasAnyEntry && (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('diary.emptyTitle')}</Text>
            <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
              {t('diary.emptyMessage')}
            </Text>
          </View>
        )}
      </View>
    </GestureDetector>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlashList
        data={items}
        keyExtractor={(item) =>
          item.kind === 'meal'
            ? `meal-${item.mealSlot}`
            : item.kind === 'add'
              ? `add-${item.mealSlot}`
              : item.entry.id
        }
        renderItem={({ item }) => {
          if (item.kind === 'meal') {
            return (
              <MealSection mealSlot={item.mealSlot} kcal={item.kcal} hasEntries={item.hasEntries} />
            );
          }
          if (item.kind === 'add') {
            return (
              <Pressable
                onPress={() => openNewFood(item.mealSlot)}
                accessibilityRole="button"
                accessibilityLabel={t('diary.addTitle')}
                style={styles.addRow}
              >
                <Text style={[styles.addLabel, { color: colors.accent }]}>
                  + {t('diary.addTitle')}
                </Text>
              </Pressable>
            );
          }
          return (
            <DiaryEntryRow
              id={item.entry.id}
              name={item.entry.foodNameSnapshot}
              amountLabel={`${formatAmount(item.entry.quantity)} ${item.entry.unit}`}
              kcal={item.entry.kcal}
              onDelete={handleDelete}
              onPress={openEdit}
            />
          );
        }}
        ListHeaderComponent={header}
        ListFooterComponent={<WaterTracker day={day} targetMl={target?.waterMl ?? null} />}
        contentContainerStyle={styles.content}
      />

      {deletedId !== null && (
        <View
          style={[
            styles.undoBanner,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.undoText, { color: colors.text }]}>{t('diary.entryDeleted')}</Text>
          <Pressable onPress={handleUndo} accessibilityRole="button" style={styles.undoButton}>
            <Text style={[styles.undoLabel, { color: colors.accent }]}>{t('common.undo')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  blocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  blockedText: { ...typography.body, textAlign: 'center' },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  navButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: typography.title,
  dateTitle: { ...typography.title, flex: 1, textAlign: 'center' },
  todayButton: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabel: typography.label,
  ringWrap: { alignItems: 'center', paddingVertical: spacing.lg },
  macroList: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
  noTarget: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xs },
  noTargetTitle: typography.label,
  noTargetHint: typography.body,
  incomplete: { ...typography.label, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  empty: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: typography.title,
  emptyMessage: typography.body,
  addRow: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  addLabel: { ...typography.label, fontWeight: '600' },
  undoBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  undoText: typography.body,
  undoButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  undoLabel: { ...typography.label, fontWeight: '600' },
});
