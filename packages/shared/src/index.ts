export const EnumRpcMessage = {
  Stream: '/rpc/chat/stream',
  Chat: '/rpc/chat',
  Stop: '/rpc/chat/stop',
  Models: '/rpc/models',
} as const;

export type EnumRpcMessageType = typeof EnumRpcMessage[keyof typeof EnumRpcMessage];