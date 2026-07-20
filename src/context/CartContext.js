import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// Module-level escape hatch so plain (non-component) code — clearSession() in
// particular — can reset cartCount on logout without cartCount becoming a
// prop/hook dependency of auth.ts. Mirrors navigationRef's pattern for the
// same "React state, non-React caller" problem.
let cartCountSetter = null;

export function resetCartCount() {
  if (cartCountSetter) cartCountSetter(0);
}

export const CartProvider = ({ children }) => {
  // Server-authoritative count. Seeded to 0; CartScreen sets it after each
  // successful fetch. ProductScreen increments it after a confirmed add.
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    cartCountSetter = setCartCount;
    return () => { cartCountSetter = null; };
  }, []);

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