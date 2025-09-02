"use client"

import type { ShelfId } from "@/lib/types"

interface ShelfBlockProps {
  id: ShelfId
  onClick: (id: ShelfId) => void
  isCommon?: boolean
}

export default function ShelfBlock({ id, onClick, isCommon = false }: ShelfBlockProps) {
  const getShelfColor = () => {
    if (isCommon) return "bg-shelf-common text-white hover:bg-opacity-90"

    switch (id) {
      case "A":
        return "bg-shelf-a text-white hover:bg-opacity-90"
      case "B":
        return "bg-shelf-b text-white hover:bg-opacity-90"
      case "C":
        return "bg-shelf-c text-white hover:bg-opacity-90"
      case "D":
        return "bg-shelf-d text-white hover:bg-opacity-90"
      case "E":
        return "bg-shelf-e text-white hover:bg-opacity-90"
      case "F":
        return "bg-shelf-f text-white hover:bg-opacity-90"
      case "G":
        return "bg-shelf-g text-white hover:bg-opacity-90"
      default:
        return "bg-shelf-common text-white hover:bg-opacity-90"
    }
  }

  const getShelfIcon = () => {
    if (isCommon) {
      if (id === "çıkış yolu") {
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M15 14l5-5-5-5"></path>
            <path d="M20 9H9.5a5.5 5.5 0 1 0 0 11H13"></path>
          </svg>
        )
      }
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1"
        >
          <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          <path d="M3 9h18"></path>
          <path d="M9 21V9"></path>
        </svg>
      )
    }
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-1"
      >
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
        <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
      </svg>
    )
  }

  const handleClick = () => {
    if (onClick && typeof onClick === "function") {
      onClick(id)
    }
  }

  return (
    <div
      className={`w-full h-full rounded-md ${getShelfColor()} flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md border border-transparent hover:shadow-lg hover:border-white/20 shelf-block`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-center">
        {getShelfIcon()}
        <span className="font-bold text-sm sm:text-base md:text-lg lg:text-xl">{id}</span>
      </div>
    </div>
  )
}
