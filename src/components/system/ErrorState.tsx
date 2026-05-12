import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius, FontSize, FontWeight } from '../../theme';
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
    <View style={styles.iconWrap}>
      {icon ?? <Icon name="cloud-offline-outline" size={32} color={Colors.ink3} />}
    </View>
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
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink1,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.ink3,
    lineHeight: FontSize.sm * 1.45,
    textAlign: 'center',
    maxWidth: 280,
  },
  retrySlot: {
    marginTop: Space[2],
  },
});
