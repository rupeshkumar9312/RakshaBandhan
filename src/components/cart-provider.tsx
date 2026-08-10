"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { shippingFor } from "@/lib/money";

const STORAGE_KEY = "rb_cart_v1";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number; // paise, snapshot at add-time
  image: string | null;
  quantity: number;
  maxQty: number;
};

type State = { lines: CartLine[]; hydrated: boolean };

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: Omit<CartLine, "quantity">; quantity: number }
  | { type: "setQty"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, hydrated: true };

    case "add": {
      const existing = state.lines.find((l) => l.productId === action.line.productId);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.productId === action.line.productId
              ? { ...l, ...action.line, quantity: clamp(l.quantity + action.quantity, 1, action.line.maxQty) }
              : l,
          ),
        };
      }
      return {
        ...state,
        lines: [
          ...state.lines,
          { ...action.line, quantity: clamp(action.quantity, 1, action.line.maxQty) },
        ],
      };
    }

    case "setQty": {
      if (action.quantity <= 0) {
        return { ...state, lines: state.lines.filter((l) => l.productId !== action.productId) };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.productId === action.productId
            ? { ...l, quantity: clamp(action.quantity, 1, l.maxQty) }
            : l,
        ),
      };
    }

    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.productId !== action.productId) };

    case "clear":
      return { ...state, lines: [] };
  }
}

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (
    line: Omit<CartLine, "quantity">,
    quantity?: number,
    opts?: { openDrawer?: boolean },
  ) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false });
  const [isOpen, setIsOpen] = useState(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
      dispatch({ type: "hydrate", lines: Array.isArray(parsed) ? parsed : [] });
    } catch {
      dispatch({ type: "hydrate", lines: [] });
    }
  }, []);

  // Persist after hydration only, so we never overwrite storage with the empty initial state.
  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      /* quota or private mode — cart just won't persist */
    }
  }, [state.lines, state.hydrated]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // These are dependencies of effects in consumers (the checkout redirect, for
  // one), so their identities must stay stable across cart updates — otherwise
  // an effect that calls clear() re-fires on its own result, forever.
  const add = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1, opts?: { openDrawer?: boolean }) => {
      dispatch({ type: "add", line, quantity });
      if (opts?.openDrawer ?? true) setIsOpen(true);
    },
    [],
  );
  const setQty = useCallback(
    (productId: string, quantity: number) => dispatch({ type: "setQty", productId, quantity }),
    [],
  );
  const remove = useCallback((productId: string) => dispatch({ type: "remove", productId }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((s, l) => s + l.quantity, 0);
    const subtotal = state.lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const shipping = shippingFor(subtotal);
    return {
      lines: state.lines,
      hydrated: state.hydrated,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      isOpen,
      openCart,
      closeCart,
      add,
      setQty,
      remove,
      clear,
    };
  }, [state.lines, state.hydrated, isOpen, add, setQty, remove, clear, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
