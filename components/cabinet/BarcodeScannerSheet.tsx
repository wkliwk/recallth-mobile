import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { lookupBarcode, type BarcodeProduct } from '../../services/barcode';

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult: (product: BarcodeProduct) => void;
}

export function BarcodeScannerSheet({ visible, onClose, onResult }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [looking, setLooking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const lastScanned = useRef<string | null>(null);

  useEffect(() => {
    if (visible) {
      setScanning(true);
      setLooking(false);
      setNotFound(false);
      lastScanned.current = null;
    }
  }, [visible]);

  const handleBarcode = useCallback(
    async ({ data }: { data: string }) => {
      if (!scanning || looking || data === lastScanned.current) return;
      lastScanned.current = data;
      setLooking(true);
      setNotFound(false);

      const product = await lookupBarcode(data);
      if (product) {
        setLooking(false);
        onResult(product);
        onClose();
      } else {
        setLooking(false);
        setNotFound(true);
        setScanning(false);
      }
    },
    [scanning, looking, onResult, onClose],
  );

  const retry = useCallback(() => {
    setScanning(true);
    setNotFound(false);
    lastScanned.current = null;
  }, []);

  if (!visible) return null;

  // Permission not yet determined — request it.
  if (!permission) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {permission.granted ? (
          <>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8'] }}
              onBarcodeScanned={scanning ? handleBarcode : undefined}
            />
            {/* Overlay */}
            <View style={styles.overlay}>
              <View style={styles.topRegion} />
              <View style={styles.middleRow}>
                <View style={styles.sideRegion} />
                <View style={styles.scanWindow}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <View style={styles.sideRegion} />
              </View>
              <View style={styles.bottomRegion}>
                {looking && (
                  <View style={styles.statusRow}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.statusText}>Looking up product…</Text>
                  </View>
                )}
                {notFound && (
                  <View style={styles.notFoundBox}>
                    <Text style={styles.notFoundTitle}>Product not found</Text>
                    <Text style={styles.notFoundBody}>Enter the supplement name manually, or try scanning again.</Text>
                    <Pressable
                      onPress={retry}
                      style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
                      accessibilityRole="button"
                      accessibilityLabel="Scan again"
                    >
                      <Text style={styles.retryBtnText}>Scan again</Text>
                    </Pressable>
                  </View>
                )}
                {!looking && !notFound && (
                  <Text style={styles.hintText}>Align barcode within the frame</Text>
                )}
              </View>
            </View>
            {/* Close button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </>
        ) : permission.canAskAgain ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permTitle}>Camera access needed</Text>
            <Text style={styles.permBody}>
              Recallth uses your camera to scan supplement barcodes and auto-fill the form.
            </Text>
            <Pressable
              onPress={() => void requestPermission()}
              style={({ pressed }) => [styles.permBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Grant camera access"
            >
              <Text style={styles.permBtnText}>Grant access</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Not now</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permTitle}>Camera access denied</Text>
            <Text style={styles.permBody}>
              Enable camera access in Settings to scan barcodes.
            </Text>
            <Pressable
              onPress={() => void Linking.openSettings()}
              style={({ pressed }) => [styles.permBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Open Settings"
            >
              <Text style={styles.permBtnText}>Open Settings</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const SCAN_WINDOW = 240;
const CORNER = 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  topRegion: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_WINDOW,
  },
  sideRegion: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanWindow: {
    width: SCAN_WINDOW,
    height: SCAN_WINDOW,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#fff',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  bottomRegion: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  hintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  notFoundBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 300,
  },
  notFoundTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  notFoundBody: {
    ...typography.bodySmall,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  retryBtnText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 24,
    right: spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionBox: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  permTitle: {
    ...typography.pageTitle,
    color: colors.text,
    textAlign: 'center',
  },
  permBody: {
    ...typography.body,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 22,
  },
  permBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 52,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permBtnText: {
    ...typography.cta,
    color: '#fff',
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    ...typography.body,
    color: colors.text3,
  },
});
