export interface TranscriptEntry {
  id: number;
  speaker: string;
  label: string;
  characteristic: {
    color: string;
    description: string; // now empty; we no longer display accessories
  };
  text: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  emotion: string;
  timestamp: string;
}

export interface SpeakerCharacteristicDetection {
  description: string;
  confidence: number; // 0..1
}

export type SpeakerIndexToDetection = Record<number, SpeakerCharacteristicDetection>;

export interface ParticipationMetric {
  speaker: string;
  label: string;
  characteristic: {
    color: string;
    description: string;
  };
  speakingTime: string;
  conflict: number;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export interface EmotionTimelinePoint {
  time: string;
  [key: string]: number | string; // Speaker ID -> sentiment score
}

export interface GraphNode {
  id: string;
  label: string;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'support' | 'conflict' | 'neutral';
  value: number;
}

export interface RelationshipGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SummaryData {
  title: string;
  overallSentiment: string;
  points: string[];
  relationshipSummary: string;
  summaryReport?: string;
}

export interface AnalysisData {
  summary: SummaryData;
  transcript: TranscriptEntry[];
  participation: ParticipationMetric[];
  emotionTimeline: EmotionTimelinePoint[];
  relationshipGraph: RelationshipGraphData;
}
