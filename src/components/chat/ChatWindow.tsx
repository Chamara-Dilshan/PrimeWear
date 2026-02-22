'use client';

import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatStore } from '@/stores/chatStore';

interface ChatWindowProps {
  roomId: string;
}

/**
 * Chat Window Component
 * Main chat area with header, messages, and input
 */
export function ChatWindow({ roomId }: ChatWindowProps) {
  const room = useChatStore((state) => state.rooms.find((r) => r.id === roomId));

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Chat room not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <ChatHeader room={room} />

      {/* Messages */}
      <MessageList roomId={roomId} />

      {/* Input */}
      <MessageInput roomId={roomId} />
    </div>
  );
}
