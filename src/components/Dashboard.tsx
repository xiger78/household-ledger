import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getMonthSummary, getTransactionsByMonth } from '../store/database';
import { PaymentMethod } from '../types';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  year: number;
  month: number;
}

export function Dashboard({ year, month }: Props) {
  const { t, tMethod, formatAmount } = useLanguage();
  const summary = getMonthSummary(year, month);
  const transactions = getTransactionsByMonth(year, month);

  const methodTotals: Record<string, number> = {};
  transactions
    .filter((tx) => tx.type === '지출')
    .forEach((tx) => {
      methodTotals[tx.method] = (methodTotals[tx.method] || 0) + tx.amount;
    });

  const topMethods = Object.entries(methodTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyExpense: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayTotal = transactions
      .filter((tx) => tx.day === d && tx.type === '지출')
      .reduce((sum, tx) => sum + tx.amount, 0);
    dailyExpense.push(dayTotal);
  }
  const maxExpense = Math.max(...dailyExpense, 1);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('monthSummary', { month })}</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('expense')}</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              {formatAmount(summary.totalExpense)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('income')}</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              {formatAmount(summary.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('balance')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {formatAmount(summary.balance)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('dailyExpenseChart')}</Text>
        <View style={styles.chart}>
          {dailyExpense.map((amount, i) => (
            <View key={i} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max((amount / maxExpense) * 80, 2) },
                ]}
              />
              <Text style={styles.barLabel}>{i + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      {topMethods.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('expenseByMethod')}</Text>
          {topMethods.map(([method, total]) => (
            <View key={method} style={styles.methodRow}>
              <Text style={styles.methodName}>{tMethod(method as PaymentMethod)}</Text>
              <Text style={styles.methodAmount}>{formatAmount(total)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('monthSchedule')}</Text>
        <View style={styles.scheduleRow}>
          <View style={[styles.badge, { backgroundColor: colors.workBadge }]}>
            <Text style={[styles.badgeText, { color: colors.workText }]}>
              {t('workDays', { count: summary.workDays })}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.restBadge }]}>
            <Text style={[styles.badgeText, { color: colors.restText }]}>
              {t('restDays', { count: summary.restDays })}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 2 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '100%', backgroundColor: colors.expense, borderRadius: 2 },
  barLabel: { fontSize: 8, color: colors.textSecondary, marginTop: 4 },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  methodName: { fontSize: 14, color: colors.text },
  methodAmount: { fontSize: 14, fontWeight: '600', color: colors.expense },
  scheduleRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: '600' },
});
