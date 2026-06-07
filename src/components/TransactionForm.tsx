import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { addTransaction, updateTransaction } from '../store/database';
import {
  PAYMENT_METHODS,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '../types';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { ReceiptScanResult } from './ReceiptScanner';

interface Props {
  visible: boolean;
  year: number;
  month: number;
  day?: number;
  editing?: Transaction | null;
  prefill?: ReceiptScanResult | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TransactionForm({
  visible,
  year,
  month,
  day,
  editing,
  prefill,
  onClose,
  onSaved,
}: Props) {
  const { t, tType, tMethod } = useLanguage();
  const [type, setType] = useState<TransactionType>('지출');
  const [txYear, setTxYear] = useState(year);
  const [txMonth, setTxMonth] = useState(month);
  const [txDay, setTxDay] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>('카드');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [memo, setMemo] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | undefined>();

  const daysInMonth = new Date(txYear, txMonth, 0).getDate();

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setType(editing.type);
      setTxYear(editing.year);
      setTxMonth(editing.month);
      setTxDay(editing.day);
      setMethod(editing.method);
      setAmount(editing.amount.toString());
      setDescription(editing.description);
      setMemo(editing.memo);
      setReceiptUri(editing.receiptUri);
    } else if (prefill) {
      setType('지출');
      setTxYear(prefill.year);
      setTxMonth(prefill.month);
      setTxDay(prefill.day);
      setMethod(prefill.method);
      setAmount(prefill.amount > 0 ? prefill.amount.toString() : '');
      setDescription(prefill.description);
      setMemo(prefill.memo);
      setReceiptUri(prefill.receiptUri);
    } else {
      setType('지출');
      setTxYear(year);
      setTxMonth(month);
      setTxDay(day || 1);
      setMethod('카드');
      setAmount('');
      setDescription('');
      setMemo('');
      setReceiptUri(undefined);
    }
  }, [visible, editing, prefill, day, year, month]);

  useEffect(() => {
    if (txDay > daysInMonth) setTxDay(daysInMonth);
  }, [txYear, txMonth, daysInMonth, txDay]);

  async function handleSave() {
    const numAmount = parseInt(amount.replace(/,/g, ''), 10);
    if (!numAmount || numAmount <= 0) return;

    if (editing) {
      await updateTransaction(editing.id, {
        year: txYear,
        month: txMonth,
        day: txDay,
        type,
        method,
        amount: numAmount,
        description,
        memo,
        receiptUri,
      });
    } else {
      await addTransaction({
        year: txYear,
        month: txMonth,
        day: txDay,
        type,
        method,
        amount: numAmount,
        description,
        memo,
        receiptUri,
      });
    }
    onSaved();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <ScrollView>
            <Text style={styles.title}>
              {editing ? t('editTransaction') : prefill ? t('receiptRegister') : t('addTransaction')}
            </Text>
            {prefill && !editing && (
              <Text style={styles.prefillHint}>{t('receiptPrefillHint')}</Text>
            )}

            <Text style={styles.label}>{t('type')}</Text>
            <View style={styles.typeRow}>
              {(['지출', '수입'] as TransactionType[]).map((txType) => (
                <TouchableOpacity
                  key={txType}
                  style={[
                    styles.typeBtn,
                    type === txType && (txType === '지출' ? styles.typeExpense : styles.typeIncome),
                  ]}
                  onPress={() => setType(txType)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      type === txType && (txType === '지출' ? styles.typeTextActive : styles.typeTextActiveIncome),
                    ]}
                  >
                    {tType(txType)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('year')}</Text>
            <TextInput
              style={styles.input}
              value={txYear.toString()}
              onChangeText={(v) => setTxYear(parseInt(v, 10) || txYear)}
              keyboardType="numeric"
            />

            <Text style={styles.label}>{t('month')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, txMonth === m && styles.chipActive]}
                  onPress={() => setTxMonth(m)}
                >
                  <Text style={[styles.chipText, txMonth === m && styles.chipTextActive]}>
                    {m}{t('month')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t('day')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, txDay === d && styles.chipActive]}
                  onPress={() => setTxDay(d)}
                >
                  <Text style={[styles.chipText, txDay === d && styles.chipTextActive]}>
                    {d}{t('dayUnit')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t('paymentMethod')}</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodChip, method === m && styles.methodChipActive]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[styles.methodText, method === m && styles.methodTextActive]}>
                    {tMethod(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('amount')}</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder={t('amountPlaceholder')}
              keyboardType="numeric"
            />

            <Text style={styles.label}>{t('description')}</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder={t('descriptionPlaceholder')}
            />

            <Text style={styles.label}>{t('memo')}</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={memo}
              onChangeText={setMemo}
              placeholder={t('memoPlaceholder')}
              multiline
            />

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose}>
                <Text style={styles.btnOutlineText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSave}>
                <Text style={styles.btnPrimaryText}>{editing ? t('edit') : t('save')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '92%',
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: colors.text },
  prefillHint: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 12,
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeExpense: { borderColor: colors.expense, backgroundColor: '#FEF2F2' },
  typeIncome: { borderColor: colors.income, backgroundColor: '#ECFDF5' },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.text },
  typeTextActive: { color: colors.expense },
  typeTextActiveIncome: { color: colors.income },
  chipScroll: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  methodChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { fontSize: 12, color: colors.text },
  methodTextActive: { color: '#fff', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 20 },
  btn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnOutline: { borderWidth: 1, borderColor: colors.border },
  btnOutlineText: { fontSize: 14, fontWeight: '600', color: colors.text },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
