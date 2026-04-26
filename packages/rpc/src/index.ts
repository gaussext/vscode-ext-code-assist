export * from './types';
export * from './RpcServer';
export * from './RpcClient';

export enum EnumRpcMessage {
  Stream = '/rpc/chat/stream',
  Summary = '/rpc/chat/summary',
  Stop = '/rpc/chat/stop',
  Models = '/rpc/models',
}
