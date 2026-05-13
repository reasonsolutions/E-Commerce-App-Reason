import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Space, Radius } from '../../theme/tokens';
import { Type } from '../../theme/typography';

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
    backgroundColor: Colors.surfaceSoft,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title: {
    ...Type.title,
    textAlign: 'center',
  },
  body: {
    ...Type.caption,
    textAlign: 'center',
    maxWidth:  280,
  },
  actionSlot: {
    marginTop: Space[2],
  },
});
