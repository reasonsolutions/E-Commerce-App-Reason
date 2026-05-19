import React from 'react';
import { ScrollView as RNScrollView, type ScrollViewProps } from 'react-native';

const ScrollView = React.forwardRef<RNScrollView, ScrollViewProps>((props, ref) => (
  <RNScrollView ref={ref} {...props} />
));
ScrollView.displayName = 'ScrollView';

export { ScrollView };
