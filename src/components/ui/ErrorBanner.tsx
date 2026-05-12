import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius, FontSize, FontWeight } from '../../theme/tokens';

interface ErrorBannerProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = "Couldn't load",
  body,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <Icon
        name="alert-circle-outline"
        size={20}
        color={Colors.danger}
        style={styles.icon}
      />

      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>

      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryBtn}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={styles.retryLabel}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:    'row',
    alignItems:       'flex-start',
    margin:           Space.screenH,
    padding:          Space[3],
    borderRadius:     Radius.md,
    backgroundColor:  Colors.dangerTint,
    borderWidth:      1,
    borderColor:      Colors.dangerBorder,
    gap: Space[3],
  },
  icon: {
    marginTop: 2,
  },
  text: {
    flex:     1,
    minWidth: 0,
  },
  title: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    color:      Colors.ink1,
  },
  body: {
    fontSize:   FontSize.xs,
    fontWeight: '400',
    color:      Colors.ink2,
    marginTop:  2,
    lineHeight: FontSize.xs * 1.45,
  },
  retryBtn: {
    paddingVertical:  6,
    paddingHorizontal: Space[3],
    borderRadius:     Radius.pill,
    borderWidth:      1,
    borderColor:      Colors.ink1,
  },
  retryLabel: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.semibold,
    color:      Colors.ink1,
  },
});
