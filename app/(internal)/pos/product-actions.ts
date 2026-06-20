"use server";

import { getBestSellerIds } from "@/lib/data/best-sellers";

export async function fetchBestSellerIds(): Promise<string[]> {
  return getBestSellerIds();
}
