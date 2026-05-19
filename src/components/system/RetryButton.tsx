import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Space, Radius, FontSize, FontWeight } from '../../theme';

interface RetryButtonProps {
  onPress: () => void;
  loading?: boolean;
  label?: string;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onPress,
  loading = false,
  label = 'Try again',
}) => (
  <TouchableOpacity
    style={styles.btn}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.75}
  >
    {loading ? (
      <ActivityIndicator size="small" color={Colors.accentInk} />
    ) : (
      <Text style={styles.label}>{label}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Space[3],
    paddingHorizontal: Space[5],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 44,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accentInk,
    letterSpacing: 0.1,
  },
});
