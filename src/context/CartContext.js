import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { isLoggedIn } from '../utils/auth';
import { getGuestCart } from '../api/cart/guestCartApi';

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

  // Bootstrap the badge from the persisted guest cart on cold launch — without
  // this, a guest who added items in a previous session sees no badge until
  // they open CartScreen (which does this same sync) or log in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loggedIn = await isLoggedIn();
      if (cancelled || loggedIn) return;
      const items = await getGuestCart();
      if (cancelled) return;
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
    })();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({
    cartCount,
    setCartCount,
  }), [cartCount]);

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