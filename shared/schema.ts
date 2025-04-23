import { pgTable, text, serial, integer, boolean, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Roles table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  description: true,
});

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// Users table (updated with additional fields)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  hearts: integer("hearts").default(5).notNull(),
  last_heart_refill: timestamp("last_heart_refill").defaultNow(),
  full_name: varchar("full_name", { length: 100 }),
  is_active: boolean("is_active").default(true).notNull(),
  role_id: integer("role_id").default(2).notNull(), // 1: admin, 2: user (default)
  reset_token: text("reset_token"),
  reset_token_expires: timestamp("reset_token_expires"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// User-role relation
export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  full_name: true,
  role_id: true,
  is_active: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Badges table
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  image_url: text("image_url"),
  criteria: text("criteria").notNull(), // JSON string with criteria
  created_at: timestamp("created_at").defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  image_url: true,
  criteria: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User badges (many-to-many)
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  badge_id: integer("badge_id").notNull(),
  earned_at: timestamp("earned_at").defaultNow(),
});

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.user_id],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badge_id],
    references: [badges.id],
  }),
}));

// Modules table
export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertModuleSchema = createInsertSchema(modules).pick({
  id: true,
  title: true,
  description: true,
  order: true,
});

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect & { lessons: Lesson[] };

// Lessons table
export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  module_id: text("module_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  order: integer("order").notNull(),
  status: text("status").notNull(), // 'locked', 'available', 'in_progress', 'completed'
  created_at: timestamp("created_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  id: true,
  module_id: true,
  title: true,
  description: true,
  duration: true,
  order: true,
  status: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect & {
  moduleIndex?: number;
  lessonIndex?: number;
  totalLessonsInModule?: number;
  lockReason?: string;
  progress?: number;
  rating?: number;
  prevLessonId?: string;
  prevLessonTitle?: string;
  nextLessonId?: string;
  nextLessonTitle?: string;
};

// Lesson Content table
export const lessonContent = pgTable("lesson_content", {
  id: text("id").primaryKey(),
  lesson_id: text("lesson_id").notNull(),
  content: text("content").notNull(), // JSON content stored as text
  created_at: timestamp("created_at").defaultNow(),
});

export const insertLessonContentSchema = createInsertSchema(lessonContent).pick({
  id: true,
  lesson_id: true,
  content: true,
});

export type InsertLessonContent = z.infer<typeof insertLessonContentSchema>;
export type LessonContent = typeof lessonContent.$inferSelect & {
  introduction: string;
  sections: any[];
  questions: any[];
};

// User Progress table
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  lesson_id: text("lesson_id").notNull(),
  is_completed: boolean("is_completed").notNull().default(false),
  score: integer("score").notNull().default(0),
  max_score: integer("max_score").notNull().default(0),
  progress: integer("progress").notNull().default(0), // percentage
  completion_date: text("completion_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  user_id: true,
  lesson_id: true,
  is_completed: true,
  score: true,
  max_score: true,
  progress: true,
  completion_date: true,
});

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// User Stats table
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull().unique(),
  streak_days: integer("streak_days").notNull().default(0),
  points: integer("points").notNull().default(0),
  completed_lessons: integer("completed_lessons").notNull().default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  user_id: true,
  streak_days: true,
  points: true,
  completed_lessons: true,
});

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;
