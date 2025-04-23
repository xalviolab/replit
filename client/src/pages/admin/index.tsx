import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  Award,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  User
} from "lucide-react";

// Admin navigation items
const adminLinks = [
  {
    title: "Kullanıcılar",
    description: "Kullanıcı yönetimi ve rol atamaları",
    href: "/admin/users",
    icon: Users,
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Modüller",
    description: "Modül yönetimi ve içerik düzenleme",
    href: "/admin/modules",
    icon: BookOpen,
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Dersler",
    description: "Ders yönetimi ve içerik düzenleme",
    href: "/admin/lessons",
    icon: FileText,
    color: "bg-violet-100 text-violet-700",
  },
  {
    title: "Rozetler",
    description: "Rozet yönetimi ve kriterleri",
    href: "/admin/badges",
    icon: Award,
    color: "bg-amber-100 text-amber-700",
  },
  {
    title: "Abonelikler",
    description: "Premium plan ve abonelik yönetimi",
    href: "/admin/subscriptions",
    icon: CreditCard,
    color: "bg-rose-100 text-rose-700",
  },
  {
    title: "Ayarlar",
    description: "Platform ayarları ve yapılandırma",
    href: "/admin/settings",
    icon: Settings,
    color: "bg-slate-100 text-slate-700",
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role_id !== 1) {
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sayfaya erişim yetkiniz bulunmamaktadır.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  // Fetch summary data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch admin stats");
      return await response.json();
    },
    enabled: !!user && user.role_id === 1,
  });

  // Fetch recent activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/admin/activities"],
    queryFn: async () => {
      const response = await fetch("/api/admin/activities");
      if (!response.ok) throw new Error("Failed to fetch activities");
      return await response.json();
    },
    enabled: !!user && user.role_id === 1,
  });

  if (!user || user.role_id !== 1) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Yetkisiz Erişim</h2>
          <p className="text-muted-foreground mb-6">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <Button asChild>
            <Link href="/">Ana Sayfaya Dön</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Placeholder stats
  const platformStats = stats || {
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    completedLessons: 0,
    totalModules: 0,
    totalLessons: 0,
    totalBadges: 0,
    registrationsToday: 0,
    lessonsCompletedToday: 0,
    revenueToday: 0,
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yönetim Paneli</h1>
        <p className="text-muted-foreground">
          Hoş geldiniz, {user.full_name || user.username}
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="navigation">Hızlı Erişim</TabsTrigger>
          <TabsTrigger value="activities">Son Aktiviteler</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Kullanıcı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformStats.totalUsers}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {platformStats.activeUsers} aktif kullanıcı
                </div>
                <Progress
                  value={(platformStats.activeUsers / (platformStats.totalUsers || 1)) * 100}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Premium Abonelikler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformStats.premiumUsers}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  %{Math.round((platformStats.premiumUsers / (platformStats.totalUsers || 1)) * 100)} dönüşüm oranı
                </div>
                <Progress
                  value={(platformStats.premiumUsers / (platformStats.totalUsers || 1)) * 100}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tamamlanan Dersler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformStats.completedLessons}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {platformStats.lessonsCompletedToday} ders bugün tamamlandı
                </div>
                <Progress
                  value={(platformStats.completedLessons / (platformStats.totalLessons || 1)) * 100}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bugünkü Kayıtlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformStats.registrationsToday}</div>
                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                  <span>Dün: {platformStats.registrationsToday - 1}</span>
                  <span className="text-success">+{platformStats.registrationsToday > 0 ? 100 : 0}%</span>
                </div>
                <Progress value={100} className="h-1 mt-2" />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Platform İstatistikleri</CardTitle>
                <CardDescription>
                  Toplam içerik ve kullanıcı istatistikleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Toplam Modül:</span>
                      <span className="font-medium">{platformStats.totalModules}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Toplam Ders:</span>
                      <span className="font-medium">{platformStats.totalLessons}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Toplam Rozet:</span>
                      <span className="font-medium">{platformStats.totalBadges}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Toplam Kullanıcı:</span>
                      <span className="font-medium">{platformStats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aktif Kullanıcı:</span>
                      <span className="font-medium">{platformStats.activeUsers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Premium Kullanıcı:</span>
                      <span className="font-medium">{platformStats.premiumUsers}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bugün</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Yeni Kayıtlar</span>
                  </div>
                  <span className="font-medium">{platformStats.registrationsToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Tamamlanan Dersler</span>
                  </div>
                  <span className="font-medium">{platformStats.lessonsCompletedToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Gelir</span>
                  </div>
                  <span className="font-medium">₺{platformStats.revenueToday.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Navigation Tab */}
        <TabsContent value="navigation">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminLinks.map((link, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${link.color}`}>
                      <link.icon className="h-5 w-5" />
                    </div>
                    {link.title}
                  </CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="ghost" className="text-primary w-full justify-between">
                    <Link href={link.href}>
                      <span>Görüntüle</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
              <CardDescription>
                Platformdaki son kullanıcı ve sistem aktiviteleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activitiesLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Aktiviteler yükleniyor...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-10">
                    <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">Henüz aktivite kaydı bulunmuyor</p>
                  </div>
                ) : (
                  <div className="relative space-y-4">
                    {activities.map((activity: any, index: any) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {activity.type === "user" ? (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          ) : activity.type === "lesson" ? (
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-secondary" />
                            </div>
                          ) : activity.type === "payment" ? (
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-success" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                              <Award className="h-4 w-4 text-warning" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">{activity.message}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {formatDate(activity.timestamp)}
                            {activity.user && (
                              <span className="mx-1">•</span>
                            )}
                            {activity.user && (
                              <span>{activity.user.username}</span>
                            )}
                          </div>
                        </div>
                        {activity.link && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            asChild
                          >
                            <Link href={activity.link}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}