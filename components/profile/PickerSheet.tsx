import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';

interface Option {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function PickerSheet({ visible, title, options, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map((opt, i) => {
            const isSelected = opt.value === selected;
            return (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.option,
                  i < options.length - 1 && styles.optionBorder,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={opt.label}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt.label}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            );
          })}
          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.sm,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    // no background change — checkmark handles it
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
});
