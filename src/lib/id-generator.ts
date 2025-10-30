// Generate short numeric IDs
export function generateShortId(length: number = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

// Generate different types of short IDs
export function generateUserId(): string {
  return generateShortId(6) // 6 digit user ID
}

export function generateSessionId(): string {
  return generateShortId(12) // 12 digit session ID
}

export function generateServiceId(): string {
  return generateShortId(7) // 7 digit service ID
}

export function generateOrderId(): string {
  return generateShortId(9) // 9 digit order ID
}

export function generateInvoiceId(): string {
  return generateShortId(8) // 8 digit invoice ID
}

export function generateDepositId(): string {
  return generateShortId(8) // 8 digit deposit ID
}

export function generateTransactionId(): string {
  return generateShortId(10) // 10 digit transaction ID
}

export function generatePaymentSettingId(): string {
  return generateShortId(7) // 7 digit payment setting ID
}

export function generateBankAccountId(): string {
  return generateShortId(6) // 6 digit bank account ID
}

export function generateEWalletAccountId(): string {
  return generateShortId(6) // 6 digit e-wallet account ID
}

export function generatePterodactylServerId(): string {
  return generateShortId(8) // 8 digit pterodactyl server ID
}

export function generateApiConfigurationId(): string {
  return generateShortId(8) // 8 digit API config ID
}

export function generateLoginHistoryId(): string {
  return generateShortId(10) // 10 digit login history ID
}

export function generateStoreItemId(): string {
  return generateShortId(7) // 7 digit store item ID
}