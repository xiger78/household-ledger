import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addTransaction } from '../store/database';
import { ParsedReceipt } from '../utils/receiptParser';
import { recognizeReceipt, saveReceiptImage } from '../utils/receiptOcr';
import { colors } from '../theme';
import { PaymentMethod } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  visible: boolean;
  defaultYear: number;
  defaultMonth: number;
  defaultDay?: number;
  onClose: () => void;
  onSaved: () => void;
  onEdit: (data: ReceiptScanResult) => void;
}

export interface ReceiptScanResult {
  amount: number;
  year: number;
  month: number;
  day: number;
  description: string;
  method: PaymentMethod;
  memo: string;
  receiptUri?: string;
}

export function ReceiptScanner({
  visible,
  defaultYear,
  defaultMonth,
  defaultDay,
  onClose,
  onSaved,
  onEdit,
}: Props) {
  const { t, tMethod, formatAmount, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    uri: string;
    parsed: ParsedReceipt;
    savedUri?: string;
  } | null>(null);

  async function requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('cameraPermission'), t('cameraPermissionMsg'));
      return false;
    }
    return true;
  }

  async function captureReceipt(useCamera: boolean) {
    if (useCamera) {
      const ok = await requestCameraPermission();
      if (!ok) return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 1,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
          allowsEditing: true,
        });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setLoading(true);
    try {
      const uri = result.assets[0].uri;
      const savedUri = await saveReceiptImage(uri);
      const parsed = await recognizeReceipt(uri, language);

      if (!parsed.amount) {
        Alert.alert(
          t('amountNotFound'),
          t('amountNotFoundMsg'),
          [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('manualInput'),
              onPress: () => {
                onEdit({
                  amount: 0,
                  year: parsed.year || defaultYear,
                  month: parsed.month || defaultMonth,
                  day: parsed.day || defaultDay || new Date().getDate(),
                  description: parsed.description,
                  method: parsed.method,
                  memo: `영수증 OCR\n${parsed.category}`,
                  receiptUri: savedUri,
                });
                onClose();
              },
            },
          ]
        );
        return;
      }

      setPreview({ uri, parsed, savedUri });
    } catch (err) {
      Alert.alert(
        t('ocrError'),
        err instanceof Error ? err.message : t('ocrError')
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoSave() {
    if (!preview?.parsed.amount) return;

    const { parsed, savedUri } = preview;
    const amount = parsed.amount!;
    await addTransaction({
      year: parsed.year || defaultYear,
      month: parsed.month || defaultMonth,
      day: parsed.day || defaultDay || new Date().getDate(),
      type: '지출',
      method: parsed.method,
      amount,
      description: parsed.description,
      memo: `영수증 자동등록 · ${parsed.category}`,
      receiptUri: savedUri,
    });

    setPreview(null);
    onSaved();
    onClose();
    Alert.alert(t('registerComplete'), `${parsed.description}\n${formatAmount(amount)}`);
  }

  function handleEditBeforeSave() {
    if (!preview?.parsed.amount) return;
    const { parsed, savedUri } = preview;
    const amount = parsed.amount!;
    onEdit({
      amount,
      year: parsed.year || defaultYear,
      month: parsed.month || defaultMonth,
      day: parsed.day || defaultDay || new Date().getDate(),
      description: parsed.description,
      method: parsed.method,
      memo: `영수증 OCR · ${parsed.category}`,
      receiptUri: savedUri,
    });
    setPreview(null);
    onClose();
  }

  function handleClose() {
    setPreview(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('analyzing')}</Text>
            </View>
          ) : preview ? (
            <ScrollView>
              <Text style={styles.title}>{t('scanResult')}</Text>
              <Image source={{ uri: preview.uri }} style={styles.previewImage} />
              <View style={styles.resultCard}>
                <ResultRow label={t('store')} value={preview.parsed.description} />
                <ResultRow
                  label={t('amount')}
                  value={preview.parsed.amount ? formatAmount(preview.parsed.amount) : '-'}
                  highlight
                />
                <ResultRow
                  label={t('date')}
                  value={`${t('monthFormat', { year: preview.parsed.year, month: preview.parsed.month })} ${preview.parsed.day}${t('dayUnit')}`}
                />
                <ResultRow label={t('payment')} value={tMethod(preview.parsed.method)} />
                <ResultRow label={t('category')} value={preview.parsed.category} />
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={handleClose}>
                  <Text style={styles.btnOutlineText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={handleEditBeforeSave}>
                  <Text style={styles.btnOutlineText}>{t('editThenSave')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleAutoSave}>
                  <Text style={styles.btnPrimaryText}>{t('autoRegister')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <>
              <Text style={styles.title}>{t('receiptScan')}</Text>
              <Text style={styles.desc}>{t('receiptScanDesc')}</Text>
              <TouchableOpacity
                style={styles.optionBtn}
                onPress={() => captureReceipt(true)}
              >
                <Text style={styles.optionIcon}>📷</Text>
                <Text style={styles.optionText}>{t('cameraCapture')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionBtn}
                onPress={() => captureReceipt(false)}
              >
                <Text style={styles.optionIcon}>🖼️</Text>
                <Text style={styles.optionText}>{t('gallerySelect')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelText}>{t('close')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ResultRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, highlight && { color: colors.expense, fontWeight: '700' }]}>
        {value}
      </Text>
    </View>
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
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  desc: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.bg,
    marginBottom: 10,
    gap: 12,
  },
  optionIcon: { fontSize: 28 },
  optionText: { fontSize: 16, fontWeight: '600', color: colors.text },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 8 },
  cancelText: { fontSize: 14, color: colors.textSecondary },
  loadingBox: { alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 15, color: colors.textSecondary },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: colors.bg,
  },
  resultCard: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultLabel: { fontSize: 14, color: colors.textSecondary },
  resultValue: { fontSize: 14, color: colors.text },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnOutline: { borderWidth: 1, borderColor: colors.border },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: colors.text },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
