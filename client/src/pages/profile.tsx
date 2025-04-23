import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Award, Battery, Calendar, Trophy, XCircle, CheckCircle, Star, Clock, AlertCircle, ShieldCheck, Heart } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Enerji yenilenmesi için kalan süreyi hesaplayan yardımcı fonksiyon
function getTimeUntilReset() {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}s ${minutes}dk`;
}

// Premium plan özelliklerini gösteren component
const PremiumFeature = ({ name, included = false }: { name: string, included?: boolean }) => (
  <div className="flex items-center py-1">
    {included ? (
      <CheckCircle className="h-4 w-4 mr-2 text-success" />
    ) : (
      <XCircle className="h-4 w-4 mr-2 text-muted-foreground" />
    )}
    <span className={included ? 'text-foreground' : 'text-muted-foreground'}>{name}</span>
  </div>
);

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Kullanıcı ilerlemesini getir
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/user/progress'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/progress');
      return res.json();
    },
    enabled: !!user
  });
  
  // Kullanıcı istatistiklerini getir
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/stats');
      return res.json();
    },
    enabled: !!user
  });
  
  // Kullanıcı rozetlerini getir
  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['/api/user/badges'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/badges');
      return res.json();
    },
    enabled: !!user
  });
  
  // Kullanıcı aboneliğini getir
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/user/subscription'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/subscription');
      return res.json();
    },
    enabled: !!user
  });
  
  // Tüm veri sorguları yüklenene kadar gösterilecek
  const isLoading = progressLoading || statsLoading || badgesLoading || subscriptionLoading;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 content-container">
      {/* Başlık Alanı */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Profil</h1>
          <p className="text-muted-foreground">Hesap bilgilerinizi, ilerlemenizi ve kazandığınız başarıları görüntüleyin.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <span className="mr-2">◀</span> Ana Sayfaya Dön
          </Link>
        </Button>
      </div>
      
      {/* Ana içerik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sol Kolon - Kullanıcı Bilgileri */}
        <div className="space-y-6">
          {/* Kullanıcı Kartı */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Kullanıcı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold">{user?.full_name || user?.username}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats?.streak_days || 0}</p>
                    <p className="text-xs text-muted-foreground">Gün Serisi</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.completed_lessons || 0}</p>
                    <p className="text-xs text-muted-foreground">Ders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.points || 0}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Enerji Kartı */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Battery className="h-5 w-5 mr-2 text-green-600" />
                  Enerji
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {getTimeUntilReset()} sonra yenilenecek
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">90 / 100</span>
                  <Badge variant="outline" className="font-normal">
                    {subscription?.plan?.name === 'Pro Plan' ? '+15 Premium' : 
                     subscription?.plan?.name === 'Sınırsız Plan' ? 'Sınırsız' : ''}
                  </Badge>
                </div>
                <Progress value={90} className="h-3" />
                <p className="text-xs text-muted-foreground pt-1">
                  Her ders tamamladığınızda 10 enerji kullanılır. Enerjiniz her gün gece yarısında yenilenir.
                  {subscription ? ' Premium üyeliğiniz sayesinde fazladan enerji kapasitesine sahipsiniz.' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Rozet Kartı */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-primary" />
                Rozetler
              </CardTitle>
              <CardDescription>
                Toplam kazanılan: {badges?.length || 0} rozet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <div className="text-center py-6">Yükleniyor...</div>
              ) : badges?.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {badges.slice(0, 6).map((badge: any) => (
                    <div key={badge.id} className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 mb-1 flex items-center justify-center">
                        {badge.image_url ? (
                          <img 
                            src={badge.image_url} 
                            alt={badge.name}
                            className="w-8 h-8" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-badge.svg';
                            }}
                          />
                        ) : (
                          <Trophy className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <span className="text-xs font-medium truncate max-w-full">
                        {badge.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Henüz rozet kazanmadınız</p>
                  <p className="text-xs">Derslerinizi tamamlayarak rozetler kazanın!</p>
                </div>
              )}
            </CardContent>
            {badges?.length > 6 && (
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full text-sm" onClick={() => setActiveTab('badges')}>
                  Tüm rozetleri görüntüle
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        {/* Sağ Kolon - İçerik Sekmeler */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="progress">İlerleme</TabsTrigger>
              <TabsTrigger value="subscription">Abonelik</TabsTrigger>
            </TabsList>
            
            {/* Genel Bakış Sekmesi */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    İstatistikler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Trophy className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Toplam Puan</span>
                      </div>
                      <p className="text-2xl font-bold">{stats?.points || 0} XP</p>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Günlük Seri</span>
                      </div>
                      <p className="text-2xl font-bold">{stats?.streak_days || 0} gün</p>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Tamamlanan Dersler</span>
                      </div>
                      <p className="text-2xl font-bold">{stats?.completed_lessons || 0}</p>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">Toplam Çalışma</span>
                      </div>
                      <p className="text-2xl font-bold">12s 30dk</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-primary" />
                    Son Aktiviteler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progress && progress.length > 0 ? (
                    <div className="space-y-4">
                      {progress.slice(0, 5).map((item: any) => (
                        <div key={item.lesson_id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <CheckCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Ders tamamlandı</p>
                              <p className="text-xs text-muted-foreground">
                                Skor: {item.score}/{item.max_score} • {new Date(item.completion_date).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">+{Math.round(item.score * 10)} XP</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p>Henüz aktivite bulunmuyor</p>
                      <p className="text-sm">Derslerinizi tamamlayarak ilerleme kaydedin!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* İlerleme Sekmesi */}
            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Modül İlerlemesi</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Bu kısım modüllerdeki ilerlemeyi gösterecek */}
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Temel Kavramlar</span>
                        <span className="text-muted-foreground">2/4 ders</span>
                      </div>
                      <Progress value={50} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">EKG Analizi</span>
                        <span className="text-muted-foreground">0/5 ders</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Kardiyak İlaçlar</span>
                        <span className="text-muted-foreground">0/3 ders</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tamamlanan Dersler</CardTitle>
                </CardHeader>
                <CardContent>
                  {progress && progress.length > 0 ? (
                    <div className="space-y-3">
                      {progress.map((item: any) => (
                        <div key={item.lesson_id} className="p-3 border rounded-lg flex justify-between items-center">
                          <div>
                            <div className="font-medium">Kardiyoloji Temelleri</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(item.completion_date).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{item.score}/{item.max_score}</div>
                            <div className="text-xs text-muted-foreground">Skor</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <p>Henüz ders tamamlanmadı</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Abonelik Sekmesi */}
            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                    Mevcut Abonelik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscription?.plan ? (
                    <div className="space-y-4">
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xl font-bold">{subscription.plan.name}</h3>
                          <Badge>{subscription.plan.price} ₺/ay</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{subscription.plan.description}</p>
                        
                        <div className="space-y-1 mt-4">
                          <div className="text-sm font-medium mb-2">Dahil Özellikler:</div>
                          {subscription.plan.features.map((feature: string, i: number) => (
                            <PremiumFeature key={i} name={feature} included={true} />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Yenileme Tarihi</p>
                          <p className="text-sm text-muted-foreground">15 Mayıs 2023</p>
                        </div>
                        <Button variant="outline">Aboneliği İptal Et</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-center py-6 text-muted-foreground mb-6">
                        <Heart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-lg font-medium mb-1">Henüz premium üye değilsiniz</p>
                        <p className="text-sm">Premium planlar ile daha fazla içeriğe erişim sağlayın ve avantajlardan yararlanın.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-2 border-primary/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Temel Plan</CardTitle>
                            <CardDescription>
                              <span className="font-medium text-lg">9.99 ₺</span> / ay
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="space-y-1 text-sm">
                              <PremiumFeature name="Tüm derslere erişim" included={true} />
                              <PremiumFeature name="Günlük 5 fazla enerji" included={true} />
                              <PremiumFeature name="Haftalık özet raporu" included={true} />
                              <PremiumFeature name="Özel rozet" included={false} />
                              <PremiumFeature name="Sınırsız quiz hakkı" included={false} />
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" className="w-full">Başla</Button>
                          </CardFooter>
                        </Card>
                        
                        <Card className="border-2 border-primary">
                          <CardHeader className="pb-2 relative">
                            <div className="absolute -top-3 -right-3">
                              <Badge className="bg-primary">Popüler</Badge>
                            </div>
                            <CardTitle className="text-lg">Pro Plan</CardTitle>
                            <CardDescription>
                              <span className="font-medium text-lg">19.99 ₺</span> / ay
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="space-y-1 text-sm">
                              <PremiumFeature name="Tüm derslere erişim" included={true} />
                              <PremiumFeature name="Günlük 15 fazla enerji" included={true} />
                              <PremiumFeature name="Haftalık özet raporu" included={true} />
                              <PremiumFeature name="Özel rozet" included={true} />
                              <PremiumFeature name="Sınırsız quiz hakkı" included={true} />
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button className="w-full">Şimdi Başla</Button>
                          </CardFooter>
                        </Card>
                        
                        <Card className="border-2 border-primary/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Sınırsız Plan</CardTitle>
                            <CardDescription>
                              <span className="font-medium text-lg">49.99 ₺</span> / ay
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="space-y-1 text-sm">
                              <PremiumFeature name="Tüm derslere sınırsız erişim" included={true} />
                              <PremiumFeature name="Sınırsız enerji" included={true} />
                              <PremiumFeature name="Günlük detaylı raporlar" included={true} />
                              <PremiumFeature name="Özel rozet koleksiyonu" included={true} />
                              <PremiumFeature name="Kişisel koçluk desteği" included={true} />
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" className="w-full">Başla</Button>
                          </CardFooter>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}