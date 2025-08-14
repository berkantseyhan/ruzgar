// Pure mock authentication - NO external dependencies
const DEFAULT_PASSWORD = "warehouse123"

export async function getStoredPassword(): Promise<string | null> {
  console.log("🚫 MOCK: Getting stored password")
  return DEFAULT_PASSWORD
}

export async function setStoredPassword(password: string): Promise<boolean> {
  console.log("🚫 MOCK: Setting stored password (ignored in mock mode)")
  return true
}

export async function verifyPassword(inputPassword: string): Promise<boolean> {
  console.log("🚫 MOCK: Verifying password")
  return inputPassword === DEFAULT_PASSWORD
}
