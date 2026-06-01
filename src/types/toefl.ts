export interface ExamInfo {
  title: string;
  code: string;
  source: string;
  totalQuestions: number;
}

export interface BaseQuestion {
  id: number;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string | null;
}

export interface ListeningQuestion extends BaseQuestion {
  transcript?: string;
}

export interface StructureQuestion extends BaseQuestion {
  underlinedParts?: Record<string, string>;
}

export interface ReadingQuestion extends BaseQuestion {}

export interface ListeningGroup {
  groupId: string;
  context: string;
  transcript: string;
  questions: ListeningQuestion[];
}

export interface ListeningPart {
  name: string;
  description: string;
  audioUrl: string;
  audioUrlDrive: string;
  questions?: ListeningQuestion[];
  groups?: ListeningGroup[];
}

export interface StructurePart {
  name: string;
  description: string;
  questions: StructureQuestion[];
}

export interface ReadingPassage {
  passageId: number;
  title: string;
  text: string;
  questions: ReadingQuestion[];
}

export interface Section {
  name: string;
  timeLimit: string;
  totalQuestions: number;
  parts?: (ListeningPart | StructurePart)[];
  passages?: ReadingPassage[];
}

export interface TOEFLData {
  examInfo: ExamInfo;
  sections: Section[];
}
