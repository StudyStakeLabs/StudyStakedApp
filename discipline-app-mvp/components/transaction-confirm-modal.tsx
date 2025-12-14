"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

interface TransactionConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  details?: Array<{ label: string; value: string }>
  warning?: string
}

export function TransactionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  details = [],
  warning,
}: TransactionConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      await onConfirm()
      setSuccess(true)
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error("Transaction failed:", err)
      setError(err instanceof Error ? err.message : "Transaction failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setError(null)
      setSuccess(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4">
      <div className="w-full max-w-md border-4 border-foreground bg-background p-6 brutal-shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-mono text-xl font-black uppercase">{title}</h2>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="border-2 border-foreground p-2 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Success State */}
        {success && (
          <div className="mb-6 flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
            <p className="font-mono text-lg font-bold text-green-500">Transaction Successful!</p>
          </div>
        )}

        {/* Normal State */}
        {!success && (
          <>
            {/* Description */}
            <p className="mb-6 font-mono text-sm font-bold text-muted-foreground">
              {description}
            </p>

            {/* Transaction Details */}
            {details.length > 0 && (
              <div className="mb-6 border-2 border-foreground bg-card p-4">
                <h3 className="mb-3 font-mono text-sm font-black uppercase">Transaction Details</h3>
                <div className="space-y-2">
                  {details.map((detail, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {detail.label}:
                      </span>
                      <span className="font-mono text-xs font-black">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            {warning && (
              <div className="mb-6 flex items-start gap-3 border-2 border-destructive bg-destructive/10 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                <p className="font-mono text-xs font-bold text-destructive">{warning}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 border-2 border-destructive bg-destructive/10 p-4">
                <p className="font-mono text-xs font-bold text-destructive">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                disabled={isProcessing}
                variant="outline"
                className="h-auto flex-1 border-3 border-foreground py-3 font-mono text-sm font-black uppercase hover:translate-x-0.5 hover:translate-y-0.5 brutal-shadow"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="h-auto flex-1 border-3 border-foreground bg-primary py-3 font-mono text-sm font-black uppercase text-primary-foreground hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-primary disabled:opacity-50 brutal-shadow"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
