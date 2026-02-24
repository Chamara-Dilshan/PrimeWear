"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VariationTypeDialog, type VariationType } from "./VariationTypeDialog";

export interface VariationSettings {
  types: VariationType[];
  pricesVary: boolean;
  quantitiesVary: boolean;
  skusVary: boolean;
}

interface ManageVariationsModalProps {
  open: boolean;
  onClose: () => void;
  initialSettings: VariationSettings;
  onApply: (settings: VariationSettings) => void;
}

export function ManageVariationsModal({
  open,
  onClose,
  initialSettings,
  onApply,
}: ManageVariationsModalProps) {
  const [types, setTypes] = useState<VariationType[]>(initialSettings.types);
  const [pricesVary, setPricesVary] = useState(initialSettings.pricesVary);
  const [quantitiesVary, setQuantitiesVary] = useState(
    initialSettings.quantitiesVary
  );
  const [skusVary, setSkusVary] = useState(initialSettings.skusVary);

  // Type dialog state
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);

  // Reset state when modal opens with new settings
  const handleOpen = () => {
    setTypes(initialSettings.types);
    setPricesVary(initialSettings.pricesVary);
    setQuantitiesVary(initialSettings.quantitiesVary);
    setSkusVary(initialSettings.skusVary);
  };

  const combinationCount =
    types.length === 0
      ? 0
      : types.reduce((acc, t) => acc * t.options.length, 1);

  const openAddType = () => {
    setEditingTypeIndex(null);
    setTypeDialogOpen(true);
  };

  const openEditType = (index: number) => {
    setEditingTypeIndex(index);
    setTypeDialogOpen(true);
  };

  const handleSaveType = (type: VariationType) => {
    if (editingTypeIndex !== null) {
      setTypes((prev) =>
        prev.map((t, i) => (i === editingTypeIndex ? type : t))
      );
    } else {
      setTypes((prev) => [...prev, type]);
    }
    setTypeDialogOpen(false);
    setEditingTypeIndex(null);
  };

  const handleDeleteType = (index: number) => {
    setTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onApply({ types, pricesVary, quantitiesVary, skusVary });
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (v) handleOpen();
          else onClose();
        }}
      >
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage variations</DialogTitle>
            <DialogDescription>
              Define variation types and configure how prices, quantities, and SKUs are set per combination.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Variation type cards */}
            <div className="space-y-3">
              {types.map((type, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{type.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.options.length} option
                        {type.options.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditType(index)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteType(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {type.options.map((opt) => (
                      <Badge key={opt} variant="outline" className="text-xs">
                        {opt}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add a variation button */}
            {types.length < 2 && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={openAddType}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a variation
              </Button>
            )}

            {types.length > 0 && <hr />}

            {/* Toggles */}
            {types.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prices-vary" className="cursor-pointer">
                    <span className="font-medium">Prices</span> vary
                  </Label>
                  <Switch
                    id="prices-vary"
                    checked={pricesVary}
                    onCheckedChange={setPricesVary}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="qty-vary" className="cursor-pointer">
                    <span className="font-medium">Quantities</span> vary
                  </Label>
                  <Switch
                    id="qty-vary"
                    checked={quantitiesVary}
                    onCheckedChange={setQuantitiesVary}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="skus-vary" className="cursor-pointer">
                    <span className="font-medium">SKUs</span> vary
                  </Label>
                  <Switch
                    id="skus-vary"
                    checked={skusVary}
                    onCheckedChange={setSkusVary}
                  />
                </div>
              </div>
            )}

            {/* Info */}
            {combinationCount > 0 && (
              <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                {combinationCount} option combination
                {combinationCount !== 1 ? "s" : ""} will be created
                automatically.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={types.length === 0}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested type dialog */}
      <VariationTypeDialog
        open={typeDialogOpen}
        onClose={() => {
          setTypeDialogOpen(false);
          setEditingTypeIndex(null);
        }}
        onSave={handleSaveType}
        onDelete={
          editingTypeIndex !== null
            ? () => handleDeleteType(editingTypeIndex)
            : undefined
        }
        initialType={
          editingTypeIndex !== null ? types[editingTypeIndex] : undefined
        }
        title={editingTypeIndex !== null ? "Edit variation" : "Custom variation"}
      />
    </>
  );
}
