"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { LoaderCircle, Sparkles, Zap, Brain, Network, BarChart3, MessageSquare, Users, FileAudio, Download, ChevronRight, Activity } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import UploadForm from "@/components/analysis/upload-form";
import AnalysisDashboard from "@/components/analysis/analysis-dashboard";
import Logo from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, OrbitControls, Sphere, Box, MeshDistortMaterial, MeshWobbleMaterial, Trail, Text3D, Center } from '@react-three/drei';
import { useSpring as useSpringThree, animated } from '@react-spring/three';
import Tilt from 'react-parallax-tilt';
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

// 3D Floating Orb Component
const FloatingOrb = ({ position, color, scale = 1 }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime()) * 0.2;
    }
  });

  const { scale: animScale } = useSpringThree({
    scale: hovered ? scale * 1.2 : scale,
    config: { tension: 300, friction: 10 }
  });

  return (
    <animated.mesh
      ref={meshRef}
      position={position}
      scale={animScale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={0.3}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </animated.mesh>
  );
};

// 3D Network Visualization
const NetworkVisualization = () => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <FloatingOrb position={[0, 0, 0]} color="#6366f1" scale={0.5} />
      <FloatingOrb position={[2, 1, -1]} color="#8b5cf6" scale={0.3} />
      <FloatingOrb position={[-2, -1, 1]} color="#ec4899" scale={0.3} />
      <FloatingOrb position={[1, -1, 2]} color="#10b981" scale={0.4} />
      <FloatingOrb position={[-1, 2, -2]} color="#f59e0b" scale={0.35} />
    </group>
  );
};

// Animated Particle Background
const ParticleField = () => {
  const particlesRef = useRef();
  const particlesCount = 1000;
  const positions = new Float32Array(particlesCount * 3);
  
  for (let i = 0; i < particlesCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 10;
    positions[i + 1] = (Math.random() - 0.5) * 10;
    positions[i + 2] = (Math.random() - 0.5) * 10;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      particlesRef.current.rotation.x = state.clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.01} color="#6366f1" transparent opacity={0.6} />
    </points>
  );
};

// Animated Loading Cube
const LoadingCube = () => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime();
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 1.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <MeshWobbleMaterial
        attach="material"
        color="#6366f1"
        speed={2}
        factor={0.6}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
};

