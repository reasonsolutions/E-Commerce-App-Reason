import React from 'react';
import { Image as RNImage, type ImageProps } from 'react-native';

const Image = React.forwardRef<RNImage, ImageProps>((props, ref) => (
  <RNImage ref={ref} {...props} />
));
Image.displayName = 'Image';

export { Image };
