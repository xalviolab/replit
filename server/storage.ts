import {
  users,
  type User,
  type InsertUser,
  modules,
  type Module,
  lessons,
  type Lesson,
  lessonContent,
  type LessonContent,
  userProgress,
  type UserProgress,
  userStats,
  type UserStats,
} from "@shared/schema";
import fs from "fs/promises";
import path from "path";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Map<number, User>;
  
  // Module and Lesson operations
  getModules(): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonContent(id: string): Promise<LessonContent | undefined>;
  completeLesson(id: string, score: number, maxScore: number): Promise<boolean>;
  
  // User progress and stats
  getUserProgress(userId: string): Promise<UserProgress[]>;
  updateUserProgress(progress: Partial<UserProgress>): Promise<UserProgress>;
  getUserStats(userId: string): Promise<UserStats | undefined>;
  updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats>;
  
  // Enerji sistemi
  getUserEnergy(userId: string): number;
  updateUserEnergy(userId: string, change: number): number;
  
  // Rozet sistemi
  getUserBadges(userId: string): any[];
  awardBadge(userId: string, badgeId: string, name: string, description: string): Promise<boolean>;
  
  // Premium abonelik
  getUserSubscription(userId: string): any;
  getPremiumPlans(): Map<string, any>;
  updateUserSubscription(userId: string, planId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private modules: Map<string, Module>;
  private lessons: Map<string, Lesson>;
  private lessonContents: Map<string, LessonContent>;
  private userProgress: Map<string, UserProgress[]>;
  private userStats: Map<string, UserStats>;
  private userEnergy: Map<string, number>; // Kullanıcı enerji sistemi
  private userBadges: Map<string, any[]>; // Kullanıcı rozetleri
  private premiumPlans: Map<string, any>; // Premium planlar
  private userSubscriptions: Map<string, any>; // Kullanıcı abonelikleri
  currentId: number;

  constructor() {
    this.users = new Map();
    this.modules = new Map();
    this.lessons = new Map();
    this.lessonContents = new Map();
    this.userProgress = new Map();
    this.userStats = new Map();
    this.userEnergy = new Map();
    this.userBadges = new Map();
    this.premiumPlans = new Map();
    this.userSubscriptions = new Map();
    this.currentId = 3; // Başlangıç ID'si (admin ve kullanıcı için 1 ve 2 kullanılıyor)
    
    // Load initial data
    this.loadData();
  }
  
  private async loadData() {
    try {
      // Load users
      try {
        const usersData = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data/users.json'), 'utf-8'));
        usersData.forEach((user: User) => {
          this.users.set(user.id, user);
          // Kullanıcı için enerji, rozet ve istatistik verilerini başlat
          this.userEnergy.set(user.id.toString(), 100); // Her kullanıcı için başlangıç enerjisi
          this.userBadges.set(user.id.toString(), []); // Boş rozet listesi
          
          this.userStats.set(user.id.toString(), {
            user_id: user.id.toString(),
            streak_days: 0,
            points: 0,
            completed_lessons: 0
          });
          
          this.userProgress.set(user.id.toString(), []);
        });
        console.log(`${this.users.size} kullanıcı yüklendi.`);
      } catch (error) {
        console.error('Kullanıcılar yüklenemedi, varsayılan kullanıcılar oluşturulacak:', error);
        
        // Varsayılan admin kullanıcı
        const adminUser: User = {
          id: 1,
          username: "admin",
          email: "admin@cardioedu.com",
          password: "4e7afebcfbae000b22c7c85e5560f89a2a0280b4", // admin123 (gerçek bir hash değil)
          full_name: "Admin User",
          is_active: true,
          role_id: 1,
          created_at: new Date(),
          updated_at: null,
          reset_token: null,
          reset_token_expires: null
        };
        
        // Varsayılan kullanıcı
        const regularUser: User = {
          id: 2,
          username: "user",
          email: "user@cardioedu.com",
          password: "4e7afebcfbae000b22c7c85e5560f89a2a0280b4", // user123 (gerçek bir hash değil)
          full_name: "Normal User",
          is_active: true,
          role_id: 2,
          created_at: new Date(),
          updated_at: null,
          reset_token: null,
          reset_token_expires: null
        };
        
        this.users.set(adminUser.id, adminUser);
        this.users.set(regularUser.id, regularUser);
        
        // Kullanıcılar için enerji ve istatistikleri başlat
        [adminUser, regularUser].forEach(user => {
          this.userEnergy.set(user.id.toString(), 100);
          this.userBadges.set(user.id.toString(), []);
          
          this.userStats.set(user.id.toString(), {
            user_id: user.id.toString(),
            streak_days: 0,
            points: 0,
            completed_lessons: 0
          });
          
          this.userProgress.set(user.id.toString(), []);
        });
        
        // Kullanıcı verilerini kaydet
        try {
          await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
          await fs.writeFile(
            path.join(process.cwd(), 'data/users.json'), 
            JSON.stringify([adminUser, regularUser], null, 2), 
            'utf-8'
          );
          console.log('Varsayılan kullanıcılar oluşturuldu ve kaydedildi.');
        } catch (writeError) {
          console.error('Kullanıcı verileri kaydedilemedi:', writeError);
        }
      }

      // Premium planları oluştur
      const premiumPlans = [
        {
          id: "basic",
          name: "Temel Plan",
          description: "Temel CardioEdu deneyimi",
          price: 9.99,
          currency: "TRY",
          interval: "month",
          features: [
            "Tüm derslere erişim",
            "Günlük 5 fazla enerji",
            "Haftalık özet raporu"
          ],
          is_active: true,
          metadata: {
            badge_id: null,
            priority: 1
          }
        },
        {
          id: "pro",
          name: "Pro Plan",
          description: "Gelişmiş CardioEdu deneyimi",
          price: 19.99,
          currency: "TRY",
          interval: "month",
          features: [
            "Tüm derslere erişim",
            "Günlük 15 fazla enerji",
            "Haftalık özet raporu",
            "Özel rozet",
            "Sınırsız quiz hakkı"
          ],
          is_active: true,
          metadata: {
            badge_id: "premium",
            priority: 2
          }
        },
        {
          id: "unlimited",
          name: "Sınırsız Plan",
          description: "Eksiksiz CardioEdu deneyimi",
          price: 49.99,
          currency: "TRY",
          interval: "month",
          features: [
            "Tüm derslere sınırsız erişim",
            "Sınırsız enerji",
            "Günlük detaylı raporlar",
            "Özel rozet koleksiyonu",
            "Sınırsız quiz hakkı",
            "Kişisel koçluk desteği"
          ],
          is_active: true,
          metadata: {
            badge_id: "unlimited",
            priority: 3
          }
        }
      ];
      
      premiumPlans.forEach(plan => {
        this.premiumPlans.set(plan.id, plan);
      });

      // Modülleri yükle
      const modulesData = JSON.parse(await fs.readFile(path.join(process.cwd(), 'lessons/modules.json'), 'utf-8'));
      modulesData.forEach((module: Module) => {
        this.modules.set(module.id, module);
        
        // Modüle ait dersleri yükle
        module.lessons.forEach((lesson: Lesson) => {
          this.lessons.set(lesson.id, lesson);
        });
      });
      
      // Ders içeriklerini yükle
      for (const lesson of this.lessons.values()) {
        try {
          const content = JSON.parse(await fs.readFile(path.join(process.cwd(), `lessons/lesson${lesson.id}.json`), 'utf-8'));
          this.lessonContents.set(lesson.id, content);
        } catch (error) {
          console.error(`Failed to load content for lesson ${lesson.id}:`, error);
        }
      }
      
      // Demo kullanıcı ilerlemesi ve istatistikler
      for (const userId of ['1', '2']) {
        // Kullanıcı enerji puanını ayarla (günde yenilenir)
        this.userEnergy.set(userId, 100);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      created_at: new Date(),
      updated_at: null,
      reset_token: null,
      reset_token_expires: null
    };
    this.users.set(id, user);
    
    // Kullanıcı oluşturulduğunda diğer verileri de başlat
    this.userEnergy.set(id.toString(), 100);
    this.userBadges.set(id.toString(), []);
    this.userProgress.set(id.toString(), []);
    this.userStats.set(id.toString(), {
      user_id: id.toString(),
      streak_days: 0,
      points: 0,
      completed_lessons: 0
    });
    
    return user;
  }
  
  getUsers(): Map<number, User> {
    return this.users;
  }
  
  // Module and Lesson operations
  async getModules(): Promise<Module[]> {
    return Array.from(this.modules.values()).sort((a, b) => a.order - b.order);
  }
  
  async getModule(id: string): Promise<Module | undefined> {
    return this.modules.get(id);
  }
  
  async getLesson(id: string): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }
  
  async getLessonContent(id: string): Promise<LessonContent | undefined> {
    return this.lessonContents.get(id);
  }
  
  async completeLesson(id: string, score: number, maxScore: number): Promise<boolean> {
    const lesson = this.lessons.get(id);
    if (!lesson) return false;
    
    // Update lesson status
    lesson.status = 'completed';
    this.lessons.set(id, lesson);
    
    // Update progress
    const userId = '2'; // Geçici olarak sabit kullanıcı ID'si (normalde req.user.id olmalı)
    const userProgress = this.userProgress.get(userId) || [];
    
    // Find if there's an existing progress for this lesson
    const existingProgressIndex = userProgress.findIndex(p => p.lesson_id === id);
    
    if (existingProgressIndex >= 0) {
      userProgress[existingProgressIndex] = {
        ...userProgress[existingProgressIndex],
        is_completed: true,
        score,
        max_score: maxScore,
        progress: 100,
        completion_date: new Date().toISOString()
      };
    } else {
      userProgress.push({
        user_id: userId,
        lesson_id: id,
        is_completed: true,
        score,
        max_score: maxScore,
        progress: 100,
        completion_date: new Date().toISOString()
      });
    }
    
    this.userProgress.set(userId, userProgress);
    
    // Update stats
    const stats = this.userStats.get(userId);
    if (stats) {
      stats.completed_lessons += 1;
      stats.points += score;
      this.userStats.set(userId, stats);
    }
    
    // If this is the next lesson in sequence, update the next lesson to be available
    const moduleId = lesson.moduleId;
    const module = this.modules.get(moduleId);
    
    if (module) {
      const lessonIndex = module.lessons.findIndex(l => l.id === id);
      if (lessonIndex < module.lessons.length - 1) {
        const nextLesson = this.lessons.get(module.lessons[lessonIndex + 1].id);
        if (nextLesson && nextLesson.status === 'locked') {
          nextLesson.status = 'available';
          this.lessons.set(nextLesson.id, nextLesson);
        }
      }
      
      // If all lessons in this module are completed, unlock the next module
      const allLessonsCompleted = module.lessons.every(l => {
        const lesson = this.lessons.get(l.id);
        return lesson && lesson.status === 'completed';
      });
      
      if (allLessonsCompleted) {
        const modules = Array.from(this.modules.values()).sort((a, b) => a.order - b.order);
        const moduleIndex = modules.findIndex(m => m.id === moduleId);
        
        if (moduleIndex < modules.length - 1) {
          const nextModule = modules[moduleIndex + 1];
          if (nextModule) {
            // Unlock the first lesson of the next module
            const firstLesson = this.lessons.get(nextModule.lessons[0].id);
            if (firstLesson && firstLesson.status === 'locked') {
              firstLesson.status = 'available';
              this.lessons.set(firstLesson.id, firstLesson);
            }
          }
        }
      }
    }
    
    return true;
  }
  
  // User progress and stats
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return this.userProgress.get(userId) || [];
  }
  
  async updateUserProgress(progress: Partial<UserProgress>): Promise<UserProgress> {
    if (!progress.user_id || !progress.lesson_id) {
      throw new Error('User ID and Lesson ID are required');
    }
    
    const userProgress = this.userProgress.get(progress.user_id) || [];
    const existingIndex = userProgress.findIndex(p => p.lesson_id === progress.lesson_id);
    
    const newProgress: UserProgress = {
      user_id: progress.user_id,
      lesson_id: progress.lesson_id,
      is_completed: progress.is_completed || false,
      score: progress.score || 0,
      max_score: progress.max_score || 0,
      progress: progress.progress || 0,
      completion_date: progress.completion_date || ''
    };
    
    if (existingIndex >= 0) {
      userProgress[existingIndex] = newProgress;
    } else {
      userProgress.push(newProgress);
    }
    
    this.userProgress.set(progress.user_id, userProgress);
    return newProgress;
  }
  
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    return this.userStats.get(userId);
  }
  
  async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats> {
    const existingStats = this.userStats.get(userId);
    
    const newStats: UserStats = {
      user_id: userId,
      streak_days: stats.streak_days !== undefined ? stats.streak_days : (existingStats?.streak_days || 0),
      points: stats.points !== undefined ? stats.points : (existingStats?.points || 0),
      completed_lessons: stats.completed_lessons !== undefined ? stats.completed_lessons : (existingStats?.completed_lessons || 0)
    };
    
    this.userStats.set(userId, newStats);
    return newStats;
  }
  
  // Enerji sistemi
  getUserEnergy(userId: string): number {
    return this.userEnergy.get(userId) || 0;
  }
  
  updateUserEnergy(userId: string, change: number, isWrongAnswer: boolean = false): number {
    const currentEnergy = this.getUserEnergy(userId);
    const maxEnergy = this.getUserSubscription(userId)?.plan?.id === 'unlimited' ? 999 : 
                      this.getUserSubscription(userId)?.plan?.id === 'pro' ? 115 :
                      this.getUserSubscription(userId)?.plan?.id === 'basic' ? 105 : 100;
    
    // Yanlış cevap için -10 enerji
    if (isWrongAnswer) {
      change = -10;
    }
    
    let newEnergy = currentEnergy + change;
    
    // Enerji 0'dan az veya maksimum değerden fazla olamaz
    newEnergy = Math.max(0, Math.min(newEnergy, maxEnergy));
    
    this.userEnergy.set(userId, newEnergy);
    return newEnergy;
  }
  
  // Rozet sistemi
  private badges = new Map([
    ['first_lesson', { id: 'first_lesson', name: 'İlk Adım', description: 'İlk dersi tamamladınız' }],
    ['streak_3', { id: 'streak_3', name: '3 Gün Serisi', description: '3 gün arka arkaya çalıştınız' }],
    ['streak_7', { id: 'streak_7', name: 'Haftalık Başarı', description: '7 gün arka arkaya çalıştınız' }],
    ['perfect_score', { id: 'perfect_score', name: 'Mükemmel', description: 'Bir dersten tam puan aldınız' }],
    ['energy_master', { id: 'energy_master', name: 'Enerji Ustası', description: 'Enerjinizi verimli kullandınız' }],
    ['quick_learner', { id: 'quick_learner', name: 'Hızlı Öğrenen', description: '30 dakikada bir dersi tamamladınız' }],
    ['night_owl', { id: 'night_owl', name: 'Gece Kuşu', description: 'Gece çalışmayı tercih ettiniz' }],
    ['early_bird', { id: 'early_bird', name: 'Erken Kuş', description: 'Sabah erken çalışmayı tercih ettiniz' }],
    ['module_master', { id: 'module_master', name: 'Modül Ustası', description: 'Bir modülü tamamen bitirdiniz' }],
    ['quiz_master', { id: 'quiz_master', name: 'Quiz Ustası', description: '10 quizi hatasız tamamladınız' }],
    ['time_master', { id: 'time_master', name: 'Zaman Ustası', description: 'Toplam 24 saat çalıştınız' }],
    ['persistent', { id: 'persistent', name: 'Azimli', description: '5 hatalı denemeden sonra başardınız' }],
    ['speed_demon', { id: 'speed_demon', name: 'Hız Şeytanı', description: 'Bir dersi 10 dakikada tamamladınız' }],
    ['weekend_warrior', { id: 'weekend_warrior', name: 'Hafta Sonu Savaşçısı', description: 'Hafta sonu 4 saat çalıştınız' }],
    ['completion_master', { id: 'completion_master', name: 'Tamamlama Ustası', description: 'Tüm dersleri tamamladınız' }],
  ]);

  getUserBadges(userId: string): any[] {
    return this.userBadges.get(userId) || [];
  }

  private userHearts = new Map<string, {
    hearts: number,
    maxHearts: number,
    lastRefill: number
  }>();

  getUserHearts(userId: string): { current: number; max: number; nextRefill: string } {
    const now = Date.now();
    let userData = this.userHearts.get(userId);
    
    if (!userData) {
      userData = { hearts: 5, maxHearts: 5, lastRefill: now };
      this.userHearts.set(userId, userData);
    }

    // Check if 24 hours have passed since last refill
    if (now - userData.lastRefill >= 24 * 60 * 60 * 1000) {
      userData.hearts = userData.maxHearts;
      userData.lastRefill = now;
      this.userHearts.set(userId, userData);
    }

    const nextRefill = new Date(userData.lastRefill + 24 * 60 * 60 * 1000).toISOString();
    
    return {
      current: userData.hearts,
      max: userData.maxHearts,
      nextRefill
    };
  }

  decreaseHearts(userId: string): boolean {
    const userData = this.userHearts.get(userId);
    if (!userData || userData.hearts <= 0) return false;
    
    userData.hearts--;
    this.userHearts.set(userId, userData);
    return true;
  }

  private userTime = new Map<string, { 
    totalTime: number,
    lastActive: number,
    sessionStart: number 
  }>();

  updateUserTime(userId: string): void {
    const now = Date.now();
    const userTimeData = this.userTime.get(userId) || { 
      totalTime: 0, 
      lastActive: now,
      sessionStart: now 
    };

    if (now - userTimeData.lastActive < 300000) { // 5 dakika içinde aktifse
      userTimeData.totalTime += now - userTimeData.lastActive;
    } else {
      userTimeData.sessionStart = now;
    }

    userTimeData.lastActive = now;
    this.userTime.set(userId, userTimeData);
  }

  getUserTotalTime(userId: string): number {
    return this.userTime.get(userId)?.totalTime || 0;
  }
  
  async awardBadge(userId: string, badgeId: string, name: string, description: string): Promise<boolean> {
    const userBadges = this.getUserBadges(userId);
    
    // Kullanıcının bu rozeti zaten kazanıp kazanmadığını kontrol et
    if (userBadges.some(badge => badge.id === badgeId)) {
      return false; // Rozet zaten kazanılmış
    }
    
    // Yeni rozeti ekle
    const newBadge = {
      id: badgeId,
      name,
      description,
      image_url: `/badges/${badgeId}.svg`,
      earned_at: new Date().toISOString()
    };
    
    userBadges.push(newBadge);
    this.userBadges.set(userId, userBadges);
    
    return true;
  }
  
  // Premium abonelik
  getUserSubscription(userId: string): any {
    return this.userSubscriptions.get(userId) || null;
  }
  
  getPremiumPlans(): Map<string, any> {
    return this.premiumPlans;
  }
  
  async updateUserSubscription(userId: string, planId: string): Promise<boolean> {
    const plan = this.premiumPlans.get(planId);
    
    if (!plan) {
      return false; // Plan bulunamadı
    }
    
    const subscription = {
      user_id: userId,
      plan_id: planId,
      plan: plan,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün sonra
      status: 'active',
      metadata: {}
    };
    
    this.userSubscriptions.set(userId, subscription);
    
    // Rozet varsa, kullanıcıya ekle
    if (plan.metadata.badge_id) {
      await this.awardBadge(
        userId,
        plan.metadata.badge_id,
        `${plan.name} Üyesi`,
        `Bu rozeti ${plan.name} aboneliği satın alarak kazandınız.`
      );
    }
    
    return true;
  }
}

export const storage = new MemStorage();
