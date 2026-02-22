'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/stores/chatStore';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn?: boolean; // Is this message from the current user?
}

/**
 * Message Bubble Component
 * Displays an individual chat message
 */
export function MessageBubble({ message, isOwn = false }: MessageBubbleProps) {
  const senderInitial = message.sender.firstName.charAt(0).toUpperCase();
  const isTempMessage = !!message.tempId && !message.id.startsWith('temp_') === false;

  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs">{senderInitial}</AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn('flex flex-col gap-1 max-w-[70%]', isOwn && 'items-end')}>
        {/* Sender name */}
        {!isOwn && (
          <p className="text-xs text-muted-foreground">
            {message.sender.firstName} {message.sender.lastName}
          </p>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-3 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted',
            isTempMessage && 'opacity-60'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Blocked content warning */}
          {message.hasBlockedContent && (
            <Badge variant="destructive" className="mt-2 text-xs">
              Content filtered
            </Badge>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">
          {format(new Date(message.createdAt), 'p')}
          {isTempMessage && ' · Sending...'}
        </p>
      </div>
    </div>
  );
}
