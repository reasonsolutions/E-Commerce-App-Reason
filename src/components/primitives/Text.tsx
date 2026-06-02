import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

const Text = React.forwardRef<RNText, TextProps>((props, ref) => (
  <RNText ref={ref} {...props} />
));
Text.displayName = 'Text';

export { Text };
