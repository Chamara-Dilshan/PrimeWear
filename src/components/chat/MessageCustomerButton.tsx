'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';

interface MessageCustomerButtonProps {
  chatRoomId: string;
}

export function MessageCustomerButton({ chatRoomId }: MessageCustomerButtonProps) {
  const { openChat } = useChatStore();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => openChat(chatRoomId)}
      className="gap-2"
    >
      <MessageCircle className="w-4 h-4" />
      Message Customer
    </Button>
  );
}
