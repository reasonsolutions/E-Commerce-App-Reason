import React from 'react';
import { View, type ViewProps } from 'react-native';

const Divider = React.forwardRef<View, ViewProps>(({ style, ...props }, ref) => (
  <View ref={ref} style={[{ height: 1 }, style]} {...props} />
));
Divider.displayName = 'Divider';

export { Divider };
