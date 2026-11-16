import { AuthProvider } from "./AuthContext";
import { WalletProvider } from "./WalletContext";
import { CartProvider } from "./CartContext";
import { OrdersProvider } from "./OrdersContext";

// Order matters: Orders uses Cart + Wallet, which use Auth.
export default function AppProvider({ children }) {
  return (
    <AuthProvider>
      <WalletProvider>
        <CartProvider>
          <OrdersProvider>{children}</OrdersProvider>
        </CartProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
