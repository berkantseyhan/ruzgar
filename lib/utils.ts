import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts Turkish characters to their Latin equivalents
 * @param text Text containing Turkish characters
 * @returns Text with Turkish characters replaced with Latin equivalents
 */
export function convertTurkishToLatin(text: string): string {
  const turkishChars: Record<string, string> = {
    ç: "c",
    Ç: "C",
    ğ: "g",
    Ğ: "G",
    ı: "i",
    İ: "I",
    ö: "o",
    Ö: "O",
    ş: "s",
    Ş: "S",
    ü: "u",
    Ü: "U",
  }

  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => turkishChars[match] || match)
}

/**
 * Converts column headers to Latin equivalents for CSV export
 */
export function convertHeadersForCSV(headers: string[]): string[] {
  return headers.map((header) => convertTurkishToLatin(header))
}

export function prepareForCSV(data: any[]): string {
  const csvRows = []
  const headers = Object.keys(data[0])
  csvRows.push(headers.join(","))

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      return `"${value}"`
    })
    csvRows.push(values.join(","))
  }

  return csvRows.join("\n")
}
