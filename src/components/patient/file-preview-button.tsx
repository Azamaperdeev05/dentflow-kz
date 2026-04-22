"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Props = {
  url: string;
  name: string;
  type: string;
  className?: string;
  label?: string;
};

export function FilePreviewButton({ url, name, type, className, label = "Ашу" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string>(url);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let currentBlobUrl: string | null = null;
    if (isOpen && url.startsWith("data:")) {
      setIsLoading(true);
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
           const bUrl = URL.createObjectURL(blob);
           currentBlobUrl = bUrl;
           setObjectUrl(bUrl);
           setIsLoading(false);
        })
        .catch(() => {
           setObjectUrl(url);
           setIsLoading(false);
        });
    } else {
      setObjectUrl(url);
    }

    return () => {
       if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
       }
    };
  }, [isOpen, url]);

  const isImage = type.startsWith("image/");
  const isPdf = type === "application/pdf";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "inline-flex items-center gap-1 rounded-lg bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-700 hover:bg-cyan-200 transition"}
      >
        <Image src="/icons/windows11-outline/messages.png" alt="" width={13} height={13} />
        {label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-200">
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex flex-col">
                 <h3 className="text-lg font-bold text-slate-900 truncate max-w-[300px]">{name}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-hidden bg-slate-50 flex items-center justify-center p-6">
              {isLoading ? (
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
              ) : isImage ? (
                <img src={objectUrl} alt={name} className="max-h-full max-w-full rounded-lg shadow-sm object-contain" />
              ) : isPdf ? (
                <iframe src={objectUrl} className="w-full h-full rounded-xl shadow-sm border border-slate-200" title={name} />
              ) : (
                <div className="text-center p-12">
                   <p className="text-slate-600">Бұл файл типін алдын ала қарау мүмкін емес.</p>
                   <a 
                    href={objectUrl} 
                    download={name}
                    className="mt-4 inline-block rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition"
                   >
                     Жүктеп алу
                   </a>
                </div>
              )}
            </div>
            
            <footer className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-white">
               <a 
                href={url} 
                download={name}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
               >
                 Жүктеу
               </a>
               <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
              >
                Жабу
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
