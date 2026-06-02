import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';

interface DeptFooterProps {
  categoryCount: number;
  onPress: () => void;
}

export const DeptFooter: React.FC<DeptFooterProps> = ({ categoryCount, onPress }) => (
  <View style={styles.wrap}>
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.left}>
        <Text style={styles.title}>Browse all departments</Text>
        <Text style={styles.sub}>{categoryCount} categories · updated daily</Text>
      </View>
      <View style={styles.circle}>
        <Icon name="arrow-forward" size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[8],
    paddingBottom:     Space[10],
  },
  card: {
    backgroundColor:  Colors.ink1,
    borderRadius:     Radius.lg,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    padding:          Space[5],
    gap:              Space[4],
  },
  left: {
    flex: 1,
    gap:  Space[2],
  },
  title: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      20,
    fontWeight:    '500',
    color:         '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight:    22,
  },
  sub: {
    ...Type.caption,
    color:         'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
  },
  circle: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: Colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
});
