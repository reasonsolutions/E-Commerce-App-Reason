import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';
import { RetryButton } from './RetryButton';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLoading?: boolean;
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLoading = false,
  icon,
}) => (
  <View style={styles.wrap}>
    {icon ?? <Icon name="cloud-offline-outline" size={32} color={Colors.ink4} />}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry ? (
      <View style={styles.retrySlot}>
        <RetryButton onPress={onRetry} loading={retryLoading} />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Space[6],
    paddingVertical: Space[8],
    gap: Space[3],
  },
  title: {
    ...Type.title,
    textAlign: 'center',
  },
  message: {
    ...Type.caption,
    textAlign: 'center',
    maxWidth: 280,
  },
  retrySlot: {
    marginTop: Space[2],
  },
});
