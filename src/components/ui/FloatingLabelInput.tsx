import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Space } from '../../theme/tokens';
import { Type } from '../../theme/typography';
import { Motion } from '../../theme/motion';

interface FloatingLabelInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  error?: string | null;
  activeColor?: string;
}

// Static-label input — label is always visible above the field at caption scale.
// No position animation. The underline weight and color respond to focus.
// Pattern reference: COS account form, Apple ID, Arc auth.
export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  error,
  activeColor = Colors.ink1,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const underlineAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const animateUnderline = useCallback((toValue: number) => {
    Animated.timing(underlineAnim, {
      toValue,
      duration:        Motion.duration.tap,
      easing:          Motion.easing.out,
      useNativeDriver: false,
    }).start();
  }, [underlineAnim]);

  const handleFocus = useCallback((e: any) => {
    setFocused(true);
    animateUnderline(1);
    onFocus?.(e);
  }, [animateUnderline, onFocus]);

  const handleBlur = useCallback((e: any) => {
    setFocused(false);
    animateUnderline(0);
    onBlur?.(e);
  }, [animateUnderline, onBlur]);

  const underlineHeight = underlineAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [1, 2],
  });

  const underlineColor = error ? Colors.danger : focused ? activeColor : Colors.ink4;

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View style={styles.wrapper}>
        {/* Static label — always at top, never moves */}
        <Text
          style={[
            styles.label,
            {
              color: error
                ? Colors.danger
                : focused
                ? Colors.ink2
                : Colors.ink3,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {/* Input text */}
        <TextInput
          ref={inputRef}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.input}
          placeholderTextColor="transparent"
          {...rest}
        />

        {/* Underline — only interactive element, weight animated on focus */}
        <Animated.View
          style={[
            styles.underline,
            {
              height:          underlineHeight,
              backgroundColor: underlineColor,
            },
          ]}
        />

        {error ? (
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  // label lineHeight (~13px) + 8px gap + input (38px) + underline (2px) = ~61px
  // Error caption sits outside via absolute positioning below the underline.
  wrapper: {
    height:         62,
    justifyContent: 'flex-start',
  },
  label: {
    ...Type.label,
    color:        Colors.ink3,  // overridden inline per focus/error state
    marginBottom: Space[2],     // 8px — enough air between label and value
  },
  input: {
    ...Type.body,
    color:              Colors.ink1,
    height:             38,
    paddingVertical:    0,
    paddingHorizontal:  0,
    includeFontPadding: false,
    textAlignVertical:  'center',
  },
  underline: {
    // backgroundColor and height both set by inline animated style
  },
  errorText: {
    ...Type.caption,
    color:    Colors.danger,
    position: 'absolute',
    bottom:   -20,
    left:     0,
  },
});
