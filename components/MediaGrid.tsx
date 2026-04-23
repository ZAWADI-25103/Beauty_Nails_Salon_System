'use client';

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMedias } from "@/lib/hooks/useMedia";
import { MediaData } from "@/lib/api/media";
import { toast } from "sonner";
import { Plus, FileText, Eye, X, Loader2, AlertTriangle } from "lucide-react";

interface MediaGridProps {
  workerId: string;
  onRemove?: (id: string) => void;
  onView?: (url: string) => void;
}

export default function MediaGrid({ workerId, onRemove, onView }: MediaGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { medias, isCreating, createMedia, isLoading, error, refetch } = useMedias();

  const handleUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont autorisés');
      return;
    }

    // Check if worker already has 3 documents
    const workerDocs = medias?.filter(media =>
      media.workerId === workerId &&
      media.type === 'DOCUMENT' &&
      media.mimeType === 'application/pdf'
    ) || [];

    if (workerDocs.length >= 3) {
      toast.error('Maximum 3 documents autorisés');
      return;
    }

    setUploading(true);

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);

    // Create media object
    const media: MediaData = {
      file,
      clientId: null,
      appointmentId: null,
      workerId
    };

    try {
      await createMedia(media);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'upload du document');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleRemove = async (id: string) => {
    // In a real implementation, you would call a delete API
    // For now, we'll just refetch to update the list
    await refetch();
  };

  const handleView = (url: string) => {
    if (onView) {
      onView(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // Filter to only show PDF documents for this worker
  const pdfDocuments = medias?.filter(media =>
    media.workerId === workerId &&
    media.type === 'DOCUMENT' &&
    media.mimeType === 'application/pdf'
  ) || [];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {/* Add File Card */}
      <Card
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center p-4 cursor-pointer border-dashed border-2 border-gray-300 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-600 transition rounded-xl bg-gray-50 dark:bg-gray-900/50"
      >
        <Plus className="w-6 h-6 mb-2 text-gray-500 dark:text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {uploading || isCreating ? "Upload..." : "Ajouter"}
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </Card>

      {/* Files */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 col-span-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center col-span-full">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-500">Erreur de chargement des documents.</p>
        </Card>
      ) : pdfDocuments.length === 0 ? (
        <div className="text-center py-8 col-span-full">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Aucun document PDF uploadé</p>
        </div>
      ) : (
        pdfDocuments.map((file: any) => (
          <Card
            key={file.id}
            className="p-2 rounded-xl overflow-hidden hover:shadow-md transition relative group"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-xs mt-2 truncate text-gray-600 dark:text-gray-300 px-1">
              {file.name}
            </p>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleView(file.url)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Voir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(file.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Supp
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}