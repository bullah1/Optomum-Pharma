import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageTopBar from "@/components/PageTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
}

const ProfileEditPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          name: data.name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          address: data.address || "",
          date_of_birth: data.date_of_birth || "",
        });
      } else {
        setProfile((p) => ({ ...p, email: user.email || "" }));
      }

      // Load existing avatar
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(user.id, { limit: 1, sortBy: { column: "created_at", order: "desc" } });

      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(`${user.id}/${files[0].name}`);
        setAvatarUrl(urlData.publicUrl);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user, authLoading, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ছবি আপলোড করুন");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ২MB এর কম হতে হবে");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    // Remove old avatars
    const { data: oldFiles } = await supabase.storage.from("avatars").list(user.id);
    if (oldFiles && oldFiles.length > 0) {
      await supabase.storage.from("avatars").remove(oldFiles.map((f) => `${user.id}/${f.name}`));
    }

    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

    if (error) {
      toast.error("ছবি আপলোড করতে সমস্যা হয়েছে");
      console.error(error);
    } else {
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
      toast.success("প্রোফাইল ছবি আপডেট হয়েছে!");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      id: user.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || null,
      address: profile.address || null,
      date_of_birth: profile.date_of_birth || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    setSaving(false);

    if (error) {
      toast.error("প্রোফাইল সেভ করতে সমস্যা হয়েছে");
      console.error(error);
    } else {
      toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে!");
      navigate("/account");
    }
  };

  const initials = profile.name
    ? profile.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "U";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageTopBar title="Edit Profile" />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/account")} className="p-2 -ml-2 rounded-xl hover:bg-secondary/60 transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Edit Profile</h1>
        </div>

        {/* Avatar with upload */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="w-24 h-24 ring-2 ring-border">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Profile" className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">ছবি পরিবর্তন করতে ক্যামেরা আইকনে ট্যাপ করুন</p>

        {/* Form */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">নাম / Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="আপনার নাম লিখুন"
              className="rounded-2xl border-border bg-secondary/30 focus:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">ইমেইল / Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="rounded-2xl border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground/60">ইমেইল পরিবর্তন করা যায় না</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">ফোন / Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
              className="rounded-2xl border-border bg-secondary/30 focus:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dob" className="text-xs font-medium text-muted-foreground">জন্ম তারিখ / Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={profile.date_of_birth}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              className="rounded-2xl border-border bg-secondary/30 focus:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-medium text-muted-foreground">ঠিকানা / Address</Label>
            <Textarea
              id="address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন"
              rows={3}
              className="rounded-2xl border-border bg-secondary/30 focus:bg-background resize-none"
            />
          </div>
        </div>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving || !profile.name.trim()}
          className="w-full rounded-xl h-12 text-base font-semibold"
        >
          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
          {saving ? "সেভ হচ্ছে..." : "প্রোফাইল সেভ করুন"}
        </Button>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default ProfileEditPage;
