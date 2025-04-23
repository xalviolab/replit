import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { users, roles } from "@shared/schema";
import { eq, and, or, sql, gt } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);
const scryptAsync = promisify(scrypt);

// Hash password with salt for secure storage
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare supplied password with stored hashed password
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Set up session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    }),
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const userResults = await db
          .select()
          .from(users)
          .where(eq(users.username, username));
        
        const user = userResults[0];
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }

        // Check if user account is active
        if (!user.is_active) {
          return done(null, false, { message: "Account is deactivated" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const userResults = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          full_name: users.full_name,
          is_active: users.is_active,
          role_id: users.role_id,
          created_at: users.created_at
        })
        .from(users)
        .where(eq(users.id, id));
      
      if (userResults.length === 0) {
        return done(null, false);
      }

      const user = userResults[0];
      
      // Add role info to user
      const userRoleResults = await db
        .select()
        .from(roles)
        .where(eq(roles.id, user.role_id));
      
      if (userRoleResults.length > 0) {
        (user as any).role = userRoleResults[0].name;
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register API routes
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, full_name } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ 
          error: "Username, email and password are required" 
        });
      }

      // Check if user already exists
      const existingUsers = await db
        .select()
        .from(users)
        .where(
          sql`${users.username} = ${username} OR ${users.email} = ${email}`
        );

      if (existingUsers.length > 0) {
        return res.status(409).json({ 
          error: "Username or email already exists" 
        });
      }

      // Get the "user" role
      const userRoles = await db
        .select()
        .from(roles)
        .where(eq(roles.name, "user"));
      
      const userRoleId = userRoles.length > 0 ? userRoles[0].id : 2; // Default to 2 (user role)

      // Create the new user
      const hashedPassword = await hashPassword(password);
      
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          full_name: full_name || null,
          is_active: true,
          role_id: userRoleId,
        })
        .returning();

      if (!newUser) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      // Log in the new user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login after registration failed" });
        }
        
        // Don't return the password
        const { password, ...userWithoutPassword } = newUser;
        
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Request password reset
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Find user by email
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      
      if (userResults.length === 0) {
        // Don't reveal that the email doesn't exist
        return res.status(200).json({ message: "If your email exists in our system, you will receive a password reset link" });
      }
      
      // Generate a reset token
      const resetToken = randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      // Store the token in the user record
      await db
        .update(users)
        .set({
          reset_token: resetToken,
          reset_token_expires: tokenExpiry,
        })
        .where(eq(users.id, userResults[0].id));
      
      // In a real application, send an email with the reset link
      // For now, we'll just return it in the response (not for production!)
      const resetLink = `${process.env.APP_URL || 'http://localhost:5000'}/password-reset/${resetToken}`;
      
      // In development, we'll return the token and link for testing
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ 
          message: "Password reset link generated",
          // Only include these in dev environments
          dev_info: {
            token: resetToken,
            link: resetLink
          }
        });
      }
      
      res.json({ 
        message: "If your email exists in our system, you will receive a password reset link"
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      
      // Find user by reset token and check if token is not expired
      const now = new Date();
      const userResults = await db
        .select()
        .from(users)
        .where(
          sql`${users.reset_token} = ${token} AND ${users.reset_token_expires} > ${now}`
        );
      
      if (userResults.length === 0) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(password);
      
      await db
        .update(users)
        .set({
          password: hashedPassword,
          reset_token: null,
          reset_token_expires: null,
        })
        .where(eq(users.id, userResults[0].id));
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Admin: Get all users (admin only)
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user as any;
    
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          full_name: users.full_name,
          is_active: users.is_active,
          role_id: users.role_id,
          created_at: users.created_at
        })
        .from(users)
        .orderBy(users.created_at);
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin: Update user (admin only)
  app.put("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user as any;
    
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      const { is_active, role_id, full_name } = req.body;
      
      // Only allow updating specific fields
      const updates: any = {};
      
      if (is_active !== undefined) updates.is_active = is_active;
      if (role_id !== undefined) updates.role_id = role_id;
      if (full_name !== undefined) updates.full_name = full_name;
      
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin: Delete user (admin only)
  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user as any;
    
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      
      // Check if this is not the admin user trying to delete themselves
      if (user.id === userId) {
        return res.status(400).json({ error: "Cannot delete your own admin account" });
      }
      
      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();
      
      if (!deletedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
}