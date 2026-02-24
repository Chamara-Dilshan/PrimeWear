"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CombinationRow {
  values: Record<string, string>; // { Size: "L", Color: "Black" }
  price?: number;                 // absolute price; undefined = use basePrice
  stock: number;
  sku?: string;
  visible: boolean;
}

interface CombinationTableProps {
  combinations: CombinationRow[];
  typeNames: string[];
  pricesVary: boolean;
  quantitiesVary: boolean;
  skusVary: boolean;
  basePrice: number;
  onChange: (combinations: CombinationRow[]) => void;
}

export function CombinationTable({
  combinations,
  typeNames,
  pricesVary,
  quantitiesVary,
  skusVary,
  basePrice,
  onChange,
}: CombinationTableProps) {
  const update = (index: number, patch: Partial<CombinationRow>) => {
    onChange(combinations.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const updateAll = (patch: Partial<CombinationRow>) => {
    onChange(combinations.map((c) => ({ ...c, ...patch })));
  };

  // Shared price / qty when not varying
  const sharedPrice =
    combinations[0]?.price !== undefined ? combinations[0].price : basePrice;
  const sharedStock = combinations[0]?.stock ?? 0;

  return (
    <div className="space-y-4">
      {/* Shared fields when not varying */}
      <div className="flex flex-wrap gap-4">
        {!pricesVary && (
          <div className="flex-1 min-w-[160px]">
            <Label className="mb-1 block text-sm">
              Price (Rs.) — all variants
            </Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={sharedPrice}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || basePrice;
                updateAll({ price: v });
              }}
            />
          </div>
        )}
        {!quantitiesVary && (
          <div className="flex-1 min-w-[140px]">
            <Label className="mb-1 block text-sm">
              Quantity — all variants
            </Label>
            <Input
              type="number"
              min="0"
              value={sharedStock}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 0;
                updateAll({ stock: v });
              }}
            />
          </div>
        )}
      </div>

      {/* Combination matrix table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {typeNames.map((t) => (
                  <th key={t} className="text-left px-3 py-2 font-medium">
                    {t}
                  </th>
                ))}
                {pricesVary && (
                  <th className="text-left px-3 py-2 font-medium">
                    Price (Rs.)
                  </th>
                )}
                {quantitiesVary && (
                  <th className="text-left px-3 py-2 font-medium">Quantity</th>
                )}
                {skusVary && (
                  <th className="text-left px-3 py-2 font-medium">SKU</th>
                )}
                <th className="text-left px-3 py-2 font-medium">Visible</th>
              </tr>
            </thead>
            <tbody>
              {combinations.map((combo, index) => (
                <tr
                  key={index}
                  className={`border-t ${!combo.visible ? "opacity-50" : ""}`}
                >
                  {/* Type value columns */}
                  {typeNames.map((t) => (
                    <td key={t} className="px-3 py-2 font-medium">
                      {combo.values[t]}
                    </td>
                  ))}

                  {/* Price */}
                  {pricesVary && (
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="w-28"
                        value={combo.price !== undefined ? combo.price : basePrice}
                        onChange={(e) =>
                          update(index, {
                            price: parseFloat(e.target.value) || basePrice,
                          })
                        }
                      />
                    </td>
                  )}

                  {/* Quantity */}
                  {quantitiesVary && (
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        className="w-24"
                        value={combo.stock}
                        onChange={(e) =>
                          update(index, {
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                  )}

                  {/* SKU */}
                  {skusVary && (
                    <td className="px-3 py-2">
                      <Input
                        className="w-32"
                        placeholder="Optional"
                        value={combo.sku ?? ""}
                        onChange={(e) =>
                          update(index, { sku: e.target.value })
                        }
                      />
                    </td>
                  )}

                  {/* Visible toggle */}
                  <td className="px-3 py-2">
                    <Switch
                      checked={combo.visible}
                      onCheckedChange={(v) => update(index, { visible: v })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {combinations.length} variant{combinations.length !== 1 ? "s" : ""} ·
        Each tracks stock independently.
      </p>
    </div>
  );
}
