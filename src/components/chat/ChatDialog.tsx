'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useChatStore } from '@/stores/chatStore';
import { ChatRoomList } from './ChatRoomList';
import { ChatWindow } from './ChatWindow';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * Main Chat Dialog Component
 * Root component for the chat system
 */
export function ChatDialog() {
  const { isOpen, selectedRoomId, closeChat, initializeSocketListeners, cleanupSocketListeners } =
    useChatStore();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  // Initialize socket listeners on mount
  useEffect(() => {
    if (isOpen) {
      initializeSocketListeners();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [isOpen, initializeSocketListeners, cleanupSocketListeners]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0">
        <div className="flex h-full overflow-hidden">
          {/* Mobile: Show room list OR chat window */}
          {isMobile ? (
            selectedRoomId ? (
              <ChatWindow roomId={selectedRoomId} />
            ) : (
              <ChatRoomList />
            )
          ) : (
            // Desktop: Side-by-side layout
            <>
              {/* Sidebar: Room list */}
              <div className="w-80 border-r flex-shrink-0">
                <ChatRoomList />
              </div>

              {/* Main: Chat window */}
              <div className="flex-1 min-w-0">
                {selectedRoomId ? (
                  <ChatWindow roomId={selectedRoomId} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Select a conversation to start chatting</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
