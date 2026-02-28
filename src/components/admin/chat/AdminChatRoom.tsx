'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  content: string;
  hasBlockedContent: boolean;
  isRead: boolean;
  createdAt: string;
  sender: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface AdminChatRoomProps {
  roomId: string;
  customer: { firstName: string; lastName: string; email: string };
  vendor: { businessName: string; email: string };
}

export function AdminChatRoom({ roomId, customer, vendor }: AdminChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/admin/chat/rooms/${roomId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to load messages');
        setMessages(data.room.messages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessages();
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-sm text-destructive">
        Failed to load messages: {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No messages in this room yet.
      </div>
    );
  }

  // Determine "sides" — customer on left, vendor on right
  function isCustomer(msg: Message) {
    return msg.sender.email === customer.email;
  }

  return (
    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto bg-muted/20">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          {customer.firstName} {customer.lastName} (Customer)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {vendor.businessName} (Vendor)
        </span>
      </div>

      {messages.map((msg) => {
        const isLeft = isCustomer(msg);
        return (
          <div
            key={msg.id}
            className={cn('flex flex-col max-w-[70%]', isLeft ? 'items-start' : 'items-end ml-auto')}
          >
            <span className="text-xs text-muted-foreground mb-1">
              {msg.sender.firstName} {msg.sender.lastName} ·{' '}
              {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
            </span>
            <div
              className={cn(
                'px-3 py-2 rounded-lg text-sm',
                isLeft
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100',
                msg.hasBlockedContent && 'ring-2 ring-destructive/50'
              )}
            >
              {msg.content}
            </div>
            {msg.hasBlockedContent && (
              <Badge variant="destructive" className="mt-1 text-xs gap-1 h-5">
                <AlertTriangle className="w-3 h-3" />
                Filtered content
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
