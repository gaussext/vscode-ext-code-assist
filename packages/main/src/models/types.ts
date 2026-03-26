export interface ChatParams {
  model: string;
  content: string;
  messages: any[];
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}