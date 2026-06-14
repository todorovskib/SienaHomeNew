import React, { createContext, useCallback, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Product, SelectedProductOptions } from '../types';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions?: SelectedProductOptions;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (product: Product, quantity: number, selectedOptions?: SelectedProductOptions) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
} | null>(null);

const CART_STORAGE_KEY = 'siena_cart_items';

const calculateCartState = (items: CartItem[]): CartState => ({
  items,
  total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
});

const getDefaultSelectedOptions = (product: Product): SelectedProductOptions => ({
  color: product.colors?.[0],
  dimensionOption: product.dimensionOptions?.[0],
});

const getCartItemId = (product: Product, selectedOptions?: SelectedProductOptions): string => {
  const colorKey = selectedOptions?.color
    ? `${selectedOptions.color.name}-${selectedOptions.color.value}`
    : 'no-color';
  const dimension = selectedOptions?.dimensionOption;
  const dimensionKey = dimension
    ? `${dimension.id}-${dimension.width}x${dimension.height}`
    : 'no-dimension';

  return `${product.id}__${colorKey}__${dimensionKey}`;
};

const getInitialCartState = (): CartState => {
  if (typeof window === 'undefined') {
    return { items: [], total: 0, itemCount: 0 };
  }

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [], total: 0, itemCount: 0 };
    }

    const parsed = JSON.parse(stored) as CartItem[];
    if (!Array.isArray(parsed)) {
      return { items: [], total: 0, itemCount: 0 };
    }

    const items = parsed
      .filter((item) => item?.product?.id && Number(item.quantity) > 0)
      .map((item) => {
        const selectedOptions = item.selectedOptions ?? getDefaultSelectedOptions(item.product);
        return {
          ...item,
          id: item.id ?? getCartItemId(item.product, selectedOptions),
          selectedOptions,
        };
      });
    return calculateCartState(items);
  } catch {
    return { items: [], total: 0, itemCount: 0 };
  }
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      );

      let newItems: CartItem[];
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }

      return calculateCartState(newItems);
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(
        item => item.id !== action.payload
      );
      return calculateCartState(newItems);
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);

      return calculateCartState(newItems);
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, getInitialCartState());

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = useCallback((product: Product, quantity: number, selectedOptions?: SelectedProductOptions) => {
    const options = selectedOptions ?? getDefaultSelectedOptions(product);
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: getCartItemId(product, options),
        product,
        quantity,
        selectedOptions: options,
      },
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: cartItemId });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: cartItemId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
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
