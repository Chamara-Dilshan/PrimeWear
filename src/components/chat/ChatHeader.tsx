'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { ChatRoom, useChatStore } from '@/stores/chatStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ChatHeaderProps {
  room: ChatRoom;
}

/**
 * Chat Header Component
 * Displays participant info and order details
 */
export function ChatHeader({ room }: ChatHeaderProps) {
  const { selectRoom, isConnected } = useChatStore();
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const participantName = room.vendor.businessName || room.customer.firstName;
  const participantInitial = participantName.charAt(0).toUpperCase();
  const productName = room.orderItem.productSnapshot?.name || 'Product';
  const variantName = room.orderItem.variantSnapshot?.name;

  return (
    <div className="border-b p-4">
      <div className="flex items-center gap-3">
        {/* Back button (mobile only) */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => selectRoom('')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback>{participantInitial}</AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{participantName}</h3>
            {isConnected && (
              <Badge variant="outline" className="text-xs">
                Online
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Order #{room.orderItem.order.orderNumber} · {productName}
            {variantName && ` - ${variantName}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ⚠️ Contact details (phone, email) are filtered for security
          </p>
        </div>
      </div>
    </div>
  );
}
