import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { FontFamily } from '../../theme/fonts';

// Card corner radius — a documented exception to the app's Radius scale
// (max lg = 18); this hero/editorial card intentionally reads larger.
const CARD_RADIUS = 27;
const CARD_MIN_HEIGHT = 210;

type Props = {
  showDivider?: boolean;
};

// Static, non-tappable Home banner reinforcing the brand promise between
// New arrivals and Best deals. No interaction, no navigation.
export const EasycomPromiseCard: React.FC<Props> = ({ showDivider = true }) => (
  <View style={styles.card}>
    <View style={styles.topBevel} pointerEvents="none" />
    <View style={styles.glowPrimary} pointerEvents="none" />
    <View style={styles.glowSecondary} pointerEvents="none" />

    <View style={styles.content}>
      <View style={styles.eyebrowRow}>
        <View style={styles.eyebrowTick} />
        <Text style={styles.eyebrowLabel}>The Easycom Promise</Text>
      </View>

      <Text style={styles.headline}>
        Good finds.{'\n'}Clear prices.{'\n'}Easy shopping.
      </Text>

      {showDivider ? <View style={styles.divider} /> : null}

      <View style={styles.benefitsRow}>
        <View style={styles.benefitItem}>
          <Icon
            name="shield-checkmark-outline"
            size={15}
            color={Colors.heroTextSoft}
            style={styles.benefitIcon}
          />
          <Text style={styles.benefitLabel}>Secure checkout</Text>
        </View>
        <View style={styles.benefitDivider} />
        <View style={styles.benefitItem}>
          <Icon
            name="car-outline"
            size={15}
            color={Colors.heroTextSoft}
            style={styles.benefitIcon}
          />
          <Text style={styles.benefitLabel}>Order tracking</Text>
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    position:        'relative',
    minHeight:        CARD_MIN_HEIGHT,
    backgroundColor:  Colors.heroNavy,
    borderRadius:     CARD_RADIUS,
    overflow:         'hidden',
    padding:          Space[5],
  },
  topBevel: {
    position:        'absolute',
    top:              0,
    left:             0,
    right:            0,
    height:           1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glowPrimary: {
    position:         'absolute',
    right:            -70,
    top:              -70,
    width:             240,
    height:            240,
    borderRadius:      120,
    backgroundColor:  'rgba(178, 90, 61, 0.22)',
  },
  glowSecondary: {
    position:         'absolute',
    right:            10,
    bottom:           -90,
    width:             160,
    height:            160,
    borderRadius:      80,
    backgroundColor:  'rgba(178, 90, 61, 0.1)',
  },
  content: {
    position: 'relative',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            Space[2],
  },
  eyebrowTick: {
    width:            14,
    height:           1,
    backgroundColor: Colors.accent,
  },
  eyebrowLabel: {
    fontSize:      11,
    fontWeight:    '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color:         Colors.accent,
  },
  headline: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      28,
    lineHeight:    28 * 1.24,
    letterSpacing: 0.2,
    color:         Colors.heroTextSoft,
    marginTop:     Space[3],
    maxWidth:      '76%',
  },
  divider: {
    height:           1,
    backgroundColor: 'rgba(233, 230, 223, 0.15)',
    marginTop:        19,
    marginBottom:     15,
    maxWidth:         '78%',
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    rowGap:         Space[3] - 2,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            Space[2] - 1,
  },
  benefitIcon: {
    opacity: 0.82,
  },
  benefitLabel: {
    fontSize:      12.5,
    letterSpacing: 0.15,
    color:         Colors.heroTextSoft,
    opacity:        0.82,
  },
  benefitDivider: {
    width:            1,
    height:           15,
    backgroundColor: 'rgba(233, 230, 223, 0.18)',
    marginHorizontal: 14,
  },
});
