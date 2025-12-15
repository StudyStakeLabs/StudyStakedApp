"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Share2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NftRewardCardProps {
    taskName: string
    duration: number
    mode: "stake" | "free"
    txHash?: string
    proofHash?: string
    onClose: () => void
}

export function NftRewardCard({ taskName, duration, mode, txHash, proofHash, onClose }: NftRewardCardProps) {
    const explorerUrl = txHash ? `https://explorer.iota.cafe/txblock/${txHash}?network=testnet` : "#"

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="border-4 border-yellow-500 bg-card brutal-shadow sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 border-4 border-black animate-bounce">
                        <Trophy className="h-10 w-10 text-black hidden" />
                        <span className="text-4xl text-black">🏆</span>
                    </div>
                    <DialogTitle className="text-center font-mono text-2xl font-black uppercase tracking-tighter">
                        Task Conquered!
                    </DialogTitle>
                    <DialogDescription className="text-center font-mono font-bold text-foreground">
                        You just minted a Proof of Discipline on the IOTA Blockchain.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-foreground bg-muted/50 p-4 text-center">
                        <p className="font-mono text-xs font-bold uppercase text-muted-foreground">Achievement Unlocked</p>
                        <h3 className="font-mono text-xl font-black uppercase text-primary">{taskName}</h3>
                        <div className="mt-2 flex justify-center gap-2">
                            <Badge variant="outline" className="border-2 border-foreground font-mono font-bold">
                                {duration} MIN
                            </Badge>
                            <Badge variant="outline" className="border-2 border-foreground font-mono font-bold">
                                {mode === "stake" ? "STAKED" : "HONOR"}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="font-bold text-muted-foreground">Transaction Hash:</span>
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 font-bold text-primary hover:underline"
                            >
                                {txHash ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}` : "Pending..."}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                        {proofHash && (
                            <div className="flex justify-between text-xs font-mono">
                                <span className="font-bold text-muted-foreground">Proof Hash:</span>
                                <span className="font-bold">{proofHash.slice(0, 6)}...{proofHash.slice(-4)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button onClick={onClose} className="w-full border-2 border-foreground font-mono font-black uppercase">
                        Collect Reward
                    </Button>
                    <Button variant="ghost" className="w-full font-mono text-xs text-muted-foreground">
                        <Share2 className="mr-2 h-3 w-3" />
                        Share Achievement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Imports needed for this to work in standalone - putting them at top in real file
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
