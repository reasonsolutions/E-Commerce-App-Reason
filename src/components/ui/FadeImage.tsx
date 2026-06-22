import React, { useRef, useCallback, useState } from 'react';
import {
  Animated,
  ImageResizeMode,
  StyleProp,
  ViewStyle,
  ImageStyle,
  StyleSheet,
  Text,
} from 'react-native';
import { Motion } from '../../theme/motion';
import { Colors } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import { Skeleton } from './Skeleton';

interface FadeImageProps {
  uri: string;
  width: number;
  height: number;
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  showSkeleton?: boolean;
  fallbackText?: string;
}

export const FadeImage: React.FC<FadeImageProps> = ({
  uri,
  width,
  height,
  borderRadius = 0,
  resizeMode = 'cover',
  style,
  imageStyle,
  showSkeleton = false,
  fallbackText,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const onLoad = useCallback(() => {
    setLoaded(true);
    Animated.timing(opacity, {
      toValue:         1,
      duration:        Motion.duration.settle,
      easing:          Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const onError = useCallback(() => {
    setFailed(true);
  }, []);

  const showFallback = failed || !uri;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { width, height, borderRadius },
        style,
      ]}
    >
      {showSkeleton && !loaded && !showFallback ? (
        <Skeleton width={width} height={height} radius={borderRadius} style={StyleSheet.absoluteFillObject} />
      ) : null}
      {showFallback ? (
        <Text style={styles.fallbackText}>{(fallbackText || '?').charAt(0).toUpperCase()}</Text>
      ) : (
        <Animated.Image
          source={{ uri }}
          style={[styles.img, { opacity }, imageStyle]}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surfaceSoft,
    overflow:        'hidden',
    flexShrink:      0,
    alignItems:      'center',
    justifyContent:  'center',
  },
  img: {
    width:  '100%',
    height: '100%',
  },
  fallbackText: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   28,
    color:      'rgba(40,32,24,0.22)',
  },
});
