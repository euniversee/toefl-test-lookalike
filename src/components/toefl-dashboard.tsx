"use client";

import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  BookOpen,
  Volume2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  VolumeX,
  Volume1,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Flag,
  RotateCcw,
  HelpCircle,
  Trophy,
  Sparkles,
  Clock,
  Eye,
  EyeOff,
  Sparkle,
  Settings,
  ClipboardList
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Import types & raw JSON data
import { TOEFLData, Section, BaseQuestion, StructureQuestion } from "@/types/toefl";
import toeflDataRaw from "@/data/toefl_exam_data.json";

const toeflData = toeflDataRaw as unknown as TOEFLData;

// TOEFL Raw to Scaled Score Converter Map (Approximate Standard TOEFL Scale)
function getListeningScaled(raw: number): number {
  if (raw >= 49) return 68;
  if (raw >= 47) return 66;
  if (raw >= 45) return 63;
  if (raw >= 42) return 60;
  if (raw >= 38) return 57;
  if (raw >= 34) return 54;
  if (raw >= 30) return 51;
  if (raw >= 26) return 48;
  if (raw >= 22) return 45;
  if (raw >= 18) return 42;
  if (raw >= 14) return 38;
  if (raw >= 10) return 35;
  return 31;
}

function getStructureScaled(raw: number): number {
  if (raw >= 39) return 68;
  if (raw >= 37) return 65;
  if (raw >= 35) return 62;
  if (raw >= 32) return 58;
  if (raw >= 29) return 55;
  if (raw >= 26) return 52;
  if (raw >= 23) return 49;
  if (raw >= 20) return 46;
  if (raw >= 17) return 43;
  if (raw >= 14) return 40;
  if (raw >= 11) return 37;
  if (raw >= 8) return 34;
  return 31;
}

function getReadingScaled(raw: number): number {
  if (raw >= 49) return 67;
  if (raw >= 47) return 65;
  if (raw >= 45) return 62;
  if (raw >= 42) return 59;
  if (raw >= 38) return 56;
  if (raw >= 34) return 53;
  if (raw >= 30) return 50;
  if (raw >= 26) return 47;
  if (raw >= 22) return 44;
  if (raw >= 18) return 41;
  if (raw >= 14) return 38;
  if (raw >= 10) return 35;
  return 31;
}

// Pre-populated realistic mock user answers for "Review Mode"
const defaultUserAnswers: Record<string, string> = {};
toeflData.sections.forEach((sec) => {
  if (sec.parts) {
    sec.parts.forEach((part: any) => {
      if (part.questions) {
        part.questions.forEach((q: any) => {
          defaultUserAnswers[`${sec.name}-${q.id}`] = q.correctAnswer;
        });
      }
      if (part.groups) {
        part.groups.forEach((g: any) => {
          g.questions.forEach((q: any) => {
            defaultUserAnswers[`${sec.name}-${q.id}`] = q.correctAnswer;
          });
        });
      }
    });
  }
  if (sec.passages) {
    sec.passages.forEach((p) => {
      p.questions.forEach((q) => {
        defaultUserAnswers[`${sec.name}-${q.id}`] = q.correctAnswer;
      });
    });
  }
});

// Introduce some realistic mistakes for review demonstration
const mistakes = [
  { sec: "Listening Comprehension", id: 5, ans: "A" },   // correct: C
  { sec: "Listening Comprehension", id: 8, ans: "A" },   // correct: C
  { sec: "Listening Comprehension", id: 20, ans: "C" },  // correct: D
  { sec: "Listening Comprehension", id: 30, ans: "A" },  // correct: C
  { sec: "Listening Comprehension", id: 35, ans: "B" },  // correct: A
  { sec: "Listening Comprehension", id: 43, ans: "A" },  // correct: D
  { sec: "Listening Comprehension", id: 46, ans: "A" },  // correct: C
  { sec: "Listening Comprehension", id: 49, ans: "A" },  // correct: C

  { sec: "Structure and Written Expression", id: 3, ans: "B" },  // correct: D
  { sec: "Structure and Written Expression", id: 8, ans: "A" },  // correct: B
  { sec: "Structure and Written Expression", id: 13, ans: "D" }, // correct: A
  { sec: "Structure and Written Expression", id: 17, ans: "C" }, // correct: A
  { sec: "Structure and Written Expression", id: 22, ans: "B" }, // correct: A
  { sec: "Structure and Written Expression", id: 26, ans: "D" }, // correct: B
  { sec: "Structure and Written Expression", id: 33, ans: "C" }, // correct: A
  { sec: "Structure and Written Expression", id: 38, ans: "A" }, // correct: D

  { sec: "Reading Comprehension", id: 5, ans: "A" },   // correct: C
  { sec: "Reading Comprehension", id: 11, ans: "B" },  // correct: D
  { sec: "Reading Comprehension", id: 20, ans: "A" },  // correct: B
  { sec: "Reading Comprehension", id: 25, ans: "B" },  // correct: C
  { sec: "Reading Comprehension", id: 37, ans: "A" },  // correct: C
  { sec: "Reading Comprehension", id: 41, ans: "C" },  // correct: A
  { sec: "Reading Comprehension", id: 45, ans: "C" },  // correct: A
  { sec: "Reading Comprehension", id: 48, ans: "A" },  // correct: C
];

mistakes.forEach((m) => {
  defaultUserAnswers[`${m.sec}-${m.id}`] = m.ans;
});

