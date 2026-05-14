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

/** webview → Agent 的 prompt 请求参数 */
export interface IChatParams {
  sessionId: string;
  text: string;
}

/** OpenAI API 调用参数（内部使用） */
export interface IOpenAIParams {
  baseURL: string;
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
}

