import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { deleteTransaction } from '../store/database';
import { Transaction } from '../types';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onChanged: () => void;
}

export function TransactionList({ transactions, onEdit, onChanged }: Props) {
  const { t, tType, tMethod, formatAmount } = useLanguage();

  if (transactions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyText}>{t('noTransactions')}</Text>
        <Text style={styles.emptyHint}>{t('addTransactionHint')}</Text>
      </View>
    );
  }

  function handleDelete(id: string) {
    Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(id);
          onChanged();
        },
      },
    ]);
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item: tx }) => (
        <View style={styles.item}>
          <View style={styles.dayBox}>
            <Text style={styles.dayNum}>{tx.day}</Text>
            <Text style={styles.dayUnit}>{t('dayUnit')}</Text>
          </View>
          <TouchableOpacity style={styles.info} onPress={() => onEdit(tx)} activeOpacity={0.7}>
            <Text style={styles.desc} numberOfLines={1}>
              {tx.description || tType(tx.type)}
            </Text>
            <Text style={styles.meta}>
              {tType(tx.type)} · {tMethod(tx.method)}
              {tx.memo ? ` · ${tx.memo}` : ''}
            </Text>
            <Text style={styles.tapHint}>{t('tapToEdit')}</Text>
          </TouchableOpacity>
          <View style={styles.rightCol}>
            <Text
              style={[
                styles.amount,
                { color: tx.type === '지출' ? colors.expense : colors.income },
              ]}
            >
              {tx.type === '지출' ? '-' : '+'}
              {formatAmount(tx.amount)}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(tx)}>
                <Text style={styles.actionText}>{t('edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDelete(tx.id)}
              >
                <Text style={styles.deleteText}>{t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 100 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  emptyHint: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  dayBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 16, fontWeight: '700', lineHeight: 18 },
  dayUnit: { fontSize: 10, color: colors.textSecondary },
  info: { flex: 1, minWidth: 0 },
  desc: { fontSize: 14, fontWeight: '500', color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tapHint: { fontSize: 10, color: colors.primary, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { fontSize: 11, color: colors.text },
  deleteBtn: { borderColor: colors.expense },
  deleteText: { fontSize: 11, color: colors.expense },
});
