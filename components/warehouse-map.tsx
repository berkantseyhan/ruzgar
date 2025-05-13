"use client"

import { useState } from "react"
import type { ShelfId } from "@/lib/redis"
import ShelfBlock from "@/components/shelf-block"
import ShelfModal from "@/components/shelf-modal"

export default function WarehouseMap() {
  const [selectedShelf, setSelectedShelf] = useState<ShelfId | null>(null)

  const handleShelfClick = (shelfId: ShelfId) => {
    setSelectedShelf(shelfId)
  }

  const handleCloseModal = () => {
    setSelectedShelf(null)
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <span className="bg-primary/10 p-1 rounded-md mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
              <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
              <path d="M21 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4"></path>
              <path d="M9 21v-6"></path>
              <path d="M15 21v-6"></path>
            </svg>
          </span>
          Depo Yerleşim Planı
        </h2>
      </div>

      <div className="relative w-full max-w-5xl mx-auto aspect-[5/3] bg-muted/20 rounded-lg p-6 overflow-hidden border border-border shadow-md warehouse-map">
        {/* Top row: E, çıkış yolu, G */}
        <div className="absolute top-[5%] left-[5%] w-[25%] h-[15%]">
          <ShelfBlock id="E" onClick={handleShelfClick} />
        </div>
        <div className="absolute top-[5%] left-[35%] w-[30%] h-[35%]">
          <ShelfBlock id="çıkış yolu" onClick={handleShelfClick} isCommon />
        </div>
        <div className="absolute top-[5%] right-[5%] w-[25%] h-[15%]">
          <ShelfBlock id="G" onClick={handleShelfClick} />
        </div>

        {/* Middle row: D, F */}
        <div className="absolute top-[25%] left-[5%] w-[25%] h-[15%]">
          <ShelfBlock id="D" onClick={handleShelfClick} />
        </div>
        <div className="absolute top-[25%] right-[5%] w-[25%] h-[15%]">
          <ShelfBlock id="F" onClick={handleShelfClick} />
        </div>

        {/* Middle row: B and C */}
        <div className="absolute top-[45%] left-[20%] w-[20%] h-[15%]">
          <ShelfBlock id="B" onClick={handleShelfClick} />
        </div>
        <div className="absolute top-[45%] left-[45%] w-[20%] h-[15%]">
          <ShelfBlock id="C" onClick={handleShelfClick} />
        </div>

        {/* Bottom row: A and orta alan */}
        <div className="absolute bottom-[5%] left-[5%] w-[10%] h-[40%]">
          <ShelfBlock id="A" onClick={handleShelfClick} />
        </div>
        <div className="absolute bottom-[5%] left-[20%] w-[75%] h-[20%]">
          <ShelfBlock id="orta alan" onClick={handleShelfClick} isCommon />
        </div>

        {/* Grid lines for visual reference */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={`v-${i}`} className="border-r border-dashed border-muted-foreground/10 h-full" />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={`h-${i}`} className="border-b border-dashed border-muted-foreground/10 w-full" />
          ))}
        </div>
      </div>

      {selectedShelf && <ShelfModal shelfId={selectedShelf} onClose={handleCloseModal} />}
    </div>
  )
}
