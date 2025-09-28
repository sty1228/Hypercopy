"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import privyAccount from "../../account/privy.json";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={privyAccount.appId}
      clientId={privyAccount.clientId}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
