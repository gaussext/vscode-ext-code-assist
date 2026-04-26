export enum EnumRpcMessage {
  ChatStream = '/rpc/chat/stream',
  Chat = '/rpc/chat',
  Stop = '/rpc/chat/stop',
  Models = '/rpc/models',
}

export interface ISender {
  postMessage: (message: string) => void;
}

export interface IReceiver {
  onDidReceiveMessage?: (message: any) => void;
  addEventListener?: (event: string, callback: (message: any) => void) => void;
}

export interface IProviderParams {
  baseURL: string;
  apiKey: string;
}

export interface ICompletionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface IChatParams {
  baseURL: string;
  apiKey: string;
  model: string;
  messages: ICompletionMessage[];
}

