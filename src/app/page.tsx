"use client";

import { useState, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import UploadForm from "@/components/analysis/upload-form";
import AnalysisDashboard from "@/components/analysis/analysis-dashboard";
import Logo from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import type {
  AnalysisData,
  TranscriptEntry,
  ParticipationMetric,
  EmotionTimelinePoint,
  RelationshipGraphData,
  SpeakerIndexToDetection,
} from "@/lib/types";
import { SPEAKER_CHARACTERISTICS } from "@/lib/speaker-characteristics";

type AppState = "idle" | "loading" | "results";

// 🔥 Updated sentiment + emotion + timeline logic
const generateDynamicAnalysis = async (
  diarizedResult: { speaker: number; text: string }[],
  detected: SpeakerIndexToDetection | undefined
): Promise<AnalysisData> => {
  const uniqueSpeakers = [...new Set(diarizedResult.map((u) => u.speaker))];
  const numSpeakers = uniqueSpeakers.length;

  // Sentiment word lists
  const positiveSet = new Set([
    "good","great","excellent","agree","yes","ok","thanks","thank","love","like","clear","awesome","nice","happy","support","strong","well","congrats","congratulations","cheers","success","improve","improved","improving"
  ]);
  const negativeSet = new Set([
    "bad","worse","worst","disagree","no","not","confused","issue","problem","hate","angry","sad","conflict","weak","blocker","delay","fail","failed","failing","bug","risk","concern","concerns"
  ]);

  // Weighted sentiment scoring
  const scoreText = (text: string) => {
    const tokens = (text.toLowerCase().match(/[a-z']+/g) || []);
    let score = 0;
    let weight = 0;
    for (const tok of tokens) {
      if (positiveSet.has(tok)) {
        score += 2;
        weight += 2;
      }
      if (negativeSet.has(tok)) {
        score -= 2;
        weight += 2;
      }
    }
    return weight > 0 ? Math.max(-1, Math.min(1, score / weight)) : 0;
  };

  const scores = diarizedResult.map(u => scoreText(u.text));

  const labelFromScore = (s: number) => {
    if (s > 0.3) return "Positive";
    if (s < -0.3) return "Negative";
    return "Neutral";
  };

  // ⚡ Enhanced Emotion Detection
  const emotionFromScore = (s: number) => {
    if (s > 0.7) return "joy";
    if (s > 0.4) return "calm";
    if (s > 0.2) return "supportive";
    if (s < -0.7) return "anger";
    if (s < -0.4) return "sadness";
    if (s < -0.2) return "critical";
    return "neutral";
  };

  // Speaker map
  const speakerMap = new Map(uniqueSpeakers.map((speakerIndex, i) => [
    speakerIndex,
    {
      id: String.fromCharCode(65 + i),
      label: `Speaker ${String.fromCharCode(65 + i)}`,
      characteristic: {
        color: SPEAKER_CHARACTERISTICS[i % SPEAKER_CHARACTERISTICS.length].color,
        description: "",
      },
    }
  ]));

  // Transcript
  let currentTime = 0;
  const transcript: TranscriptEntry[] = diarizedResult.map((utterance, index) => {
    const duration = Math.floor(utterance.text.length / 15) + 1;
    currentTime += duration;
    const speakerInfo = speakerMap.get(utterance.speaker)!;
    return {
      id: index + 1,
      speaker: speakerInfo.id,
      label: speakerInfo.label,
      characteristic: speakerInfo.characteristic,
      text: utterance.text,
      sentiment: labelFromScore(scores[index]),
      emotion: emotionFromScore(scores[index]),
      timestamp: `00:${Math.min(currentTime, 59).toString().padStart(2, "0")}`,
    };
  });

  // Participation
  const transcriptBySpeaker = transcript.reduce((acc, t) => {
    if (!acc[t.speaker]) acc[t.speaker] = [];
    acc[t.speaker].push(t);
    return acc;
  }, {} as Record<string, TranscriptEntry[]>);

  const participation: ParticipationMetric[] = Array.from(speakerMap.values()).map(speaker => {
    const utterances = transcriptBySpeaker[speaker.id] || [];
    const speakingTime = utterances.reduce((acc, u) => acc + Math.floor(u.text.length / 15) + 1, 0);
    const avgScore = utterances.reduce((acc, u) => {
      return acc + (u.sentiment === "Positive" ? 1 : u.sentiment === "Negative" ? -1 : 0);
    }, 0) / Math.max(1, utterances.length);
    return {
      speaker: speaker.id,
      label: speaker.label,
      characteristic: speaker.characteristic,
      speakingTime: `${speakingTime} sec`,
      conflict: Math.max(0, Math.round((1 - Math.max(-1, Math.min(1, avgScore))) * 10)),
      sentiment: labelFromScore(avgScore),
    };
  });

  // Emotion Timeline
  const emotionTimeline: EmotionTimelinePoint[] = Array.from({ length: 5 }, (_, i) => {
    const time = Math.floor(i * (currentTime / 4));
    const point: EmotionTimelinePoint = { time: `0:${time.toString().padStart(2, "0")}` };
    Array.from(speakerMap.values()).forEach(s => {
      point[s.id] = Math.random() * 2 - 1;
    });
    return point;
  });

  // Relationship Graph (ML/NLP API)
  let relationshipGraph: RelationshipGraphData = { nodes: [], links: [] };
  try {
    const relRes = await fetch("/api/relationship-graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: transcript.map(t => `${t.label}: ${t.text}`).join("\n") })
    });
    if (relRes.ok) {
      const relJson = await relRes.json();
      relationshipGraph = relJson.graphData;
    }
  } catch {}

  // Summary (ML/NLP API)
  const sentimentCounts = {
    Positive: transcript.filter(t => t.sentiment === "Positive").length,
    Negative: transcript.filter(t => t.sentiment === "Negative").length,
    Neutral: transcript.filter(t => t.sentiment === "Neutral").length,
  };
  const overallSentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0][0];

  let summaryReport = "";
  let keyPoints: string[] = [];
  let relationshipSummary = "";
  try {
    const sumRes = await fetch("/api/summary-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: transcript.map(t => `${t.label}: ${t.text}`).join("\n"),
        overallSentiment,
        relationshipSummary: ""
      })
    });
    if (sumRes.ok) {
      const sumJson = await sumRes.json();
      summaryReport = sumJson.summaryReport;
      // Optionally, extract key points from summaryReport using a simple split or another API if available
      keyPoints = summaryReport.split(/\n|\./).filter(p => p.trim().length > 0);
      relationshipSummary = sumJson.relationshipSummary || "";
    }
  } catch {}

  return {
    summary: {
      title: "Dynamic Analysis Report",
      overallSentiment,
      points: keyPoints,
      relationshipSummary,
      summaryReport,
    },
    transcript,
    participation,
    emotionTimeline,
    relationshipGraph,
  };
};

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; createdAt: string; fileName?: string; hidden?: boolean }>>([]);
  const [showHidden, setShowHidden] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/upload");
        if (res.ok) {
          const json = await res.json();
          setHistory(Array.isArray(json.items) ? json.items : []);
        }
      } catch {}
    })();
  }, []);

  const handleFileUpload = async (file: File) => {
    setAppState("loading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }
      const uploadJson = await uploadRes.json();
      const diarizationResult = uploadJson.diarizationResult;
      const speakerCharacteristics = uploadJson.speakerCharacteristics;
      if (!diarizationResult || !diarizationResult.utterances?.length) {
        throw new Error("Diarization failed or returned no utterances.");
      }
      const dynamicData = await generateDynamicAnalysis(diarizationResult.utterances, speakerCharacteristics);
      setAnalysisData(dynamicData);

      try {
        const res = await fetch("/api/upload");
        if (res.ok) {
          const json = await res.json();
          setHistory(json.items || []);
        }
      } catch {}

      setAppState("results");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
      setAppState("idle");
    }
  };

  const handleNewAnalysis = () => {
    setAppState("idle");
    setAnalysisData(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-lg shadow-md">
        <div className="container h-16 flex items-center justify-between">
          <Logo />
          <AnimatePresence>
            {appState === "results" && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleNewAnalysis}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-white shadow-lg hover:bg-primary/90 h-10 px-4 py-2 transition-all"
              >
                New Analysis
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-1 container py-10">
        {appState === "idle" && (
          <motion.div
            className="space-y-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <UploadForm onFileUpload={handleFileUpload} />

            {history.length > 0 && (
              <motion.div
                className="rounded-lg border p-5 shadow-lg bg-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Recent Analyses</h3>
                  <div className="flex gap-2">
                    <button
                      className="text-sm text-primary hover:underline"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/upload");
                          if (res.ok) {
                            const j = await res.json();
                            setHistory(j.items || []);
                          }
                        } catch {}
                      }}
                    >
                      Refresh
                    </button>
                    <button
                      className="text-sm text-red-600 hover:underline"
                      onClick={async () => {
                        try {
                          setAppState("loading");
                          const res = await fetch("/api/clear-all", { method: "POST" });
                          if (res.ok) {
                            setHistory([]);
                            toast({
                              title: "All analyses cleared",
                              description: "All video data has been deleted.",
                              variant: "default",
                            });
                          } else {
                            toast({
                              title: "Failed to clear analyses",
                              description: "Please try again.",
                              variant: "destructive",
                            });
                          }
                          setAppState("idle");
                        } catch {
                          setAppState("idle");
                        }
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                <ul className="space-y-2">
                  {history.filter(item => !item.hidden).map((item) => (
                    <motion.li
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 transition-all"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                        {item.fileName && (
                          <span className="text-xs text-gray-400">{item.fileName}</span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          className="text-sm px-3 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-white transition-all"
                          onClick={async () => {
                            try {
                              setAppState("loading");
                              const res = await fetch(`/api/upload?id=${item.id}`);
                              if (!res.ok) throw new Error("Failed to load analysis");
                              const j = await res.json();
                              const dynamicData = await generateDynamicAnalysis(
                                j.diarizationResult.utterances,
                                j.speakerCharacteristics
                              );
                              setAnalysisData(dynamicData);
                              setAppState("results");
                            } catch (e) {
                              setAppState("idle");
                            }
                          }}
                        >Open</button>
                        <button
                          className="text-sm px-3 py-1 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white transition-all"
                          onClick={async () => {
                            await fetch("/api/hide-analysis", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: item.id })
                            });
                            setHistory(history.map(h => h.id === item.id ? { ...h, hidden: true } : h));
                          }}
                        >Hide</button>
                        <button
                          className="text-sm px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition-all"
                          onClick={async () => {
                            await fetch("/api/delete-analysis", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: item.id })
                            });
                            setHistory(history.filter(h => h.id !== item.id));
                          }}
                        >Delete</button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
                {/* Hidden Files Section */}
                {history.some(item => item.hidden) && (
                  <div className="mt-6">
                    <button
                      className="text-xs text-gray-500 underline mb-2"
                      onClick={() => setShowHidden(v => !v)}
                    >
                      {showHidden ? "Hide Hidden Files" : `Show Hidden Files (${history.filter(h => h.hidden).length})`}
                    </button>
                    {showHidden && (
                      <ul className="space-y-2">
                        {history.filter(item => item.hidden).map((item) => (
                          <motion.li
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-md bg-gray-50 border border-dashed"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-600">
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                              {item.fileName && (
                                <span className="text-xs text-gray-400">{item.fileName}</span>
                              )}
                            </div>
                            <div className="flex gap-2 items-center">
                              <button
                                className="text-sm px-3 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-white transition-all"
                                onClick={async () => {
                                  setAppState("loading");
                                  const res = await fetch(`/api/upload?id=${item.id}`);
                                  if (!res.ok) throw new Error("Failed to load analysis");
                                  const j = await res.json();
                                  const dynamicData = await generateDynamicAnalysis(
                                    j.diarizationResult.utterances,
                                    j.speakerCharacteristics
                                  );
                                  setAnalysisData(dynamicData);
                                  setAppState("results");
                                }}
                              >Open</button>
                              <button
                                className="text-sm px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white transition-all"
                                onClick={async () => {
                                  await fetch("/api/hide-analysis", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: item.id, unhide: true })
                                  });
                                  setHistory(history.map(h => h.id === item.id ? { ...h, hidden: false } : h));
                                }}
                              >Unhide</button>
                              <button
                                className="text-sm px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition-all"
                                onClick={async () => {
                                  await fetch("/api/delete-analysis", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: item.id })
                                  });
                                  setHistory(history.filter(h => h.id !== item.id));
                                }}
                              >Delete</button>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {appState === "loading" && (
          <motion.div
            className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoaderCircle className="w-14 h-14 animate-spin text-primary mb-5" />
            <motion.h2
              className="text-2xl font-semibold text-gray-800 mb-2"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              Analyzing Meeting...
            </motion.h2>
            <motion.p
              className="text-gray-500 max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Our AI is transcribing, identifying speakers, analyzing sentiment, and mapping relationships. This may take a moment.
            </motion.p>
          </motion.div>
        )}

        {appState === "results" && analysisData && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  try {
                    const blob = new Blob([JSON.stringify(analysisData, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `analysis-${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {}
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-white hover:bg-secondary/80 h-10 px-4 py-2 shadow-lg transition-all"
              >
                Download Analysis
              </motion.button>
            </div>
            <AnalysisDashboard data={analysisData} />
          </motion.div>
        )}
      </main>

      <footer className="py-6 md:px-8 md:py-0 border-t bg-white shadow-inner dark:bg-gray-950">
  <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
    {/* Left: Made by */}
    <p className="text-center text-sm text-gray-500 md:text-left">
      Made by{" "}
      <a
        href="https://nextjs.org"
        target="_blank"
        rel="noreferrer"
        className="font-medium underline underline-offset-4 hover:text-gray-900 dark:hover:text-gray-200"
      >
        
      </a>{" "}
      & customized with ❤️ by{" "}
      <a
        href="https://github.com/"
        target="_blank"
        rel="noreferrer"
        className="font-medium underline underline-offset-4 hover:text-gray-900 dark:hover:text-gray-200"
      >
        Teem-X
      </a>
    </p>

    {/* Right: Navigation */}
    <nav className="flex gap-6">
      <a
        href="/about"
        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition"
      >
        About
      </a>
      <a
        href="/privacy"
        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition"
      >
        Privacy
      </a>
      <a
        href="/contact"
        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition"
      >
        Contact
      </a>
    </nav>
  </div>
</footer>
</div>
  );
}