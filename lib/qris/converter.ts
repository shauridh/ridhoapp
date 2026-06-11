import { calculateCRC16 } from "./crc16"
import { parseTLV } from "./parser"
import type { ConvertOptions, TLV } from "./types"

function buildTLVString(elements: TLV[]): string {
  return elements
    .map((el) => {
      const length = el.value.length.toString().padStart(2, "0")
      return `${el.tag}${length}${el.value}`
    })
    .join("")
}

function makeTLV(tag: string, value: string): TLV {
  return { tag, length: value.length, value }
}

// Ubah QRIS statis menjadi dinamis dengan nominal transaksi.
// - tag 01 (Point of Initiation): 11 (statis) -> 12 (dinamis)
// - sisipkan tag 54 (Transaction Amount) sebelum tag 58 (Country Code)
// - opsional fee: tag 55/56 (fixed) atau 55/57 (percent)
// - hitung ulang CRC (tag 63).
export function convertQRIS(qrisString: string, options: ConvertOptions): string {
  const elements = parseTLV(qrisString)
  const result: TLV[] = []
  let amountInserted = false
  const managedTags = new Set(["54", "55", "56", "57", "63"])

  for (const el of elements) {
    if (managedTags.has(el.tag)) continue

    if (el.tag === "01") {
      result.push(makeTLV("01", "12"))
      continue
    }

    if (el.tag === "58" && !amountInserted) {
      result.push(makeTLV("54", options.amount.toString()))
      if (options.fee) {
        if (options.fee.type === "fixed") {
          result.push(makeTLV("55", "02"))
          result.push(makeTLV("56", options.fee.value.toString()))
        } else {
          result.push(makeTLV("55", "03"))
          result.push(makeTLV("57", options.fee.value.toString()))
        }
      }
      amountInserted = true
    }

    result.push(el)
  }

  const withoutCRC = buildTLVString(result)
  const crcInput = withoutCRC + "6304"
  const crc = calculateCRC16(crcInput)
  return crcInput + crc
}
