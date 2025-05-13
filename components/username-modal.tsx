"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { User, LogIn } from "lucide-react"

interface UsernameModalProps {
  onComplete: (username: string) => void
}

export default function UsernameModal({ onComplete }: UsernameModalProps) {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("İsim alanı boş bırakılamaz.")
      return
    }

    // Store username in localStorage
    localStorage.setItem("username", username.trim())

    // Notify parent component
    onComplete(username.trim())

    toast({
      title: "Hoş Geldiniz",
      description: `Merhaba, ${username.trim()}! Sisteme başarıyla giriş yaptınız.`,
    })
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md shadow-xl border-2 animate-fadeIn">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Kullanıcı Bilgisi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username" className="font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                İsminizi giriniz:
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError("")
                }}
                placeholder="Adınız ve soyadınız"
                autoComplete="name"
                className="transition-colors duration-200"
              />
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full transition-colors duration-200 bg-primary flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Devam Et
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
