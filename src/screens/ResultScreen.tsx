import React, { useState, useEffect } from "react";
import { ProductByCategoryProductDetails } from "../api/interfaces";
import { getProductsByCategory } from "../api/integrations";
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

const { width } = Dimensions.get("window");

type ResultScreenProps = {
  navigation: StackNavigationProp<any>;
};

const truncateDescription = (desc: string, maxLength = 80) =>
  desc.length > maxLength ? desc.slice(0, maxLength) + "..." : desc;

const ResultScreen = ({ navigation }: ResultScreenProps) => {
  const [productDetails, setProductDetails] = useState<ProductByCategoryProductDetails[]>([]);
  const route = useRoute();
  const { categoryId } = route.params as { categoryId: string };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const data = await getProductsByCategory(categoryId);
        if (data?.statusCode === 1) {
          setProductDetails(data?.result.productsDetails || []);
        } else {
          setProductDetails([]);
        }
      } catch {
        setProductDetails([]);
      }
    };
    fetchProductDetails();
  }, [categoryId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {productDetails.length > 0 ? (
        Object.values(
          productDetails.reduce<Record<string, ProductByCategoryProductDetails[]>>((acc, product) => {
            if (!acc[product.Item_Id]) acc[product.Item_Id] = [];
            acc[product.Item_Id].push(product);
            return acc;
          }, {})
        ).map((group) => (
          <TouchableOpacity
            key={group[0].Item_Id}
            style={styles.cardTouchable}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("Product", { product: group[0].Inventory_Id })
            }
          >
            <View style={styles.card}>
              <View style={styles.imageWrapper}>
                {group[0].Images && (
                  <Image
                    source={{ uri: group[0].Images.split(";")[0] }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {group[0].Name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>${group[0].Price.toFixed(2)}</Text>
                  {group[0].ComparePrice > group[0].Price && (
                    <Text style={styles.comparePrice}>
                      <Text style={styles.strikeThrough}>
                        ${group[0].ComparePrice.toFixed(2)}
                      </Text>
                    </Text>
                  )}
                </View>
                <Text style={styles.description}>
                  {truncateDescription(group[0].Description)}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.brand}>{group[0].Brand_Name}</Text>
                  <Text style={styles.category}>{group[0].CategoryName}</Text>
                </View>
                <View style={styles.variantRow}>
                  {group.map((variant) => (
                    <View
                      key={variant.Variant}
                      style={[
                        styles.variantChip,
                        variant.Count !== 0
                          ? styles.inStockChip
                          : styles.outOfStockChip,
                      ]}
                    >
                      <Text style={styles.variantChipText}>{variant.Variant}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.loading}>Loading...</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    paddingTop: StatusBar.currentHeight || 0,
  },
  cardTouchable: {
    marginBottom: 24,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    backgroundColor: "#fff",
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
  },
  imageWrapper: {
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: "#eaeaea",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  info: {
    flex: 1,
    justifyContent: "flex-start",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  price: {
    fontSize: 17,
    color: "#e91e63",
    fontWeight: "700",
  },
  comparePrice: {
    fontSize: 15,
    color: "#888",
    marginLeft: 8,
  },
  strikeThrough: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  brand: {
    fontSize: 13,
    color: "#007aff",
    fontWeight: "500",
  },
  category: {
    fontSize: 13,
    color: "#009688",
    fontWeight: "500",
  },
  variantRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  variantChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  inStockChip: {
    backgroundColor: "#e0f7fa",
    borderColor: "#00bcd4",
  },
  outOfStockChip: {
    backgroundColor: "#ffebee",
    borderColor: "#e57373",
  },
  variantChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  loading: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
});

export default ResultScreen;