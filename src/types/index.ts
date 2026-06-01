export interface Session {
  id: string;
  topic: string;
  text: string;
  timestamp: number;
}

export type RecordingStatus = "idle" | "recording" | "processing";

export interface TopicCategory {
  name: string;
  icon: string;
  topics: string[];
}
