"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { z } from "zod";

import UploadButtonComponent from "@/components/upload-button";
import SmartDateField from "@/components/smart-date-field";
import { FormInput, FormLabel, FormTextarea } from "@/components/form-fields";
import PdfPlaceholder from "@/components/pdf-placeholder";
import { computeExpiryFromPeriod } from "@/lib/warranty";

const WARRANTY_PERIOD_OPTIONS = [
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months / 1 year" },
  { months: 18, label: "18 months / 1.5 years" },
  { months: 24, label: "24 months / 2 years" },
] as const;

const formSchema = z
  .object({
    name: z.string().min(1, "Product name is required").max(200),
    brand: z.string().max(100).optional(),
    serialNumber: z.string().max(100).optional(),
    invoiceNumber: z.string().max(100).optional(),
    purchaseDate: z.string().min(1, "Purchase date is required"),
    warrantyExpiry: z.string().min(1, "Warranty expiry is required"),
    notes: z.string().max(2000).optional(),
    renewalAvailable: z.boolean().optional(),
    renewalNotes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    const purchase = new Date(data.purchaseDate);
    const expiry = new Date(data.warrantyExpiry);

    if (Number.isNaN(purchase.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid purchase date",
        path: ["purchaseDate"],
      });
    }

    if (Number.isNaN(expiry.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid warranty expiry",
        path: ["warrantyExpiry"],
      });
    }

    if (
      !Number.isNaN(purchase.getTime()) &&
      !Number.isNaN(expiry.getTime()) &&
      expiry < purchase
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Expiry must be on or after purchase date",
        path: ["warrantyExpiry"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

type ScanField =
  | "name"
  | "brand"
  | "serialNumber"
  | "invoiceNumber"
  | "purchaseDate"
  | "warrantyExpiry";

type DocumentType = {
  id?: string;
  fileUrl: string;
  fileType: string;
  documentType: "Invoice" | "Warranty Card" | "Other";
};

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  defaultValues?: Partial<FormValues> & {
    documents?: DocumentType[];
  };
};

type ScanDocType = "Invoice" | "Warranty Card";

function todayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

function nonEmpty(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function ScanBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
      <Sparkles size={10} />
      Scanned
    </span>
  );
}

