export interface IStandardItem<T> {
  value: T;
  label: string;
}

export interface IMessage {
  conversationId: string;
  type: 'delta' | 'end';
  delta?: string;
  startTime?: number;
  endTime?: number;
}
