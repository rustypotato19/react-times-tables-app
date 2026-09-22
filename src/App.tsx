import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useOutlet,
  useNavigate,
} from "react-router";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import Play from "./routes/play/Play";

interface LocationState {
  TTs: number[];
  questionCount: number;
}

const TTs = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function PageTransition({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: reduceMotion ? 0 : 12,
      }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        y: reduceMotion ? 0 : -12,
      }}
      transition={{
        duration: reduceMotion ? 0 : 0.25,
        ease: "easeInOut",
      }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>{outlet}</PageTransition>
    </AnimatePresence>
  );
}

export default function App() {
  const [selectedTTs, setSelectedTTs] = useState<number[]>([]);

  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customQuestionCount, setCustomQuestionCount] = useState("");

  function handleTTClick(tt: number) {
    setSelectedTTs((previous) =>
      previous.includes(tt)
        ? previous.filter((t) => t !== tt)
        : [...previous, tt],
    );
  }

  function clearAll() {
    setSelectedTTs([]);
  }

  function selectAll() {
    setSelectedTTs(TTs);
  }

  return (
    <BrowserRouter>
      <MotionConfig
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <Routes>
          <Route element={<AnimatedRoutes />}>
            <Route
              path="/"
              element={
                <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
                  <div className="mb-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-pink-500">
                      Marcelina's
                      <span className="text-purple-500"> Super Special</span>
                      <br />
                      <span className="text-white font-outline-1">
                        Times Table Practice
                      </span>
                    </h1>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row"
                  >
                    {/* Left Panel: Controls */}
                    <div className="flex-1 p-8 bg-white border-b md:border-b-0 md:border-r border-gray-100">
                      <h2 className="text-2xl font-bold text-black mb-2">
                        Times Tables
                      </h2>

                      <p className="text-gray-500 text-sm mb-6">
                        Select the tables you want to practice.
                      </p>

                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        {TTs.map((tt) => {
                          const selected = selectedTTs.includes(tt);

                          return (
                            <motion.button
                              key={tt}
                              onClick={() => handleTTClick(tt)}
                              whileHover={{ scale: 1.06 }}
                              whileTap={{ scale: 0.92 }}
                              animate={{
                                scale: selected ? 1.05 : 1,
                                backgroundColor: selected
                                  ? "#ec4899"
                                  : "#ffffff",
                                borderColor: selected ? "#ec4899" : "#e5e7eb",
                                color: selected ? "#ffffff" : "#374151",
                              }}
                              transition={{ duration: 0.2 }}
                              className="w-14 h-14 rounded-xl font-bold text-lg border-2 focus:outline-none focus:ring-4 focus:ring-pink-100 shadow-sm"
                              aria-pressed={selected}
                            >
                              {tt}
                            </motion.button>
                          );
                        })}
                      </div>
                      <div className="mt-6">
                        <p className="mb-3 text-sm font-semibold text-gray-700">
                          Number of questions
                        </p>

                        <div className="flex gap-2">
                          {([10, 20, 30] as const).map((amount) => {
                            const selected = questionCount === amount;

                            return (
                              <motion.button
                                key={amount}
                                type="button"
                                onClick={() => setQuestionCount(amount)}
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.92 }}
                                animate={{
                                  scale: selected ? 1.05 : 1,
                                  backgroundColor: selected
                                    ? "#ec4899"
                                    : "#ffffff",
                                  borderColor: selected ? "#ec4899" : "#e5e7eb",
                                  color: selected ? "#ffffff" : "#374151",
                                }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 rounded-xl px-4 py-3 font-bold border-2 focus:outline-none focus:ring-4 focus:ring-pink-100 shadow-sm  transition-all duration-150"
                                aria-pressed={selected}
                              >
                                {amount}
                              </motion.button>
                            );
                          })}

                          {/* Custom number */}
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            animate={{
                              scale: ![10, 20, 30].includes(questionCount)
                                ? 1.05
                                : 1,
                            }}
                            transition={{ duration: 0.2 }}
                            className="flex-4"
                          >
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={customQuestionCount}
                              placeholder="Custom"
                              onChange={(e) => {
                                const value = e.target.value;

                                // Allow clearing the field while editing
                                if (value === "") {
                                  setCustomQuestionCount("");
                                  return;
                                }

                                const number = Math.floor(Number(value));

                                if (!Number.isFinite(number)) return;

                                const limited = Math.min(
                                  999,
                                  Math.max(1, number),
                                );

                                setCustomQuestionCount(String(limited));
                                setQuestionCount(limited);
                              }}
                              onBlur={() => {
                                // Empty custom input = return to default 10
                                if (customQuestionCount === "") {
                                  setQuestionCount(10);
                                }
                              }}
                              onFocus={() => {
                                // Restore the previously entered custom value when clicked
                                if (customQuestionCount !== "") {
                                  setQuestionCount(Number(customQuestionCount));
                                }
                              }}
                              className={`w-full rounded-xl px-4 py-3 font-bold text-center border-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-pink-100 transition-colors aappearnce-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                ![10, 20, 30].includes(questionCount)
                                  ? "bg-pink-500 border-pink-500 text-white placeholder:text-pink-100"
                                  : "bg-white border-gray-200 text-gray-700 placeholder:text-gray-400"
                              }`}
                              aria-label="Custom number of questions"
                            />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Selections & Start */}
                    <div className="flex-1 p-8 flex flex-col bg-gray-50/50">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-black">
                          Selected
                        </h2>

                        <motion.span
                          key={selectedTTs.length}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className="bg-black text-white text-xs font-bold px-2.5 py-1 rounded-full"
                        >
                          {selectedTTs.length}
                        </motion.span>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-32">
                        <AnimatePresence mode="wait" initial={false}>
                          {selectedTTs.length === 0 ? (
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={{ duration: 0.2 }}
                              className="h-full min-h-32 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-6"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 mb-3 opacity-40"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h16"
                                />
                              </svg>

                              <p className="text-sm font-medium text-gray-500">
                                No times tables selected
                              </p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="selected"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex flex-wrap gap-2"
                            >
                              <AnimatePresence initial={false}>
                                {selectedTTs
                                  .slice()
                                  .sort((a, b) => a - b)
                                  .map((tt) => (
                                    <motion.span
                                      key={tt}
                                      layout
                                      initial={{
                                        opacity: 0,
                                        scale: 0.7,
                                        y: 10,
                                      }}
                                      animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                      }}
                                      exit={{
                                        opacity: 0,
                                        scale: 0.7,
                                        y: -8,
                                      }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 350,
                                        damping: 25,
                                      }}
                                      className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-pink-50 text-pink-700 border border-pink-100"
                                    >
                                      {tt}x
                                      <motion.button
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => handleTTClick(tt)}
                                        className="ml-2 text-pink-400 hover:text-black focus:outline-none transition-colors"
                                        aria-label={`Remove ${tt}`}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </motion.button>
                                    </motion.span>
                                  ))}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-4">
                          {/* Select All */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={selectAll}
                            disabled={selectedTTs.length === TTs.length}
                            className="text-sm text-pink-600 hover:text-pink-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            Select All
                          </motion.button>

                          {/* Clear All */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearAll}
                            disabled={selectedTTs.length === 0}
                            className="text-sm text-gray-500 hover:text-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Clear All
                          </motion.button>
                        </div>

                        {/* Start */}
                        <motion.div
                          whileHover={
                            selectedTTs.length > 0 ? { y: -2, scale: 1.02 } : {}
                          }
                          whileTap={
                            selectedTTs.length > 0 ? { scale: 0.96 } : {}
                          }
                        >
                          <Link
                            to="/play"
                            state={{
                              TTs: selectedTTs,
                              questionCount: questionCount,
                            }}
                            aria-disabled={selectedTTs.length === 0}
                            onClick={(e) => {
                              if (selectedTTs.length === 0) {
                                e.preventDefault();
                              }
                            }}
                            className={`inline-block px-8 py-3 rounded-xl font-bold text-white transition-colors ${
                              selectedTTs.length > 0
                                ? "bg-black hover:bg-gray-800 shadow-lg"
                                : "bg-gray-300 cursor-not-allowed"
                            }`}
                          >
                            Start
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              }
            />

            <Route path="/play" element={<PlayPage />} />
          </Route>
        </Routes>
      </MotionConfig>
    </BrowserRouter>
  );
}

function PlayPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;

  const TTs = state?.TTs ?? [];
  const questionCount = state?.questionCount ?? 10;

  function handleBack() {
    navigate("/", {
      state: {
        TTs,
        questionCount,
      },
    });
  }

  if (TTs.length === 0) {
    return (
      <div className="p-8 text-center">
        No times tables selected.
        <button
          onClick={handleBack}
          className="mt-4 block mx-auto text-pink-600 underline"
        >
          Back to selection
        </button>
      </div>
    );
  }

  return (
    <Play
      key={`${TTs.join("-")}-${questionCount}`}
      TTs={TTs}
      questionCount={questionCount}
      onBack={handleBack}
    />
  );
}
