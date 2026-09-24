/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = {
  TTs: number[];
  onBack: () => void;
  questionCount: number;
};

type Question = {
  table: number;
  multiplier: number;
  answer: number;
  options: number[];
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function createQuestionPool(TTs: number[]): Question[] {
  const pool = TTs.flatMap((table) =>
    Array.from({ length: 12 }, (_, i) => {
      const multiplier = i + 1;
      const answer = table * multiplier;

      const wrongAnswers = new Set<number>();

      while (wrongAnswers.size < 3) {
        const offset = Math.floor(Math.random() * 21) - 10;
        const wrong = answer + offset;

        if (wrong > 0 && wrong !== answer) {
          wrongAnswers.add(wrong);
        }
      }

      return {
        table,
        multiplier,
        answer,
        options: shuffle([answer, ...wrongAnswers]),
      };
    }),
  );

  return shuffle(pool);
}

function getCurrentTime(): number {
  return performance.now();
}

function formatSeconds(t: number): string {
  const totalSeconds = Math.max(0, Math.floor(t));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function calculatePoints(milliseconds: number): number {
  const seconds = milliseconds / 1000;

  const floor = 300;
  const ceiling = 1000;

  const decay = 0.13;

  const points =
    floor + (ceiling - floor + 50) * Math.exp(-decay * Math.pow(seconds, 0.7));

  return Math.max(floor, Math.round(points));
}

export default function Play({ TTs, onBack, questionCount }: Props) {
  const reduceMotion = useReducedMotion();

  const [questions, setQuestions] = useState<Question[]>(() =>
    createQuestionPool(TTs),
  );

  const [questionNumber, setQuestionNumber] = useState(1);
  const question = questions[(questionNumber - 1) % questions.length];

  // Correct-answer count
  const [score, setScore] = useState(0);

  // Points score
  const [pointScore, setPointScore] = useState(0);
  const [animatedPointScore, setAnimatedPointScore] = useState(0);

  // Streak is intentionally only used for the summary
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Question timing
  const questionStartTime = useRef(getCurrentTime());
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const [answeredTime, setAnsweredTime] = useState<number | null>(null);

  // Total time across the round
  const [totalTime, setTotalTime] = useState(0);

  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [finished, setFinished] = useState(false);

  // Running question timer.
  useEffect(() => {
    if (answered || finished) return;

    questionStartTime.current = performance.now();

    const doThis = () => setElapsedMilliseconds(0);
    doThis();

    const interval = window.setInterval(() => {
      setElapsedMilliseconds(performance.now() - questionStartTime.current);
    }, 50);

    return () => window.clearInterval(interval);
  }, [questionNumber, answered, finished]);

  // Animate the running points total whenever a new score is awarded.
  useEffect(() => {
    if (reduceMotion) {
      const doThis = () => setAnimatedPointScore(pointScore);
      doThis();
      return;
    }

    const startValue = animatedPointScore;
    const difference = pointScore - startValue;
    const duration = 450;
    const startTime = performance.now();

    let animationFrame: number;

    const animateScore = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease out for a quick grow/shrink effect
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedPointScore(Math.round(startValue + difference * eased));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateScore);
      }
    };

    animationFrame = requestAnimationFrame(animateScore);

    return () => cancelAnimationFrame(animationFrame);
  }, [pointScore, reduceMotion]);

  const currentElapsedMilliseconds = answeredTime ?? elapsedMilliseconds;

  const currentElapsedSeconds = currentElapsedMilliseconds / 1000;

  const correct = selectedAnswer !== null && selectedAnswer === question.answer;

  function handleAnswer(answer: number) {
    if (answered || finished) return;

    const endTime = getCurrentTime();
    const timeTaken = endTime - questionStartTime.current;

    const isCorrect = answer === question.answer;
    const earnedPoints = isCorrect ? calculatePoints(timeTaken) : 0;

    setSelectedAnswer(answer);
    setAnswered(true);
    setAnsweredTime(timeTaken);
    setTotalTime((previous) => previous + timeTaken);

    if (isCorrect) {
      setScore((previous) => previous + 1);
      setPointScore((previous) => previous + earnedPoints);

      setStreak((previous) => {
        const next = previous + 1;

        setBestStreak((best) => Math.max(best, next));

        console.log(
          `See here's the thing, I don't know if it will be, but the straek varaible is currently not used. So here you go, a useless logging of the streak variable: ${streak}`,
        );

        return next;
      });
    } else {
      setStreak(0);
    }
  }

  const answerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!answered && !finished) {
      answerInput.current?.focus();
    }
  }, [questionNumber, answered, finished]);

  function handleNext() {
    if (!answered) return;

    // Finish when the total requested questions have been answered
    if (questionNumber >= questionCount) {
      setFinished(true);
      return;
    }

    // Refresh the pool after we've used every question in it
    if (questionNumber % questions.length === 0) {
      setQuestions(createQuestionPool(TTs));
    }

    // Keep the overall question number increasing
    setQuestionNumber((previous) => previous + 1);

    setSelectedAnswer(null);
    setTypedAnswer("");
    setAnswered(false);
    setAnsweredTime(null);
  }

  function handleRestart() {
    setQuestions(createQuestionPool(TTs));
    setQuestionNumber(1);

    setScore(0);
    setPointScore(0);
    setAnimatedPointScore(0);

    setStreak(0);
    setBestStreak(0);

    setTotalTime(0);

    setElapsedMilliseconds(0);
    setAnsweredTime(null);

    setSelectedAnswer(null);
    setTypedAnswer("");
    setAnswered(false);
    setFinished(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!typedAnswer.trim()) return;

    const answer = Number(typedAnswer);

    if (Number.isFinite(answer)) {
      handleAnswer(answer);
    }
  }

  const progress = finished
    ? 100
    : ((questionNumber - 1) / questionCount) * 100;

  const averageQuestionTime = questionCount > 0 ? totalTime / questionCount : 0;

  const motionProps = reduceMotion
    ? {
        initial: false,
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  return (
    <div className="min-h-dvh w-full flex justify-center items-start px-4 py-6 text-white bg-black">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-gray-300 transition-all duration-200 hover:bg-gray-800 hover:text-white active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <span className="text-sm text-gray-500">
            {TTs.join(", ")} times tables
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {finished ? (
            /* Results screen */
            <motion.div
              key="results"
              {...motionProps}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="rounded-3xl border border-gray-800 bg-gray-900 p-8 text-center"
            >
              <div className="text-5xl mb-5">
                {score === questionCount
                  ? "🏆"
                  : score >= questionCount * 0.7
                    ? "🎉"
                    : "💪"}
              </div>

              <h1 className="text-4xl font-bold text-pink-500 mb-3">
                Round complete!
              </h1>

              <p className="text-gray-400 mb-8">
                You answered {questionCount} questions.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {/* Total points */}
                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-gray-500 mb-2">Round score</p>

                  <p className="text-4xl font-bold text-pink-500">
                    {pointScore.toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-600 mt-1">points</p>
                </div>

                {/* Correct answers */}
                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-gray-500 mb-2">Correct answers</p>

                  <p className="text-4xl font-bold">
                    {score}/{questionCount}
                  </p>
                </div>

                {/* Average time */}
                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-gray-500 mb-2">
                    Average question time
                  </p>

                  <p className="text-3xl font-bold">
                    {(averageQuestionTime / 1000).toFixed(1)}s
                  </p>
                </div>

                {/* Accuracy */}
                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-gray-500 mb-2">Accuracy</p>

                  <p className="text-3xl font-bold">
                    {Math.round((score / questionCount) * 100)}%
                  </p>
                </div>

                {/* Best streak */}
                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-gray-500 mb-2">Best streak</p>

                  <p className="text-3xl font-bold">{bestStreak}</p>
                </div>

                {/* Tables */}
                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-gray-500 mb-2">Tables practiced</p>

                  <p className="text-3xl font-bold">{TTs.length}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 rounded-xl bg-pink-500 px-6 py-3 font-bold text-white transition hover:bg-pink-400 active:scale-95"
                >
                  Play Again
                </button>

                <button
                  onClick={onBack}
                  className="flex-1 rounded-xl border border-gray-700 px-6 py-3 font-bold text-gray-300 transition hover:bg-gray-800 active:scale-95"
                >
                  Change Tables
                </button>
              </div>
            </motion.div>
          ) : (
            /* Game screen */
            <motion.div
              key="game"
              {...motionProps}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-pink-500 mb-2">
                  Practice Mode
                </h1>

                <p className="text-gray-400">
                  Solve the multiplication question!
                </p>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>
                    Question {questionNumber} of {questionCount}
                  </span>

                  <span>{animatedPointScore.toLocaleString()} pts</span>
                </div>

                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-pink-500"
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <p className="text-xs text-gray-500 mb-1">Correct answers</p>

                  <p className="text-2xl font-bold">{score}</p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <p className="text-xs text-gray-500 mb-1">Score this round</p>

                  <motion.p
                    key={pointScore}
                    initial={
                      reduceMotion
                        ? false
                        : {
                            scale: 1.2,
                          }
                    }
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-pink-500"
                  >
                    {animatedPointScore.toLocaleString()}
                  </motion.p>
                </div>
              </div>

              {/* Question */}
              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 sm:p-10 text-center">
                <p className="text-sm font-medium text-gray-500 mb-5">
                  WHAT IS
                </p>

                <motion.div
                  key={`${question.table}-${question.multiplier}-${questionNumber}`}
                  initial={{
                    opacity: 0,
                    scale: reduceMotion ? 1 : 0.85,
                  }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.2,
                  }}
                  className="mb-8"
                >
                  <div className="text-5xl sm:text-7xl font-bold tracking-tight">
                    {question.table} <span className="text-pink-500">×</span>{" "}
                    {question.multiplier}
                  </div>

                  <div className="text-3xl text-gray-500 mt-4">
                    =
                    <span className="text-pink-500 ml-3">
                      {answered ? question.answer : "?"}
                    </span>
                  </div>
                </motion.div>

                {/* Running timer */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-widest text-gray-600 mb-1">
                    Time
                  </p>

                  <motion.p
                    key={answered ? "finished" : "running"}
                    initial={
                      reduceMotion
                        ? false
                        : {
                            scale: answered ? 1.1 : 1,
                          }
                    }
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold tabular-nums text-white"
                  >
                    {answered
                      ? `${currentElapsedSeconds.toFixed(1)}s`
                      : formatSeconds(currentElapsedSeconds)}
                  </motion.p>
                </div>

                {/* Multiple choice answers */}
                <div className="grid grid-cols-2 gap-3">
                  {question.options.map((option) => {
                    const isCorrect = option === question.answer;
                    const isSelected = option === selectedAnswer;

                    let buttonStyle =
                      "border-gray-700 bg-black hover:border-pink-500 hover:bg-gray-800";

                    if (answered && isCorrect) {
                      buttonStyle =
                        "border-green-500 bg-green-500/15 text-green-400";
                    } else if (answered && isSelected) {
                      buttonStyle = "border-red-500 bg-red-500/15 text-red-400";
                    } else if (answered) {
                      buttonStyle =
                        "border-gray-800 bg-black text-gray-600 opacity-50";
                    }

                    return (
                      <motion.button
                        key={option}
                        whileHover={
                          !answered && !reduceMotion ? { scale: 1.03 } : {}
                        }
                        whileTap={
                          !answered && !reduceMotion ? { scale: 0.96 } : {}
                        }
                        disabled={answered}
                        onClick={() => handleAnswer(option)}
                        className={`min-h-16 rounded-2xl border-2 text-2xl font-bold transition-colors duration-200 ${buttonStyle}`}
                      >
                        {option}

                        {answered && isCorrect && (
                          <span className="ml-2">✓</span>
                        )}

                        {answered && isSelected && !isCorrect && (
                          <span className="ml-2">✕</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Type answer */}
                <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    ref={answerInput}
                    min="0"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    disabled={answered}
                    placeholder="Or type your answer..."
                    aria-label="Your answer"
                    className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none min-w-0 flex-1 rounded-xl border border-gray-700 bg-black px-4 py-3 text-white placeholder:text-gray-600 outline-none transition focus:border-pink-500 disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={answered || !typedAnswer.trim()}
                    className="rounded-xl bg-gray-800 px-5 py-3 font-bold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Check
                  </button>
                </form>

                {/* Feedback */}
                <AnimatePresence>
                  {answered && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: reduceMotion ? 0 : 8,
                      }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.2,
                      }}
                      className="mt-6"
                    >
                      <div
                        className={`rounded-xl p-4 mb-4 ${
                          correct
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        <p className="font-bold text-lg">
                          {correct ? "Correct! 🎉" : "Not quite!"}
                        </p>

                        {!correct && (
                          <p className="text-sm mt-1">
                            The answer is {question.answer}.
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                          <span>
                            Time:{" "}
                            <strong>{currentElapsedSeconds.toFixed(1)}s</strong>
                          </span>

                          {correct && (
                            <span>
                              +{" "}
                              <strong>
                                {calculatePoints(
                                  currentElapsedMilliseconds,
                                ).toLocaleString()}
                              </strong>{" "}
                              pts
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleNext}
                        autoFocus
                        className="w-full rounded-xl bg-pink-500 px-6 py-4 font-bold text-white transition hover:bg-pink-400 active:scale-[0.98]"
                      >
                        {questionNumber === questionCount
                          ? "See Results"
                          : "Next Question →"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="mt-5 text-center text-xs text-gray-600">
                Choose an answer or type it in. You can also press Enter to
                check.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
