export const categories = [
  {
    id: 1,
    name: 'Mobile',
    icon: 'phone',
    iconType: 'Ionicons',
  },
  {
    id: 2,
    name: 'Headphone',
    icon: 'headphones',
    iconType: 'Ionicons',
  },
  {
    id: 3,
    name: 'Tablets',
    icon: 'tablet-portrait',
    iconType: 'Ionicons',
  },
  {
    id: 4,
    name: 'Laptop',
    icon: 'laptop',
    iconType: 'Ionicons',
  },
  {
    id: 5,
    name: 'Speakers',
    icon: 'volume-high',
    iconType: 'Ionicons',
  },
  {
    id: 6,
    name: 'More',
    icon: 'grid',
    iconType: 'Ionicons',
  },
];

export const products = [
  {
    id: 1,
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    price: 1399.99,
    originalPrice: 1499.99,
    rating: 4.9,
    reviewCount: 2200,
    image: 'https://picsum.photos/300/300?random=1',
    images: [
      'https://picsum.photos/300/300?random=1',
      'https://picsum.photos/300/300?random=2',
      'https://picsum.photos/300/300?random=3',
      'https://picsum.photos/300/300?random=4',
    ],
    colors: [
      { name: 'Desert Titanium', color: '#D4B896' },
      { name: 'Natural Titanium', color: '#8E8E93' },
      { name: 'White Titanium', color: '#F2F2F7' },
      { name: 'Black Titanium', color: '#1C1C1E' },
    ],
    selectedColor: 'White Titanium',
    storage: ['256 GB', '512 GB', '1 TB'],
    selectedStorage: '512 GB',
    features: [
      {
        icon: 'tv',
        title: '4K Ultra HD XDR Display',
      },
      {
        icon: 'battery-charging',
        title: 'Wireless Charging System',
      },
    ],
    category: 'Mobile',
  },
  {
    id: 2,
    name: 'Smartwatch Ultra',
    brand: 'Apple',
    price: 99.99,
    originalPrice: 129.99,
    rating: 4.7,
    reviewCount: 1800,
    image: 'https://picsum.photos/300/300?random=5',
    images: [
      'https://picsum.photos/300/300?random=5',
      'https://picsum.photos/300/300?random=6',
      'https://picsum.photos/300/300?random=7',
      'https://picsum.photos/300/300?random=8',
    ],
    colors: [
      { name: 'Black', color: '#1C1C1E' },
      { name: 'White', color: '#F2F2F7' },
      { name: 'Blue', color: '#007AFF' },
    ],
    selectedColor: 'Black',
    features: [
      {
        icon: 'heart',
        title: 'Health Monitoring',
      },
      {
        icon: 'fitness',
        title: 'Fitness Tracking',
      },
    ],
    category: 'Wearables',
  },
];

export const heroBanner = {
  title: 'iPhone 16 Pro',
  subtitle: 'Extraordinary Visual\n& Exceptional Power',
  buttonText: 'Shop Now',
  images: [
    'https://picsum.photos/400/300?random=10',
    'https://picsum.photos/400/300?random=11',
  ],
  gradient: ['#6366F1', '#8B5CF6'],
};

export const flashDeals = [
  {
    id: 1,
    name: 'iPhone 16 Pro',
    image: 'https://picsum.photos/200/200?random=12',
    isFavorite: false,
  },
  {
    id: 2,
    name: 'Smartwatch Ultra',
    image: 'https://picsum.photos/200/200?random=13',
    isFavorite: false,
  },
];