export default function ProductForm({
  mode,
  productId,
  defaultValues,
}: ProductFormProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentType[]>(
    defaultValues?.documents ?? []
  );
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanExtracted, setScanExtracted] = useState(false);
  const [scanDocType, setScanDocType] = useState<ScanDocType>("Invoice");
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);
  const [scanPreviewType, setScanPreviewType] = useState<string>("image");
  const [scanFilled, setScanFilled] = useState<Set<ScanField>>(new Set());
  const [selectedPeriodMonths, setSelectedPeriodMonths] = useState<number | null>(
    null
  );
  const [lightbox, setLightbox] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      brand: defaultValues?.brand ?? "",
      serialNumber: defaultValues?.serialNumber ?? "",
      invoiceNumber: defaultValues?.invoiceNumber ?? "",
      purchaseDate:
        defaultValues?.purchaseDate || (mode === "create" ? todayIso() : ""),
      warrantyExpiry: defaultValues?.warrantyExpiry ?? "",
      notes: defaultValues?.notes ?? "",
      renewalAvailable: defaultValues?.renewalAvailable ?? false,
      renewalNotes: defaultValues?.renewalNotes ?? "",
    },
  });

  const renewalAvailable = useWatch({
    control,
    name: "renewalAvailable",
  });
  const purchaseDateValue = useWatch({
    control,
    name: "purchaseDate",
  });
  const isFormDirty =
    isDirty || documents.length !== (defaultValues?.documents?.length ?? 0);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isFormDirty || loading) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isFormDirty, loading]);

  useEffect(() => {
    if (!lightbox) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightbox(null);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightbox]);

  useEffect(() => {
    if (!selectedPeriodMonths || !purchaseDateValue) return;

    const expiry = computeExpiryFromPeriod(
      purchaseDateValue,
      selectedPeriodMonths
    );

    if (!expiry) return;

    const current = getValues("warrantyExpiry");
    if (current === expiry) return;

    setValue("warrantyExpiry", expiry, { shouldDirty: true });
  }, [purchaseDateValue, selectedPeriodMonths, getValues, setValue]);

  function markScanFilled(fields: ScanField[]) {
    setScanFilled((prev) => {
      const next = new Set(prev);
      fields.forEach((field) => next.add(field));
      return next;
    });
  }

  function clearScanBadge(field: ScanField) {
    setScanFilled((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function applyWarrantyPeriod(months: number) {
    const purchaseDate = getValues("purchaseDate");

    if (!purchaseDate) {
      toast.error("Set purchase date first");
      return;
    }

    const expiry = computeExpiryFromPeriod(purchaseDate, months);

    if (!expiry) {
      toast.error("Could not calculate expiry from purchase date");
      return;
    }

    setSelectedPeriodMonths(months);
    setValue("warrantyExpiry", expiry, {
      shouldDirty: true,
      shouldValidate: true,
    });
    markScanFilled(["warrantyExpiry"]);
  }

  function nearestPeriodOption(months: number) {
    const exact = WARRANTY_PERIOD_OPTIONS.find(
      (option) => option.months === months
    );
    return exact?.months ?? months;
  }

  async function runOcr(imageUrl: string) {
    try {
      setScanning(true);
      setScanExtracted(false);
      toast.message("Extracting details from document…");

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        toast.error(
          typeof data.error === "string" && data.error
            ? data.error
            : "Sorry, unable to scan — enter manually."
        );
        return;
      }

      const result = data.result as {
        name?: string;
        brand?: string;
        serialNumber?: string;
        invoiceNumber?: string;
        purchaseDate?: string;
        warrantyPeriod?: string | number;
      };

      const filled: ScanField[] = [];

      const name = nonEmpty(result.name);
      if (name) {
        setValue("name", name, { shouldDirty: true });
        filled.push("name");
      }

      const brand = nonEmpty(result.brand);
      if (brand) {
        setValue("brand", brand, { shouldDirty: true });
        filled.push("brand");
      }

      const serialNumber = nonEmpty(result.serialNumber);
      if (serialNumber) {
        setValue("serialNumber", serialNumber, { shouldDirty: true });
        filled.push("serialNumber");
      }

      const invoiceNumber = nonEmpty(result.invoiceNumber);
      if (invoiceNumber) {
        setValue("invoiceNumber", invoiceNumber, { shouldDirty: true });
        filled.push("invoiceNumber");
      }

      const purchaseDate =
        nonEmpty(result.purchaseDate) || nonEmpty(getValues("purchaseDate"));

      if (nonEmpty(result.purchaseDate)) {
        setValue("purchaseDate", result.purchaseDate!, { shouldDirty: true });
        filled.push("purchaseDate");
      }

      if (purchaseDate && result.warrantyPeriod) {
        const periodMonths =
          typeof result.warrantyPeriod === "number"
            ? result.warrantyPeriod
            : Number.parseInt(String(result.warrantyPeriod), 10);

        const expiry = computeExpiryFromPeriod(purchaseDate, periodMonths);

        if (expiry && !Number.isNaN(periodMonths) && periodMonths > 0) {
          setSelectedPeriodMonths(nearestPeriodOption(periodMonths));
          setValue("warrantyExpiry", expiry, { shouldDirty: true });
          filled.push("warrantyExpiry");
        }
      }

      markScanFilled(filled);
      setScanExtracted(true);

      if (filled.length > 0) {
        toast.success(
          `Filled ${filled.length} field${filled.length > 1 ? "s" : ""} — review and edit below`
        );
      } else {
        toast.error("Sorry, unable to scan — enter manually.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Sorry, unable to scan — enter manually.");
    } finally {
      setScanning(false);
    }
  }

  function addDocument(
    url: string,
    documentType: DocumentType["documentType"],
    runScan = false,
    mimeType?: string
  ) {
    const fileType =
      mimeType === "application/pdf" || url.toLowerCase().includes(".pdf")
        ? "pdf"
        : "image";

    setDocuments((prev) => [
      ...prev,
      {
        fileUrl: url,
        fileType,
        documentType,
      },
    ]);
    toast.success(`${documentType} uploaded`);

    if (runScan) {
      setScanPreviewUrl(url);
      setScanPreviewType(fileType);
      runOcr(url);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);

      const body = {
        ...values,
        brand: values.brand || null,
        serialNumber: values.serialNumber || null,
        invoiceNumber: values.invoiceNumber || null,
        notes: values.notes || null,
        renewalNotes: values.renewalNotes || null,
        renewalAvailable: values.renewalAvailable ?? false,
        documents,
      };

      const response = await fetch(
        mode === "create" ? "/api/products" : `/api/products/${productId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const firstError = result.details
          ? Object.values(result.details).flat()[0]
          : null;
        toast.error(
          (typeof firstError === "string" && firstError) ||
            result.error ||
            "Something went wrong"
        );
        return;
      }

      toast.success(
        mode === "create"
          ? "Product added successfully"
          : "Product updated successfully"
      );

      router.push(
        mode === "create"
          ? "/dashboard"
          : `/dashboard/products/${productId}`
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* SECTION 1 — Smart scan */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Scan document</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload an invoice or warranty card first. Only found fields will be
            filled — you can edit anything.
          </p>
        </div>

        <div className="flex gap-2">
          {(["Invoice", "Warranty Card"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setScanDocType(type)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                scanDocType === type
                  ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300"
                  : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <UploadButtonComponent
          size="lg"
          label={
            scanDocType === "Invoice"
              ? "Upload Invoice to auto-fill"
              : "Upload Warranty Card to auto-fill"
          }
          description="We'll extract available details — image or PDF up to 8MB"
          onChange={(url, fileType) => addDocument(url, scanDocType, true, fileType)}
        />

        {scanPreviewUrl && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <p className="text-sm text-gray-400">
                Scanned {scanDocType}
              </p>
              {scanning ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-cyan-300">
                  <Loader2 size={12} className="animate-spin" />
                  Scanning…
                </span>
              ) : scanExtracted ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-cyan-300">
                  <CheckCircle2 size={12} />
                  Details extracted — review below
                </span>
              ) : null}
            </div>
            {scanPreviewType === "pdf" ? (
              <PdfPlaceholder
                sizeClassName="h-40"
                label="PDF uploaded — text extracted"
              />
            ) : (
              <button
                type="button"
                onClick={() =>
                  setLightbox({
                    url: scanPreviewUrl,
                    title: `Scanned ${scanDocType}`,
                  })
                }
                className="block w-full cursor-zoom-in text-left"
              >
                <Image
                  src={scanPreviewUrl}
                  alt="Scanned document"
                  width={1200}
                  height={400}
                  className="h-40 w-full object-cover transition hover:opacity-90"
                />
              </button>
            )}
          </div>
        )}

        {scanning && (
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            <Loader2 size={16} className="animate-spin" />
            <Sparkles size={16} />
            Extracting product details from your document…
          </div>
        )}
      </section>

      {/* SECTION 2 — Product details */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Product details</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review auto-filled values or enter anything missing.
          </p>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <FormLabel htmlFor="name" className="mb-0">
              Product Name
            </FormLabel>
            <ScanBadge show={scanFilled.has("name")} />
          </div>
          <FormInput
            id="name"
            placeholder="iPhone 15 Pro"
            error={errors.name?.message}
            {...register("name", {
              onChange: () => clearScanBadge("name"),
            })}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <FormLabel htmlFor="invoiceNumber" optional className="mb-0">
                Invoice Number
              </FormLabel>
              <ScanBadge show={scanFilled.has("invoiceNumber")} />
            </div>
            <FormInput
              id="invoiceNumber"
              placeholder="INV-2024-001"
              error={errors.invoiceNumber?.message}
              {...register("invoiceNumber", {
                onChange: () => clearScanBadge("invoiceNumber"),
              })}
            />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <FormLabel htmlFor="serialNumber" optional className="mb-0">
                Serial Number
              </FormLabel>
              <ScanBadge show={scanFilled.has("serialNumber")} />
            </div>
            <FormInput
              id="serialNumber"
              placeholder="SN-123456"
              error={errors.serialNumber?.message}
              {...register("serialNumber", {
                onChange: () => clearScanBadge("serialNumber"),
              })}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <FormLabel htmlFor="brand" optional className="mb-0">
              Brand
            </FormLabel>
            <ScanBadge show={scanFilled.has("brand")} />
          </div>
          <FormInput
            id="brand"
            placeholder="Apple"
            error={errors.brand?.message}
            {...register("brand", {
              onChange: () => clearScanBadge("brand"),
            })}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <FormLabel htmlFor="purchaseDate" className="mb-0">
                Purchase Date
              </FormLabel>
              <ScanBadge show={scanFilled.has("purchaseDate")} />
            </div>
            <Controller
              name="purchaseDate"
              control={control}
              render={({ field }) => (
                <SmartDateField
                  id="purchaseDate"
                  value={field.value}
                  onChange={(value) => {
                    clearScanBadge("purchaseDate");
                    field.onChange(value);
                  }}
                  onBlur={field.onBlur}
                  error={errors.purchaseDate?.message}
                  hint={
                    mode === "create" && !scanFilled.has("purchaseDate")
                      ? "Pre-filled with today — edit or keep it"
                      : undefined
                  }
                />
              )}
            />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <FormLabel htmlFor="warrantyExpiry" className="mb-0">
                Warranty Expiry
              </FormLabel>
              <ScanBadge show={scanFilled.has("warrantyExpiry")} />
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {WARRANTY_PERIOD_OPTIONS.map((option) => {
                const active = selectedPeriodMonths === option.months;

                return (
                  <button
                    key={option.months}
                    type="button"
                    onClick={() => applyWarrantyPeriod(option.months)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                        : "border-white/10 bg-black/40 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Controller
              name="warrantyExpiry"
              control={control}
              render={({ field }) => (
                <SmartDateField
                  id="warrantyExpiry"
                  value={field.value}
                  onChange={(value) => {
                    clearScanBadge("warrantyExpiry");
                    setSelectedPeriodMonths(null);
                    field.onChange(value);
                  }}
                  onBlur={field.onBlur}
                  error={errors.warrantyExpiry?.message}
                  hint="Pick a period above, or type DD / MM / YYYY"
                />
              )}
            />
          </div>
        </div>

        <div>
          <FormLabel htmlFor="notes" optional>
            Notes
          </FormLabel>
          <FormTextarea
            id="notes"
            rows={4}
            placeholder="Service history, claim tips, store location…"
            error={errors.notes?.message}
            {...register("notes")}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <label className="flex items-center gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-600 bg-black text-cyan-400"
              {...register("renewalAvailable")}
            />
            Renewal / extension available
          </label>

          {renewalAvailable && (
            <div className="mt-4">
              <FormLabel htmlFor="renewalNotes" optional>
                Renewal Notes
              </FormLabel>
              <FormTextarea
                id="renewalNotes"
                rows={2}
                placeholder="e.g. AppleCare+ available until March 2027"
                error={errors.renewalNotes?.message}
                {...register("renewalNotes")}
              />
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3 — More documents */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">More documents</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add extra invoices, warranty cards, or other files. These do not
            re-run document scanning.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
              Invoice
            </p>
            <UploadButtonComponent
              label="Add Invoice"
              onChange={(url, fileType) => addDocument(url, "Invoice", false, fileType)}
            />
          </div>
          <div>
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
              Warranty Card
            </p>
            <UploadButtonComponent
              label="Add Card"
              onChange={(url, fileType) => addDocument(url, "Warranty Card", false, fileType)}
            />
          </div>
          <div>
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
              Other
            </p>
            <UploadButtonComponent
              label="Add File"
              onChange={(url, fileType) => addDocument(url, "Other", false, fileType)}
            />
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc, index) => (
              <div
                key={`${doc.fileUrl}-${index}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/40"
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <p className="text-sm text-gray-400">{doc.documentType}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setDocuments((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                      if (doc.fileUrl === scanPreviewUrl) {
                        setScanPreviewUrl(null);
                        setScanExtracted(false);
                      }
                    }}
                    className="text-sm text-red-400 transition hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                {doc.fileType === "pdf" ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition hover:opacity-90"
                  >
                    <PdfPlaceholder
                      sizeClassName="h-48"
                      label={doc.documentType}
                    />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setLightbox({
                        url: doc.fileUrl,
                        title: doc.documentType,
                      })
                    }
                    className="block w-full cursor-zoom-in text-left"
                  >
                    <Image
                      src={doc.fileUrl}
                      alt={doc.documentType}
                      width={1200}
                      height={800}
                      className="h-48 w-full object-cover transition hover:opacity-90"
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={loading || scanning}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading
          ? mode === "create"
            ? "Adding Product…"
            : "Saving…"
          : mode === "create"
            ? "Add Product"
            : "Save Changes"}
      </button>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <div
            className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="min-w-0 truncate text-sm font-medium text-white">
              {lightbox.title}
            </p>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close image"
            >
              <X size={20} />
            </button>
          </div>
          <div
            className="flex flex-1 items-center justify-center p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={lightbox.url}
              alt={lightbox.title}
              width={1600}
              height={1200}
              className="max-h-[calc(100vh-5.5rem)] w-auto max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </form>
  );
}
