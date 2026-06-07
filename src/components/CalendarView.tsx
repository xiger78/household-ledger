import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  getDailySummaries,
  getTransactionsByDay,
} from '../store/database';
import { getWeekday } from '../utils/date';
import { Transaction } from '../types';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  year: number;
  month: number;
  selectedDay?: number;
  onSelectDay: (day: number) => void;
  onEditTransaction: (tx: Transaction) => void;
}

const WEEKDAY_HEADERS = ['日', '月', '火', '水', '木', '金', '土'];

export function CalendarView({ year, month, selectedDay, onSelectDay, onEditTransaction }: Props) {
  const { t, tType, tMethod, formatAmount } = useLanguage();
  const summaries = getDailySummaries(year, month);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  const cells: (typeof summaries[0] | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  summaries.forEach((s) => cells.push(s));
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedSummary = selectedDay
    ? summaries.find((s) => s.day === selectedDay)
    : null;
  const dayTransactions = selectedDay
    ? getTransactionsByDay(year, month, selectedDay)
    : [];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.grid}>
          {WEEKDAY_HEADERS.map((d) => (
            <Text key={d} style={styles.header}>
              {d}
            </Text>
          ))}
          {cells.map((cell, i) => {
            if (!cell) {
              return <View key={`e-${i}`} style={styles.emptyCell} />;
            }
            const isToday = isCurrentMonth && cell.day === today.getDate();
            const isSelected = selectedDay === cell.day;
            return (
              <TouchableOpacity
                key={cell.day}
                style={[
                  styles.dayCell,
                  cell.dayType === '休' && styles.restDay,
                  isToday && styles.today,
                  isSelected && styles.selected,
                ]}
                onPress={() => onSelectDay(cell.day)}
              >
                <Text style={[styles.dayNum, isSelected && styles.selectedText]}>
                  {cell.day}
                </Text>
                {cell.actualExpense > 0 && (
                  <Text style={[styles.expenseTag, isSelected && styles.selectedExpense]}>
                    {(cell.actualExpense / 1000).toFixed(0)}k
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedSummary && selectedDay && (
        <View style={styles.card}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>
              {t('dateFormat', {
                month,
                day: selectedDay,
                weekday: getWeekday(year, month, selectedDay),
              })}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    selectedSummary.dayType === '勤' ? colors.workBadge : colors.restBadge,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    selectedSummary.dayType === '勤' ? colors.workText : colors.restText,
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {selectedSummary.dayType}
              </Text>
            </View>
          </View>

          <View style={styles.miniGrid}>
            <View style={styles.miniItem}>
              <Text style={styles.miniLabel}>{t('expectedExpense')}</Text>
              <Text style={styles.miniValue}>{formatAmount(selectedSummary.expectedExpense)}</Text>
            </View>
            <View style={styles.miniItem}>
              <Text style={styles.miniLabel}>{t('actualExpense')}</Text>
              <Text style={[styles.miniValue, { color: colors.expense }]}>
                {formatAmount(selectedSummary.actualExpense)}
              </Text>
            </View>
            <View style={styles.miniItem}>
              <Text style={styles.miniLabel}>{t('actualIncome')}</Text>
              <Text style={[styles.miniValue, { color: colors.income }]}>
                {formatAmount(selectedSummary.actualIncome)}
              </Text>
            </View>
          </View>

          {dayTransactions.length > 0 ? (
            dayTransactions.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={styles.txRow}
                onPress={() => onEditTransaction(tx)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{tx.description || tType(tx.type)}</Text>
                  <Text style={styles.txMeta}>
                    {tType(tx.type)} · {tMethod(tx.method)}
                    {tx.memo ? ` · ${tx.memo}` : ''}
                  </Text>
                  <Text style={styles.tapHint}>{t('tapToEdit')}</Text>
                </View>
                <Text
                  style={{
                    fontWeight: '700',
                    color: tx.type === '지출' ? colors.expense : colors.income,
                  }}
                >
                  {tx.type === '지출' ? '-' : '+'}
                  {formatAmount(tx.amount)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noData}>{t('noDayTransactions')}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  header: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingVertical: 8,
  },
  emptyCell: { width: '14.28%', aspectRatio: 1 },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.bg,
    marginBottom: 2,
  },
  restDay: {},
  today: { borderWidth: 2, borderColor: colors.primary },
  selected: { backgroundColor: colors.primary },
  dayNum: { fontSize: 13, fontWeight: '600', color: colors.text },
  selectedText: { color: '#fff' },
  expenseTag: { fontSize: 8, color: colors.expense },
  selectedExpense: { color: '#fecaca' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  miniGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  miniItem: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  miniLabel: { fontSize: 11, color: colors.textSecondary },
  miniValue: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  txDesc: { fontSize: 14, fontWeight: '500' },
  txMeta: { fontSize: 12, color: colors.textSecondary },
  tapHint: { fontSize: 10, color: colors.primary, marginTop: 2 },
  noData: { textAlign: 'center', color: colors.textSecondary, padding: 16 },
});
