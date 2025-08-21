const bcrypt = require("bcryptjs")

async function generateHash() {
  const password = "admin123"
  const saltRounds = 10

  try {
    const hash = await bcrypt.hash(password, saltRounds)
    console.log("Password:", password)
    console.log("Bcrypt Hash:", hash)

    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash)
    console.log("Verification:", isValid)

    return hash
  } catch (error) {
    console.error("Error generating hash:", error)
  }
}

generateHash()
