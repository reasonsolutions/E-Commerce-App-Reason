import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Server-authoritative count. Seeded to 0; CartScreen sets it after each
  // successful fetch. ProductScreen increments it after a confirmed add.
  const [cartCount, setCartCount] = useState(0);

  const value = {
    cartCount,
    setCartCount,
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