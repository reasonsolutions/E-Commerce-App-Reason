import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius, FontSize, FontWeight } from '../../theme';
import { RetryButton } from './RetryButton';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  retryLoading?: boolean;
}

/** @deprecated Use ErrorBanner (already adopted in ProductScreen). Extend ErrorBanner with onRetry if inline-retry is needed. */
export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  onRetry,
  retryLoading = false,
}) => (
  <View style={styles.wrap}>
    <Icon name="alert-circle-outline" size={16} color={Colors.danger} />
    <Text style={styles.message}>{message}</Text>
    {onRetry ? (
      <RetryButton onPress={onRetry} loading={retryLoading} label="Retry" />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
    backgroundColor: Colors.dangerTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.md,
    paddingVertical: Space[3],
    paddingHorizontal: Space[4],
    flexWrap: 'wrap',
  },
  message: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.danger,
    lineHeight: FontSize.sm * 1.4,
  },
});
