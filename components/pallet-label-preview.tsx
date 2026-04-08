import React from "react"

interface ProductLine {
  description: string
  packages: string
  quantity: string
}

interface LabelData {
  palletNumber: number
  orderNumber: string
  date: string
  receiverInfo: string
  productLines: ProductLine[]
  palletWeight: string
  dispatchNote?: string // Add dispatch note to interface
}

interface PalletLabelPreviewProps {
  labelData: LabelData
}

const senderInfo = {
  name: "RÜZGAR CIVATA BAĞLANTI ELEMANLARI İMALATI SANAYİ TİCARET LİMİTED ŞİRKETİ",
  address: "YAKUPLU MAH. 226. SK. Raal Statik NO: 9 A İÇ KAPI NO: A BEYLİKDÜZÜ/ İSTANBUL",
  phone: "TEL: (0) 533 142 79 59",
}

export const PalletLabelPreview = React.forwardRef<HTMLDivElement, PalletLabelPreviewProps>(({ labelData }, ref) => {
  const totalPackages = labelData.productLines.reduce((sum, line) => sum + (Number(line.packages) || 0), 0)

  return (
    <div ref={ref} className="p-4 bg-white text-black font-sans text-xs print:p-0">
      <div className="border-2 border-black w-full">
        {/* Header Section */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/2 p-2 border-r-2 border-black">
            <h2 className="font-bold mb-1">GÖNDEREN</h2>
            <p className="font-semibold">{senderInfo.name}</p>
            <p>{senderInfo.address}</p>
            <p>{senderInfo.phone}</p>
          </div>
          <div className="w-1/2 p-2 relative">
            {/* Sipariş No ve Tarih - Üst sağ köşe */}
            <div className="absolute top-1 right-1 text-right">
              {labelData.orderNumber && (
                <div className="mb-1">
                  <span className="font-bold">SİPARİŞ NO: </span>
                  <span>{labelData.orderNumber}</span>
                </div>
              )}
              <div>
                <span className="font-bold">TARİH: </span>
                <span>{labelData.date}</span>
              </div>
            </div>

            {/* Palet Numarası - Merkez - PDF için özel düzen */}
            <div className="flex flex-col items-center justify-center h-full pt-8 print:pt-12 print:flex print:flex-col print:items-center print:justify-center">
              <h2 className="font-bold mb-4 print:mb-6 text-center print:text-center print:display-block">
                PALET NUMARASI
              </h2>
              <div className="print:display-block print:text-center print:margin-top-4">
                <p className="text-8xl font-bold print:text-9xl print:display-block print:text-center print:line-height-none print:margin-0">
                  {labelData.palletNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Receiver Section */}
        <div className="border-b-2 border-black p-2">
          <h2 className="font-bold mb-1">ALICI</h2>
          <div className="whitespace-pre-wrap">{labelData.receiverInfo}</div>
        </div>

        {/* Table Section */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="border-r-2 border-black p-1 font-bold w-[60%]">MALZEME AÇIKLAMASI</th>
              <th className="border-r-2 border-black p-1 font-bold w-[20%]">KOLİ/ÇUVAL</th>
              <th className="p-1 font-bold w-[20%]">MİKTAR/ADET</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, index) => {
              const line = labelData.productLines[index]
              return (
                <tr key={index} className="border-b border-black h-8">
                  <td className="border-r-2 border-black p-1 text-center">{line?.description || ""}</td>
                  <td className="border-r-2 border-black p-1 text-center">{line?.packages || ""}</td>
                  <td className="p-1 text-center">{line?.quantity || ""}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Footer Section - İki satırlı düzen */}
        <div className="border-t-2 border-black">
          {/* Üst satır - Palet Ağırlığı ve Toplam Koli */}
          <div className="flex border-b-2 border-black">
            <div className="w-1/2 p-2 flex items-center">
              <span className="font-bold mr-2">PALET AĞIRLIĞI (KG):</span>
              <span>{labelData.palletWeight}</span>
            </div>
            <div className="w-1/2 p-2 flex items-center border-l-2 border-black">
              <span className="font-bold mr-2">TOPLAM KOLİ & ÇUVAL:</span>
              <span>{totalPackages}</span>
            </div>
          </div>
          {/* Alt satır - İrsaliye No */}
          <div className="p-2 flex items-center">
            <span className="font-bold mr-2">İRSALİYE NO:</span>
            <span>{labelData.dispatchNote || ""}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

PalletLabelPreview.displayName = "PalletLabelPreview"
