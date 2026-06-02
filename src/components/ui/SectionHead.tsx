import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';

interface SectionHeadProps {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}

export const SectionHead: React.FC<SectionHeadProps> = ({ eyebrow, title, action, onAction }) => (
  <View style={styles.row}>
    <View style={styles.left}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
    </View>
    {action && onAction ? (
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onAction}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.actionText}>{action}</Text>
        <Icon name="arrow-forward" size={14} color={Colors.ink3} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    marginBottom:      Space[4] - 2,
    gap:               Space[3],
  },
  left: {
    flex:    1,
    minWidth: 0,
    gap:     5,
  },
  eyebrow: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 2,
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      25,
    fontWeight:    '600',
    color:         Colors.ink1,
    letterSpacing: 0.1,
    lineHeight:    25,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    paddingBottom: 2,
  },
  actionText: {
    ...Type.caption,
    fontWeight: '600',
    color:      Colors.ink3,
  },
});
