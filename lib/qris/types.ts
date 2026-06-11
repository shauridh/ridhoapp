export interface TLV {
  tag: string
  length: number
  value: string
}

export interface QrisFee {
  type: "fixed" | "percent"
  value: number
}

export interface ConvertOptions {
  amount: number
  fee?: QrisFee
}
