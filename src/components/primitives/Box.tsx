import React from 'react';
import { View, type ViewProps } from 'react-native';

const Box = React.forwardRef<View, ViewProps>((props, ref) => (
  <View ref={ref} {...props} />
));
Box.displayName = 'Box';

export { Box };
