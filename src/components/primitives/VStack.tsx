import React from 'react';
import { View, type ViewProps } from 'react-native';

const VStack = React.forwardRef<View, ViewProps>(({ style, ...props }, ref) => (
  <View ref={ref} style={[{ flexDirection: 'column' }, style]} {...props} />
));
VStack.displayName = 'VStack';

export { VStack };
