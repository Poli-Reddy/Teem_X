import type { AnalysisData } from "@/lib/types";
import SummaryReport from "./summary-report";
import TranscriptView from "./transcript-view";
import RelationshipGraph from "./relationship-graph";
import EmotionTimeline from "./emotion-timeline";
import ParticipationMetrics from "./participation-metrics";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BarChart, FileText, Smile, GitGraph, Users } from "lucide-react";

interface AnalysisDashboardProps {
  data: AnalysisData;
}

export default function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  const sections = [
    { id: "summary", title: "Summary", icon: FileText, component: <SummaryReport summary={data.summary} relationshipGraph={data.relationshipGraph} /> },
    { id: "transcript", title: "Transcript", icon: FileText, component: <TranscriptView transcript={data.transcript} /> },
    { id: "relationship-graph", title: "Relationship Graph", icon: GitGraph, component: <RelationshipGraph data={data.relationshipGraph} /> },
    { id: "emotion-timeline", title: "Emotion Timeline", icon: Smile, component: <EmotionTimeline data={data.emotionTimeline} speakers={data.participation} /> },
    { id: "participation-metrics", title: "Participation", icon: BarChart, component: <ParticipationMetrics metrics={data.participation} /> },
  ];

  const handleScroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-64 lg:sticky lg:top-24 lg:self-start">
        <h3 className="text-lg font-semibold mb-4">Analysis Sections</h3>
        <nav className="flex flex-col gap-2">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant="ghost"
              className="justify-start"
              onClick={() => handleScroll(section.id)}
            >
              <section.icon className="w-4 h-4 mr-2" />
              {section.title}
            </Button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 space-y-8">
        {sections.map((section, index) => (
          <motion.div
            id={section.id}
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {section.component}
          </motion.div>
        ))}
      </main>
    </div>
  );
}
