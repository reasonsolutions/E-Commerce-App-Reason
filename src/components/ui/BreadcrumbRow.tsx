import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';

interface BreadcrumbRowProps {
  category?: string | null;
  subCategory?: string | null;
}

export const BreadcrumbRow: React.FC<BreadcrumbRowProps> = ({ category, subCategory }) => {
  if (!category && !subCategory) return null;

  return (
    <View style={styles.row}>
      {category ? <Text style={styles.label}>{category}</Text> : null}
      {category && subCategory ? <Text style={styles.sep}>›</Text> : null}
      {subCategory ? <Text style={styles.label}>{subCategory}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Space[4],
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: Colors.surface,
  },
  label: {
    ...Type.label,
    fontSize: 10,
    letterSpacing: 1.1,
    color: Colors.ink3,
  },
  sep: {
    color: Colors.ink3,
    fontSize: 10,
    lineHeight: 14,
  },
});
