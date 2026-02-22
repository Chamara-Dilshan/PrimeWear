"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShopStatusToggle() {
  // Mock state - will integrate with API in Phase 4
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (newStatus: boolean) => {
    setIsLoading(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsOpen(newStatus);
    setIsLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
          <Store className="w-4 h-4" />
          <span className="hidden sm:inline">Shop Status:</span>
          <Badge variant={isOpen ? "default" : "secondary"}>
            {isLoading ? "Updating..." : isOpen ? "Open" : "Closed"}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Shop Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleToggle(true)} disabled={isOpen}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Open Shop</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleToggle(false)} disabled={!isOpen}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span>Close Shop</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {isOpen
            ? "Your shop is visible to customers"
            : "Your shop is hidden from customers"}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
