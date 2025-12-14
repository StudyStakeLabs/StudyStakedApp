"use client"

import { useState } from "react"
import { CHARITIES, Charity } from "@/lib/charities"
import { Label } from "@/components/ui/label"
import { RadioGroup } from "@/components/ui/radio-group"
import { Heart, Droplet, Leaf, Cross } from "lucide-react"

interface CharitySelectorProps {
  selectedCharityId: string
  onSelect: (charityId: string) => void
}

const categoryIcons = {
  education: Heart,
  health: Cross,
  environment: Leaf,
  humanitarian: Droplet,
}

export function CharitySelector({ selectedCharityId, onSelect }: CharitySelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="font-mono text-sm font-bold uppercase">
        Select Charity (If You Fail)
      </Label>
      <RadioGroup value={selectedCharityId} onValueChange={onSelect}>
        <div className="space-y-2">
          {CHARITIES.map((charity) => {
            const Icon = categoryIcons[charity.category]
            const isSelected = selectedCharityId === charity.id
            
            return (
              <label
                key={charity.id}
                className={`flex cursor-pointer items-start gap-3 border-3 border-foreground p-3 transition-all hover:translate-x-0.5 hover:translate-y-0.5 ${
                  isSelected
                    ? "bg-primary text-primary-foreground brutal-shadow"
                    : "bg-card hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="charity"
                  value={charity.id}
                  checked={isSelected}
                  onChange={() => onSelect(charity.id)}
                  className="mt-1 h-4 w-4 border-2 border-foreground"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-mono text-sm font-bold">{charity.name}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs opacity-80">
                    {charity.description}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </RadioGroup>
    </div>
  )
}
