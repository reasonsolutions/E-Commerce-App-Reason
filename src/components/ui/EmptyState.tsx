import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Space, Radius, FontSize, FontWeight } from '../../theme/tokens';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  body,
  action,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action ? <View style={styles.actionSlot}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Space[6],
    paddingVertical:   Space[8],
    gap: Space[3],
  },
  iconWrap: {
    width:           64,
    height:          64,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title: {
    fontSize:      FontSize.lg,
    fontWeight:    FontWeight.semibold,
    letterSpacing: -0.2,
    color:         Colors.ink1,
    textAlign:     'center',
  },
  body: {
    fontSize:   FontSize.sm,
    fontWeight: '400',
    color:      Colors.ink3,
    lineHeight: FontSize.sm * 1.45,
    textAlign:  'center',
    maxWidth:   280,
  },
  actionSlot: {
    marginTop: Space[2],
  },
});
