"use client";

import { useState } from "react";
import { Edit, Trash, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { EditCategoryDialog } from "./EditCategoryDialog";
import type { CategoryListItem } from "@/types/category";

interface CategoryTableProps {
  categories: CategoryListItem[];
  onCategoryUpdated: () => void;
}

export function CategoryTable({
  categories,
  onCategoryUpdated,
}: CategoryTableProps) {
  const [editingCategory, setEditingCategory] =
    useState<CategoryListItem | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<CategoryListItem | null>(null);
  const { toast } = useToast();

  const handleToggleStatus = async (
    categoryId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/admin/categories/${categoryId}/toggle-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update category status",
        });
        return;
      }

      toast({
        title: "Success",
        description: result.data.message,
      });

      onCategoryUpdated();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      const response = await fetch(
        `/api/admin/categories/${deletingCategory.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete category",
        });
        setDeletingCategory(null);
        return;
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      setDeletingCategory(null);
      onCategoryUpdated();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No categories found</p>
          <p className="text-sm text-muted-foreground">
            Create your first category to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Children</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  {category.image ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        No image
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {category.parent ? (
                    <span className="text-sm">{category.parent.name}</span>
                  ) : (
                    <Badge variant="secondary">Root</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{category._count.products}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{category._count.children}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={() =>
                        handleToggleStatus(category.id, category.isActive)
                      }
                    />
                    <Badge
                      variant={category.isActive ? "default" : "secondary"}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingCategory(category)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          onSuccess={onCategoryUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingCategory?.name}&rdquo;?
              {deletingCategory?._count?.children && deletingCategory._count.children > 0 && (
                <span className="block mt-2 text-destructive">
                  This category has {deletingCategory._count.children}{" "}
                  subcategor{deletingCategory._count.children === 1 ? "y" : "ies"}.
                  You must delete them first.
                </span>
              )}
              {deletingCategory?._count?.products && deletingCategory._count.products > 0 && (
                <span className="block mt-2 text-destructive">
                  This category has {deletingCategory._count.products} product
                  {deletingCategory._count.products === 1 ? "" : "s"}. You must
                  reassign or delete them first.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCategory(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                (deletingCategory?._count.children ?? 0) > 0 ||
                (deletingCategory?._count.products ?? 0) > 0
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
