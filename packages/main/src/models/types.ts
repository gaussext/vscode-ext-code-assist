export interface IChatParams {
  model: string;
  content: string;
  messages: any[];
  apiKey: string;
  baseURL?: string;
}

export interface StreamCallbacks {
  onChunk: (delta: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}