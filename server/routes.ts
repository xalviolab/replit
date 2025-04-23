import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { modules, lessons, lessonContent, userProgress, userStats, badges, userBadges } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Yardımcı fonksiyonlar
async function checkForBadges(userId: string) {
  const progress = await storage.getUserProgress(userId);
  const stats = await storage.getUserStats(userId);
  const totalTime = storage.getUserTotalTime(userId);
  const currentHour = new Date().getHours();
  
  if (!stats) return;

  // Temel rozetler
  if (stats.completed_lessons === 1) {
    await storage.awardBadge(userId, 'first_lesson', 'İlk Adım', 'İlk dersi tamamladınız');
  }

  // Seri rozetleri
  if (stats.streak_days >= 3) {
    await storage.awardBadge(userId, 'streak_3', '3 Gün Serisi', '3 gün arka arkaya çalıştınız');
  }

  if (stats.streak_days >= 7) {
    await storage.awardBadge(userId, 'streak_7', 'Haftalık Başarı', '7 gün arka arkaya çalıştınız');
  }

  // Zaman bazlı rozetler
  if (totalTime >= 86400000) { // 24 saat
    await storage.awardBadge(userId, 'time_master', 'Zaman Ustası', 'Toplam 24 saat çalıştınız');
  }

  // Gün içi zaman rozetleri
  if (currentHour >= 22 || currentHour <= 4) {
    await storage.awardBadge(userId, 'night_owl', 'Gece Kuşu', 'Gece çalışmayı tercih ettiniz');
  }

  if (currentHour >= 5 && currentHour <= 8) {
    await storage.awardBadge(userId, 'early_bird', 'Erken Kuş', 'Sabah erken çalışmayı tercih ettiniz');
  }

  // Performans rozetleri
  const latestProgress = progress[progress.length - 1];
  if (latestProgress && latestProgress.score === latestProgress.max_score) {
    await storage.awardBadge(userId, 'perfect_score', 'Mükemmel', 'Bir dersten tam puan aldınız');
  }
  
  if (!stats) return;
  
  // Tamamlanan ders sayısına göre rozet kontrolü
  if (stats.completed_lessons >= 5) {
    await storage.awardBadge(userId, 'lessons_completed_5', 'Çalışkan Öğrenci', 
      'Bu rozeti 5 ders tamamlayarak kazandınız.');
  }
  
  if (stats.completed_lessons >= 10) {
    await storage.awardBadge(userId, 'lessons_completed_10', 'Bilgi Avcısı', 
      'Bu rozeti 10 ders tamamlayarak kazandınız.');
  }
  
  // XP puanına göre rozet kontrolü
  if (stats.points >= 1000) {
    await storage.awardBadge(userId, 'points_1000', 'Puan Toplayıcı', 
      'Bu rozeti 1000 XP puanı toplayarak kazandınız.');
  }
  
  // Günlük seriye göre rozet kontrolü
  if (stats.streak_days >= 7) {
    await storage.awardBadge(userId, 'streak_7_days', 'Haftalık Çalışkan', 
      'Bu rozeti 7 gün aralıksız çalışarak kazandınız.');
  }
  
  if (stats.streak_days >= 30) {
    await storage.awardBadge(userId, 'streak_30_days', 'Disiplinli Öğrenci', 
      'Bu rozeti 30 gün aralıksız çalışarak kazandınız.');
  }
  
  // Modül tamamlama rozetleri
  const allModules = await storage.getModules();
  
  for (const module of allModules) {
    const isCompleted = await isModuleCompleted(module.id, progress);
    if (isCompleted) {
      await storage.awardBadge(userId, 
        `module_${module.id}_completed`, 
        `${module.title} Uzmanı`, 
        `Bu rozeti '${module.title}' modülünü tamamlayarak kazandınız.`
      );
    }
  }
}

async function isModuleCompleted(moduleId: string, progress: any[]): Promise<boolean> {
  const module = await storage.getModule(moduleId);
  if (!module || !module.lessons || module.lessons.length === 0) {
    return false;
  }
  
  // Modüldeki tüm derslerin tamamlanıp tamamlanmadığını kontrol et
  for (const lesson of module.lessons) {
    const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
    if (!lessonProgress || !lessonProgress.is_completed) {
      return false;
    }
  }
  
  return true;
}

// Kullanıcının enerji seviyesini getir
async function getUserEnergy(userId: string): Promise<number> {
  return storage.getUserEnergy(userId);
}

// Kullanıcının maksimum enerji seviyesini getir
async function getMaxEnergy(userId: string): Promise<number> {
  const subscription = await storage.getUserSubscription(userId);
  
  if (!subscription) return 100; // Ücretsiz plan için 100 enerji
  
  const planId = subscription.plan?.id;
  if (planId === 'basic') return 105; // Temel plan için 105 enerji
  if (planId === 'pro') return 115; // Pro plan için 115 enerji
  if (planId === 'unlimited') return 999; // Sınırsız plan için 999 enerji
  
  return 100; // Varsayılan
}

