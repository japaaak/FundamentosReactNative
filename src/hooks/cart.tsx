import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import api from 'src/services/api';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarket:product');

      if (response) {
        setProducts([...JSON.parse(response)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExist = products.find(p => p.id === product.id);

      if (productExist) {
        const newProduct = products.map(p =>
          p.id !== productExist.id
            ? p
            : { ...productExist, quantity: productExist.quantity + 1 },
        );

        setProducts(newProduct);
      } else {
        const { id, title, image_url, price } = product;
        const newProduct = {
          id,
          title,
          image_url,
          price,
          quantity: 1,
        };
        setProducts([...products, newProduct]);
      }

      AsyncStorage.setItem('@GoMarket:product', JSON.stringify(product));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const index = products.findIndex(p => p.id === id);

      const incrementQuantity = {
        ...products[index],
        quantity: products[index].quantity + 1,
      };
      products[index] = incrementQuantity;

      setProducts([...products]);

      AsyncStorage.setItem(
        '@GoMarket:product',
        JSON.stringify(incrementQuantity),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(p => p.id === id);

      if (products[index].quantity <= 0) {
        setProducts([...products]);
      } else {
        const incrementQuantity = {
          ...products[index],
          quantity: products[index].quantity - 1,
        };
        products[index] = incrementQuantity;

        setProducts([...products]);

        AsyncStorage.setItem(
          '@GoMarket:product',
          JSON.stringify(incrementQuantity),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
