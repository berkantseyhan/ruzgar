import { supabase, type MachineTile, type ProductionEntry, type OperationLog, type User } from "@/lib/supabase"

// Layout Services
export class LayoutService {
  static async getActiveLayout(): Promise<MachineTile[]> {
    try {
      const { data, error } = await supabase
        .from("pul_machine_layouts")
        .select("tiles")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.log("No active layout found, using default")
        return this.getDefaultLayout()
      }

      return data.tiles as MachineTile[]
    } catch (error) {
      console.error("Error fetching layout:", error)
      return this.getDefaultLayout()
    }
  }

  static async saveLayout(tiles: MachineTile[], createdBy: string): Promise<boolean> {
    try {
      // Önce mevcut aktif layout'ları pasif yap
      await supabase.from("pul_machine_layouts").update({ is_active: false }).eq("is_active", true)

      // Yeni layout'u kaydet
      const { error } = await supabase.from("pul_machine_layouts").insert({
        layout_name: "default",
        tiles,
        created_by: createdBy,
        is_active: true,
      })

      if (error) {
        console.error("Error saving layout:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error saving layout:", error)
      return false
    }
  }

  static getDefaultLayout(): MachineTile[] {
    return [
      // Row 1
      { id: "machine1", name: "Makine 1", boxId: "A", x: 50, y: 50, width: 200, height: 120, color: "bg-blue-500" },
      { id: "machine2", name: "Makine 2", boxId: "B", x: 270, y: 50, width: 200, height: 120, color: "bg-purple-500" },
      { id: "machine3", name: "Makine 3", boxId: "C", x: 490, y: 50, width: 200, height: 120, color: "bg-pink-500" },
      { id: "machine4", name: "Makine 4", boxId: "D", x: 710, y: 50, width: 200, height: 120, color: "bg-red-500" },
      { id: "machine5", name: "Makine 5", boxId: "E", x: 930, y: 50, width: 200, height: 120, color: "bg-orange-500" },

      // Row 2
      { id: "machine6", name: "Makine 6", boxId: "F", x: 50, y: 190, width: 200, height: 120, color: "bg-yellow-500" },
      { id: "machine7", name: "Makine 7", boxId: "G", x: 270, y: 190, width: 200, height: 120, color: "bg-green-500" },
      { id: "machine8", name: "Makine 8", boxId: "H", x: 490, y: 190, width: 200, height: 120, color: "bg-teal-500" },
      { id: "machine9", name: "Makine 9", boxId: "I", x: 710, y: 190, width: 200, height: 120, color: "bg-cyan-500" },
      {
        id: "machine10",
        name: "Makine 10",
        boxId: "J",
        x: 930,
        y: 190,
        width: 200,
        height: 120,
        color: "bg-indigo-500",
      },

      // Row 3
      {
        id: "machine11",
        name: "Makine 11",
        boxId: "K",
        x: 50,
        y: 330,
        width: 200,
        height: 120,
        color: "bg-violet-500",
      },
      {
        id: "machine12",
        name: "Makine 12",
        boxId: "L",
        x: 270,
        y: 330,
        width: 200,
        height: 120,
        color: "bg-fuchsia-500",
      },
      { id: "machine13", name: "Makine 13", boxId: "M", x: 490, y: 330, width: 200, height: 120, color: "bg-rose-500" },
      {
        id: "machine14",
        name: "Makine 14",
        boxId: "N",
        x: 710,
        y: 330,
        width: 200,
        height: 120,
        color: "bg-amber-500",
      },
      { id: "machine15", name: "Makine 15", boxId: "O", x: 930, y: 330, width: 200, height: 120, color: "bg-lime-500" },
    ]
  }
}