// Enhanced Card Component with 3D Tilt
const Card3D = ({ children, className = "", delay = 0 }) => {
  // Only apply tilt and hover effects for the upload card, but remove blur effect on hover
  const isUploadCard = className.includes('upload-form') || className.includes('p-8');
  const isAnalysisSectionsCard = className.includes('analysis-dashboard') || className.includes('p-8 backdrop-blur-2xl');
  if (isUploadCard && !isAnalysisSectionsCard) {
    return (
      <Tilt
        tiltMaxAngleX={10}
        tiltMaxAngleY={10}
        perspective={1000}
        glareEnable={true}
        glareMaxOpacity={0.3}
        glareColor="#6366f1"
        glarePosition="all"
        glareBorderRadius="12px"
      >
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ 
            duration: 0.8, 
            delay,
            type: "spring",
            stiffness: 100
          }}
          whileHover={{ 
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)"
          }}
          className={`rounded-xl border bg-white/90 dark:bg-gray-900/90 shadow-2xl ${className}`}
        >
          {children}
        </motion.div>
      </Tilt>
    );
  }
  // For the Analysis Sections card, make it completely static (no tilt, scale, movement, or blur)
  if (isAnalysisSectionsCard) {
    return (
      <div className={`rounded-xl border bg-white/90 dark:bg-gray-900/90 shadow-2xl ${className}`}>
        {children}
      </div>
    );
  }
  // For all other cards, keep them static as well
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ 
        duration: 0.8, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      className={`rounded-xl border bg-white/90 dark:bg-gray-900/90 shadow-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Animated Stats Counter
const AnimatedCounter = ({ value, suffix = "", prefix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseInt(value.toString().replace(/\D/g, '')) || 0;
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [numericValue]);
  
  return (
    <span className="font-bold text-2xl">
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// Main Analysis Logic (unchanged)
const generateDynamicAnalysis = async (
  diarizedResult: { speaker: number; text: string }[],
  detected: SpeakerIndexToDetection | undefined
): Promise<AnalysisData> => {
  const uniqueSpeakers = [...new Set(diarizedResult.map((u) => u.speaker))];
  const numSpeakers = uniqueSpeakers.length;

  const positiveSet = new Set([
    "good","great","excellent","agree","yes","ok","thanks","thank","love","like","clear","awesome","nice","happy","support","strong","well","congrats","congratulations","cheers","success","improve","improved","improving"
  ]);
  const negativeSet = new Set([
    "bad","worse","worst","disagree","no","not","confused","issue","problem","hate","angry","sad","conflict","weak","blocker","delay","fail","failed","failing","bug","risk","concern","concerns"
  ]);

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

  const emotionFromScore = (s: number) => {
    if (s > 0.7) return "joy";
    if (s > 0.4) return "calm";
    if (s > 0.2) return "supportive";
    if (s < -0.7) return "anger";
    if (s < -0.4) return "sadness";
    if (s < -0.2) return "critical";
    return "neutral";
  };

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

  const emotionTimeline: EmotionTimelinePoint[] = Array.from({ length: 5 }, (_, i) => {
    const time = Math.floor(i * (currentTime / 4));
    const point: EmotionTimelinePoint = { time: `0:${time.toString().padStart(2, "0")}` };
    Array.from(speakerMap.values()).forEach(s => {
      point[s.id] = Math.random() * 2 - 1;
    });
    return point;
  });

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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* 3D Background Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <ParticleField />
          </Suspense>
        </Canvas>
      </div>

      {/* Animated Gradient Overlay */}
      <motion.div 
        className="fixed inset-0 z-[1] opacity-70"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)",
            "linear-gradient(45deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%)",
            "linear-gradient(45deg, rgba(236,72,153,0.1) 0%, rgba(99,102,241,0.1) 100%)",
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Header with Glassmorphism */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl"
      >
        <div className="container h-20 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Logo />
          </motion.div>
          
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-white/70"
            >
              <Network className="w-6 h-6" />
            </motion.div>
            
            <AnimatePresence>
              {appState === "results" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNewAnalysis}
                  className="relative inline-flex items-center justify-center rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl h-12 px-8 overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    New Analysis
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 container py-10 relative z-10">
        {appState === "idle" && (
          <motion.div
            className="space-y-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Hero Section with 3D Graphics */}
            <motion.div 
              className="text-center mb-12"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Meeting Intelligence Platform
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-300 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Transform your meetings with AI-powered insights, sentiment analysis, and relationship mapping
              </motion.p>
              
              {/* Feature Icons */}
              <div className="flex justify-center gap-8 mt-8">
                {[
                  { icon: Brain, label: "AI Analysis" },
                  { icon: MessageSquare, label: "Transcription" },
                  { icon: Users, label: "Speaker ID" },
                  { icon: Activity, label: "Sentiment" }
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 3D Upload Section */}
            <div className="relative">
              <div className="absolute inset-0 -z-10">
                <Canvas camera={{ position: [0, 0, 3] }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} />
                  <Suspense fallback={null}>
                    <Float speed={2}>
                      <NetworkVisualization />
                    </Float>
                  </Suspense>
                  <OrbitControls enableZoom={false} enablePan={false} />
                </Canvas>
              </div>
              
              <Card3D className="p-8 backdrop-blur-2xl bg-white/10 border-white/20">
                <UploadForm onFileUpload={handleFileUpload} />
              </Card3D>
            </div>

            {/* History Section with Advanced Animations */}
            {history.length > 0 && (
              <Card3D className="p-6 backdrop-blur-2xl bg-white/10 border-white/20" delay={0.2}>
                <div className="flex items-center justify-between mb-4">
                  <motion.h3 
                    className="font-semibold text-xl text-white flex items-center gap-2"
                    whileHover={{ x: 5 }}
                  >
                    <BarChart3 className="w-5 h-5" />
                    Recent Analyses
                  </motion.h3>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
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
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
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
                          }
                          setAppState("idle");
                        } catch {
                          setAppState("idle");
                        }
                      }}
                    >
                      Clear all
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-3">
                  {history.filter(item => !item.hidden).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                      className="group relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-300">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                          {item.fileName && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <FileAudio className="w-3 h-3" />
                              {item.fileName}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-lg hover:shadow-blue-500/25 transition-all"
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
                          >
                            <span className="flex items-center gap-1">
                              Open <ChevronRight className="w-3 h-3" />
                            </span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="px-3 py-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-sm transition-all"
                            onClick={async () => {
                              await fetch("/api/hide-analysis", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: item.id })
                              });
                              setHistory(history.map(h => h.id === item.id ? { ...h, hidden: true } : h));
                            }}
                          >
                            Hide
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm transition-all"
                            onClick={async () => {
                              await fetch("/api/delete-analysis", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: item.id })
                              });
                              setHistory(history.filter(h => h.id !== item.id));
                            }}
                          >
                            Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Hidden Files Section with Animations */}
                {history.some(item => item.hidden) && (
                  <motion.div 
                    className="mt-6 p-4 rounded-xl bg-gray-800/30 backdrop-blur-lg border border-gray-700/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      className="text-sm text-gray-400 hover:text-gray-300 mb-3 flex items-center gap-2"
                      onClick={() => setShowHidden(v => !v)}
                    >
                      <motion.div
                        animate={{ rotate: showHidden ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                      {showHidden ? "Hide Hidden Files" : `Show Hidden Files (${history.filter(h => h.hidden).length})`}
                    </motion.button>
                    
                    <AnimatePresence>
                      {showHidden && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {history.filter(item => item.hidden).map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-3 rounded-lg bg-gray-900/50 border border-gray-700/30"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-400">
                                    {new Date(item.createdAt).toLocaleString()}
                                  </span>
                                  {item.fileName && (
                                    <span className="text-xs text-gray-500">
                                      {item.fileName}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="px-3 py-1 rounded-md bg-blue-600/30 text-blue-400 text-sm"
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
                                  >Open</motion.button>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="px-3 py-1 rounded-md bg-green-600/30 text-green-400 text-sm"
                                    onClick={async () => {
                                      await fetch("/api/hide-analysis", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: item.id, unhide: true })
                                      });
                                      setHistory(history.map(h => h.id === item.id ? { ...h, hidden: false } : h));
                                    }}
                                  >Unhide</motion.button>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="px-3 py-1 rounded-md bg-red-600/30 text-red-400 text-sm"
                                    onClick={async () => {
                                      await fetch("/api/delete-analysis", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: item.id })
                                      });
                                      setHistory(history.filter(h => h.id !== item.id));
                                    }}
                                  >Delete</motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </Card3D>
            )}
          </motion.div>
        )}

        {/* Enhanced Loading State with 3D */}
        {appState === "loading" && (
          <motion.div
            className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative w-64 h-64 mb-8">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Suspense fallback={null}>
                  <Float speed={2} floatIntensity={2}>
                    <LoadingCube />
                  </Float>
                </Suspense>
              </Canvas>
            </div>
            
            <motion.div
              className="space-y-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-white">
                Processing Your Meeting
              </h2>
              
              <div className="flex items-center justify-center gap-3">
                {["Transcribing", "Analyzing", "Mapping"].map((step, i) => (
                  <motion.div
                    key={step}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                    />
                    <span className="text-gray-400 text-sm">{step}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.p
                className="text-gray-400 max-w-md mt-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Our AI is extracting insights from your conversation...
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* Results State with Enhanced Dashboard */}
        {appState === "results" && analysisData && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Action Bar */}
            <motion.div 
              className="flex justify-between items-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <motion.div 
                className="flex items-center gap-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="px-4 py-2 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30">
                  <span className="text-green-400 text-sm font-medium">
                    Analysis Complete
                  </span>
                </div>
                
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-green-400"
                >
                  <Zap className="w-5 h-5" />
                </motion.div>
              </motion.div>
              
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
                className="relative inline-flex items-center justify-center rounded-full text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-2xl h-12 px-6 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Results
                </span>
              </motion.button>
            </motion.div>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  label: "Total Speakers", 
                  value: analysisData.participation.length,
                  icon: Users,
                  color: "from-blue-600 to-indigo-600"
                },
                { 
                  label: "Transcript Lines", 
                  value: analysisData.transcript.length,
                  icon: MessageSquare,
                  color: "from-purple-600 to-pink-600"
                },
                { 
                  label: "Overall Sentiment", 
                  value: analysisData.summary.overallSentiment,
                  icon: Activity,
                  color: "from-green-600 to-emerald-600"
                }
              ].map((stat, index) => (
                <Card3D key={stat.label} delay={index * 0.1}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className={`p-3 rounded-full bg-gradient-to-r ${stat.color} shadow-lg`}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                      >
                        {typeof stat.value === 'number' ? (
                          <AnimatedCounter value={stat.value} />
                        ) : (
                          <span className="text-2xl font-bold text-white">{stat.value}</span>
                        )}
                      </motion.div>
                    </div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                  </div>
                </Card3D>
              ))}
            </div>

            {/* Enhanced Analysis Dashboard */}
            <Card3D className="p-8 backdrop-blur-2xl bg-white/5 border-white/10" delay={0.3}>
              <AnalysisDashboard data={analysisData} />
            </Card3D>
          </motion.div>
        )}
      </main>

      {/* Enhanced Footer */}
      <motion.footer 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 py-8 border-t border-white/10 bg-black/20 backdrop-blur-2xl"
      >
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div 
              className="flex items-center gap-2 text-gray-400"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm">
                Powered by Advanced AI • Built with ❤️ by{" "}
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Teem-X
                </a>
              </span>
            </motion.div>

            <nav className="flex gap-8">
              {["About", "Privacy", "Contact"].map((item, i) => (
                <motion.a
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-sm text-gray-400 hover:text-white transition-colors relative group"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                >
                  {item}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
                </motion.a>
              ))}
            </nav>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}