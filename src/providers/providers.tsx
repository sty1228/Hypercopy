"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import privyAccount from "../../account/privy.json";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={privyAccount.appId}
      clientId={privyAccount.clientId}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          walletList: [
            "detected_ethereum_wallets",
            "rabby_wallet",
            "metamask",
            "phantom",
            "coinbase_wallet",
            "rainbow",
            "wallet_connect",
          ],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}