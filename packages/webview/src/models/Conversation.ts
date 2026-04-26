import * as UUID from 'uuid';

export class ChatConversation {
  id: string = UUID.v4();
  title: string = 'New Session';
  isSummary: boolean = false;
}