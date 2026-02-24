"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CategorySelector } from "@/components/admin/categories/CategorySelector";
import { ImageUploader } from "./ImageUploader";
import { ImageGallery } from "./ImageGallery";
import { VariantManager, ProductVariant, type VariantSettingsInfo } from "./VariantManager";
import type { ProductFormData } from "@/types/product";
import { createProductSchema } from "@/lib/validations/product";

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ProductFormData> & { id?: string };
  onSuccess?: () => void;
}

export function ProductForm({ mode, initialData, onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ProductFormData["images"]>(
    initialData?.images || []
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialData?.variants || []
  );
  const [variantSettings, setVariantSettings] = useState<VariantSettingsInfo>({
    hasVariants: (initialData?.variants?.length ?? 0) > 0,
    pricesVary: false,
    quantitiesVary: true,
    typeNames: [],
  });
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      compareAtPrice: initialData?.compareAtPrice,
      sku: initialData?.sku || "",
      stock: initialData?.stock || 0,
      lowStockThreshold: initialData?.lowStockThreshold || 5,
      images: initialData?.images || [],
      variants: initialData?.variants || [],
    },
  });

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  const handleImagesUploaded = (newImages: ProductFormData["images"]) => {
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    form.setValue("images", updatedImages, { shouldDirty: true });
  };

  const handleImagesReordered = (reorderedImages: ProductFormData["images"]) => {
    setImages(reorderedImages);
    form.setValue("images", reorderedImages, { shouldDirty: true });
  };

  const handleImageDelete = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    // Re-index positions
    const reindexed = updatedImages.map((img, idx) => ({
      ...img,
      position: idx,
    }));
    setImages(reindexed);
    form.setValue("images", reindexed, { shouldDirty: true });
  };

  const handleVariantsChange = (newVariants: ProductVariant[]) => {
    setVariants(newVariants);
    form.setValue("variants", newVariants, { shouldDirty: true });
  };

  const onSubmit = async (data: ProductFormData) => {
    // Validate images
    if (images.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "At least one product image is required",
      });
      return;
    }

    // Validate variants if any
    if (variants.length > 0) {
      const invalidVariants = variants.filter(
        (v) => !v.name || !v.value || v.stock < 0
      );
      if (invalidVariants.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "All variants must have name, value, and valid stock",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        images,
        variants: variants.length > 0 ? variants : undefined,
      };

      const url =
        mode === "create"
          ? "/api/vendor/products"
          : `/api/vendor/products/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || `Failed to ${mode} product`,
        });
        return;
      }

      toast({
        title: "Success",
        description: `Product ${mode === "create" ? "created" : "updated"} successfully`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/vendor/products");
      }
    } catch (error) {
      console.error(`Error ${mode}ing product:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Basic Information</h2>
            <p className="text-muted-foreground">
              Essential product details and category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Premium Cotton T-Shirt"
                      {...field}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/200 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <CategorySelector
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select category"
                      allowRoot={false}
                      apiUrl="/api/categories?pageSize=100"
                      showAllLevels={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SKU */}
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                  <FormControl>
                    <Input placeholder="TSHIRT-001" {...field} maxLength={100} />
                  </FormControl>
                  <FormDescription>Optional unique identifier</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed product description..."
                      className="resize-none"
                      rows={5}
                      {...field}
                      maxLength={5000}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/5000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Pricing Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Pricing</h2>
            <p className="text-muted-foreground">Set product pricing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (Rs.) *</FormLabel>
                  {variantSettings.hasVariants ? (
                    <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                      <p className="font-medium text-muted-foreground">
                        {variantSettings.pricesVary
                          ? `Prices vary for each ${variantSettings.typeNames.join(" and ")}`
                          : `Price is set in variations`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Edit in variations ↓
                      </p>
                    </div>
                  ) : (
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="999.99"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compare At Price */}
            <FormField
              control={form.control}
              name="compareAtPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compare at Price (Rs.)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1499.99"
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Original price for showing discounts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Inventory Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Inventory</h2>
            <p className="text-muted-foreground">Manage stock levels</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stock */}
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity *</FormLabel>
                  {variantSettings.hasVariants ? (
                    <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                      <p className="font-medium text-muted-foreground">
                        {variantSettings.quantitiesVary
                          ? `Quantities vary for each ${variantSettings.typeNames.join(" and ")}`
                          : `Stock is set in variations`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Edit in variations ↓
                      </p>
                    </div>
                  ) : (
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                  )}
                  <FormDescription>
                    {!variantSettings.hasVariants && "Available quantity"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Low Stock Threshold */}
            <FormField
              control={form.control}
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Stock Alert Threshold</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="5"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Get alerts when stock falls below this level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Images Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Product Images *</h2>
            <p className="text-muted-foreground">
              Upload and arrange product photos (1-10 images)
            </p>
          </div>

          <ImageUploader
            onImagesUploaded={handleImagesUploaded}
            currentImageCount={images.length}
            maxImages={10}
          />

          {images.length > 0 && (
            <ImageGallery
              images={images}
              onReorder={handleImagesReordered}
              onDelete={handleImageDelete}
              minImages={0}
            />
          )}

          {images.length === 0 && (
            <p className="text-sm text-destructive">
              At least one image is required
            </p>
          )}
        </div>

        <Separator />

        {/* Variants Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Product Variants</h2>
            <p className="text-muted-foreground">
              Optional: Add size, color, or other variations
            </p>
          </div>

          <VariantManager
            variants={variants}
            onChange={handleVariantsChange}
            basePrice={form.watch("price") || 0}
            onSettingsChange={setVariantSettings}
          />
        </div>

        <Separator />

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
