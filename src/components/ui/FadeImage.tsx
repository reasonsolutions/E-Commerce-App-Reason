import React, { useCallback, useState } from 'react';
import {
  Image,
  ImageResizeMode,
  StyleProp,
  ViewStyle,
  ImageStyle,
  StyleSheet,
  View,
  Text,
} from 'react-native';
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
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const onLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const onError = useCallback(() => {
    setFailed(true);
  }, []);

  const showFallback = failed || !uri;

  return (
    <View
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
        <Image
          source={{ uri }}
          style={[styles.img, imageStyle]}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </View>
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
