import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';
import { Type } from '../../theme/typography';
import { OrderStatusCode } from '../../api/interfaces';

// Active statuses that map to a step index. Terminal statuses (Delivered,
// Cancelled, Returned) return null — callers decide whether to show or hide.
const PROGRESS_STEPS: OrderStatusCode[] = [
  OrderStatusCode.New,
  OrderStatusCode.Confirmed,
  OrderStatusCode.Processing,
  OrderStatusCode.Fulfilled,
  OrderStatusCode.Shipped,
  OrderStatusCode.Delivered,
];

const STEP_LABELS: Record<OrderStatusCode, string> = {
  [OrderStatusCode.New]:        'Placed',
  [OrderStatusCode.Confirmed]:  'Confirmed',
  [OrderStatusCode.Processing]: 'Processing',
  [OrderStatusCode.Fulfilled]:  'Packed',
  [OrderStatusCode.Shipped]:    'Shipped',
  [OrderStatusCode.Delivered]:  'Delivered',
  [OrderStatusCode.Cancelled]:  'Cancelled',
  [OrderStatusCode.Returned]:   'Returned',
};

interface OrderProgressBarProps {
  status: OrderStatusCode;
}

export const OrderProgressBar: React.FC<OrderProgressBarProps> = ({ status }) => {
  const currentIdx = PROGRESS_STEPS.indexOf(status);
  if (currentIdx < 0) return null;

  return (
    <View style={styles.container}>
      {PROGRESS_STEPS.map((step, i) => {
        const filled   = i <= currentIdx;
        const isActive = i === currentIdx;
        return (
          <View key={step} style={styles.stepWrap}>
            <View
              style={[
                styles.segment,
                filled   && styles.segmentFilled,
                isActive && styles.segmentActive,
              ]}
            />
            {isActive ? (
              <Text style={styles.stepLabel}>{STEP_LABELS[step]}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap:           3,
    marginTop:     10,
    marginBottom:  2,
  },
  stepWrap: {
    flex:       1,
    alignItems: 'center',
  },
  segment: {
    width:           '100%',
    height:          3,
    borderRadius:    2,
    backgroundColor: Colors.rule,
  },
  segmentFilled: {
    backgroundColor: Colors.ink3,
  },
  segmentActive: {
    backgroundColor: Colors.accent,
  },
  stepLabel: {
    ...Type.label,
    fontSize:      8,
    letterSpacing: 0.3,
    color:         Colors.accent,
    marginTop:     3,
    textAlign:     'center',
  },
});
