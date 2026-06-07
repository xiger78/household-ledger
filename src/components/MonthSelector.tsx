import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSelector({ year, month, onPrev, onNext }: Props) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={onPrev}>
        <Text style={styles.btnText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.label}>{t('monthFormat', { year, month })}</Text>
      <TouchableOpacity style={styles.btn} onPress={onNext}>
        <Text style={styles.btnText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 20, color: colors.text },
  label: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 140,
    textAlign: 'center',
    color: colors.text,
  },
});
