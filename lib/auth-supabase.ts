import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Fixed UUID for the main password record
const MAIN_PASSWORD_ID = "00000000-0000-0000-0000-000000000001"

export async function getStoredPassword(): Promise<string | null> {
  try {
    console.log("Fetching password from Supabase with ID:", MAIN_PASSWORD_ID)

    const { data, error } = await supabase
      .from("Depo_Ruzgar_Auth_Passwords")
      .select("password_hash")
      .eq("id", MAIN_PASSWORD_ID)
      .single()

    if (error) {
      console.error("Supabase query error:", error)
      throw new Error(`Error fetching password from Supabase: ${error.message}`)
    }

    if (!data) {
      console.log("No password record found")
      return null
    }

    console.log("Password hash retrieved successfully")
    return data.password_hash
  } catch (error) {
    console.error("Error in getStoredPassword:", error)
    throw error
  }
}

export async function setStoredPassword(password: string): Promise<void> {
  try {
    console.log("Generating bcrypt hash for password...")
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    console.log("Generated hash:", hashedPassword)

    const { error } = await supabase.from("Depo_Ruzgar_Auth_Passwords").upsert({
      id: MAIN_PASSWORD_ID,
      username: "admin",
      password_hash: hashedPassword,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error storing password:", error)
      throw new Error(`Error storing password in Supabase: ${error.message}`)
    }

    console.log("Password stored successfully in Supabase")
  } catch (error) {
    console.error("Error in setStoredPassword:", error)
    throw error
  }
}

export async function verifyPassword(inputPassword: string): Promise<boolean> {
  try {
    console.log("Starting password verification...")

    let storedHash = await getStoredPassword()

    if (!storedHash) {
      console.log("Password record not found, attempting to initialize...")
      // Auto-initialize with "admin123" if no password exists
      await setStoredPassword("admin123")
      storedHash = await getStoredPassword()

      if (!storedHash) {
        throw new Error("Failed to initialize password")
      }
      console.log("Default password initialized successfully with hash:", storedHash)
    }

    console.log("Verifying password against hash:", storedHash)
    const isValid = await bcrypt.compare(inputPassword, storedHash)
    console.log("Password verification result:", isValid)

    return isValid
  } catch (error) {
    console.error("Error in verifyPassword:", error)
    throw error
  }
}

export async function initializePassword(): Promise<boolean> {
  try {
    console.log("Checking if password is already initialized...")
    const existingPassword = await getStoredPassword()

    if (existingPassword) {
      console.log("Password already initialized")
      return true
    }

    console.log("Initializing default password...")
    await setStoredPassword("admin123")
    console.log("Password initialized successfully")
    return true
  } catch (error) {
    console.error("Error initializing password:", error)
    return false
  }
}
