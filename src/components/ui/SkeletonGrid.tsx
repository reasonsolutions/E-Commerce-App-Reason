import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from './Skeleton';
import { Colors, Space, Radius } from '../../theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP = Space[3];

interface SkeletonGridProps {
  cols?: 1 | 2;
  rows?: number;
  showPriceLine?: boolean;
  showButton?: boolean;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  cols = 2,
  rows = 2,
  showPriceLine = true,
  showButton = false,
}) => {
  const colW =
    cols === 2
      ? (SCREEN_W - Space.screenH * 2 - COL_GAP) / 2
      : SCREEN_W - Space.screenH * 2;
  const imgH = colW * 1.25; // 4:5 portrait

  const Cell: React.FC = () => (
    <View style={{ width: colW }}>
      <Skeleton width={colW} height={imgH} radius={0} />
      <View style={styles.metaBlock}>
        <Skeleton width="45%" height={9} radius={Radius.xs} style={styles.line} />
        <Skeleton width="80%" height={11} radius={Radius.xs} style={styles.line} />
        {showPriceLine && (
          <Skeleton width="35%" height={9} radius={Radius.xs} style={styles.line} />
        )}
        {showButton && (
          <Skeleton
            width="100%"
            height={28}
            radius={Radius.xs}
            style={styles.btn}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.grid}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <View
          key={rowIdx}
          style={[styles.row, cols === 1 && styles.rowSingle]}
        >
          <Cell />
          {cols === 2 && <Cell />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: Space.screenH,
    gap:               Space[5],
  },
  row: {
    flexDirection: 'row',
    gap:           COL_GAP,
  },
  rowSingle: {
    flexDirection: 'column',
  },
  metaBlock: {
    paddingTop: Space[2],
  },
  line: {
    marginBottom: Space[1] + 2,
  },
  btn: {
    marginTop: Space[2],
  },
});
