"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { uiFeedback } from "@/lib/ui-feedback";

export function MedicalFileUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: (acceptedFiles) => {
      setError(null);
      setSuccess(null);
      setFile(acceptedFiles[0] ?? null);
    },
  });

  async function submitUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Файл таңдаңыз.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? uiFeedback.genericError);
        return;
      }

      setSuccess(uiFeedback.uploadSuccess);
      setFile(null);
      router.refresh();
    } catch {
      setError(uiFeedback.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submitUpload} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Файл</span>
          <div
            {...getRootProps()}
            className={`flex h-11 cursor-pointer items-center rounded-lg border border-dashed bg-white px-3 transition ${
              isDragActive ? "border-cyan-500 bg-cyan-50" : "border-slate-300"
            }`}
          >
            <input {...getInputProps()} />
            <span className="truncate text-slate-600">
              {file ? file.name : isDragActive ? "Файлды осында жіберіңіз..." : "Файлды сүйреп апарыңыз немесе таңдаңыз"}
            </span>
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-cyan-600 px-4 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-70"
          >
            {loading ? "Жүктелуде..." : "Жүктеу"}
          </button>
        </div>
      </div>

      {file && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
          {file.type.startsWith("image/") && previewUrl ? (
            <Image src={previewUrl} alt="Preview" width={240} height={144} unoptimized className="mt-2 h-36 w-auto rounded border border-slate-200 object-contain" />
          ) : (
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p>{file.name}</p>
              <p>{file.type || "Белгісіз тип"} · {(file.size / 1024).toFixed(1)} KB</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}
    </form>
  );
}
