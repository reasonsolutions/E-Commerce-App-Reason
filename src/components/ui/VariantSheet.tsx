import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Pressable, HStack, VStack, Text, Box } from '../primitives';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';

export interface VariantOption {
  id: string;
  label: string;
  outOfStock?: boolean;
}

interface VariantSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: VariantOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

// ── Variant chip ────────────────────────────────────────────────────────────

const VariantChip: React.FC<{
  option: VariantOption;
  isSelected: boolean;
  onPress: () => void;
}> = ({ option, isSelected, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={option.outOfStock}
    style={{
      paddingHorizontal: Space[4],
      paddingVertical: Space[2] + 2,
      borderRadius: 8,
      borderWidth: isSelected ? 1.5 : 1,
      borderColor: isSelected ? Colors.ink1 : Colors.rule,
      backgroundColor: isSelected ? Colors.surface : Colors.surfaceSoft,
      minWidth: 64,
      opacity: option.outOfStock ? 0.36 : 1,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Text
      style={{
        fontFamily: 'JetBrainsMono-Regular',
        fontSize: 12,
        letterSpacing: 0.3,
        color: isSelected ? Colors.ink1 : Colors.ink2,
      }}
    >
      {option.label}
    </Text>
    {option.outOfStock && (
      <View
        style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: 0.5, backgroundColor: Colors.ink4,
          transform: [{ rotate: '-18deg' }],
        }}
      />
    )}
  </Pressable>
);

// ── VariantSheet ────────────────────────────────────────────────────────────

export const VariantSheet: React.FC<VariantSheetProps> = ({
  isOpen,
  onClose,
  title = 'Select variant',
  options,
  selectedId,
  onSelect,
}) => (
  <Modal
    visible={isOpen}
    transparent
    animationType="slide"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.backdrop} />
    </TouchableWithoutFeedback>

    <View style={styles.sheet}>
      {/* drag indicator */}
      <View style={styles.indicatorWrapper}>
        <View style={styles.indicator} />
      </View>

      <VStack style={{ width: '100%', paddingTop: Space[2], paddingBottom: Space[4], gap: Space[4] }}>
        <Text style={[Type.label, { color: Colors.ink3 }]}>{title}</Text>

        <HStack style={{ flexWrap: 'wrap', gap: Space[2] }}>
          {options.map(option => (
            <VariantChip
              key={option.id}
              option={option}
              isSelected={selectedId === option.id}
              onPress={() => {
                onSelect(option.id);
                onClose();
              }}
            />
          ))}
        </HStack>

        {selectedId ? (
          <Box style={{ paddingTop: Space[2] }}>
            <Text style={[Type.caption, { color: Colors.ink3 }]}>
              Selected: <Text style={{ color: Colors.ink1 }}>{options.find(o => o.id === selectedId)?.label}</Text>
            </Text>
          </Box>
        ) : null}
      </VStack>
    </View>
  </Modal>
);

const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Space[5],
    paddingBottom: Space[8],
    minHeight: SCREEN_H * 0.35,
  },
  indicatorWrapper: {
    width: '100%',
    paddingVertical: Space[2],
    alignItems: 'center',
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.rule,
  },
});
