import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';

interface DarkHeaderProps {
  eyebrow: string;
  title: string;
  titleFont?: 'serif' | 'mono';
  onBack: () => void;
  rightSlot?: React.ReactNode;
  paddingTop: number;
}

export const DarkHeader: React.FC<DarkHeaderProps> = ({
  eyebrow,
  title,
  titleFont = 'serif',
  onBack,
  rightSlot,
  paddingTop,
}) => (
  <View style={[styles.header, { paddingTop }]}>
    <View style={styles.headerRow}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Icon name="chevron-back" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.headerTitleBlock}>
        <Text style={styles.headerEyebrow}>{eyebrow}</Text>
        <Text
          style={titleFont === 'mono' ? styles.headerTitleMono : styles.headerTitleSerif}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View style={styles.headerRight}>
        {rightSlot ?? null}
      </View>
    </View>
    <View style={styles.headerSeam} />
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor:   Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  backBtn: {
    width:          36,
    height:         36,
    justifyContent: 'center',
    alignItems:     'center',
  },
  headerTitleBlock: {
    flex:              1,
    paddingHorizontal: Space[3],
    gap:               3,
  },
  headerEyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.30)',
  },
  headerTitleSerif: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight:    26 * 1.1,
  },
  headerTitleMono: {
    fontFamily:    FontFamily.mono,
    fontSize:      18,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: 0.3,
    lineHeight:    18 * 1.2,
  },
  headerRight: {
    alignItems:  'flex-end',
    flexShrink:  0,
  },
  headerSeam: {
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  'rgba(255,255,255,0.06)',
    marginTop:        Space[4],
    marginHorizontal: -Space.screenH,
  },
});
