export interface IChatParams {
  model: string;
  content: string;
  messages: any[];
  apiKey: string;
  baseURL?: string;
}

export interface IChunk {
  type: 'content' | 'reasoning' | 'error';
  data: string;
}

export interface StreamCallbacks {
  onChunk: (delta: IChunk) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}