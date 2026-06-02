// Actionsheet primitive — gorhom/bottom-sheet infrastructure.
//
// Replaces the previous @gluestack-ui/actionsheet implementation which
// introduced an unstable react-aria → react-dom dependency chain incompatible
// with React Native CLI projects.
//
// This file preserves the same export surface so all consumers (VariantSheet,
// future FilterSheet, SortSheet, etc.) import from here without changes.
// Infrastructure is now @gorhom/bottom-sheet v5 — Reanimated-native,
// gesture-native, no web dependencies.

import React, { useCallback, useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet, type ViewProps, type PressableProps } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Colors, Radius, Space } from '../../theme';
import { Shadow } from '../../theme/tokens';

// ── Types ──────────────────────────────────────────────────────────────────

interface ActionsheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
}

// ── Sub-components (styled wrappers — same names as before) ────────────────

export const ActionsheetContent = React.forwardRef<View, ViewProps>(
  ({ style, children, ...props }, ref) => (
    <View
      ref={ref}
      style={[styles.content, style]}
      {...props}
    >
      {children}
    </View>
  ),
);
ActionsheetContent.displayName = 'ActionsheetContent';

export const ActionsheetDragIndicator = React.forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.dragIndicator, style]} {...props} />
  ),
);
ActionsheetDragIndicator.displayName = 'ActionsheetDragIndicator';

export const ActionsheetDragIndicatorWrapper = React.forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.dragIndicatorWrapper, style]} {...props} />
  ),
);
ActionsheetDragIndicatorWrapper.displayName = 'ActionsheetDragIndicatorWrapper';

export const ActionsheetItem = React.forwardRef<View, PressableProps>(
  ({ style, ...props }, ref) => (
    <Pressable
      ref={ref as React.Ref<View>}
      style={typeof style === 'function'
        ? (state) => [styles.item, style(state)]
        : [styles.item, style]}
      {...props}
    />
  ),
);
ActionsheetItem.displayName = 'ActionsheetItem';

export const ActionsheetItemText = React.forwardRef<
  React.ComponentRef<typeof View>,
  React.ComponentProps<typeof View>
>((props, ref) => <View ref={ref} {...props} />);
ActionsheetItemText.displayName = 'ActionsheetItemText';

// Backdrop is handled internally by gorhom — this is a no-op placeholder
// so existing consumer code (<ActionsheetBackdrop />) compiles without changes.
export const ActionsheetBackdrop: React.FC = () => null;

export const ActionsheetScrollView = BottomSheetView;

// ── Root Actionsheet ───────────────────────────────────────────────────────

export const Actionsheet: React.FC<ActionsheetProps> = ({
  isOpen,
  onClose,
  children,
  snapPoints = ['40%'],
}) => {
  const sheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.sheetInner}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.md,
  },
  handleIndicator: {
    backgroundColor: Colors.rule,
    width: 40,
    height: 4,
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: Space[5],
    paddingBottom: Space[8],
  },
  content: {
    width: '100%',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.rule,
  },
  dragIndicatorWrapper: {
    width: '100%',
    paddingVertical: Space[2],
    alignItems: 'center',
  },
  item: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Space[3] + 2,
    paddingHorizontal: Space[2],
  },
});
