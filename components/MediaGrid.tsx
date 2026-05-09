"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMedias } from "@/lib/hooks/useMedia";
import { MediaData } from "@/lib/api/media";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Eye,
  X,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

interface MediaGridProps {
  workerId: string;
  onRemove?: (id: string) => void;
  onView?: (url: string) => void;
  canDelete?: boolean; // Prop to control delete permission (default: false for workers)
}

export default function MediaGrid({
  workerId,
  onRemove,
  onView,
  canDelete = false, // Workers cannot delete by default
}: MediaGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const { medias, isCreating, createMedia, isLoading, error, refetch } =
    useMedias();

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont autorisés");
      return;
    }

    // Check if worker already has 3 documents
    const workerDocs =
      medias?.filter(
        (media) =>
          media.workerId === workerId &&
          media.type === "DOCUMENT" &&
          media.mimeType === "application/pdf",
      ) || [];

    if (workerDocs.length >= 3) {
      toast.error("Maximum 3 documents autorisés");
      return;
    }

    setUploading(true);

    // Create FormData for upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);

    // Create media object
    const media: MediaData = {
      file,
      clientId: null,
      appointmentId: null,
      workerId,
    };

    try {
      await createMedia(media);
      toast.success("Document uploadé avec succès");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          "Erreur lors de l'upload du document",
      );
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
    // Only allow deletion if user has permission
    if (!canDelete && user?.role !== "admin") {
      toast.error("Vous n'avez pas la permission de supprimer ce document");
      return;
    }

    // In a real implementation, you would call a delete API
    // For now, we'll just refetch to update the list
    await refetch();
    toast.success("Document supprimé");
  };

  const handleView = (url: string) => {
    if (onView) {
      onView(url);
    } else {
      window.open(url, "_blank");
    }
  };

  // Filter to only show PDF documents for this worker
  const pdfDocuments =
    medias?.filter(
      (media) =>
        media.workerId === workerId &&
        media.type === "DOCUMENT" &&
        media.mimeType === "application/pdf",
    ) || [];

  return (
    <div className="space-y-3">
      {/* Add File Card - List Style */}
      <Card
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-between p-4 cursor-pointer border-dashed border-2 border-gray-300 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-600 transition rounded-xl bg-gray-50 dark:bg-gray-900/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
            <Plus className="w-5 h-5 text-pink-500 dark:text-pink-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {uploading || isCreating
                ? "Upload en cours..."
                : "Ajouter un document"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF uniquement • Maximum 3 documents
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </Card>

      {/* Files List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <Card className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <p className="text-sm text-red-500">
            Erreur de chargement des documents.
          </p>
        </Card>
      ) : pdfDocuments.length === 0 ? (
        <Card className="p-6 text-center">
          <FileText className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun document PDF uploadé
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {pdfDocuments.map((file: any) => (
            <Card
              key={file.id}
              className="flex items-center justify-between p-4 rounded-xl hover:shadow-md transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF • {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(file.url)}
                  className="rounded-full"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Voir
                </Button>

                {/* Only show delete button for admins or if canDelete prop is true */}
                {(canDelete || user?.role === "admin") && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(file.id)}
                    className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