// Production Services
export class ProductionService {
  static async getEntries(machineId: string): Promise<ProductionEntry[]> {
    try {
      const { data, error } = await supabase
        .from("pul_production_entries")
        .select("*")
        .eq("machine_id", machineId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching entries:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching entries:", error)
      return []
    }
  }

  static async getAllEntries(): Promise<ProductionEntry[]> {
    try {
      const { data, error } = await supabase
        .from("pul_production_entries")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching all entries:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching all entries:", error)
      return []
    }
  }

  static async checkTimeFieldsSupport(): Promise<boolean> {
    try {
      // Try to fetch the table schema to check if time fields exist
      const { data, error } = await supabase.from("pul_production_entries").select("start_time, end_time").limit(1)

      // If we get an error about columns not existing, time fields are not supported
      if (error && (error.message.includes("column") || error.message.includes("does not exist"))) {
        console.log("Time fields not supported:", error.message)
        return false
      }

      // If we get data or a "no rows" error, time fields are supported
      console.log("Time fields are supported")
      return true
    } catch (error) {
      console.error("Error checking time fields support:", error)
      return false
    }
  }

  static async addEntry(
    entry: Omit<ProductionEntry, "id" | "created_at" | "updated_at">,
  ): Promise<ProductionEntry | null> {
    try {
      // First check if time fields are supported
      const timeFieldsSupported = await this.checkTimeFieldsSupport()

      // Create entry object based on what's supported
      const entryData: any = {
        machine_id: entry.machine_id,
        date: entry.date,
        operator: entry.operator,
        material: entry.material,
        product: entry.product,
        product_dimension: entry.product_dimension,
        pressed_kg: entry.pressed_kg,
        pressed_pieces: entry.pressed_pieces,
        target_kg: entry.target_kg,
        target_pieces: entry.target_pieces,
        customer: entry.customer,
        notes: entry.notes,
        created_by: entry.created_by,
      }

      // Only add time fields if they're supported
      if (timeFieldsSupported) {
        if (entry.start_time) entryData.start_time = entry.start_time
        if (entry.end_time) entryData.end_time = entry.end_time
      }

      const { data, error } = await supabase.from("pul_production_entries").insert(entryData).select().single()

      if (error) {
        console.error("Error adding entry:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error adding entry:", error)
      return null
    }
  }

  static async deleteEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("pul_production_entries").delete().eq("id", id)

      if (error) {
        console.error("Error deleting entry:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error deleting entry:", error)
      return false
    }
  }

  static async updateEntry(id: string, updates: Partial<ProductionEntry>): Promise<boolean> {
    try {
      // First check if time fields are supported
      const timeFieldsSupported = await this.checkTimeFieldsSupport()

      // Create updates object based on what's supported
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // Remove time fields from updates if they're not supported
      if (!timeFieldsSupported) {
        delete updateData.start_time
        delete updateData.end_time
      }

      const { error } = await supabase.from("pul_production_entries").update(updateData).eq("id", id)

      if (error) {
        console.error("Error updating entry:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error updating entry:", error)
      return false
    }
  }
}

// Operations Log Services
export class OperationsService {
  static async getOperationsLog(): Promise<OperationLog[]> {
    try {
      const { data, error } = await supabase
        .from("pul_operations_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

      if (error) {
        console.error("Error fetching operations log:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching operations log:", error)
      return []
    }
  }

  static async logOperation(operation: Omit<OperationLog, "id" | "created_at">): Promise<boolean> {
    try {
      const { error } = await supabase.from("pul_operations_log").insert(operation)

      if (error) {
        console.error("Error logging operation:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error logging operation:", error)
      return false
    }
  }
}

// User Services
export class UserService {
  static async getOrCreateUser(name: string): Promise<User | null> {
    try {
      // Önce kullanıcıyı ara
      const { data: existingUsers, error: searchError } = await supabase.from("pul_users").select("*").eq("name", name)

      // Eğer arama hatası varsa ve "PGRST116" (no rows) değilse, gerçek bir hata
      if (searchError && !searchError.message.includes("PGRST116")) {
        console.error("Error searching for user:", searchError)
        return null
      }

      // Kullanıcı bulundu
      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0]
        // Son giriş zamanını güncelle
        const { error: updateError } = await supabase
          .from("pul_users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", existingUser.id)

        if (updateError) {
          console.error("Error updating user login time:", updateError)
          // Güncelleme hatası olsa bile kullanıcıyı döndür
        }

        return existingUser
      }

      // Kullanıcı yoksa oluştur
      const { data: newUser, error: createError } = await supabase
        .from("pul_users")
        .insert({
          name: name.trim(),
          last_login: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating user:", createError)
        return null
      }

      return newUser
    } catch (error) {
      console.error("Error with user operations:", error)
      return null
    }
  }
}

// Customer Services
export class CustomerService {
  // Etiket oluşturma için sadece aktif müşteriler
  static async getAllCustomers(): Promise<{ id: string; company_name: string; address: string }[]> {
    try {
      const { data, error } = await supabase
        .from("pul_musteri_bilgileri")
        .select("id, company_name, address")
        .eq("is_active", true) // Sadece aktif müşteriler
        .order("company_name", { ascending: true })

      if (error) {
        console.error("Error fetching customers:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching customers:", error)
      return []
    }
  }

  static async saveCustomer(customer: {
    company_name: string
    address: string
    created_by: string
    contact_person?: string
    phone?: string
    email?: string
  }): Promise<{ id: string; company_name: string; address: string } | null> {
    try {
      const { data, error } = await supabase
        .from("pul_musteri_bilgileri")
        .insert({
          ...customer,
          is_active: true,
        })
        .select("id, company_name, address")
        .single()

      if (error) {
        console.error("Error saving customer:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error saving customer:", error)
      return null
    }
  }

  // Müşteri yönetimi için sayfalama ile
  static async getAllCustomersDetailed(
    page = 1,
    limit = 5,
  ): Promise<{
    customers: any[]
    totalCount: number
    totalPages: number
    currentPage: number
  }> {
    try {
      // Toplam sayıyı al
      const { count, error: countError } = await supabase
        .from("pul_musteri_bilgileri")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

      if (countError) {
        console.error("Error counting customers:", countError)
        return { customers: [], totalCount: 0, totalPages: 0, currentPage: 1 }
      }

      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / limit)

      // Sayfalı veriyi al
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error } = await supabase
        .from("pul_musteri_bilgileri")
        .select("*")
        .eq("is_active", true)
        .order("company_name", { ascending: true })
        .range(from, to)

      if (error) {
        console.error("Error fetching detailed customers:", error)
        return { customers: [], totalCount: 0, totalPages: 0, currentPage: 1 }
      }

      return {
        customers: data || [],
        totalCount,
        totalPages,
        currentPage: page,
      }
    } catch (error) {
      console.error("Error fetching detailed customers:", error)
      return { customers: [], totalCount: 0, totalPages: 0, currentPage: 1 }
    }
  }

  static async updateCustomer(id: string, updates: any): Promise<boolean> {
    try {
      // Güvenli güncelleme - sadece mevcut alanları güncelle
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      // Sadece geçerli alanları ekle
      if (updates.company_name !== undefined) updateData.company_name = updates.company_name
      if (updates.address !== undefined) updateData.address = updates.address
      if (updates.contact_person !== undefined) updateData.contact_person = updates.contact_person
      if (updates.phone !== undefined) updateData.phone = updates.phone
      if (updates.email !== undefined) updateData.email = updates.email
      if (updates.updated_by !== undefined) updateData.updated_by = updates.updated_by

      const { error } = await supabase.from("pul_musteri_bilgileri").update(updateData).eq("id", id)

      if (error) {
        console.error("Error updating customer:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error updating customer:", error)
      return false
    }
  }

  // Müşteriyi tamamen veritabanından sil (HARD DELETE)
  static async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("pul_musteri_bilgileri").delete().eq("id", id)

      if (error) {
        console.error("Error deleting customer:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error deleting customer:", error)
      return false
    }
  }

  // Eğer soft delete istiyorsanız bu fonksiyonu kullanın
  static async softDeleteCustomer(id: string): Promise<boolean> {
    try {
      // Soft delete - is_active false yap
      const { error } = await supabase
        .from("pul_musteri_bilgileri")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        console.error("Error soft deleting customer:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error soft deleting customer:", error)
      return false
    }
  }
}

// Label Services
export class LabelService {
  static async getNextPalletNumber(): Promise<number> {
    try {
      // Get the highest pallet number from existing labels
      const { data, error } = await supabase
        .from("pul_labels")
        .select("pallet_number")
        .order("pallet_number", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows found
        console.error("Error fetching highest pallet number:", error)
        // Return a default starting number if there's an error
        return 1
      }

      // If no labels exist yet, start with 1
      if (!data || error?.code === "PGRST116") {
        return 1
      }

      // Return the next number
      return (data.pallet_number || 0) + 1
    } catch (error) {
      console.error("Error in getNextPalletNumber:", error)
      // Fallback to a timestamp-based number if everything fails
      return Math.floor(Date.now() / 1000) % 10000 // Last 4 digits of timestamp
    }
  }

  static async checkOrderNumberColumnExists(): Promise<boolean> {
    try {
      // Try to select order_number column to check if it exists
      const { error } = await supabase.from("pul_labels").select("order_number").limit(1)

      if (error && (error.message.includes("column") || error.message.includes("does not exist"))) {
        console.log("Order number column not found:", error.message)
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking order_number column:", error)
      return false
    }
  }

  static async saveLabel(labelData: any): Promise<boolean> {
    try {
      // Validate required fields
      if (!labelData.pallet_number || isNaN(labelData.pallet_number) || labelData.pallet_number <= 0) {
        console.error("Invalid pallet number:", labelData.pallet_number)
        return false
      }

      // Check if order_number column exists
      const orderNumberExists = await this.checkOrderNumberColumnExists()

      // Create the data object based on what columns exist
      const dataToSave: any = {
        pallet_number: Number(labelData.pallet_number), // Ensure it's a number
        date: labelData.date,
        receiver_info: labelData.receiver_info || "",
        product_lines: labelData.product_lines || [],
        pallet_weight: Number(labelData.pallet_weight) || 0,
        total_packages: Number(labelData.total_packages) || 0,
        created_by: labelData.created_by || "Unknown",
      }

      // Only add order_number if the column exists
      if (orderNumberExists && labelData.order_number) {
        dataToSave.order_number = labelData.order_number
      }

      const { error } = await supabase.from("pul_labels").insert(dataToSave)

      if (error) {
        console.error("Error saving label:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error saving label:", error)
      return false
    }
  }

  static async getLabelHistory(limit = 100): Promise<any[]> {
    try {
      // Check if order_number column exists
      const orderNumberExists = await this.checkOrderNumberColumnExists()

      // Select columns based on what exists
      const selectColumns = orderNumberExists
        ? "*"
        : "id, pallet_number, date, receiver_info, product_lines, pallet_weight, total_packages, created_by, created_at"

      const { data, error } = await supabase
        .from("pul_labels")
        .select(selectColumns)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching label history:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching label history:", error)
      return []
    }
  }

  static async deleteLabel(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("pul_labels").delete().eq("id", id)

      if (error) {
        console.error("Error deleting label:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error deleting label:", error)
      return false
    }
  }

  // Veritabanından en son kullanılan sipariş numarasını kontrol ederek yeni numara oluştur
  static async getNextOrderNumber(): Promise<string> {
    try {
      console.log("Getting next order number from database...")

      // Check if order_number column exists
      const orderNumberExists = await this.checkOrderNumberColumnExists()

      if (!orderNumberExists) {
        console.log("Order number column doesn't exist, using fallback generation")
        return this.generateFallbackOrderNumber()
      }

      // Bugünün tarihini al (YYYYMMDD formatında)
      const today = new Date()
      const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, "") // YYYYMMDD
      const todayPrefix = `SIP${datePrefix}` // SIP20250630

      console.log("Looking for existing orders with prefix:", todayPrefix)

      // Bugün oluşturulan sipariş numaralarını bul
      const { data: existingOrders, error } = await supabase
        .from("pul_labels")
        .select("order_number")
        .like("order_number", `${todayPrefix}%`)
        .order("order_number", { ascending: false })

      if (error) {
        console.error("Error fetching existing order numbers:", error)
        return this.generateFallbackOrderNumber()
      }

      console.log("Found existing orders:", existingOrders)

      // Eğer bugün hiç sipariş yoksa, 0001 ile başla
      if (!existingOrders || existingOrders.length === 0) {
        const newOrderNumber = `${todayPrefix}0001`
        console.log("No orders found for today, starting with:", newOrderNumber)
        return newOrderNumber
      }

      // Mevcut numaraları analiz et ve en büyük sıra numarasını bul
      let maxSequence = 0
      const usedSequences = new Set<number>()

      for (const order of existingOrders) {
        if (order.order_number && order.order_number.startsWith(todayPrefix)) {
          // Son 4 haneli sıra numarasını çıkar
          const sequencePart = order.order_number.slice(-4)
          const sequenceNumber = Number.parseInt(sequencePart, 10)

          if (!isNaN(sequenceNumber)) {
            usedSequences.add(sequenceNumber)
            maxSequence = Math.max(maxSequence, sequenceNumber)
          }
        }
      }

      console.log(
        "Used sequences:",
        Array.from(usedSequences).sort((a, b) => a - b),
      )
      console.log("Max sequence found:", maxSequence)

      // Boş olan en küçük numarayı bul (silinen numaraları yeniden kullan)
      let nextSequence = 1
      while (usedSequences.has(nextSequence) && nextSequence <= maxSequence) {
        nextSequence++
      }

      // Eğer tüm numaralar doluysa, bir sonraki numarayı kullan
      if (nextSequence <= maxSequence) {
        console.log("Found gap in sequence, using:", nextSequence)
      } else {
        nextSequence = maxSequence + 1
        console.log("No gaps found, using next sequence:", nextSequence)
      }

      const newOrderNumber = `${todayPrefix}${nextSequence.toString().padStart(4, "0")}`
      console.log("Generated new order number:", newOrderNumber)

      return newOrderNumber
    } catch (error) {
      console.error("Error in getNextOrderNumber:", error)
      return this.generateFallbackOrderNumber()
    }
  }

  // Fallback sipariş numarası oluşturma (eski yöntem)
  private static generateFallbackOrderNumber(): string {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
    const timeStr = now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0")
    const fallbackNumber = `SIP${dateStr}${timeStr}`
    console.log("Using fallback order number:", fallbackNumber)
    return fallbackNumber
  }

  // Sipariş numarasının kullanılıp kullanılmadığını kontrol et
  static async isOrderNumberUsed(orderNumber: string): Promise<boolean> {
    try {
      const orderNumberExists = await this.checkOrderNumberColumnExists()

      if (!orderNumberExists) {
        return false
      }

      const { data, error } = await supabase
        .from("pul_labels")
        .select("id")
        .eq("order_number", orderNumber)
        .limit(1)
        .single()

      if (error && error.code === "PGRST116") {
        // No rows found - number is available
        return false
      }

      if (error) {
        console.error("Error checking order number:", error)
        return false
      }

      // If we got data, the number is used
      return !!data
    } catch (error) {
      console.error("Error in isOrderNumberUsed:", error)
      return false
    }
  }
}
