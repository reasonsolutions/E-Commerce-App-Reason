import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, FontSize, FontWeight } from '../../theme/tokens';

interface SectionAction {
  label: string;
  onPress: () => void;
}

interface SectionLabelProps {
  children: React.ReactNode;
  kicker?: string;
  action?: SectionAction;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  kicker,
  action,
}) => {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.heading}>{children}</Text>
      </View>

      {action ? (
        <TouchableOpacity
          onPress={action.onPress}
          style={styles.actionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
        >
          <Text style={styles.actionLabel}>{action.label}</Text>
          <Icon name="chevron-forward" size={14} color={Colors.accent} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Space.screenH,
    marginBottom:   Space[3],
  },
  left: {
    flex: 1,
  },
  kicker: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.semibold,
    color:         Colors.ink3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  heading: {
    fontSize:      FontSize.lg,
    fontWeight:    FontWeight.semibold,
    letterSpacing: -0.4,
    color:         Colors.ink1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap: 2,
  },
  actionLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
    color:      Colors.accent,
  },
});
