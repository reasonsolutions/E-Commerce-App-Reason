import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Space, Radius, Shadow, Motion } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';

interface OrderItemCardProps {
  id: string;
  image: string;
  title: string;
  brandName: string;
  variantLabel?: string;
  quantity: number;
  price: number;
  discount?: number;
  statusLabel: string;
  isCancellable?: boolean;
  onCancel?: () => void;
  expanded?: boolean;
  onToggle?: (id: string) => void;
  renderTimeline?: () => React.ReactNode;
}

const THUMB_W = 52;
const THUMB_H = 52;

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  id,
  image,
  title,
  brandName,
  variantLabel,
  quantity,
  price,
  discount,
  statusLabel,
  isCancellable = false,
  onCancel,
  expanded = false,
  onToggle,
  renderTimeline,
}) => {
  const [expandAnim] = useState(new Animated.Value(expanded ? 1 : 0));
  const lineTotal = price * quantity;

  React.useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: Motion.duration.tap,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  });

  const opacity = expandAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.5, 1],
  });

  const handlePress = () => {
    if (onToggle) {
      onToggle(id);
    }
  };

  const metaItems = [brandName, variantLabel, `Qty ${quantity}`].filter(Boolean);

  return (
    <View style={styles.card}>
      {/* Header - Always visible */}
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={handlePress}
        style={styles.headerButton}
      >
        <View style={styles.headerLeft}>
          {/* Image */}
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Product info */}
          <View style={styles.infoSection}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {metaItems.join(' · ')}
            </Text>
          </View>
        </View>

        {/* Right side - price, status, expand button */}
        <View style={styles.headerRight}>
          <Text style={styles.price}>
            MUR {lineTotal.toLocaleString('en-IN')}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
          <View style={styles.expandButton}>
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.ink3}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expandable content */}
      <Animated.View
        style={[
          styles.expandableContent,
          {
            maxHeight,
            opacity,
          },
        ]}
      >
        <View style={styles.divider} />
        <View style={styles.contentInner}>
          {/* Price breakdown */}
          <View>
            <Text style={styles.detailLabel}>
              Total: <Text style={styles.detailValue}>MUR {lineTotal.toLocaleString('en-IN')}</Text>
            </Text>
            <Text style={styles.detailSecondary}>
              (MUR {price.toLocaleString('en-IN')} each)
            </Text>
            {discount ? (
              <View style={styles.savingsBadge}>
                <Icon name="tag" size={11} color={Colors.success} />
                <Text style={styles.savingsText}>
                  Saved MUR {discount.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Timeline/Events */}
          {renderTimeline ? (
            <View style={styles.timelineSection}>
              <View style={styles.timelineHeader}>
                <Icon name="truck-outline" size={13} color={Colors.ink3} />
                <Text style={styles.timelineTitle}>DELIVERY PROGRESS</Text>
              </View>
              <View style={styles.timelineContent}>
                {renderTimeline()}
              </View>
            </View>
          ) : null}

          {/* Cancel button */}
          {isCancellable && onCancel ? (
            <View>
              <View style={styles.divider} />
              <Text style={styles.cancelMessage}>
                Cancellation is open until this item ships.
              </Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Icon name="close-circle-outline" size={15} color={Colors.danger} />
                <Text style={styles.cancelButtonText}>Cancel this item</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginVertical: Space[1],
    overflow: 'hidden',
    ...Shadow.sm,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Space[3],
    paddingVertical: Space[3],
    gap: Space[2],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space[3],
    flex: 1,
  },
  image: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceSoft,
  },
  infoSection: {
    flex: 1,
    gap: Space[1],
    paddingTop: 2,
  },
  title: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink1,
    lineHeight: 17,
  },
  meta: {
    fontSize: 11,
    color: Colors.ink4,
    lineHeight: 14,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
    paddingTop: 2,
  },
  price: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink1,
    lineHeight: 17,
  },
  statusBadge: {
    paddingHorizontal: Space[2],
    paddingVertical: 3,
    backgroundColor: Colors.surfaceSoft,
    borderRadius: Radius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.ink2,
    lineHeight: 13,
  },
  expandButton: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.rule,
    backgroundColor: Colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandableContent: {
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  contentInner: {
    paddingHorizontal: Space[3],
    paddingVertical: Space[3],
    gap: Space[3],
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink1,
    lineHeight: 16,
  },
  detailValue: {
    fontWeight: '700',
  },
  detailSecondary: {
    fontSize: 11,
    color: Colors.ink4,
    marginTop: 2,
    lineHeight: 14,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[1],
    marginTop: Space[1],
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  timelineSection: {
    gap: Space[2],
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[1],
  },
  timelineTitle: {
    ...Type.label,
    fontSize: 9,
    color: Colors.ink4,
    letterSpacing: 0.4,
  },
  timelineContent: {
    marginLeft: 2,
  },
  cancelMessage: {
    fontSize: 11,
    color: Colors.ink3,
    lineHeight: 15,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space[1],
    paddingVertical: Space[2],
    paddingHorizontal: Space[3],
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.surface,
    marginTop: Space[2],
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.danger,
  },
});
