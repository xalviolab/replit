import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { type Module } from '@/types';

interface ProgressPathProps {
  modules: Module[];
  currentModule?: number;
  currentLesson?: number;
}

export function ProgressPath({ modules, currentModule = 0, currentLesson = 0 }: ProgressPathProps) {
  const [visibleModules, setVisibleModules] = useState<number[]>([0]);
  
  useEffect(() => {
    // Always display the currentModule
    if (!visibleModules.includes(currentModule)) {
      setVisibleModules(prev => [...prev, currentModule]);
    }
  }, [currentModule, visibleModules]);

  const toggleModule = (moduleIndex: number) => {
    setVisibleModules(prev => 
      prev.includes(moduleIndex) 
        ? prev.filter(idx => idx !== moduleIndex) 
        : [...prev, moduleIndex]
    );
  };

  return (
    <div className="relative">
      {modules.map((module, moduleIndex) => (
        <div key={`module-${moduleIndex}`} className="mb-8">
          <div 
            className="flex items-center mb-4 cursor-pointer"
            onClick={() => toggleModule(moduleIndex)}
          >
            <div className="flex-grow h-px bg-neutral-200"></div>
            <h3 className="mx-4 text-lg font-semibold text-neutral-800/70">
              Modül {moduleIndex + 1}: {module.title}
            </h3>
            <div className="flex-grow h-px bg-neutral-200"></div>
          </div>
          
          {visibleModules.includes(moduleIndex) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {module.lessons.map((lesson, lessonIndex) => {
                // Determine if lesson is available
                const isCompleted = lesson.status === 'completed';
                const isAvailable = lesson.status === 'available' || lesson.status === 'in_progress';
                const isLocked = lesson.status === 'locked';
                
                return (
                  <div key={`lesson-${moduleIndex}-${lessonIndex}`}>
                    <Link href={isAvailable ? `/lesson/${lesson.id}` : '#'}>
                      <div 
                        className={`node bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer
                          ${isCompleted ? 'border-2 border-accent' : ''}
                          ${isAvailable && !isCompleted ? lesson.status === 'in_progress' ? 'border-2 border-primary animate-pulse-slow shadow-md' : 'border border-neutral-200' : ''}
                          ${isLocked ? 'opacity-70' : ''}
                        `}
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
                      </div>
                    </Link>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
