import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TextInput,
  Image,
  FlatList,
  Dimensions,
  Alert,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import { heroBanner, flashDeals } from '../data/mockData';
import CategoryItem from '../components/CategoryItem';
import ProductCard from '../components/ProductCard';
import { CategoryInterface, ProductInterface } from '../api/interfaces';
import { getAllProducts, getCategories } from '../api/integrations';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  getState?: () => { routes: Array<{ name: string }> };
};

type HomeScreenProps = {
  navigation: NavigationProp;
};

function useCustomBackHandler(navigation: NavigationProp) {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        AsyncStorage.getItem('userData').then((user) => {
          const routeHistory = navigation?.getState?.()?.routes;
          const cameFromLogin =
            routeHistory &&
            routeHistory.length > 1 &&
            routeHistory[routeHistory.length - 2]?.name === 'Login';

          if (user && cameFromLogin) {
            Alert.alert(
              'Log Out',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes',
                  onPress: async () => {
                    await AsyncStorage.clear();
                    navigation.navigate('Login');
                  },
                },
              ],
              { cancelable: true }
            );
            // No need to return here, just exit
          }
        });
        // Always return true to prevent default back behavior while async logic runs
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [navigation])
  );
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  useCustomBackHandler(navigation);

  const { getCartItemsCount } = useCart();
  const cartItemsCount: number = getCartItemsCount();
  const [categories, setCategories] = useState<CategoryInterface[] | null>(null);
  const [products, setProducts] = useState<ProductInterface[] | null>(null);

  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data.result);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });

    getAllProducts()
      .then((data) => {
        setProducts(data.result);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      });
  }, []);

  const renderCategory = ({ item }: { item: CategoryInterface }) => (
    <CategoryItem
      category={item}
      onPress={() => navigation.navigate('Result', { categoryId: item.Category_Id })}
    />
  );

  const renderFlashDeal = ({ item }: { item: ProductInterface }) => (
    <ProductCard
      product={item}
      onPress={() => navigation.navigate('Product', { product: item.Inventory_Id })}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoContainer}>
          <Icon name="storefront-outline" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="camera-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartContainer}
            onPress={() => navigation.navigate('Cart')}
          >
            <Icon name="bag-outline" size={24} color="#333" />
            {cartItemsCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBannerContainer}>
          <LinearGradient
            colors={heroBanner.gradient}
            style={styles.heroBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroBannerContent}>
              <View style={styles.heroBannerText}>
                <Text style={styles.heroBannerTitle}>{heroBanner.title}</Text>
                <Text style={styles.heroBannerSubtitle}>{heroBanner.subtitle}</Text>
                <TouchableOpacity style={styles.shopNowButton}>
                  <Text style={styles.shopNowButtonText}>{heroBanner.buttonText}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.heroBannerImages}>
                <Image
                  source={{ uri: heroBanner.images[0] }}
                  style={styles.heroImage1}
                />
                <Image
                  source={{ uri: heroBanner.images[1] }}
                  style={styles.heroImage2}
                />
              </View>
            </View>

            {/* Pagination dots */}
            <View style={styles.paginationContainer}>
              <View style={[styles.paginationDot, styles.paginationDotActive]} />
              <View style={styles.paginationDot} />
              <View style={styles.paginationDot} />
              <View style={styles.paginationDot} />
            </View>
          </LinearGradient>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories &&
              categories.map((category) => (
                <View key={category.Category_Id} style={styles.categoryItem}>
                  <CategoryItem
                    category={category}
                    onPress={() =>
                      navigation.navigate('Result', { categoryId: category.Category_Id })
                    }
                  />
                </View>
              ))}
          </View>
        </View>

        {/* Flash Deals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Flash Deals for You</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={
              products
                ? Array.from(
                    new Map(products.map((item) => [item.Item_Id, item])).values()
                  )
                : []
            }
            renderItem={renderFlashDeal}
            keyExtractor={(item: ProductInterface) => String(item.Item_Id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flashDealsContainer}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Icon name="home" size={24} color="#007AFF" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Orders')}>
          <Icon name="receipt-outline" size={24} color="#666" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="heart-outline" size={24} color="#666" />
          <Text style={styles.navText}>Wishlist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="bag-outline" size={24} color="#666" />
          <Text style={styles.navText}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Icon name="person-outline" size={24} color="#666" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logoContainer: {
    marginRight: 14,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 14,
    height: 42,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 0,
    letterSpacing: 0.2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 14,
  },
  cartContainer: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  heroBannerContainer: {
    marginTop: 16,
    marginHorizontal: 18,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  heroBanner: {
    width: '100%',
    minHeight: 170,
    padding: 22,
    borderRadius: 18,
    justifyContent: 'center',
  },
  heroBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBannerText: {
    flex: 1,
    paddingRight: 14,
  },
  heroBannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  heroBannerSubtitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 14,
    opacity: 0.95,
  },
  shopNowButton: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 22,
    alignSelf: 'flex-start',
    elevation: 1,
  },
  shopNowButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  heroBannerImages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroImage1: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  heroImage2: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 14,
  },
  paginationDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFF',
    opacity: 0.4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    opacity: 1,
    backgroundColor: '#FFF',
  },
  section: {
    marginTop: 28,
    marginHorizontal: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.2,
  },
  seeAllText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  categoryItem: {
    width: (width - 54 - 36) / 3, // 3 columns, 18px margin each side, 12px gap between
    aspectRatio: 1,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  flashDealsContainer: {
    paddingVertical: 10,
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  navTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
