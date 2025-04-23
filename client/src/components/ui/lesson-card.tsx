import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { type Lesson } from '@/types';

interface LessonCardProps {
  lesson: Lesson;
  moduleIndex: number;
  lessonIndex: number;
}

export function LessonCard({ lesson, moduleIndex, lessonIndex }: LessonCardProps) {
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available' || lesson.status === 'in_progress';
  const isLocked = lesson.status === 'locked';
  
  return (
    <Link href={isAvailable ? `/lesson/${lesson.id}` : '#'}>
      <motion.div 
        className={`node bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer
          ${isCompleted ? 'border-2 border-accent' : ''}
          ${isAvailable && !isCompleted ? lesson.status === 'in_progress' ? 'border-2 border-primary animate-pulse-slow shadow-md' : 'border border-neutral-200' : ''}
          ${isLocked ? 'opacity-70' : ''}
        `}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
      >
        <div className={`h-2 ${isCompleted ? 'bg-accent' : isAvailable && lesson.status === 'in_progress' ? 'bg-primary' : 'bg-neutral-200'}`}></div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <span 
              className={`inline-block text-xs font-medium px-2 py-1 rounded-full
                ${isCompleted ? 'bg-accent/10 text-accent' : ''}
                ${isAvailable && !isCompleted ? lesson.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary' : ''}
                ${isLocked ? 'bg-neutral-200 text-neutral-800/70' : ''}
              `}
            >
              {isCompleted ? 'Tamamlandı' : isAvailable && lesson.status === 'in_progress' ? 'Devam Ediyor' : isAvailable ? 'Hazır' : 'Kilitli'}
            </span>
            <span className="text-sm text-neutral-800/70">{lesson.duration} dakika</span>
          </div>
          <h4 className="font-semibold mb-1">{lesson.title}</h4>
          <p className="text-sm text-neutral-800/70 mb-3">{lesson.description}</p>
          <div className="flex justify-between items-center">
            {isCompleted ? (
              <div className="flex items-center space-x-1">
                <i className='bx bxs-star text-warning'></i>
                <span className="text-sm font-medium">{lesson.rating}</span>
              </div>
            ) : lesson.status === 'in_progress' ? (
              <div className="flex items-center">
                <div className="w-full bg-neutral-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: `${lesson.progress || 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-neutral-800/70">{lesson.progress}%</span>
              </div>
            ) : (
              <div></div>
            )}
            
            {isCompleted ? (
              <button className="text-secondary text-sm font-medium hover:underline">Tekrarla</button>
            ) : lesson.status === 'in_progress' ? (
              <button className="bg-primary text-white text-sm font-medium rounded-full px-3 py-1 hover:bg-primary/90">Devam Et</button>
            ) : isLocked ? (
              <button className="flex items-center space-x-1 text-neutral-800/70 text-sm">
                <i className='bx bx-lock-alt'></i>
                <span>{lesson.lockReason}</span>
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
