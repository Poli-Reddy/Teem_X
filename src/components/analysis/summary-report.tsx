import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { SummaryData } from "@/lib/types";

interface SummaryReportProps {
  summary: SummaryData;
  relationshipGraph?: import("@/lib/types").RelationshipGraphData;
}

export default function SummaryReport({ summary }: SummaryReportProps) {
  // Destructure relationshipGraph from props
  const { relationshipGraph } = arguments[0] as { relationshipGraph?: import("@/lib/types").RelationshipGraphData };
  function describeRelationships(graph?: import("@/lib/types").RelationshipGraphData): string[] {
    if (!graph || !graph.nodes.length || !graph.links.length) return ["No relationship data available."];
    const typeLabels: Record<string, string> = {
      support: "supportive",
      conflict: "conflicting",
      neutral: "neutral",
    };
    return graph.links.map(link => {
      const source = graph.nodes.find(n => n.id === link.source)?.label || link.source;
      const target = graph.nodes.find(n => n.id === link.target)?.label || link.target;
      return `${source} and ${target} had a ${typeLabels[link.type] || link.type} interaction (strength: ${link.value})`;
    });
  }

  return (
    <Card className="shadow-md overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {summary.title}
                </CardTitle>
                <CardDescription>Auto-generated analysis summary</CardDescription>
            </div>
            <Badge variant={summary.overallSentiment.includes('Negative') ? 'destructive' : 'secondary'} className="capitalize">
                {summary.overallSentiment}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Transcript Summary</h3>
          <motion.p className="text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {summary.summaryReport}
          </motion.p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Key Discussion Points</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {summary.points.map((point, index) => (
              <motion.li key={index} className="flex items-start" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <span>{point}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Relationship Summary</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {describeRelationships(relationshipGraph).map((item, index) => (
              <motion.li key={index} className="flex items-start" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
