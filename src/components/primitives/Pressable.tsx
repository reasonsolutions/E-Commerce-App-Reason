import React from 'react';
import { Pressable as RNPressable, View, type PressableProps } from 'react-native';

const Pressable = React.forwardRef<View, PressableProps>((props, ref) => (
  <RNPressable ref={ref} {...props} />
));
Pressable.displayName = 'Pressable';

export { Pressable };
