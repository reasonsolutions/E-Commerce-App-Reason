import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme/tokens';
import { Type } from '../../theme/typography';

interface FloatingLabelInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  error?: string | null;
  activeColor?: string;
  showToggle?: boolean;
  required?: boolean;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  error,
  activeColor = Colors.ink1,
  showToggle = false,
  required = false,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback((e: any) => { setFocused(true);  onFocus?.(e); }, [onFocus]);
  const handleBlur  = useCallback((e: any) => { setFocused(false); onBlur?.(e);  }, [onBlur]);

  const accentColor = error ? Colors.danger : focused ? activeColor : 'transparent';
  const labelColor  = error ? Colors.danger : focused ? Colors.ink2 : Colors.ink3;

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View style={styles.wrapper}>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}{required && <Text style={styles.requiredMark}> *</Text>}
        </Text>

        <View style={[styles.field, focused && styles.fieldFocused]}>
          <TextInput
            ref={inputRef}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={styles.input}
            placeholderTextColor="rgba(0,0,0,0.22)"
            secureTextEntry={showToggle ? !visible : rest.secureTextEntry}
            {...rest}
          />
          {showToggle && (
            <TouchableOpacity
              onPress={() => setVisible(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            >
              <Icon
                name={visible ? 'eye-off-outline' : 'eye-outline'}
                size={17}
                color={Colors.ink4}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Accent line — invisible when unfocused/no error, 1.5px on focus, danger on error */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

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
  wrapper: {
    gap: 0,
  },
  label: {
    ...Type.label,
    fontSize:      9,
    letterSpacing: 1.2,
    color:         Colors.ink3,
    marginBottom:  Space[2],
  },
  requiredMark: {
    color: Colors.ink3,
  },
  field: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#FFFFFF',
    borderRadius:      Radius.xs,
    borderWidth:       1,
    borderColor:       'rgba(0,0,0,0.10)',
    paddingHorizontal: Space[4],
    paddingVertical:   9,
    gap:               Space[3],
  },
  fieldFocused: {
    backgroundColor: '#FFFFFF',
  },
  input: {
    ...Type.body,
    flex:               1,
    color:              Colors.ink1,
    paddingVertical:    0,
    paddingHorizontal:  0,
    includeFontPadding: false,
    textAlignVertical:  'center',
  },
  accentLine: {
    height:       1.5,
    marginTop:    2,
    borderRadius: 1,
  },
  errorText: {
    ...Type.caption,
    color:     Colors.danger,
    marginTop: Space[1],
  },
});
