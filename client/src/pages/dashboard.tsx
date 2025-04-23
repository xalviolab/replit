import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Award, BookOpen, Clock, Play, CheckCircle, LockIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/modules');
        
        if (!response.ok) {
          throw new Error('Failed to fetch modules');
        }
        
        const data = await response.json();
        setModules(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Modüller yüklenirken bir hata oluştu.');
        setIsLoading(false);
      }
    };
    
    fetchModules();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold text-destructive mb-4">Oops!</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Yeniden Dene</Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 content-container">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-primary/20 to-secondary/10 rounded-xl p-6 md:p-8 lg:p-10 shadow-sm">
        <div className="max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Hoş Geldin, {user?.full_name || user?.username || 'Öğrenci'}!
          </h1>
          <p className="text-muted-foreground mb-6">
            Kardiyoloji eğitimine devam ederek bilgilerinizi pekiştirin ve yeni konular keşfedin.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/profile">
                <Award className="mr-2 h-4 w-4" />
                İlerleme Durumum
              </Link>
            </Button>
            <Button variant="outline" className="border-primary/20 hover:border-primary/30">
              <Clock className="mr-2 h-4 w-4" />
              Son Kalınan Ders
            </Button>
          </div>
        </div>
      </section>

      {/* Modules List */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Eğitim Modülleri</h2>
        </div>

        <div className="space-y-6">
          {modules.map((module, index) => (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{module.title}</span>
                  <Badge variant="outline" className="ml-2">
                    {module.lessons?.length || 0} ders
                  </Badge>
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-3">
                <Progress 
                  value={calculateModuleProgress(module)} 
                  className="h-2 mb-2" 
                />
                <p className="text-sm text-muted-foreground">
                  {getCompletedLessonCount(module)} / {module.lessons?.length || 0} ders tamamlandı
                </p>
              </CardContent>
              
              <CardFooter>
                <div className="w-full space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {module.lessons?.slice(0, 3).map((lesson: any) => (
                      <Button 
                        key={lesson.id}
                        variant={lesson.status === 'locked' ? 'outline' : 'secondary'}
                        className="justify-start"
                        asChild
                      >
                        <Link href={lesson.status !== 'locked' ? `/lesson/${lesson.id}` : '#'}>
                          {lesson.status === 'locked' ? (
                            <LockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          ) : lesson.status === 'completed' ? (
                            <CheckCircle className="mr-2 h-4 w-4 text-success" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </Link>
                      </Button>
                    ))}
                  </div>
                  
                  {(module.lessons?.length || 0) > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      asChild
                    >
                      <Link href={`/module/${module.id}`}>
                        Tüm dersleri görüntüle
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

// Helper functions
function calculateModuleProgress(module: any): number {
  if (!module.lessons || module.lessons.length === 0) return 0;
  
  const completedLessons = module.lessons.filter((lesson: any) => 
    lesson.status === 'completed'
  ).length;
  
  return Math.round((completedLessons / module.lessons.length) * 100);
}

function getCompletedLessonCount(module: any): number {
  if (!module.lessons) return 0;
  return module.lessons.filter((lesson: any) => lesson.status === 'completed').length;
}