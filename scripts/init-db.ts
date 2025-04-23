import { db } from "../server/db";
import { roles, users } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Initializing database...");

  // Create roles
  console.log("Creating roles...");
  try {
    // Check if roles already exist
    const existingRoles = await db.select().from(roles);
    
    if (existingRoles.length === 0) {
      await db.insert(roles).values([
        { id: 1, name: "admin", description: "Administrator" },
        { id: 2, name: "user", description: "Regular user" }
      ]);
      console.log("Roles created successfully");
    } else {
      console.log("Roles already exist, skipping creation");
    }
  } catch (error) {
    console.error("Error creating roles:", error);
  }

  // Create admin user
  console.log("Creating admin user...");
  try {
    // Check if admin user already exists
    const adminUser = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (adminUser.length === 0) {
      const hashedPassword = await hashPassword("admin123");
      
      await db.insert(users).values({
        username: "admin",
        email: "admin@eduhealision.com",
        password: await hashPassword("admin1234"),
        full_name: "Administrator",
        is_active: true,
        role_id: 1, // Admin role
      });
      
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists, skipping creation");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  console.log("Database initialization completed");
  process.exit(0);
}

main().catch(error => {
  console.error("Database initialization failed:", error);
  process.exit(1);
});