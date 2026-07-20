import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';

interface SectionHeadProps {
  eyebrow?: string;
  title: string;
  note?: string;
  action?: string;
  onAction?: () => void;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
}

export const SectionHead: React.FC<SectionHeadProps> = ({
  eyebrow, title, note, action, onAction, secondaryAction, onSecondaryAction,
}) => (
  <View style={[styles.row, note ? styles.rowWithNote : null]}>
    <View style={styles.left}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {note ? <Text style={styles.note} numberOfLines={2}>{note}</Text> : null}
    </View>
    <View style={styles.actions}>
      {secondaryAction && onSecondaryAction ? (
        <TouchableOpacity
          onPress={onSecondaryAction}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.secondaryActionText}>{secondaryAction}</Text>
        </TouchableOpacity>
      ) : null}
      {action && onAction ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onAction}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.actionText}>{action}</Text>
          <Icon name="arrow-forward" size={14} color={Colors.heroLink} />
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    marginBottom:      10,
    gap:               Space[3],
  },
  rowWithNote: {
    alignItems: 'flex-start',
  },
  left: {
    flex:    1,
    minWidth: 0,
    gap:     2,
  },
  eyebrow: {
    ...Type.label,
    color:         Colors.heroKicker,
    letterSpacing: 2,
  },
  note: {
    ...Type.caption,
    color:      Colors.heroInkMuted,
    fontStyle:  'italic',
    lineHeight: 16,
    marginTop:  2,
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    '600',
    color:         Colors.heroInk,
    letterSpacing: 0.1,
    lineHeight:    26,
  },
  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[4],
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
    color:      Colors.heroLink,
  },
  secondaryActionText: {
    ...Type.caption,
    color: Colors.heroInkMuted,
  },
});
