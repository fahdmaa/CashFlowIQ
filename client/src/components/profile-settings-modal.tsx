import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProfilePictureUpload from "@/components/profile-picture-upload";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string | null;
  onImageUpdate: (newImageUrl: string | null) => void;
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  currentImageUrl,
  onImageUpdate
}: ProfileSettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl border-border/50 shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold">
            Profile Settings
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <ProfilePictureUpload
            currentImageUrl={currentImageUrl}
            onImageUpdate={onImageUpdate}
            size="lg"
            className="flex-col items-center space-x-0 space-y-4"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
