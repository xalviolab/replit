import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Move, AlertCircle } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  type MultipleChoiceQuestion,
  type TrueFalseQuestion,
  type MatchingQuestion,
  type DragAndDropQuestion,
  type QuestionAnswer
} from '@/types';

// Multiple Choice Question Component
interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  onAnswer: (answer: QuestionAnswer) => void;
  isAnswered?: boolean;
  selectedOption?: string;
}

export function MultipleChoice({ question, onAnswer, isAnswered = false, selectedOption }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(selectedOption || null);

  const handleSelect = (optionId: string) => {
    if (isAnswered) return;

    setSelected(optionId);
    onAnswer({
      questionId: question.id,
      questionType: 'multiple_choice',
      answer: optionId,
      isCorrect: optionId === question.correctOption
    });
  };

  return (
    <Card className="bg-neutral-100 mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-medium">Soru {question.order}: Çoktan Seçmeli</h4>
          <span className="text-xs bg-neutral-200 rounded-full px-2 py-1">{question.points} puan</span>
        </div>
        <p className="mb-4" dangerouslySetInnerHTML={{ __html: question.text }}></p>

        <div className="space-y-3">
          {question.options.map((option) => (
            <div 
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`question-option flex items-center p-3 rounded-lg cursor-pointer
                ${selected === option.id 
                  ? isAnswered 
                    ? option.id === question.correctOption 
                      ? 'border-2 border-green-500 bg-green-50' 
                      : 'border-2 border-red-500 bg-red-50' 
                    : 'border-2 border-secondary bg-secondary/5' 
                  : 'border border-neutral-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div 
                className={`w-5 h-5 rounded-full flex-shrink-0 mr-3 flex items-center justify-center
                  ${selected === option.id 
                    ? isAnswered 
                      ? option.id === question.correctOption 
                        ? 'border-2 border-green-500 bg-green-500' 
                        : 'border-2 border-red-500 bg-red-500' 
                      : 'border-2 border-secondary bg-secondary' 
                    : 'border-2 border-neutral-300'
                  }
                `}
              >
                {selected === option.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isAnswered ? (
                      option.id === question.correctOption ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : (
                        <X className="h-3 w-3 text-white" />
                      )
                    ) : (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </motion.div>
                )}
              </div>
              <span>{option.text}</span>
            </div>
          ))}
        </div>

        {isAnswered && selected && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mt-4 p-3 border rounded-lg ${selected === question.correctOption ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
          >
            <div className="flex items-start">
              {selected === question.correctOption ? (
                <>
                  <Check className="text-green-500 text-xl mr-2" />
                  <div>
                    <p className="font-medium text-green-500">Doğru!</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-500 text-xl mr-2" />
                  <div>
                    <p className="font-medium text-red-500">Yanlış</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// True/False Question Component
interface TrueFalseProps {
  question: TrueFalseQuestion;
  onAnswer: (answer: QuestionAnswer) => void;
  isAnswered?: boolean;
  selectedAnswer?: boolean;
}

export function TrueFalse({ question, onAnswer, isAnswered = false, selectedAnswer }: TrueFalseProps) {
  const [answer, setAnswer] = useState<boolean | null>(selectedAnswer === undefined ? null : selectedAnswer);

  const handleSelect = (value: boolean) => {
    if (isAnswered) return;

    setAnswer(value);
    onAnswer({
      questionId: question.id,
      questionType: 'true_false',
      answer: value,
      isCorrect: value === question.correctAnswer
    });
  };

  return (
    <Card className="bg-neutral-100 mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-medium">Soru {question.order}: Doğru/Yanlış</h4>
          <span className="text-xs bg-neutral-200 rounded-full px-2 py-1">{question.points} puan</span>
        </div>
        <p className="mb-4" dangerouslySetInnerHTML={{ __html: question.text }}></p>

        <div className="flex space-x-3">
          <Button
            variant={answer === true ? (isAnswered ? (question.correctAnswer ? 'success' : 'destructive') : 'secondary') : 'outline'}
            onClick={() => handleSelect(true)}
            className="flex-1 p-3"
          >
            Doğru
          </Button>
          <Button
            variant={answer === false ? (isAnswered ? (!question.correctAnswer ? 'success' : 'destructive') : 'secondary') : 'outline'}
            onClick={() => handleSelect(false)}
            className="flex-1 p-3"
          >
            Yanlış
          </Button>
        </div>

        {isAnswered && answer !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mt-4 p-3 border rounded-lg ${answer === question.correctAnswer ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
          >
            <div className="flex items-start">
              {answer === question.correctAnswer ? (
                <>
                  <Check className="text-green-500 text-xl mr-2" />
                  <div>
                    <p className="font-medium text-green-500">Doğru!</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-500 text-xl mr-2" />
                  <div>
                    <p className="font-medium text-red-500">Yanlış</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Matching Question Component
interface MatchingProps {
  question: MatchingQuestion;
  onAnswer: (answer: QuestionAnswer) => void;
  isAnswered?: boolean;
  matchedPairs?: Record<string, string>;
}

export function Matching({ question, onAnswer, isAnswered = false, matchedPairs = {} }: MatchingProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>(matchedPairs);

  const handleSelect = (id: string) => {
    if (isAnswered) return;

    if (selected === null) {
      // First selection (left side)
      setSelected(id);
    } else {
      // Second selection (right side) - make a match
      const updatedMatches = { ...matches, [selected]: id };
      setMatches(updatedMatches);
      setSelected(null);

      // Check if all items are matched
      if (Object.keys(updatedMatches).length === question.leftItems.length) {
        // Calculate correctness
        const correctMatches = question.leftItems.reduce((correct, leftItem) => {
          return correct + (updatedMatches[leftItem.id] === question.correctMatches[leftItem.id] ? 1 : 0);
        }, 0);

        const isAllCorrect = correctMatches === question.leftItems.length;

        onAnswer({
          questionId: question.id,
          questionType: 'matching',
          answer: updatedMatches,
          isCorrect: isAllCorrect,
          partialScore: correctMatches / question.leftItems.length
        });
      }
    }
  };

  const isItemMatched = (id: string, side: 'left' | 'right') => {
    if (side === 'left') {
      return id in matches;
    } else {
      return Object.values(matches).includes(id);
    }
  };

  const getMatchClass = (id: string, side: 'left' | 'right') => {
    if (!isAnswered) {
      return selected === id ? 'border-primary bg-primary/5' : isItemMatched(id, side) ? 'border-secondary bg-secondary/5' : '';
    }

    // If answered, show correct/incorrect
    if (side === 'left') {
      const rightId = matches[id];
      const isCorrect = question.correctMatches[id] === rightId;
      return isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
    } else {
      const leftId = Object.keys(matches).find(key => matches[key] === id);
      if (!leftId) return '';
      const isCorrect = question.correctMatches[leftId] === id;
      return isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
    }
  };

  return (
    <Card className="bg-neutral-100 mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-medium">Soru {question.order}: Eşleştirme</h4>
          <span className="text-xs bg-neutral-200 rounded-full px-2 py-1">{question.points} puan</span>
        </div>
        <p className="mb-4" dangerouslySetInnerHTML={{ __html: question.text }}></p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {question.leftItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 bg-white border rounded-lg flex items-center justify-between cursor-pointer
                  ${getMatchClass(item.id, 'left')}
                  ${isItemMatched(item.id, 'left') && !isAnswered ? 'opacity-60' : ''}
                `}
                onClick={() => !isItemMatched(item.id, 'left') && handleSelect(item.id)}
              >
                <span>{item.text}</span>
                <Move className="h-4 w-4 text-neutral-400" />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {question.rightItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 bg-white border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center min-h-[45px] cursor-pointer
                  ${isItemMatched(item.id, 'right') ? `border-solid ${getMatchClass(item.id, 'right')}` : ''}
                `}
                onClick={() => selected !== null && !isItemMatched(item.id, 'right') && handleSelect(item.id)}
              >
                <span className={isItemMatched(item.id, 'right') ? 'text-neutral-800' : 'text-neutral-400'}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-3 border rounded-lg border-green-500 bg-green-50"
          >
            <div className="flex items-start">
              <Check className="text-green-500 text-xl mr-2" />
              <div>
                <p className="font-medium text-green-500">
                  {Object.keys(matches).every(key => matches[key] === question.correctMatches[key]) 
                    ? 'Mükemmel!' 
                    : 'Tamamlandı!'}
                </p>
                <p className="text-sm">{question.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Sortable Item Component for Drag and Drop
interface SortableItemProps {
  id: string;
  order: number;
  text: string;
  isCorrect?: boolean;
  showResult?: boolean;
}

function SortableItem({ id, order, text, isCorrect, showResult }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`p-3 bg-white border rounded-lg flex items-center justify-between cursor-grab active:cursor-grabbing
        ${showResult && isCorrect !== undefined ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-neutral-200'}
      `}
    >
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
          {order}
        </div>
        <span>{text}</span>
      </div>
      <Move className="h-4 w-4 text-neutral-400" />
    </div>
  );
}

// Drag and Drop (Order) Question Component
interface DragAndDropProps {
  question: DragAndDropQuestion;
  onAnswer: (answer: QuestionAnswer) => void;
  isAnswered?: boolean;
  currentOrder?: string[];
}

export function DragAndDrop({ question, onAnswer, isAnswered = false, currentOrder = [] }: DragAndDropProps) {
  const [items, setItems] = useState(() => {
    return currentOrder.length > 0 
      ? currentOrder
      : [...question.items.map(item => item.id)];
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (isAnswered) return;

    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id.toString());
        const newIndex = items.indexOf(over.id.toString());

        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Check if the order is correct
        const isCorrect = JSON.stringify(newOrder) === JSON.stringify(question.correctOrder);

        // Calculate partial score based on how many items are in the correct position
        let correctPositions = 0;
        for (let i = 0; i < newOrder.length; i++) {
          if (newOrder[i] === question.correctOrder[i]) {
            correctPositions++;
          }
        }

        const partialScore = correctPositions / question.correctOrder.length;

        onAnswer({
          questionId: question.id,
          questionType: 'drag_and_drop',
          answer: newOrder,
          isCorrect,
          partialScore
        });

        return newOrder;
      });
    }
  };

  // Map items to their text and check if they're in the correct position
  const itemsWithDetails = items.map((id, index) => {
    const item = question.items.find(item => item.id === id);
    const isCorrectPosition = isAnswered && id === question.correctOrder[index];

    return {
      id,
      text: item?.text || '',
      order: index + 1,
      isCorrect: isCorrectPosition
    };
  });

  return (
    <Card className="bg-neutral-100 mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-medium">Soru {question.order}: Sürükle Bırak</h4>
          <span className="text-xs bg-neutral-200 rounded-full px-2 py-1">{question.points} puan</span>
        </div>
        <p className="mb-4" dangerouslySetInnerHTML={{ __html: question.text }}></p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 mb-4">
              {itemsWithDetails.map((item) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  text={item.text}
                  order={item.order}
                  isCorrect={item.isCorrect}
                  showResult={isAnswered}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {isAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mt-4 p-3 border rounded-lg ${JSON.stringify(items) === JSON.stringify(question.correctOrder) ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
          >
            <div className="flex items-start">
              {JSON.stringify(items) === JSON.stringify(question.correctOrder) ? (
                <>
                  <Check className="text-green-500 text-xl mr-2" />
                  <div>
                    <p className="font-medium text-green-500">Mükemmel sıralama!</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-500 text-xl mr-2" />
                  <div>
                    <p className="font-medium text-red-500">İyi deneme!</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}