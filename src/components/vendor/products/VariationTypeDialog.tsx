"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface VariationType {
  name: string;
  options: string[];
}

const PREDEFINED_TYPES = ["Color", "Size", "Material", "Style", "Pattern"];

interface VariationTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (type: VariationType) => void;
  onDelete?: () => void;
  initialType?: VariationType;
  title?: string;
}

export function VariationTypeDialog({
  open,
  onClose,
  onSave,
  onDelete,
  initialType,
  title = "Custom variation",
}: VariationTypeDialogProps) {
  const [name, setName] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setName(initialType?.name ?? "");
      setOptions(initialType?.options ?? []);
      setOptionInput("");
      setNameError("");
      setOptionsError("");
    }
  }, [open, initialType]);

  const addOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      setOptionInput("");
      return;
    }
    setOptions((prev) => [...prev, trimmed]);
    setOptionInput("");
    setOptionsError("");
    inputRef.current?.focus();
  };

  const removeOption = (opt: string) => {
    setOptions((prev) => prev.filter((o) => o !== opt));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addOption();
    }
  };

  const handleSave = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    } else {
      setNameError("");
    }
    if (options.length === 0) {
      setOptionsError("Add at least 1 option");
      valid = false;
    } else {
      setOptionsError("");
    }
    if (!valid) return;
    onSave({ name: name.trim(), options });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose a variation name and add the available options buyers can select.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Predefined type chips */}
          <div>
            <Label className="mb-2 block">Name *</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PREDEFINED_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setName(t);
                    setNameError("");
                  }}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    name === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-accent border-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input
              placeholder="Or create your own…"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && (
              <p className="text-xs text-destructive mt-1">{nameError}</p>
            )}
          </div>

          {/* Options */}
          <div>
            <Label className="mb-1 block">
              Options{" "}
              <span className="text-muted-foreground font-normal">
                ({options.length})
              </span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Buyers can choose from the following options.
            </p>

            {/* Existing option chips */}
            {options.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {options.map((opt) => (
                  <Badge
                    key={opt}
                    variant="secondary"
                    className="gap-1 pr-1 text-sm"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => removeOption(opt)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Option input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Enter an option…"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={optionsError ? "border-destructive" : ""}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                disabled={!optionInput.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {optionsError && (
              <p className="text-xs text-destructive mt-1">{optionsError}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive mr-auto"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Delete variation
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
