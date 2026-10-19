import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_CODE = "990990";
const BUCKET = "product-images";
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const ALLOWED_EXTENSIONS = new Set(["webp", "jpg", "jpeg", "png"]);

function decodeBase64(base64: string) {
  const normalized = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin_code, fileData, extension, contentType } = await req.json();

    if (admin_code !== ADMIN_CODE) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fileData || typeof fileData !== "string") {
      return new Response(JSON.stringify({ error: "Image data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedExtension = String(extension || "").toLowerCase();
    const normalizedType = String(contentType || "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(normalizedExtension) || !ALLOWED_TYPES.has(normalizedType)) {
      return new Response(JSON.stringify({ error: "Unsupported image format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = decodeBase64(fileData);
    const maxBytes = 8 * 1024 * 1024;

    if (bytes.byteLength === 0 || bytes.byteLength > maxBytes) {
      return new Response(JSON.stringify({ error: "Processed image is too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const path = `${Date.now()}-${crypto.randomUUID()}.${normalizedExtension}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: normalizedType,
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return new Response(JSON.stringify({ path, publicUrl: data.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Upload failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});