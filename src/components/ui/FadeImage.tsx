import React, { useRef, useCallback } from 'react';
import {
  Animated,
  ImageResizeMode,
  StyleProp,
  ViewStyle,
  ImageStyle,
  StyleSheet,
} from 'react-native';
import { Motion } from '../../theme/motion';
import { Colors } from '../../theme';

interface FadeImageProps {
  uri: string;
  width: number;
  height: number;
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const FadeImage: React.FC<FadeImageProps> = ({
  uri,
  width,
  height,
  borderRadius = 0,
  resizeMode = 'cover',
  style,
  imageStyle,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    Animated.timing(opacity, {
      toValue:         1,
      duration:        Motion.duration.settle,
      easing:          Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.Image
        source={{ uri }}
        style={[styles.img, { opacity }, imageStyle]}
        resizeMode={resizeMode}
        onLoad={onLoad}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surfaceDeep,
    overflow:        'hidden',
    flexShrink:      0,
  },
  img: {
    width:  '100%',
    height: '100%',
  },
});
