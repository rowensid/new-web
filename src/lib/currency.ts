// Currency utility untuk konversi Rupiah ke USD
export interface CurrencyDisplay {
  idr: string
  usd: string
  rate: number
}

// Rate konversi (1 USD = 15,750 IDR, bisa diupdate sesuai rate saat ini)
export const EXCHANGE_RATE = 15750;

export function formatCurrency(amount: number): CurrencyDisplay {
  // Format Rupiah dengan custom format "IDR xxx.xxx"
  const idrAmount = new Intl.NumberFormat('id-ID').format(amount);
  const idr = `IDR ${idrAmount}`;

  // Format USD dengan custom format "xx.xx$"
  const usdAmount = amount / EXCHANGE_RATE;
  const usdFormatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdAmount);
  const usd = `${usdFormatted}$`;

  return {
    idr,
    usd,
    rate: EXCHANGE_RATE
  };
}

export function formatPriceDisplay(amount: number, showUSD: boolean = false): string {
  const { idr, usd } = formatCurrency(amount);
  
  if (showUSD) {
    return `${idr} / ${usd}`;
  }
  
  return idr;
}

export function formatRupiah(amount: number): string {
  const idrAmount = new Intl.NumberFormat('id-ID').format(amount);
  return `IDR ${idrAmount}`;
}

export function formatUSD(amount: number): string {
  const usdAmount = amount / EXCHANGE_RATE;
  const usdFormatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdAmount);
  return `${usdFormatted}$`;
}