export default function TOEFLDashboard() {
  const [activeTab, setActiveTab] = useState<string>("listening");
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"review" | "exam">("exam"); // 'review' = review mode dashboard, 'exam' = real pristine exam mode
  const [readingHighlight, setReadingHighlight] = useState<string>("yellow");
  const [readingFontSize, setReadingFontSize] = useState<number>(15);
  const [showTranscripts, setShowTranscripts] = useState<boolean>(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // TOEFL Section timers (in seconds)
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({
    listening: 35 * 60,  // 35 mins
    structure: 25 * 60,  // 25 mins
    reading: 55 * 60,    // 55 mins
  });
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [sectionsStarted, setSectionsStarted] = useState<Record<string, boolean>>({
    listening: false,
    structure: false,
    reading: false,
  });

  // Live timer ticking logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (viewMode === "exam" && timerActive && sectionsStarted[activeTab]) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const currentSec = prev[activeTab];
          if (currentSec <= 0) return prev;
          return {
            ...prev,
            [activeTab]: currentSec - 1,
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [viewMode, timerActive, activeTab, sectionsStarted]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // YouTube Iframe elements references for pausing audio programmatically
  const iframePartARef = useRef<HTMLIFrameElement | null>(null);
  const iframePartBRef = useRef<HTMLIFrameElement | null>(null);
  const iframePartCRef = useRef<HTMLIFrameElement | null>(null);

  // Pause all playing audio from YouTube iframes
  const pauseAllAudio = () => {
    const pauseCmd = '{"event":"command","func":"pauseVideo","args":""}';
    if (iframePartARef.current?.contentWindow) {
      iframePartARef.current.contentWindow.postMessage(pauseCmd, '*');
    }
    if (iframePartBRef.current?.contentWindow) {
      iframePartBRef.current.contentWindow.postMessage(pauseCmd, '*');
    }
    if (iframePartCRef.current?.contentWindow) {
      iframePartCRef.current.contentWindow.postMessage(pauseCmd, '*');
    }
  };

  // Switch tabs handler - pauses all running audios immediately
  const handleTabChange = (val: string) => {
    pauseAllAudio();
    setTimerActive(false);
    setActiveTab(val);
  };

  // Flag toggle
  const toggleFlag = (key: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Reset all answers to practice from scratch
  const resetAnswers = () => {
    pauseAllAudio();
    setUserAnswers({});
    setFlaggedQuestions({});
    setTimeRemaining({
      listening: 35 * 60,
      structure: 25 * 60,
      reading: 55 * 60,
    });
    setTimerActive(false);
    setSectionsStarted({
      listening: false,
      structure: false,
      reading: false,
    });
  };

  // Load preset mock results
  const loadPresetReview = () => {
    pauseAllAudio();
    setUserAnswers(defaultUserAnswers);
    setFlaggedQuestions({});
  };

  // Calculate Scores
  const scores = useMemo(() => {
    let listeningCorrect = 0;
    let listeningTotal = 0;
    let structureCorrect = 0;
    let structureTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;

    toeflData.sections.forEach((sec) => {
      const isListening = sec.name === "Listening Comprehension";
      const isStructure = sec.name === "Structure and Written Expression";
      const isReading = sec.name === "Reading Comprehension";

      if (sec.parts) {
        sec.parts.forEach((part: any) => {
          if (part.questions) {
            part.questions.forEach((q: any) => {
              const ans = userAnswers[`${sec.name}-${q.id}`];
              const isCorrect = ans === q.correctAnswer;
              if (isListening) {
                listeningTotal++;
                if (isCorrect) listeningCorrect++;
              } else if (isStructure) {
                structureTotal++;
                if (isCorrect) structureCorrect++;
              }
            });
          }
          if (part.groups) {
            part.groups.forEach((g: any) => {
              g.questions.forEach((q: any) => {
                const ans = userAnswers[`${sec.name}-${q.id}`];
                const isCorrect = ans === q.correctAnswer;
                if (isListening) {
                  listeningTotal++;
                  if (isCorrect) listeningCorrect++;
                }
              });
            });
          }
        });
      }

      if (sec.passages) {
        sec.passages.forEach((p) => {
          p.questions.forEach((q) => {
            const ans = userAnswers[`${sec.name}-${q.id}`];
            const isCorrect = ans === q.correctAnswer;
            if (isReading) {
              readingTotal++;
              if (isCorrect) readingCorrect++;
            }
          });
        });
      }
    });

    const listScaled = getListeningScaled(listeningCorrect);
    const strucScaled = getStructureScaled(structureCorrect);
    const readScaled = getReadingScaled(readingCorrect);
    const toeflScore = Math.round(((listScaled + strucScaled + readScaled) * 10) / 3);

    return {
      listeningCorrect,
      listeningTotal,
      listeningScaled: listScaled,
      structureCorrect,
      structureTotal,
      structureScaled: strucScaled,
      readingCorrect,
      readingTotal,
      readingScaled: readScaled,
      totalCorrect: listeningCorrect + structureCorrect + readingCorrect,
      totalQuestions: listeningTotal + structureTotal + readingTotal,
      toeflScore,
    };
  }, [userAnswers]);

  // Handle Question Answer Selection
  const selectAnswer = (sectionName: string, questionId: number, optionLetter: string) => {
    const key = `${sectionName}-${questionId}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: optionLetter,
    }));
  };

  // Written Expression inline sentence parsing
  const renderWrittenExpressionSentence = (
    q: StructureQuestion,
    sectionName: string
  ) => {
    const text = q.question;
    const parts = q.underlinedParts;
    if (!parts) return <span>{text}</span>;

    const regex = /([a-zA-Z0-9'\s\-\/\,]+)\(([A-D])\)/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const wordText = match[1];
      const letter = match[2];

      if (matchIndex > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>{text.substring(lastIndex, matchIndex)}</span>
        );
      }

      const key = `${sectionName}-${q.id}`;
      const selectedOption = userAnswers[key];
      const isSelected = selectedOption === letter;

      let colorClass = "border-amber-400 text-amber-300 hover:bg-slate-800";
      if (viewMode === "review") {
        const isCorrect = letter === q.correctAnswer;
        if (isCorrect) {
          colorClass = "border-emerald-500 bg-emerald-950/20 text-emerald-400 font-semibold ring-2 ring-emerald-500/30";
        } else if (isSelected) {
          colorClass = "border-rose-500 bg-rose-950/20 text-rose-400 ring-2 ring-rose-500/30";
        }
      } else if (isSelected) {
        colorClass = "border-indigo-500 bg-indigo-950/30 text-indigo-300 ring-2 ring-indigo-500/40";
      }

      elements.push(
        <button
          key={`err-${letter}-${q.id}`}
          onClick={() => selectAnswer(sectionName, q.id, letter)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded border-b-2 font-medium transition-all ${colorClass}`}
        >
          <span className="underline decoration-wavy underline-offset-4">{wordText.trim()}</span>
          <span className="text-[10px] font-bold opacity-80 font-mono bg-background/60 px-1 rounded">({letter})</span>
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(<span key={`text-end`}>{text.substring(lastIndex)}</span>);
    }

    return <div className="text-base leading-relaxed leading-7 text-slate-200">{elements}</div>;
  };

  // Start Section Overlay for Pristine Exam Mode
  const renderStartSectionOverlay = (
    sectionKey: string,
    title: string,
    timeLimit: string,
    questionCount: number,
    instructions: string
  ) => {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 border border-slate-800 bg-slate-950/70 backdrop-blur-md rounded-2xl max-w-xl mx-auto my-8 shadow-2xl animate-scaleUp">
        <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-full mb-5">
          {sectionKey === "listening" && <Volume2 className="w-10 h-10 text-indigo-400" />}
          {sectionKey === "structure" && <FileText className="w-10 h-10 text-indigo-400" />}
          {sectionKey === "reading" && <BookOpen className="w-10 h-10 text-indigo-400" />}
        </div>

        <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 bg-indigo-950/20 font-mono tracking-widest text-[10px] uppercase mb-2">
          TOEFL Exam Section
        </Badge>

        <h3 className="text-xl font-extrabold text-white tracking-tight mb-2 font-outfit">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed mb-6 max-w-sm">{instructions}</p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col items-center">
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-1">Time Limit</span>
            <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              {timeLimit}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col items-center">
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-1">Questions</span>
            <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              {questionCount} Items
            </span>
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => {
            setSectionsStarted((prev) => ({ ...prev, [sectionKey]: true }));
            setTimerActive(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-5 text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Mulai Sesi Ujian
        </Button>
      </div>
    );
  };

  // Highlighting passage helper
  const handlePassageHighlight = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === "") return;

    const range = selection.getRangeAt(0);
    const span = document.createElement("span");

    if (readingHighlight === "yellow") {
      span.className = "bg-yellow-500/30 text-yellow-100 px-0.5 rounded border-b border-yellow-400/40";
    } else if (readingHighlight === "cyan") {
      span.className = "bg-cyan-500/30 text-cyan-100 px-0.5 rounded border-b border-cyan-400/40";
    } else {
      return;
    }

    try {
      range.surroundContents(span);
      selection.removeAllRanges();
    } catch (err) {
      console.warn("Could not highlight range across tags:", err);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 select-text">

      {/* MASTER HEADER PANEL */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Trophy className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="flex flex-col gap-1.5 z-10">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 bg-indigo-950/20 font-mono text-xs tracking-wider font-semibold">
              KODE SOAL: {toeflData.examInfo.code}
            </Badge>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">TOEFL Practice Series</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-outfit">
            {toeflData.examInfo.title}
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-slate-400 text-xs md:text-sm font-mono mt-1">
            Mode: {viewMode === "review" ? "TOEFL-Style Test Review Dashboard" : "Real Mock Exam Mode"}
          </p>
        </div>

        {/* PERFORMANCE BREAKDOWN DISPLAY */}
        <div className="flex flex-wrap items-center gap-4 z-10 w-full md:w-auto">

          {viewMode === "review" && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-5 py-3 flex items-center gap-4 shadow-inner">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Correct Answers</span>
                <span className="text-2xl font-black text-white leading-none font-mono">
                  {scores.totalCorrect}<span className="text-slate-600 text-base font-normal font-sans">/{scores.totalQuestions}</span>
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-500">TOEFL Score Estimate</span>
                <span className="text-2xl font-black text-indigo-400 leading-none font-mono flex items-center gap-1.5">
                  {scores.toeflScore}
                  <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 px-1 bg-emerald-950/20 font-normal">
                    {Math.round((scores.totalCorrect / scores.totalQuestions) * 100)}% Acc
                  </Badge>
                </span>
              </div>
            </div>
          )}

          {viewMode === "exam" && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-5 py-3 flex items-center gap-4 shadow-inner">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Practice Mode Status</span>
                <span className="text-xl font-bold text-white font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Prisinte Exam Mode
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-row md:flex-col gap-2 w-full sm:w-auto">
            {/* MODE TOGGLES */}
            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <Button
                size="sm"
                variant={viewMode === "review" ? "default" : "ghost"}
                onClick={() => { pauseAllAudio(); setViewMode("review"); }}
                className={`text-xs gap-1 font-semibold ${viewMode === "review" ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "text-slate-400 hover:bg-slate-900"}`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Review Dashboard
              </Button>
              <Button
                size="sm"
                variant={viewMode === "exam" ? "default" : "ghost"}
                onClick={() => { pauseAllAudio(); setViewMode("exam"); }}
                className={`text-xs gap-1 font-semibold ${viewMode === "exam" ? "bg-amber-600 hover:bg-amber-500 text-white" : "text-slate-400 hover:bg-slate-900"}`}
              >
                <Clock className="w-3.5 h-3.5" />
                Exam Mode
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAnswers}
                className="text-xs gap-1 text-rose-400 border-rose-500/20 bg-rose-950/10 hover:bg-rose-950/30 w-full sm:w-auto flex-1 sm:flex-none"
              >
                <RotateCcw className="w-3 h-3" />
                Reset answers
              </Button>
              {viewMode === "review" && Object.keys(userAnswers).length < scores.totalQuestions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPresetReview}
                  className="text-xs text-slate-300 border-slate-700 bg-slate-850 hover:bg-slate-800 flex-1 sm:flex-none"
                >
                  Load Mock Data
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CORE NAVIGATION */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col gap-4">
        <TabsList className="grid grid-cols-3 bg-slate-900 border border-slate-800/80 p-1 h-12 rounded-xl text-slate-400 max-w-xl">
          <TabsTrigger value="listening" className="gap-2 text-xs md:text-sm font-semibold rounded-lg transition-all py-2">
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Listening</span>
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-2 text-xs md:text-sm font-semibold rounded-lg transition-all py-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Structure & Written</span>
          </TabsTrigger>
          <TabsTrigger value="reading" className="gap-2 text-xs md:text-sm font-semibold rounded-lg transition-all py-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Reading</span>
          </TabsTrigger>
        </TabsList>

        <Separator className="bg-slate-800/50 my-1" />

        {/* TAB 1: LISTENING COMPREHENSION */}
        <TabsContent value="listening" className="flex flex-col gap-6 focus-visible:outline-none">

          {viewMode === "exam" && !sectionsStarted.listening ? (
            renderStartSectionOverlay(
              "listening",
              "Section 1: Listening Comprehension",
              "35 Minutes",
              50,
              "Sesi ini menguji kemampuan mendengarkan percakapan bahasa Inggris. Sesuai ujian aslinya, Anda hanya akan melihat pilihan opsi (A, B, C, D) di layar tanpa teks pertanyaan tertulis."
            )
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Section 1: Listening Comprehension
                    {viewMode === "review" && (
                      <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 font-mono text-xs">
                        {scores.listeningCorrect}/50 Correct
                      </Badge>
                    )}
                  </h2>
                  <p className="text-slate-400 text-xs">Listen to conversation audios and review the spoken questions. Time limit: 35 minutes.</p>
                </div>

                {viewMode === "exam" && (
                  <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl shadow-inner animate-fadeIn">
                    <Clock className={`w-4 h-4 ${timeRemaining.listening < 5 * 60 ? "text-rose-500 animate-pulse" : "text-indigo-400"}`} />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500">Listening Timer</span>
                      <span className={`text-sm font-bold font-mono ${timeRemaining.listening < 5 * 60 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                        {formatTimer(timeRemaining.listening)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800 mx-1" />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setTimerActive(!timerActive)}
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      title={timerActive ? "Pause Timer" : "Start Timer"}
                    >
                      {timerActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </Button>
                  </div>
                )}

                {viewMode === "review" && (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTranscripts(!showTranscripts)}
                      className={`text-xs gap-1.5 transition-all ${showTranscripts
                          ? "bg-indigo-950/30 text-indigo-400 border-indigo-500/40"
                          : "border-slate-800 text-slate-400"
                        }`}
                    >
                      {showTranscripts ? "Hide Transcripts" : "Show Transcripts"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-8">
                {toeflData.sections[0].parts?.map((part: any) => {
                  const isPartA = part.name === "Part A";
                  const isPartB = part.name === "Part B";

                  // Map correct Video ID based on part for pristine exam audios
                  const videoId = isPartA ? "F4Zslsm8x38" : isPartB ? "vw2z9MOJM7c" : "7iSVnDFtWDw";

                  return (
                    <div key={part.name} className="flex flex-col gap-4 border border-slate-800/80 rounded-xl p-5 bg-slate-900/30">

                      {/* Part Header & Audio Controller */}
                      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 border-b border-slate-800/80 pb-4">
                        <div className="flex flex-col gap-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-500/25 border-b-2 border-indigo-400/30 text-indigo-300 font-mono text-xs">{part.name}</Badge>
                            <h3 className="text-md font-bold text-white">{part.description}</h3>
                          </div>
                          <p className="text-slate-500 text-xs mt-1">This section is synced directly with the official TOEFL audios.</p>
                        </div>

                        {/* YouTube Embedded Audio Player Card */}
                        <div className="w-full max-w-md bg-slate-950 border border-slate-800/85 rounded-xl p-3 shadow-lg flex flex-col gap-2">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-mono text-indigo-400 font-bold flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                              REAL EXAM AUDIO STREAM
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">Original YouTube audio</span>
                          </div>
                          <iframe
                            ref={isPartA ? iframePartARef : isPartB ? iframePartBRef : iframePartCRef}
                            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0`}
                            className="w-full h-[120px] rounded-lg border border-slate-800 bg-slate-900"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                      </div>

                      {/* Multiple Choice Questions Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">

                        {/* Part A: Simple List of Questions */}
                        {isPartA && part.questions?.map((q: any) => {
                          const qKey = `Listening Comprehension-${q.id}`;
                          const userAns = userAnswers[qKey];
                          const isCorrect = userAns === q.correctAnswer;
                          const isFlagged = flaggedQuestions[qKey];

                          return (
                            <Card key={q.id} className="border-slate-800 bg-slate-950/40 hover:border-slate-700/80 transition-all flex flex-col shadow">
                              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold font-mono text-indigo-400">NUMBER {q.id}</span>
                                    {viewMode === "review" && (
                                      <Badge variant="outline" className={isCorrect ? "border-emerald-500/20 text-emerald-400 bg-emerald-950/15" : "border-rose-500/20 text-rose-400 bg-rose-950/15"}>
                                        {isCorrect ? "Correct" : "Incorrect"}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* EXAM MODE: Hides spoken question text, matches paper test! */}
                                  {viewMode === "review" ? (
                                    <h4 className="text-sm font-semibold text-slate-100">{q.question}</h4>
                                  ) : (
                                    <div className="text-xs text-slate-500 font-mono italic my-1">
                                      Question prompt is spoken in the audio track
                                    </div>
                                  )}
                                </div>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleFlag(qKey)}
                                  className={`h-7 w-7 rounded-md ${isFlagged ? "text-amber-500 bg-amber-950/10" : "text-slate-500 hover:text-slate-300"}`}
                                >
                                  <Flag className="w-3.5 h-3.5 fill-current" />
                                </Button>
                              </CardHeader>

                              <CardContent className="p-4 pt-1 flex-1 flex flex-col gap-2">

                                {/* Question Options */}
                                <div className="grid grid-cols-1 gap-1.5 mt-2">
                                  {q.options.map((opt: string) => {
                                    const letter = opt[0]; // A, B, C, D
                                    const optionText = opt.substring(3);
                                    const isUserSelected = userAns === letter;
                                    const isAnswerCorrect = letter === q.correctAnswer;

                                    let borderClass = "border-slate-800/80 bg-slate-900/30 hover:border-slate-700 text-slate-300";
                                    let badgeClass = "bg-slate-900 border border-slate-700/80 text-slate-400";

                                    if (viewMode === "review") {
                                      if (isAnswerCorrect) {
                                        borderClass = "border-emerald-500/40 bg-emerald-950/20 text-emerald-300 font-semibold ring-1 ring-emerald-500/20 shadow-emerald-950/20 shadow-sm";
                                        badgeClass = "bg-emerald-500 text-slate-950 font-bold border border-emerald-400";
                                      } else if (isUserSelected) {
                                        borderClass = "border-rose-500/40 bg-rose-950/20 text-rose-300 ring-1 ring-rose-500/20";
                                        badgeClass = "bg-rose-500 text-slate-950 font-bold border border-rose-400";
                                      }
                                    } else if (isUserSelected) {
                                      borderClass = "border-indigo-500 bg-indigo-950/30 text-indigo-300 ring-1 ring-indigo-500/30";
                                      badgeClass = "bg-indigo-500 text-slate-950 font-bold border border-indigo-400";
                                    }

                                    return (
                                      <button
                                        key={opt}
                                        onClick={() => selectAnswer("Listening Comprehension", q.id, letter)}
                                        className={`flex items-start gap-3 w-full text-left p-2.5 rounded-lg border text-xs tracking-wide transition-all ${borderClass}`}
                                      >
                                        <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] ${badgeClass}`}>
                                          {letter}
                                        </span>
                                        <span className="leading-5">{optionText}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Transcript Display */}
                                {viewMode === "review" && showTranscripts && q.transcript && (
                                  <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-serif text-slate-400">
                                    <span className="font-sans font-bold text-indigo-400 block mb-1">Audio Transcript:</span>
                                    "{q.transcript}"
                                  </div>
                                )}

                                {/* Explanation Panel */}
                                {viewMode === "review" && (
                                  <div className="mt-3 p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 flex items-start gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                    <p><span className="font-bold text-slate-300">Explanation: </span>{q.explanation}</p>
                                  </div>
                                )}

                              </CardContent>
                            </Card>
                          );
                        })}

                        {/* Part B & C: Groups Layouts */}
                        {!isPartA && part.groups?.map((g: any, gIdx: number) => {
                          return (
                            <div key={g.groupId} className="col-span-1 md:col-span-2 flex flex-col gap-4 border border-slate-800 p-4 rounded-xl bg-slate-950/20">
                              <div className="flex flex-col gap-1 border-b border-slate-800/80 pb-2">
                                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold">Group {gIdx + 1} • Questions {g.questions[0].id}–{g.questions[g.questions.length - 1].id}</span>
                                <h4 className="text-sm font-semibold text-slate-200">Context: {g.context}</h4>

                                {viewMode === "review" && showTranscripts && (
                                  <div className="mt-2 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-serif text-slate-400 leading-relaxed">
                                    <span className="font-sans font-bold text-indigo-400 block mb-1">Group Conversation Transcript:</span>
                                    "{g.transcript}"
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {g.questions.map((q: any) => {
                                  const qKey = `Listening Comprehension-${q.id}`;
                                  const userAns = userAnswers[qKey];
                                  const isCorrect = userAns === q.correctAnswer;
                                  const isFlagged = flaggedQuestions[qKey];

                                  return (
                                    <Card key={q.id} className="border-slate-850 bg-slate-950/50 flex flex-col shadow">
                                      <CardHeader className="p-3.5 pb-1 flex flex-row items-start justify-between gap-4">
                                        <div className="flex flex-col gap-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold font-mono text-indigo-400">NUMBER {q.id}</span>
                                            {viewMode === "review" && (
                                              <Badge variant="outline" className={`text-[9px] px-1.5 h-4.5 ${isCorrect ? "border-emerald-500/20 text-emerald-400 bg-emerald-950/15" : "border-rose-500/20 text-rose-400 bg-rose-950/15"}`}>
                                                {isCorrect ? "Correct" : "Incorrect"}
                                              </Badge>
                                            )}
                                          </div>

                                          {/* EXAM MODE: Hides spoken question text, matches paper test! */}
                                          {viewMode === "review" ? (
                                            <h5 className="text-xs font-semibold text-slate-200">{q.question}</h5>
                                          ) : (
                                            <div className="text-[10px] text-slate-500 font-mono italic my-1">
                                              Question prompt is spoken in the audio track
                                            </div>
                                          )}
                                        </div>

                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => toggleFlag(qKey)}
                                          className={`h-6 w-6 rounded-md ${isFlagged ? "text-amber-500 bg-amber-950/10" : "text-slate-600 hover:text-slate-300"}`}
                                        >
                                          <Flag className="w-3 h-3 fill-current" />
                                        </Button>
                                      </CardHeader>

                                      <CardContent className="p-3.5 pt-1 flex flex-col gap-2 flex-grow">

                                        <div className="grid grid-cols-1 gap-1 mt-1.5">
                                          {q.options.map((opt: string) => {
                                            const letter = opt[0];
                                            const optionText = opt.substring(3);
                                            const isUserSelected = userAns === letter;
                                            const isAnswerCorrect = letter === q.correctAnswer;

                                            let borderClass = "border-slate-800/80 bg-slate-900/30 hover:border-slate-700 text-slate-300";
                                            let badgeClass = "bg-slate-900 border border-slate-700 text-slate-400";

                                            if (viewMode === "review") {
                                              if (isAnswerCorrect) {
                                                borderClass = "border-emerald-500/30 bg-emerald-950/15 text-emerald-300 font-semibold";
                                                badgeClass = "bg-emerald-500 text-slate-950 font-bold border border-emerald-400";
                                              } else if (isUserSelected) {
                                                borderClass = "border-rose-500/30 bg-rose-950/15 text-rose-300";
                                                badgeClass = "bg-rose-500 text-slate-950 font-bold border border-rose-400";
                                              }
                                            } else if (isUserSelected) {
                                              borderClass = "border-indigo-500 bg-indigo-950/25 text-indigo-300 ring-1 ring-indigo-500/20";
                                              badgeClass = "bg-indigo-500 text-slate-950 font-bold border border-indigo-400";
                                            }

                                            return (
                                              <button
                                                key={opt}
                                                onClick={() => selectAnswer("Listening Comprehension", q.id, letter)}
                                                className={`flex items-start gap-2.5 w-full text-left p-2 rounded-lg border text-[11px] tracking-wide transition-all ${borderClass}`}
                                              >
                                                <span className={`w-4.5 h-4.5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] ${badgeClass}`}>
                                                  {letter}
                                                </span>
                                                <span className="leading-4">{optionText}</span>
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {viewMode === "review" && (
                                          <div className="mt-2 p-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-[10px] text-slate-400 flex items-start gap-1.5">
                                            <AlertCircle className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />
                                            <p><span className="font-bold text-slate-300">Explanation: </span>{q.explanation}</p>
                                          </div>
                                        )}

                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                      </div>

                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB 2: STRUCTURE & WRITTEN EXPRESSION */}
        <TabsContent value="structure" className="flex flex-col gap-6 focus-visible:outline-none">

          {viewMode === "exam" && !sectionsStarted.structure ? (
            renderStartSectionOverlay(
              "structure",
              "Section 2: Structure & Written Expression",
              "25 Minutes",
              40,
              "Sesi ini dirancang untuk menguji kemampuan tata bahasa Inggris Anda. Terbagi menjadi Part 1 (Sentence Completion) dan Part 2 (Written Expression Error Identification)."
            )
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Section 2: Structure & Written Expression
                    {viewMode === "review" && (
                      <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 font-mono text-xs">
                        {scores.structureCorrect}/40 Correct
                      </Badge>
                    )}
                  </h2>
                  <p className="text-slate-400 text-xs">Sentence completion practice and inline error identification review. Time limit: 25 minutes.</p>
                </div>

                {viewMode === "exam" && (
                  <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl shadow-inner animate-fadeIn">
                    <Clock className={`w-4 h-4 ${timeRemaining.structure < 5 * 60 ? "text-rose-500 animate-pulse" : "text-indigo-400"}`} />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500">Structure Timer</span>
                      <span className={`text-sm font-bold font-mono ${timeRemaining.structure < 5 * 60 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                        {formatTimer(timeRemaining.structure)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800 mx-1" />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setTimerActive(!timerActive)}
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      title={timerActive ? "Pause Timer" : "Start Timer"}
                    >
                      {timerActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-8">
                {toeflData.sections[1].parts?.map((part: any) => {
                  const isSentenceCompletion = part.name.includes("Sentence Completion");

                  return (
                    <div key={part.name} className="flex flex-col gap-5 border border-slate-800/80 rounded-xl p-5 bg-slate-900/30">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Badge className="bg-indigo-500/25 border-b-2 border-indigo-400/30 text-indigo-300 font-mono text-xs">{isSentenceCompletion ? "PART 1" : "PART 2"}</Badge>
                        <h3 className="text-md font-bold text-white">{part.name}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {part.questions.map((q: any) => {
                          const qKey = `Structure and Written Expression-${q.id}`;
                          const userAns = userAnswers[qKey];
                          const isCorrect = userAns === q.correctAnswer;
                          const isFlagged = flaggedQuestions[qKey];

                          return (
                            <Card key={q.id} className="border-slate-800 bg-slate-950/40 hover:border-slate-700/80 transition-all flex flex-col shadow">
                              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4">
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold font-mono text-indigo-400">NUMBER {q.id}</span>
                                    {viewMode === "review" && (
                                      <Badge variant="outline" className={isCorrect ? "border-emerald-500/20 text-emerald-400 bg-emerald-950/15" : "border-rose-500/20 text-rose-400 bg-rose-950/15"}>
                                        {isCorrect ? "Correct" : "Incorrect"}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="mt-2">
                                    {isSentenceCompletion ? (
                                      <div className="text-base text-slate-200 leading-relaxed font-sans font-medium">
                                        {q.question}
                                      </div>
                                    ) : (
                                      renderWrittenExpressionSentence(q, "Structure and Written Expression")
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleFlag(qKey)}
                                  className={`h-7 w-7 rounded-md ${isFlagged ? "text-amber-500 bg-amber-950/10" : "text-slate-500 hover:text-slate-300"} flex-shrink-0`}
                                >
                                  <Flag className="w-3.5 h-3.5 fill-current" />
                                </Button>
                              </CardHeader>

                              <CardContent className="p-4 pt-1 flex-1 flex flex-col gap-2">
                                {/* Incomplete Sentence Options Display */}
                                {isSentenceCompletion && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                    {q.options.map((opt: string) => {
                                      const letter = opt[0];
                                      const optionText = opt.substring(3);
                                      const isUserSelected = userAns === letter;
                                      const isAnswerCorrect = letter === q.correctAnswer;

                                      let borderClass = "border-slate-800 bg-slate-900/30 hover:border-slate-700 text-slate-300";
                                      let badgeClass = "bg-slate-900 border border-slate-700 text-slate-400";

                                      if (viewMode === "review") {
                                        if (isAnswerCorrect) {
                                          borderClass = "border-emerald-500/40 bg-emerald-950/20 text-emerald-300 font-semibold ring-1 ring-emerald-500/20";
                                          badgeClass = "bg-emerald-500 text-slate-950 font-bold border border-emerald-400";
                                        } else if (isUserSelected) {
                                          borderClass = "border-rose-500/40 bg-rose-950/20 text-rose-300 ring-1 ring-rose-500/20";
                                          badgeClass = "bg-rose-500 text-slate-950 font-bold border border-rose-400";
                                        }
                                      } else if (isUserSelected) {
                                        borderClass = "border-indigo-500 bg-indigo-950/30 text-indigo-300 ring-1 ring-indigo-500/30";
                                        badgeClass = "bg-indigo-500 text-slate-950 font-bold border border-indigo-400";
                                      }

                                      return (
                                        <button
                                          key={opt}
                                          onClick={() => selectAnswer("Structure and Written Expression", q.id, letter)}
                                          className={`flex items-center gap-2.5 w-full text-left p-2 rounded-lg border text-xs tracking-wide transition-all ${borderClass}`}
                                        >
                                          <span className={`w-4.5 h-4.5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] ${badgeClass}`}>
                                            {letter}
                                          </span>
                                          <span className="leading-5">{optionText}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Written Expression list in Exam Mode */}
                                {!isSentenceCompletion && viewMode === "exam" && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center w-full mb-1">Select Incorrect Element:</span>
                                    {["A", "B", "C", "D"].map((letter) => {
                                      const isSelected = userAns === letter;
                                      return (
                                        <Button
                                          key={letter}
                                          size="sm"
                                          variant={isSelected ? "default" : "outline"}
                                          onClick={() => selectAnswer("Structure and Written Expression", q.id, letter)}
                                          className={`h-7 px-3.5 text-xs font-bold font-mono ${isSelected
                                              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                                              : "border-slate-800 text-slate-400 hover:bg-slate-900"
                                            }`}
                                        >
                                          ({letter}) {q.underlinedParts?.[letter]}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Correction results in Review Mode */}
                                {viewMode === "review" && userAns && (
                                  <div className="mt-3 flex items-center gap-2 text-xs font-mono">
                                    <span className="text-slate-500">Your Selection:</span>
                                    <Badge variant="outline" className={isCorrect ? "border-emerald-500/20 text-emerald-400 bg-emerald-950/20" : "border-rose-500/20 text-rose-400 bg-rose-950/20"}>
                                      Option {userAns} ({isCorrect ? "Correct" : "Wrong"})
                                    </Badge>
                                    {!isCorrect && (
                                      <>
                                        <span className="text-slate-500">Correct:</span>
                                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-950/20">
                                          Option {q.correctAnswer}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                )}

                                {/* Explanation Panel */}
                                {viewMode === "review" && (
                                  <div className="mt-3.5 p-3 bg-slate-950/50 border border-slate-800/80 rounded-lg text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
                                    <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                                    <p><span className="font-bold text-slate-300">Explanation: </span>{q.explanation}</p>
                                  </div>
                                )}

                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB 3: READING COMPREHENSION */}
        <TabsContent value="reading" className="flex flex-col gap-6 focus-visible:outline-none flex-1">

          {viewMode === "exam" && !sectionsStarted.reading ? (
            renderStartSectionOverlay(
              "reading",
              "Section 3: Reading Comprehension",
              "55 Minutes",
              50,
              "Sesi ini menguji pemahaman membaca Anda terhadap teks bacaan paragraf ilmiah bahasa Inggris. Teks bacaan akan ditampilkan di sisi kiri dengan daftar pertanyaan di sisi kanan."
            )
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Section 3: Reading Comprehension
                    {viewMode === "review" && (
                      <Badge variant="outline" className="border-indigo-500/20 text-indigo-400 font-mono text-xs">
                        {scores.readingCorrect}/50 Correct
                      </Badge>
                    )}
                  </h2>
                  <p className="text-slate-400 text-xs">Passage reference text split view with highlighted references. Time limit: 55 minutes.</p>
                </div>

                {viewMode === "exam" && (
                  <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-xl shadow-inner animate-fadeIn">
                    <Clock className={`w-4 h-4 ${timeRemaining.reading < 5 * 60 ? "text-rose-500 animate-pulse" : "text-indigo-400"}`} />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500">Reading Timer</span>
                      <span className={`text-sm font-bold font-mono ${timeRemaining.reading < 5 * 60 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                        {formatTimer(timeRemaining.reading)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-800 mx-1" />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setTimerActive(!timerActive)}
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      title={timerActive ? "Pause Timer" : "Start Timer"}
                    >
                      {timerActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </Button>
                  </div>
                )}

                {/* Split Screen Control Panel */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-mono px-1">Text:</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md text-[10px] font-bold text-slate-300" onClick={() => setReadingFontSize(Math.max(12, readingFontSize - 1))}>A-</Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md text-[10px] font-bold text-slate-300" onClick={() => setReadingFontSize(Math.min(22, readingFontSize + 1))}>A+</Button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-mono px-1">Highlight:</span>
                    <button
                      onClick={() => setReadingHighlight("yellow")}
                      className={`w-4 h-4 rounded-full bg-yellow-400/80 border ${readingHighlight === "yellow" ? "ring-2 ring-white scale-110" : "opacity-60"}`}
                      title="Highlight Yellow"
                    />
                    <button
                      onClick={() => setReadingHighlight("cyan")}
                      className={`w-4 h-4 rounded-full bg-cyan-400/80 border ${readingHighlight === "cyan" ? "ring-2 ring-white scale-110" : "opacity-60"}`}
                      title="Highlight Cyan"
                    />
                    <button
                      onClick={() => setReadingHighlight("")}
                      className={`w-4 h-4 rounded-full bg-slate-800 border flex items-center justify-center text-[8px] font-bold text-slate-500 ${readingHighlight === "" ? "ring-2 ring-white scale-110" : "opacity-60"}`}
                      title="Clear Highlights"
                    >
                      X
                    </button>
                  </div>
                </div>
              </div>

              {/* DUAL-COLUMN SCREEN SPLIT LAYOUT */}
              <div className="flex flex-col gap-6">
                {toeflData.sections[2].passages?.map((passage) => {
                  const passageLines = passage.text.split("\n");

                  return (
                    <div key={passage.passageId} className="flex flex-col gap-3 border border-slate-800/80 rounded-xl p-5 bg-slate-900/20 shadow-lg">
                      <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
                        <h3 className="text-md font-extrabold text-white tracking-wide font-outfit">PASSAGE {passage.passageId}: {passage.title}</h3>
                        <Badge variant="outline" className="border-slate-800 text-slate-400 text-[10px] font-mono">
                          Q: {passage.questions[0].id}–{passage.questions[passage.questions.length - 1].id}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">

                        {/* LEFT COLUMN: ScrollArea with Passage Text & Line Numbers */}
                        <div className="col-span-1 lg:col-span-6 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-2">
                            <span>📖 Reference Text Pane</span>
                            <span>Drag mouse to highlight text</span>
                          </div>

                          <div
                            onMouseUp={handlePassageHighlight}
                            className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-inner flex"
                          >
                            <ScrollArea className="h-[480px] w-full p-4 md:p-6" style={{ fontSize: `${readingFontSize}px` }}>
                              <div className="flex flex-col gap-3 font-serif leading-relaxed text-slate-300 animate-fadeIn">
                                {passageLines.map((line, idx) => {
                                  return (
                                    <p key={idx} className="relative hover:bg-slate-900/30 px-1 rounded transition-colors duration-150">
                                      {line}
                                    </p>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Questions Associated With This Exact Passage */}
                        <div className="col-span-1 lg:col-span-6 flex flex-col gap-2">
                          <div className="text-[10px] text-slate-400 font-mono px-2">
                            <span>📝 Questionnaire Card Panel ({passage.questions.length} questions)</span>
                          </div>

                          <ScrollArea className="h-[480px] border border-slate-850/60 rounded-xl bg-slate-950/20 p-2">
                            <div className="flex flex-col gap-4 p-1">
                              {passage.questions.map((q) => {
                                const qKey = `Reading Comprehension-${q.id}`;
                                const userAns = userAnswers[qKey];
                                const isCorrect = userAns === q.correctAnswer;
                                const isFlagged = flaggedQuestions[qKey];

                                return (
                                  <Card key={q.id} className="border-slate-850 bg-slate-950/60 flex flex-col shadow hover:border-slate-800 transition-all animate-fadeIn">
                                    <CardHeader className="p-3.5 pb-1 flex flex-row items-start justify-between gap-4">
                                      <div className="flex flex-col gap-0.5 w-full">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold font-mono text-indigo-400">NUMBER {q.id}</span>
                                          {viewMode === "review" && (
                                            <Badge variant="outline" className={`text-[9px] px-1.5 h-4.5 ${isCorrect ? "border-emerald-500/20 text-emerald-400 bg-emerald-950/15" : "border-rose-500/20 text-rose-400 bg-rose-950/15"}`}>
                                              {isCorrect ? "Correct" : "Incorrect"}
                                            </Badge>
                                          )}
                                        </div>
                                        <h4 className="text-xs font-semibold text-slate-100 mt-1 leading-5">{q.question}</h4>
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => toggleFlag(qKey)}
                                        className={`h-6 w-6 rounded-md flex-shrink-0 ${isFlagged ? "text-amber-500 bg-amber-950/10" : "text-slate-600 hover:text-slate-300"}`}
                                      >
                                        <Flag className="w-3.5 h-3.5 fill-current" />
                                      </Button>
                                    </CardHeader>

                                    <CardContent className="p-3.5 pt-1 flex flex-col gap-2">

                                      <div className="grid grid-cols-1 gap-1.5 mt-2">
                                        {q.options.map((opt: string) => {
                                          const letter = opt[0];
                                          const optionText = opt.substring(3);
                                          const isUserSelected = userAns === letter;
                                          const isAnswerCorrect = letter === q.correctAnswer;

                                          let borderClass = "border-slate-800/80 bg-slate-900/30 hover:border-slate-700 text-slate-300";
                                          let badgeClass = "bg-slate-900 border border-slate-700 text-slate-400";

                                          if (viewMode === "review") {
                                            if (isAnswerCorrect) {
                                              borderClass = "border-emerald-500/30 bg-emerald-950/15 text-emerald-300 font-semibold";
                                              badgeClass = "bg-emerald-500 text-slate-950 font-bold border border-emerald-400";
                                            } else if (isUserSelected) {
                                              borderClass = "border-rose-500/30 bg-rose-950/15 text-rose-300";
                                              badgeClass = "bg-rose-500 text-slate-950 font-bold border border-rose-400";
                                            }
                                          } else if (isUserSelected) {
                                            borderClass = "border-indigo-500 bg-indigo-950/25 text-indigo-300 ring-1 ring-indigo-500/20";
                                            badgeClass = "bg-indigo-500 text-slate-950 font-bold border border-indigo-400";
                                          }

                                          return (
                                            <button
                                              key={opt}
                                              onClick={() => selectAnswer("Reading Comprehension", q.id, letter)}
                                              className={`flex items-start gap-2.5 w-full text-left p-2 rounded-lg border text-xs tracking-wide transition-all ${borderClass}`}
                                            >
                                              <span className={`w-4.5 h-4.5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] ${badgeClass}`}>
                                                {letter}
                                              </span>
                                              <span className="leading-4">{optionText}</span>
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {viewMode === "review" && (
                                        <div className="mt-3.5 p-2 bg-slate-950/60 border border-slate-850 rounded-lg text-[10px] text-slate-400 flex items-start gap-2">
                                          <AlertCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                          <p><span className="font-bold text-slate-300">Explanation: </span>{q.explanation}</p>
                                        </div>
                                      )}

                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
