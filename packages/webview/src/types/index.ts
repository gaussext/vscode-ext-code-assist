export interface IStandardItem<T> {
  value: T;
  label: string;
}

export interface IChunk {
  type: 'content' | 'reasoning' | 'error';
  data: string;
}

export interface IMessage {
  conversationId: string;
  type: 'content' | 'reasoning'  | 'error' |  'end';
  data?: string;
  startTime?: number;
  loadTime?: number;
  endTime?: number;
}
