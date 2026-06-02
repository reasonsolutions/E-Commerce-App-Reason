import React from 'react';
import { View, type ViewProps } from 'react-native';

const HStack = React.forwardRef<View, ViewProps>(({ style, ...props }, ref) => (
  <View ref={ref} style={[{ flexDirection: 'row' }, style]} {...props} />
));
HStack.displayName = 'HStack';

export { HStack };
