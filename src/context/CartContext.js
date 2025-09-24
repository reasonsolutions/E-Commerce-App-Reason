import React, { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => 
        item.id === action.payload.id && 
        item.selectedColor === action.payload.selectedColor &&
        item.selectedStorage === action.payload.selectedStorage
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id &&
            item.selectedColor === action.payload.selectedColor &&
            item.selectedStorage === action.payload.selectedStorage
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }],
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => 
          !(item.id === action.payload.id && 
            item.selectedColor === action.payload.selectedColor &&
            item.selectedStorage === action.payload.selectedStorage)
        ),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id &&
          item.selectedColor === action.payload.selectedColor &&
          item.selectedStorage === action.payload.selectedStorage
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };

    default:
      return state;
  }
};

const initialState = {
  items: [
    // {
    //   id: 1,
    //   name: 'iPhone 16 Pro Max',
    //   brand: 'Apple',
    //   price: 1399.99,
    //   image: 'https://picsum.photos/300/300?random=1',
    //   selectedColor: 'Natural Titanium',
    //   selectedStorage: '512 GB',
    //   quantity: 1,
    // },
    // {
    //   id: 2,
    //   name: 'Smartwatch Ultra',
    //   brand: 'Apple',
    //   price: 99.99,
    //   image: 'https://picsum.photos/300/300?random=5',
    //   selectedColor: 'Black',
    //   quantity: 1,
    // },
  ],
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = (product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (product) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: product });
  };

  const updateQuantity = (product, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { ...product, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartItemsCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value = {
    items: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemsCount,
    getCartTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};