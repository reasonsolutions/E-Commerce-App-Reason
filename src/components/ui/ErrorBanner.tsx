import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme/tokens';
import { Type } from '../../theme/typography';

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
        color={Colors.ink3}
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
    backgroundColor:  Colors.surfaceDeep,
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
    ...Type.captionStrong,
    color: Colors.ink1,
  },
  body: {
    ...Type.caption,
    marginTop: 2,
  },
  retryBtn: {
    paddingVertical:   6,
    paddingHorizontal: Space[3],
    borderRadius:      Radius.pill,
    borderWidth:       1,
    borderColor:       Colors.rule,
  },
  retryLabel: {
    ...Type.caption,
    color: Colors.ink1,
  },
});