// Kullanıcının enerji seviyesini azalt
async function decreaseUserEnergy(userId: string, amount: number): Promise<number> {
  return storage.updateUserEnergy(userId, -amount);
}

// Bir sonraki enerji yenilemesi için zamanı hesapla
function getNextEnergyReset(): string {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

// Kullanıcının rozetlerini getir
async function getUserBadges(userId: string): Promise<any[]> {
  return storage.getUserBadges(userId);
}

// Kullanıcının aboneliğini getir
async function getUserSubscription(userId: string): Promise<any> {
  return storage.getUserSubscription(userId);
}

// Premium planları getir
async function getPremiumPlans(): Promise<any[]> {
  return Array.from(storage.getPremiumPlans().values());
}

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Middleware to check if user is admin
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = req.user as any;
  if (user.role_id !== 1) { // Admin role_id is 1
    return res.status(403).json({ error: "Not authorized" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // API endpoints - prefix all routes with /api
  
  // Get all modules with lessons
  app.get("/api/modules", async (req, res) => {
    try {
      // For authenticated users, we'll show personalized progress
      // For guests, we'll just return the basic module structure
      const isAuthenticated = req.isAuthenticated();
      const userId = isAuthenticated ? (req.user as any).id : null;
      
      const allModules = await storage.getModules();
      
      // If user is authenticated, add personalized data
      if (isAuthenticated && userId) {
        // Get user's progress
        const progress = await storage.getUserProgress(userId.toString());
        
        // Add user's progress to modules and lessons
        allModules.forEach(module => {
          module.lessons.forEach(lesson => {
            const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
            if (lessonProgress) {
              lesson.progress = lessonProgress.progress;
              lesson.status = lessonProgress.is_completed ? 'completed' : 
                              lessonProgress.progress > 0 ? 'in_progress' : lesson.status;
            }
          });
        });
      }
      
      res.json(allModules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });
  
  // Get specific module
  app.get("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = req.params.id;
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });
  
  // Get specific lesson
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = req.params.id;
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      // If user is authenticated, add personalized status
      if (req.isAuthenticated()) {
        const userId = (req.user as any).id.toString();
        const progressArr = await storage.getUserProgress(userId);
        const progress = progressArr.find(p => p.lesson_id === lessonId);
        
        if (progress) {
          lesson.progress = progress.progress;
          if (progress.is_completed) {
            lesson.status = 'completed';
          } else if (progress.progress > 0) {
            lesson.status = 'in_progress';
          }
        }
      }
      
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });
  
  // Get lesson content
  app.get("/api/lessons/:id/content", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const hearts = storage.getUserHearts(userId);
      
      if (hearts.current <= 0) {
        return res.status(403).json({ 
          error: "No hearts remaining",
          nextRefill: hearts.nextRefill
        });
      }

      const lessonId = req.params.id;
      const content = await storage.getLessonContent(lessonId);
      
      if (!content) {
        return res.status(404).json({ error: "Lesson content not found" });
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching lesson content:", error);
      res.status(500).json({ error: "Failed to fetch lesson content" });
    }
  });
  
  // Mark lesson as complete
  app.post("/api/lessons/:id/complete", requireAuth, async (req, res) => {
    try {
      const lessonId = req.params.id;
      const { score, maxScore } = req.body;
      const userId = (req.user as any).id.toString();
      
      const result = await storage.completeLesson(lessonId, score, maxScore);
      
      // Check if user has earned any badges
      await checkForBadges(userId);
      
      res.json({ success: true, result });
    } catch (error) {
      console.error("Error completing lesson:", error);
      res.status(500).json({ error: "Failed to mark lesson as complete" });
    }
  });
  
  // Get user progress
  app.get("/api/user/progress", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const progress = await storage.getUserProgress(userId);
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });
  
  // Get user stats
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const stats = await storage.getUserStats(userId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Add endpoint for updating user stats
  app.post("/api/user/stats/update", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const { points, completed_lessons } = req.body;
      
      const stats = await storage.getUserStats(userId);
      const updatedStats = {
        user_id: userId,
        points: (stats?.points || 0) + points,
        completed_lessons: (stats?.completed_lessons || 0) + completed_lessons,
        streak_days: stats?.streak_days || 0
      };
      
      await storage.updateUserStats(userId, updatedStats);
      
      // Check for badges after stats update
      await checkForBadges(userId);
      
      res.json(updatedStats);
    } catch (error) {
      console.error("Error updating user stats:", error);
      res.status(500).json({ error: "Failed to update user stats" });
    }
  });
  
  // Get user hearts
  app.get("/api/user/hearts", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const hearts = storage.getUserHearts(userId);
      res.json(hearts);
    } catch (error) {
      console.error("Error fetching user hearts:", error);
      res.status(500).json({ error: "Failed to fetch user hearts" });
    }
  });
  
  // Update user hearts when answering incorrectly
  app.post("/api/user/hearts/decrease", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const result = storage.decreaseHearts(userId);
      
      if (!result) {
        return res.status(403).json({ error: "No hearts remaining" });
      }
      
      const hearts = storage.getUserHearts(userId);
      res.json(hearts);
    } catch (error) {
      console.error("Error updating user hearts:", error);
      res.status(500).json({ error: "Failed to update user hearts" });
    }
  });
  
  // Get user badges
  app.get("/api/user/badges", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const badges = await getUserBadges(userId);
      
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ error: "Failed to fetch user badges" });
    }
  });
  
  // Get user subscription
  app.get("/api/user/subscription", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const subscription = await getUserSubscription(userId);
      
      res.json(subscription || {});
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ error: "Failed to fetch user subscription" });
    }
  });
  
  // Get premium plans
  app.get("/api/premium-plans", async (req, res) => {
    try {
      const plans = await getPremiumPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching premium plans:", error);
      res.status(500).json({ error: "Failed to fetch premium plans" });
    }
  });
  
  // Update user subscription (simulated payment)
  app.post("/api/user/subscription", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id.toString();
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }
      
      const result = await storage.updateUserSubscription(userId, planId);
      
      if (result) {
        res.json({ success: true, message: "Subscription updated successfully" });
      } else {
        res.status(500).json({ error: "Failed to update subscription" });
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });
  
  // ADMIN ROUTES
  
  // Get all modules (for admin)
  app.get("/api/admin/modules", requireAdmin, async (req, res) => {
    try {
      const modulesData = await db.select().from(modules).orderBy(modules.order);
      res.json(modulesData);
    } catch (error) {
      console.error("Error fetching modules for admin:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });
  
  // Create new module (admin only)
  app.post("/api/admin/modules", requireAdmin, async (req, res) => {
    try {
      const { id, title, description, order } = req.body;
      
      if (!id || !title || order === undefined) {
        return res.status(400).json({ error: "ID, title, and order are required" });
      }
      
      const [newModule] = await db
        .insert(modules)
        .values({
          id,
          title,
          description,
          order
        })
        .returning();
      
      res.status(201).json(newModule);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Failed to create module" });
    }
  });
  
  // Update module (admin only)
  app.put("/api/admin/modules/:id", requireAdmin, async (req, res) => {
    try {
      const moduleId = req.params.id;
      const { title, description, order } = req.body;
      
      const [updatedModule] = await db
        .update(modules)
        .set({
          title,
          description,
          order
        })
        .where(eq(modules.id, moduleId))
        .returning();
      
      if (!updatedModule) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      res.json(updatedModule);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ error: "Failed to update module" });
    }
  });
  
  // Delete module (admin only)
  app.delete("/api/admin/modules/:id", requireAdmin, async (req, res) => {
    try {
      const moduleId = req.params.id;
      
      // Check if module has lessons
      const associatedLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.module_id, moduleId));
      
      if (associatedLessons.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete module with associated lessons. Delete the lessons first."
        });
      }
      
      const [deletedModule] = await db
        .delete(modules)
        .where(eq(modules.id, moduleId))
        .returning();
      
      if (!deletedModule) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Failed to delete module" });
    }
  });
  
  // Get all lessons for a module (admin)
  app.get("/api/admin/modules/:id/lessons", requireAdmin, async (req, res) => {
    try {
      const moduleId = req.params.id;
      
      const lessonsData = await db
        .select()
        .from(lessons)
        .where(eq(lessons.module_id, moduleId))
        .orderBy(lessons.order);
      
      res.json(lessonsData);
    } catch (error) {
      console.error("Error fetching lessons for admin:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });
  
  // Create new lesson (admin only)
  app.post("/api/admin/lessons", requireAdmin, async (req, res) => {
    try {
      const { id, module_id, title, description, duration, order, status } = req.body;
      
      if (!id || !module_id || !title || duration === undefined || order === undefined || !status) {
        return res.status(400).json({ 
          error: "ID, module_id, title, duration, order, and status are required" 
        });
      }
      
      const [newLesson] = await db
        .insert(lessons)
        .values({
          id,
          module_id,
          title,
          description,
          duration,
          order,
          status
        })
        .returning();
      
      res.status(201).json(newLesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });
  
  // Update lesson (admin only)
  app.put("/api/admin/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const lessonId = req.params.id;
      const { module_id, title, description, duration, order, status } = req.body;
      
      const [updatedLesson] = await db
        .update(lessons)
        .set({
          module_id,
          title,
          description,
          duration,
          order,
          status
        })
        .where(eq(lessons.id, lessonId))
        .returning();
      
      if (!updatedLesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      res.json(updatedLesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });
  
  // Delete lesson (admin only)
  app.delete("/api/admin/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const lessonId = req.params.id;
      
      // Check if lesson has content
      const associatedContent = await db
        .select()
        .from(lessonContent)
        .where(eq(lessonContent.lesson_id, lessonId));
      
      if (associatedContent.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete lesson with associated content. Delete the content first."
        });
      }
      
      // Check if lesson has user progress
      const associatedProgress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.lesson_id, lessonId));
      
      if (associatedProgress.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete lesson with associated user progress. Consider marking as inactive instead."
        });
      }
      
      const [deletedLesson] = await db
        .delete(lessons)
        .where(eq(lessons.id, lessonId))
        .returning();
      
      if (!deletedLesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });
  
  // Get lesson content (admin)
  app.get("/api/admin/lessons/:id/content", requireAdmin, async (req, res) => {
    try {
      const lessonId = req.params.id;
      
      const contentData = await db
        .select()
        .from(lessonContent)
        .where(eq(lessonContent.lesson_id, lessonId));
      
      if (contentData.length === 0) {
        return res.status(404).json({ error: "Lesson content not found" });
      }
      
      res.json(contentData[0]);
    } catch (error) {
      console.error("Error fetching lesson content for admin:", error);
      res.status(500).json({ error: "Failed to fetch lesson content" });
    }
  });
  
  // Create/update lesson content (admin only)
  app.post("/api/admin/lessons/:id/content", requireAdmin, async (req, res) => {
    try {
      const lessonId = req.params.id;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      // Check if content exists
      const existingContent = await db
        .select()
        .from(lessonContent)
        .where(eq(lessonContent.lesson_id, lessonId));
      
      let result;
      
      if (existingContent.length > 0) {
        // Update existing content
        [result] = await db
          .update(lessonContent)
          .set({ content: JSON.stringify(content) })
          .where(eq(lessonContent.lesson_id, lessonId))
          .returning();
      } else {
        // Create new content
        [result] = await db
          .insert(lessonContent)
          .values({
            lesson_id: lessonId,
            content: JSON.stringify(content)
          })
          .returning();
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error saving lesson content:", error);
      res.status(500).json({ error: "Failed to save lesson content" });
    }
  });
  
  // Create new badge (admin only)
  app.post("/api/admin/badges", requireAdmin, async (req, res) => {
    try {
      const { id, name, description, image_url, criteria } = req.body;
      
      if (!id || !name || !description || !criteria) {
        return res.status(400).json({ error: "ID, name, description, and criteria are required" });
      }
      
      const [newBadge] = await db
        .insert(badges)
        .values({
          id,
          name,
          description,
          image_url,
          criteria: typeof criteria === 'string' ? criteria : JSON.stringify(criteria)
        })
        .returning();
      
      res.status(201).json(newBadge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ error: "Failed to create badge" });
    }
  });
  
  // Get all badges (admin)
  app.get("/api/admin/badges", requireAdmin, async (req, res) => {
    try {
      const badgesData = await db.select().from(badges);
      res.json(badgesData);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });
  
  // Update badge (admin only)
  app.put("/api/admin/badges/:id", requireAdmin, async (req, res) => {
    try {
      const badgeId = req.params.id;
      const { name, description, image_url, criteria } = req.body;
      
      const [updatedBadge] = await db
        .update(badges)
        .set({
          name,
          description,
          image_url,
          criteria: typeof criteria === 'string' ? criteria : JSON.stringify(criteria)
        })
        .where(eq(badges.id, badgeId))
        .returning();
      
      if (!updatedBadge) {
        return res.status(404).json({ error: "Badge not found" });
      }
      
      res.json(updatedBadge);
    } catch (error) {
      console.error("Error updating badge:", error);
      res.status(500).json({ error: "Failed to update badge" });
    }
  });
  
  // Delete badge (admin only)
  app.delete("/api/admin/badges/:id", requireAdmin, async (req, res) => {
    try {
      const badgeId = req.params.id;
      
      // Check if badge has been awarded to users
      const userAwards = await db
        .select()
        .from(userBadges)
        .where(eq(userBadges.badge_id, badgeId));
      
      if (userAwards.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete badge that has been awarded to users."
        });
      }
      
      const [deletedBadge] = await db
        .delete(badges)
        .where(eq(badges.id, badgeId))
        .returning();
      
      if (!deletedBadge) {
        return res.status(404).json({ error: "Badge not found" });
      }
      
      res.json({ message: "Badge deleted successfully" });
    } catch (error) {
      console.error("Error deleting badge:", error);
      res.status(500).json({ error: "Failed to delete badge" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}