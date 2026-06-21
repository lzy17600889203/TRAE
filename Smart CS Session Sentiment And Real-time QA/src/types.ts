export type Sender = 'agent' | 'customer';

export interface ChatMessage {
  id: number;
  sender: Sender;
  name: string;
  avatar: string;
  time: string;
  /** 原始文本（未高亮） */
  text: string;
  /** 检测到的敏感/负面词列表 */
  hitKeywords: string[];
  /** 该条消息给客户情绪打分带来的贡献 (-1.0 ~ +1.0)，客户消息有效 */
  sentiment: number;
  /** 是否被计为负面消息 */
  negative: boolean;
}

export interface SessionSummary {
  responseSpeed: number;     // 0-100
  serviceAttitude: number;    // 0-100
  problemResolution: number;  // 0-100
  professionalKnowledge: number; // 0-100
  emotionalIntelligence: number; // 0-100
  overall: number;            // 加权总分
  level: 'S' | 'A' | 'B' | 'C' | 'D';
}
