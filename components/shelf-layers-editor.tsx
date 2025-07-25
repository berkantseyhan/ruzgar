"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash2, Layers, Save, X } from "lucide-react"
import type { ShelfId, ShelfLayout } from "@/lib/redis"

interface ShelfLayersEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shelf: ShelfLayout
  onSave: (updatedShelf: ShelfLayout) => void
}

export default function ShelfLayersEditor({ open, onOpenChange, shelf, onSave }: ShelfLayersEditorProps) {
  const [layers, setLayers] = useState<string[]>(shelf.customLayers || getDefaultLayers(shelf.id))
  const [newLayerName, setNewLayerName] = useState("")
  const { toast } = useToast()

  function getDefaultLayers(shelfId: ShelfId): string[] {
    if (shelfId === "çıkış yolu") {
      return ["dayının alanı", "cam kenarı", "tuvalet önü", "merdiven tarafı"]
    } else if (shelfId === "orta alan") {
      return ["a önü", "b önü", "c önü", "mutfak yanı", "tezgah yanı"]
    } else {
      return ["üst kat", "orta kat", "alt kat"]
    }
  }

  const handleAddLayer = () => {
    const trimmedName = newLayerName.trim()
    if (!trimmedName) {
      toast({
        title: "Hata",
        description: "Katman adı boş olamaz.",
        variant: "destructive",
      })
      return
    }

    if (layers.some((layer) => layer.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        title: "Hata",
        description: "Bu katman adı zaten mevcut.",
        variant: "destructive",
      })
      return
    }

    setLayers([...layers, trimmedName])
    setNewLayerName("")
  }

  const handleRemoveLayer = (index: number) => {
    if (layers.length <= 1) {
      toast({
        title: "Hata",
        description: "En az bir katman bulunmalıdır.",
        variant: "destructive",
      })
      return
    }

    setLayers(layers.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (layers.length === 0) {
      toast({
        title: "Hata",
        description: "En az bir katman bulunmalıdır.",
        variant: "destructive",
      })
      return
    }

    const updatedShelf: ShelfLayout = {
      ...shelf,
      customLayers: layers,
    }

    onSave(updatedShelf)
    onOpenChange(false)

    toast({
      title: "Başarılı",
      description: `${shelf.id} rafının katmanları güncellendi.`,
    })
  }

  const handleReset = () => {
    setLayers(getDefaultLayers(shelf.id))
    toast({
      title: "Sıfırlandı",
      description: "Katmanlar varsayılan haline getirildi.",
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddLayer()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {shelf.id} - Katman Düzenleyici
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current layers */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Mevcut Katmanlar</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {layers.map((layer, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <Badge variant="outline" className="font-normal">
                    {layer}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLayer(index)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    disabled={layers.length <= 1}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add new layer */}
          <div>
            <Label htmlFor="newLayer" className="text-sm font-medium mb-2 block">
              Yeni Katman Ekle
            </Label>
            <div className="flex gap-2">
              <Input
                id="newLayer"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Katman adı girin..."
                className="flex-1"
              />
              <Button onClick={handleAddLayer} size="sm" className="px-3">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
            <p className="font-medium mb-1">💡 İpucu:</p>
            <p>
              Katmanları özelleştirerek rafınızı daha iyi organize edebilirsiniz. Örneğin: "1. Kat", "2. Kat", "Sol
              Taraf", "Sağ Taraf" gibi.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2 bg-transparent">
            <X className="h-4 w-4" />
            Sıfırla
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
