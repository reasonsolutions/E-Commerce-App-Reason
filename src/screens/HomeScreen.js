import React from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import { categories, heroBanner, flashDeals } from '../data/mockData';
import CategoryItem from '../components/CategoryItem';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { getCartItemsCount } = useCart();
  const cartItemsCount = getCartItemsCount();

  const renderCategory = ({ item }) => (
    <CategoryItem 
      category={item} 
      onPress={() => console.log('Category pressed:', item.name)}
    />
  );

  const renderFlashDeal = ({ item }) => (
    <ProductCard 
      product={item}
      onPress={() => navigation.navigate('Product', { product: item })}
      onFavoritePress={(product) => console.log('Favorite pressed:', product.name)}
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
            {categories.map((category, index) => (
              <View key={category.id} style={styles.categoryItem}>
                <CategoryItem 
                  category={category} 
                  onPress={() => console.log('Category pressed:', category.name)}
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
            data={flashDeals}
            renderItem={renderFlashDeal}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flashDealsContainer}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="home" size={24} color="#007AFF" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.navText}>Chat</Text>
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
        <TouchableOpacity style={styles.navItem}>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerIcon: {
    marginRight: 16,
  },
  cartContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  heroBannerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    borderRadius: 16,
    padding: 20,
    height: 180,
    justifyContent: 'space-between',
  },
  heroBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  heroBannerText: {
    flex: 1,
  },
  heroBannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroBannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 20,
  },
  shopNowButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  shopNowButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  heroBannerImages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroImage1: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  heroImage2: {
    width: 80,
    height: 100,
    borderRadius: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '31%',
    marginBottom: 12,
  },
  flashDealsContainer: {
    paddingRight: 16,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#007AFF',
  },
});

export default HomeScreen;