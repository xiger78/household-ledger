import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  getHolidays,
  getSettings,
  getTransactions,
  importFromExcelData,
  resetData,
  updateSavingsPlan,
  updateSettings,
} from '../store/database';
import { exportToExcel, importFromExcelUri } from '../utils/excel';
import { Language } from '../types';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onChanged: () => void;
}

const LANGUAGES: { code: Language; labelKey: 'languageKo' | 'languageJa' | 'languageEn' }[] = [
  { code: 'ko', labelKey: 'languageKo' },
  { code: 'ja', labelKey: 'languageJa' },
  { code: 'en', labelKey: 'languageEn' },
];

export function SettingsView({ onChanged }: Props) {
  const { t, language, setLanguage, formatAmount } = useLanguage();
  const settings = getSettings();
  const [weekdayExpense, setWeekdayExpense] = useState(settings.weekdayExpense.toString());
  const [holidayExpense, setHolidayExpense] = useState(settings.holidayExpense.toString());
  const [salary, setSalary] = useState(settings.savingsPlan.salary.toString());
  const [bonus, setBonus] = useState(settings.savingsPlan.bonus.toString());
  const [fixedCost, setFixedCost] = useState(settings.savingsPlan.fixedCost.toString());
  const [rent, setRent] = useState(settings.savingsPlan.rent.toString());

  async function handleLanguageChange(lang: Language) {
    await setLanguage(lang);
    onChanged();
  }

  async function handleSaveSettings() {
    await updateSettings({
      weekdayExpense: parseInt(weekdayExpense, 10) || 1000,
      holidayExpense: parseInt(holidayExpense, 10) || 5000,
    });
    await updateSavingsPlan({
      salary: parseInt(salary, 10) || 0,
      bonus: parseInt(bonus, 10) || 0,
      fixedCost: parseInt(fixedCost, 10) || 0,
      rent: parseInt(rent, 10) || 0,
    });
    Alert.alert(t('saveSettings'), t('settingsSaved'));
    onChanged();
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const importResult = await importFromExcelUri(result.assets[0].uri);
      await importFromExcelData(
        importResult.transactions,
        importResult.holidays,
        importResult.settings
      );
      Alert.alert(
        t('importComplete'),
        t('importResult', { count: importResult.transactions.length, months: importResult.monthCount })
      );
      onChanged();
    } catch {
      Alert.alert(t('error'), t('excelReadError'));
    }
  }

  async function handleExport() {
    try {
      await exportToExcel(getTransactions(), getHolidays(), getSettings());
    } catch {
      Alert.alert(t('error'), t('excelExportError'));
    }
  }

  function handleReset() {
    Alert.alert(t('resetConfirmTitle'), t('resetConfirmMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('resetData'),
        style: 'destructive',
        onPress: async () => {
          await resetData();
          await setLanguage('ko');
          Alert.alert(t('resetConfirmTitle'), t('resetComplete'));
          onChanged();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settingsLanguage')}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langBtn, language === lang.code && styles.langBtnActive]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                {t(lang.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('excelSync')}</Text>
        <Text style={styles.desc}>{t('excelSyncDesc')}</Text>
        <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
          <Text style={styles.importText}>{t('excelImport')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportText}>{t('excelExport')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('expectedExpenseSettings')}</Text>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('weekdayLabel')}</Text>
            <TextInput
              style={styles.input}
              value={weekdayExpense}
              onChangeText={setWeekdayExpense}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('holidayLabel')}</Text>
            <TextInput
              style={styles.input}
              value={holidayExpense}
              onChangeText={setHolidayExpense}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('savingsPlan')}</Text>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('salary')}</Text>
            <TextInput style={styles.input} value={salary} onChangeText={setSalary} keyboardType="numeric" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('bonus')}</Text>
            <TextInput style={styles.input} value={bonus} onChangeText={setBonus} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('fixedCost')}</Text>
            <TextInput style={styles.input} value={fixedCost} onChangeText={setFixedCost} keyboardType="numeric" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('rent')}</Text>
            <TextInput style={styles.input} value={rent} onChangeText={setRent} keyboardType="numeric" />
          </View>
        </View>
        <Text style={styles.hint}>
          {t('monthlyFixed')}: {formatAmount((parseInt(fixedCost, 10) || 0) + (parseInt(rent, 10) || 0))}
        </Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
        <Text style={styles.saveText}>{t('saveSettings')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetText}>{t('resetData')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { fontSize: 14, fontWeight: '600', color: colors.text },
  langTextActive: { color: '#fff' },
  desc: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  importBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  importText: { fontSize: 14, color: colors.textSecondary },
  exportBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  exportText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  hint: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  resetBtn: {
    backgroundColor: colors.expense,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  resetText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
