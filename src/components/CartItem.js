import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Price, QuantityStepper } from './ui';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';

const CartItem = ({ item, onUpdateQuantity, onRemove, onEdit }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: item.Images.split(';')[0] }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.productInfo}>
            <Text style={styles.name}>{item.Name}</Text>
            <Text style={styles.brand}>{item.Brand_Name}</Text>
            {item.Variant ? (
              <Text style={styles.variant}>Variant: {item.Variant}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onRemove(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Price
            value={item.Price}
            was={item.ComparePrice > item.Price ? item.ComparePrice : undefined}
            size="base"
            currency="$"
          />
          <QuantityStepper
            value={item.Quantity}
            onChange={(next) => onUpdateQuantity(item, next)}
            min={1}
            size="sm"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Space.padCard,
    marginBottom: Space.gapRow,
    ...Shadow.md,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  content: {
    flex: 1,
    marginLeft: Space[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Space[2],
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink1,
  },
  brand: {
    fontSize: FontSize.sm,
    color: Colors.ink3,
  },
  variant: {
    fontSize: FontSize.xs,
    color: Colors.ink4,
  },
  deleteButton: {
    padding: Space[1],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default CartItem;
