import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../theme/colors';

interface SignaturePadModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialSvgPath?: string;
  primaryActionLabel: string;
  onClose: () => void;
  onConfirm: (svgPath: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  visible,
  title,
  subtitle,
  initialSvgPath = '',
  primaryActionLabel,
  onClose,
  onConfirm,
}) => {
  const [paths, setPaths] = useState<string[]>(initialSvgPath ? [initialSvgPath] : []);
  const currentPathRef = useRef<string>('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setPaths((prev) => [...prev, currentPathRef.current]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setPaths((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = currentPathRef.current;
          return copy;
        });
      },
    })
  ).current;

  const handleClear = () => {
    currentPathRef.current = '';
    setPaths([]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.padLabelRow}>
            <Text style={styles.padLabel}>✍️ Draw Handover Signature Below</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear Pad</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.canvasBox} {...panResponder.panHandlers}>
            <Svg width="100%" height="130">
              {paths.map((d, idx) => (
                <Path
                  key={idx}
                  d={d}
                  stroke={COLORS.crimsonPrimary}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </Svg>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => onConfirm(paths.join(' '))}
          >
            <Text style={styles.confirmBtnTxt}>{primaryActionLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  padLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  padLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.crimsonPrimary,
  },
  canvasBox: {
    height: 130,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFBEB',
    overflow: 'hidden',
    marginBottom: 14,
  },
  confirmBtn: {
    backgroundColor: COLORS.crimsonPrimary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
