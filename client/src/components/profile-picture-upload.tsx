import { useState, useRef } from "react";
import { User, Camera, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadProfilePicture, deleteProfilePicture } from "@/lib/supabase-direct";
import { useToast } from "@/hooks/use-toast";

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate: (newImageUrl: string | null) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ProfilePictureUpload({ 
  currentImageUrl, 
  onImageUpdate, 
  size = "md",
  className = "" 
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-6 w-6"
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadProfilePicture(file);
      onImageUpdate(result.url);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProfilePicture();
      onImageUpdate(null);
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete profile picture",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="relative group">
        <div className={`${sizeClasses[size]} bg-muted rounded-full flex items-center justify-center overflow-hidden transition-all hover:scale-105 cursor-pointer border-2 border-border`}>
          {currentImageUrl ? (
            <img 
              src={currentImageUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={`${iconSizes[size]} text-muted-foreground`} />
          )}
        </div>
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className={`${iconSizes[size]} text-white`} />
        </div>
      </div>

      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size={size === "lg" ? "default" : "sm"}
          onClick={triggerFileSelect}
          disabled={isUploading || isDeleting}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          {isUploading ? "Uploading..." : "Change"}
        </Button>
        
        {currentImageUrl && (
          <Button 
            variant="outline" 
            size={size === "lg" ? "default" : "sm"}
            onClick={handleDelete}
            disabled={isUploading || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isDeleting ? "Removing..." : "Remove"}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}