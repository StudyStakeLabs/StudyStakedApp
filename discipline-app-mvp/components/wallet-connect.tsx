"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import { 
  useCurrentAccount, 
  useConnectWallet, 
  useDisconnectWallet,
  ConnectModal,
  useWallets
} from "@iota/dapp-kit"
import { saveWalletData, getWalletData } from "@/lib/storage"
import { useState } from "react"

interface WalletConnectProps {
  onConnect?: (address: string) => void
  onDisconnect?: () => void
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const currentAccount = useCurrentAccount()
  const { mutate: connect } = useConnectWallet()
  const { mutate: disconnect } = useDisconnectWallet()
  const [showModal, setShowModal] = useState(false)

  // Handle account connection/disconnection
  useEffect(() => {
    if (currentAccount?.address) {
      const address = currentAccount.address
      saveWalletData({ address, lastConnected: Date.now() })
      onConnect?.(address)
    } else {
      const walletData = getWalletData()
      if (walletData?.address) {
        // Clear stale data if wallet disconnected
        saveWalletData(null)
      }
    }
  }, [currentAccount, onConnect])

  const handleConnect = () => {
    setShowModal(true)
  }

  const handleDisconnect = () => {
    disconnect()
    saveWalletData(null)
    onDisconnect?.()
  }

  if (currentAccount?.address) {
    const address = currentAccount.address
    return (
      <div className="flex items-center gap-2 border-3 border-foreground bg-card px-4 py-2">
        <Wallet className="h-4 w-4" />
        <span className="font-mono text-sm font-bold">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          className="ml-2 hover:opacity-70"
          title="Disconnect"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={handleConnect}
        className="border-3 border-foreground bg-primary font-mono text-sm font-bold uppercase text-primary-foreground hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-primary brutal-shadow"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
      <ConnectModal
        trigger={<span />}
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  )
}
