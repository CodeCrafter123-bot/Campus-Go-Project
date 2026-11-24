import { CatalogProvider } from "./CatalogContext";
import { AuthProvider } from "./AuthContext";
import { WalletProvider } from "./WalletContext";
import { CartProvider } from "./CartContext";
import { OrdersProvider } from "./OrdersContext";

// Order matters: Orders uses Cart + Wallet, which use Auth.
// The catalog (stores, products…) is loaded first, before anything else.
export default function AppProvider({ children }) {
  return (
    <CatalogProvider>
      <AuthProvider>
        <WalletProvider>
          <CartProvider>
            <OrdersProvider>{children}</OrdersProvider>
          </CartProvider>
        </WalletProvider>
      </AuthProvider>
    </CatalogProvider>
  );
}
