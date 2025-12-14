"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { IotaClientProvider, WalletProvider } from "@iota/dapp-kit"
import { getFullnodeUrl } from "@iota/iota-sdk/client"
import { useState } from "react"
import "@iota/dapp-kit/dist/index.css"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  // IOTA Testnet configuration
  const networks = {
    testnet: { url: getFullnodeUrl("testnet") },
  }

  return (
    <QueryClientProvider client={queryClient}>
      <IotaClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </IotaClientProvider>
    </QueryClientProvider>
  )
}
