import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ParticipationMetric } from "@/lib/types";

interface ParticipationMetricsProps {
  metrics: ParticipationMetric[];
}

const sentimentColorMap = {
  Positive: "bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/30",
  Negative: "bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-500/30",
  Neutral: "bg-gray-500/20 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 border-gray-500/30",
};


export default function ParticipationMetrics({ metrics }: ParticipationMetricsProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Participation Metrics</CardTitle>
        <CardDescription>Breakdown of speaker engagement.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Participant</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead className="text-right">Conflict %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.speaker}>
                <TableCell className="font-medium">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${metric.characteristic.color}`}></span>
                  {metric.label}
                </TableCell>
                <TableCell>{metric.speakingTime}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${sentimentColorMap[metric.sentiment]}`}>{metric.sentiment}</Badge>
                </TableCell>
                <TableCell className="text-right">{metric.conflict}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
