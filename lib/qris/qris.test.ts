import { describe, it, expect } from "vitest"
import { calculateCRC16 } from "./crc16"
import { parseTLV } from "./parser"
import { convertQRIS } from "./converter"

describe("calculateCRC16", () => {
  it("menghasilkan 4 karakter hex uppercase", () => {
    const crc = calculateCRC16("hello6304")
    expect(crc).toMatch(/^[0-9A-F]{4}$/)
  })
  it("deterministik untuk input sama", () => {
    expect(calculateCRC16("abc")).toBe(calculateCRC16("abc"))
  })
})

describe("parseTLV", () => {
  it("mem-parse tag-length-value sederhana", () => {
    // tag 00, len 02, value 01
    const els = parseTLV("000201")
    expect(els[0]).toMatchObject({ tag: "00", value: "01" })
  })
  it("mem-parse beberapa elemen berurutan", () => {
    const els = parseTLV("0002010102AB")
    expect(els).toHaveLength(2)
    expect(els[1]).toMatchObject({ tag: "01", value: "AB" })
  })
})

describe("convertQRIS", () => {
  // QRIS statis minimal dengan tag 01 = 11 (statis)
  // 00 02 01 | 01 02 11 | 58 02 ID | 6304XXXX
  const staticQr = "000201" + "010211" + "5802ID" + "6304ABCD"

  it("mengubah static (010211) jadi dynamic (010212) dan menyisipkan amount tag 54", () => {
    const result = convertQRIS(staticQr, { amount: 25000 })
    expect(result).toContain("010212")
    expect(result).toContain("540525000")
  })
  it("mengakhiri dengan CRC tag 6304 + 4 hex", () => {
    const result = convertQRIS(staticQr, { amount: 25000 })
    expect(result.slice(-8, -4)).toBe("6304")
    expect(result.slice(-4)).toMatch(/^[0-9A-F]{4}$/)
  })
})
