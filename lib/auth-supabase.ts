import { createServerClient } from "./supabase"
import bcrypt from "bcryptjs"

// Get stored password from Supabase
export async function getStoredPassword(): Promise<string | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("auth_passwords").select("password_hash").eq("id", "main").single()

    if (error && error.code !== "PGRST116") {
      // Not found error
      console.error("Error fetching password from Supabase:", error)
      return null
    }

    return data?.password_hash || null
  } catch (error) {
    console.error("Error fetching password from Supabase:", error)
    return null
  }
}

// Set password in Supabase
export async function setStoredPassword(password: string): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const passwordHash = await bcrypt.hash(password, 10)

    const { error } = await supabase.from("auth_passwords").upsert({
      id: "main",
      password_hash: passwordHash,
    })

    if (error) {
      console.error("Error setting password in Supabase:", error)
      return false
    }

    console.log("Password set in Supabase")
    return true
  } catch (error) {
    console.error("Error setting password in Supabase:", error)
    return false
  }
}

// Verify password against stored hash
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  try {
    const storedHash = await getStoredPassword()

    if (!storedHash) {
      console.error("No password found in Supabase")
      return false
    }

    const isValid = await bcrypt.compare(inputPassword, storedHash)
    return isValid
  } catch (error) {
    console.error("Error verifying password:", error)
    return false
  }
}
