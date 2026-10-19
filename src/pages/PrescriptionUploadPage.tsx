import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, X, ArrowLeft, Image, Loader2, CheckCircle2 } from "lucide-react";
import PageTopBar from "@/components/PageTopBar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

const PrescriptionUploadPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to upload prescriptions");
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Only images are allowed");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setSuccess(false);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from("prescriptions")
        .upload(filePath, file);
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from("prescriptions")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("prescriptions").insert({
        user_id: user.id,
        image_url: filePath,
        notes: notes || null,
      });
      if (dbError) throw dbError;

      setSuccess(true);
      toast.success("Prescription uploaded successfully!");
      setFile(null);
      setPreview(null);
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <PageTopBar title="Upload Prescription" />
      <main className="container py-4 max-w-lg mx-auto space-y-4">

        <div className="bg-card rounded-xl border border-border p-5 sm:p-7 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Upload Prescription</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your prescription image and we'll deliver your medicines quickly.
            </p>
          </div>

          {success && (
            <div className="flex items-center gap-2 bg-success/10 text-success rounded-xl p-4 text-sm font-medium">
              <CheckCircle2 size={18} />
              Prescription submitted successfully! We'll contact you soon.
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {!preview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-primary/30 rounded-xl py-12 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="text-primary" size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Upload Image</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG — Max 5MB</p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={preview} alt="Prescription preview" className="w-full max-h-80 object-contain bg-secondary/30" />
              <button
                onClick={removeFile}
                className="absolute top-3 right-3 bg-destructive text-destructive-foreground rounded-xl p-1.5"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Note (Optional)
            </label>
            <textarea
              placeholder="Any additional info, e.g. medicine quantity, delivery address..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder:text-muted-foreground/50"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Uploading...
              </>
            ) : (
              <>
                <Image size={18} />
                Submit Prescription
              </>
            )}
          </button>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default PrescriptionUploadPage;
