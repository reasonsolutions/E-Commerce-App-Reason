import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius, FontSize } from '../../theme/tokens';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  trailing?: React.ReactNode;
  editable?: boolean;
  onPress?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search',
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  trailing,
  editable = true,
  onPress,
  autoFocus = false,
}) => {
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.container} onTouchStart={onPress}>
      <Icon name="search-outline" size={18} color={Colors.ink3} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.ink4}
        style={styles.input}
        editable={editable}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        onBlur={onBlur}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        autoFocus={autoFocus}
      />
      {value.length > 0 && editable ? (
        <TouchableOpacity
          onPress={() => { onChangeText(''); inputRef.current?.focus(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close-circle" size={16} color={Colors.ink4} />
        </TouchableOpacity>
      ) : trailing ? (
        <View style={styles.trailing}>{trailing}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.surfaceAlt,
    borderRadius:     Radius.pill,
    paddingVertical:  Space[3] - 2,
    paddingHorizontal: Space[3],
    gap: Space[2],
  },
  input: {
    flex:       1,
    fontSize:   FontSize.base,
    color:      Colors.ink1,
    padding:    0,
    margin:     0,
  },
  trailing: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});
