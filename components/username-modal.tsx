"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Loader2 } from "lucide-react"

interface UsernameModalProps {
  isOpen: boolean
  onSubmit: (username: string) => void
  isLoading?: boolean
}

export default function UsernameModal({ isOpen, onSubmit, isLoading = false }: UsernameModalProps) {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      setError("Lütfen adınızı girin")
      return
    }

    if (trimmedUsername.length < 2) {
      setError("Ad en az 2 karakter olmalıdır")
      return
    }

    if (trimmedUsername.length > 50) {
      setError("Ad en fazla 50 karakter olabilir")
      return
    }

    setError("")
    onSubmit(trimmedUsername)
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    if (error) {
      setError("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl">Hoş Geldiniz!</DialogTitle>
          <DialogDescription>İşlem geçmişinde görünmesi için adınızı girin</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Adınız
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Örn: Ahmet Yılmaz"
              value={username}
              onChange={handleUsernameChange}
              className="w-full"
              maxLength={50}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !username.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Giriş Yapılıyor...
              </>
            ) : (
              "Sisteme Giriş Yap"
            )}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground text-center mt-4">Bu isim tüm işlemlerinizde görünecektir</div>
      </DialogContent>
    </Dialog>
  )
}
