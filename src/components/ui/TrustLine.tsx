import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/tokens';
import { Type } from '../../theme/typography';

interface TrustLineProps {
  message: string;
}

export const TrustLine: React.FC<TrustLineProps> = ({ message }) => (
  <View style={styles.row}>
    <Icon name="lock-closed-outline" size={12} color={Colors.ink4} />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     2,
  },
  text: {
    ...Type.caption,
    color:    Colors.ink4,
    fontSize: 12,
  },
});
