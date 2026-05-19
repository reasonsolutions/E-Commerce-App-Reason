import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius, FontSize } from '../../theme/tokens';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  trailing?: React.ReactNode;
  editable?: boolean;
  onPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search',
  value,
  onChangeText,
  trailing,
  editable = true,
  onPress,
}) => {
  return (
    <View style={styles.container} onTouchStart={onPress}>
      <Icon name="search-outline" size={18} color={Colors.ink3} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.ink4}
        style={styles.input}
        editable={editable}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        accessibilityRole="search"
      />
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
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
