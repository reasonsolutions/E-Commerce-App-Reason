import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ReviewImageViewerProps {
  images:       string[];
  initialIndex: number;
  onClose:      () => void;
}

// Full-screen lightbox for review photo thumbnails. Mirrors AddReviewSheet's
// Modal usage (plain RN core Modal, no Gluestack overlay) but fades over
// black rather than sliding up as a sheet, since this replaces the whole
// screen rather than layering above it.
export const ReviewImageViewer: React.FC<ReviewImageViewerProps> = ({
  images,
  initialIndex,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * SCREEN_W, y: 0 }}
          onScroll={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setActiveIndex(idx);
          }}
          scrollEventThrottle={16}
        >
          {images.map((uri, i) => (
            <View key={i} style={styles.page}>
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + Space[3] }]}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Icon name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {images.length > 1 ? (
          <View style={[styles.dotsRow, { bottom: insets.bottom + Space[5] }]}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  page: {
    width:          SCREEN_W,
    height:         SCREEN_H,
    alignItems:     'center',
    justifyContent: 'center',
  },
  image: {
    width:  SCREEN_W,
    height: SCREEN_H,
  },
  closeButton: {
    position:        'absolute',
    right:           Space[4],
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  dotsRow: {
    position:       'absolute',
    alignSelf:      'center',
    flexDirection:  'row',
    gap:            Space[1],
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: Colors.surface,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
