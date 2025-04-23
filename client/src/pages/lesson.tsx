import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { updateUserProgress } from '@/lib/supabase';
import { 
  type Lesson,
  type LessonContent,
  type QuestionAnswer,
  type MultipleChoiceQuestion,
  type TrueFalseQuestion,
  type MatchingQuestion,
  type DragAndDropQuestion
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MultipleChoice,
  TrueFalse,
  Matching,
  DragAndDrop
} from '@/components/ui/question-types';
import { ChevronLeft, ChevronRight, Bookmark, Share, PlayCircle } from 'lucide-react';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await apiRequest('GET', `/api/lessons/${id}`, undefined);
        const lessonData = await response.json();
        setLesson(lessonData);
        
        const contentResponse = await apiRequest('GET', `/api/lessons/${id}/content`, undefined);
        const contentData = await contentResponse.json();
        setContent(contentData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError('Ders içeriği yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleAnswer = async (answer: QuestionAnswer) => {
    // Store the answer
    setAnswers(prev => ({ ...prev, [answer.questionId]: answer }));
    
    // Calculate progress and points
    if (content) {
      const totalQuestions = content.questions.length;
      const answeredQuestions = Object.keys(answers).length + 1;
      const newProgress = Math.round((answeredQuestions / totalQuestions) * 100);
      setProgress(newProgress);

      // Calculate earned points
      let earnedPoints = 0;
      const currentAnswers = { ...answers, [answer.questionId]: answer };
      
      content.questions.forEach(q => {
        const questionAnswer = currentAnswers[q.id];
        if (questionAnswer) {
          if (questionAnswer.isCorrect) {
            earnedPoints += q.points;
          } else if (questionAnswer.partialScore) {
            earnedPoints += Math.round(q.points * questionAnswer.partialScore);
          }
        }
      });

      // If all questions are answered, complete the lesson
      if (answeredQuestions === totalQuestions) {
        try {
          const maxScore = content.questions.reduce((sum, q) => sum + q.points, 0);
          const result = await apiRequest('POST', `/api/lessons/${id}/complete`, {
            score: earnedPoints,
            maxScore: maxScore
          });

          // Kullanıcı istatistiklerini güncelle
          await apiRequest('POST', '/api/user/stats/update', {
            points: earnedPoints,
            completed_lessons: 1
          });

          // Show completion message with earned XP
          toast({
            title: "Ders tamamlandı!",
            description: `Tebrikler! Bu dersten ${earnedPoints} XP kazandınız.`,
            variant: "success"
          });

          // Sayfayı yeniden yükle veya sonraki derse yönlendir
          if (lesson?.nextLessonId) {
            navigate(`/lesson/${lesson.nextLessonId}`);
            window.location.reload();
          }

          // Check for earned badges
          const badgesResponse = await apiRequest('GET', '/api/user/badges');
          const newBadges = await badgesResponse.json();
          
          // Get current badges and compare with new ones
          const prevBadgesResponse = await apiRequest('GET', '/api/user/badges');
          const prevBadges = await prevBadgesResponse.json();
          const earnedBadges = newBadges.filter(
            (badge: any) => !prevBadges.some((b: any) => b.id === badge.id)
          );

          // Show badge notifications
          earnedBadges.forEach((badge: any) => {
            toast({
              title: "Yeni Rozet Kazandınız!",
              description: `"${badge.name}" rozetini kazandınız: ${badge.description}`,
              variant: "success"
            });
          });
        } catch (error) {
          console.error('Error completing lesson:', error);
          toast({
            title: "Hata",
            description: "Ders tamamlanırken bir hata oluştu.",
            variant: "destructive"
          });
        }
      }
      
      // Update progress in database if all questions are answered
      if (answeredQuestions === totalQuestions) {
        try {
          // Get total score
          let totalPoints = 0;
          let earnedPoints = 0;
          
          content.questions.forEach(q => {
            const questionAnswer = { ...answers, [answer.questionId]: answer }[q.id];
            if (questionAnswer) {
              totalPoints += q.points;
              
              if (questionAnswer.isCorrect) {
                earnedPoints += q.points;
              } else if (questionAnswer.partialScore) {
                earnedPoints += Math.round(q.points * questionAnswer.partialScore);
              }
            }
          });
          
          // Update user progress
          await updateUserProgress({
            user_id: 'current-user', // In a real app, this would be the actual user ID
            lesson_id: id,
            is_completed: true,
            score: earnedPoints,
            max_score: totalPoints,
            progress: 100,
            completion_date: new Date().toISOString()
          });
          
          // Also update lesson status in the API
          await apiRequest('POST', `/api/lessons/${id}/complete`, {
            score: earnedPoints,
            maxScore: totalPoints
          });
          
        } catch (err) {
          console.error('Error updating progress:', err);
        }
      }
    }
  };
  
  const renderQuestion = (question: any) => {
    const answer = answers[question.id];
    const isAnswered = !!answer;
    
    switch (question.type) {
      case 'multiple_choice':
        return (
          <MultipleChoice
            key={question.id}
            question={question as MultipleChoiceQuestion}
            onAnswer={handleAnswer}
            isAnswered={isAnswered}
            selectedOption={answer?.answer as string}
          />
        );
      case 'true_false':
        return (
          <TrueFalse
            key={question.id}
            question={question as TrueFalseQuestion}
            onAnswer={handleAnswer}
            isAnswered={isAnswered}
            selectedAnswer={answer?.answer as boolean}
          />
        );
      case 'matching':
        return (
          <Matching
            key={question.id}
            question={question as MatchingQuestion}
            onAnswer={handleAnswer}
            isAnswered={isAnswered}
            matchedPairs={answer?.answer as Record<string, string>}
          />
        );
      case 'drag_and_drop':
        return (
          <DragAndDrop
            key={question.id}
            question={question as DragAndDropQuestion}
            onAnswer={handleAnswer}
            isAnswered={isAnswered}
            currentOrder={answer?.answer as string[]}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !lesson || !content) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold text-red-600 mb-4">Oops!</h2>
        <p className="mb-4">{error || 'Ders içeriği bulunamadı.'}</p>
        <Button onClick={() => navigate('/')}>Ana Sayfaya Dön</Button>
      </div>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm p-6 mb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Link href="/">
              <Button variant="link" className="text-secondary p-0 flex items-center">
                <ChevronLeft className="h-4 w-4" />
                <span>Geri</span>
              </Button>
            </Link>
            <span className="text-neutral-800/50">•</span>
            <span className="text-neutral-800/70 text-sm">Modül {lesson.moduleIndex + 1}</span>
            <span className="text-neutral-800/50">•</span>
            <span className="text-neutral-800/70 text-sm">Ders {lesson.lessonIndex + 1}/{lesson.totalLessonsInModule}</span>
          </div>
          <h2 className="text-2xl font-bold">{lesson.title}</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" className="flex items-center space-x-1 text-neutral-800/70">
            <Bookmark className="h-5 w-5" />
            <span className="text-sm hidden md:inline">Kaydet</span>
          </Button>
          <Button variant="ghost" className="flex items-center space-x-1 text-neutral-800/70">
            <Share className="h-5 w-5" />
            <span className="text-sm hidden md:inline">Paylaş</span>
          </Button>
        </div>
      </div>
      
      <div>
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Konu Anlatımı</h3>
          <div dangerouslySetInnerHTML={{ __html: content.introduction }}></div>
          
          {content.sections.map((section, index) => (
            <div key={index}>
              {section.type === 'text' && (
                <div dangerouslySetInnerHTML={{ __html: section.content }}></div>
              )}
              
              {section.type === 'list' && (
                <div className="bg-neutral-100 rounded-lg p-4 my-4">
                  <h4 className="font-medium mb-2">{section.title}</h4>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    {section.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {section.type === 'video' && (
                <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <PlayCircle className="h-16 w-16 text-primary" />
                    <p className="text-neutral-800/70 mt-2">{section.caption}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Sorular</h3>
          
          {content.questions.map(question => renderQuestion(question))}
          
          <div className="mt-8 flex justify-between">
            {lesson.prevLessonId ? (
              <Link href={`/lesson/${lesson.prevLessonId}`}>
                <Button variant="outline" className="flex items-center space-x-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Önceki: {lesson.prevLessonTitle}</span>
                </Button>
              </Link>
            ) : (
              <div></div>
            )}
            
            {lesson.nextLessonId ? (
              <Link href={`/lesson/${lesson.nextLessonId}`}>
                <Button className="bg-primary text-white flex items-center space-x-2 hover:bg-primary/90">
                  <span>Sonraki: {lesson.nextLessonTitle}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/">
                <Button className="bg-primary text-white flex items-center space-x-2 hover:bg-primary/90">
                  <span>Modülü Tamamla</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
