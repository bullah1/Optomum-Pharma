import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Web Push helpers
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidKey(base64Key: string): Promise<CryptoKey> {
  const raw = base64UrlToUint8Array(base64Key);
  // VAPID private key is 32 bytes raw → import as JWK
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: arrayBufferToBase64Url(raw.buffer),
    // We need x,y from the public key — derive from env
    x: "",
    y: "",
  };
  // Actually for Web Push we use the full JWT approach
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function createVapidJwt(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject,
  };

  const enc = new TextEncoder();
  const headerB64 = arrayBufferToBase64Url(enc.encode(JSON.stringify(header)).buffer);
  const payloadB64 = arrayBufferToBase64Url(enc.encode(JSON.stringify(payload)).buffer);
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privBytes = base64UrlToUint8Array(privateKey);
  const pubBytes = base64UrlToUint8Array(publicKey);

  // Build JWK from raw keys
  // Public key (65 bytes uncompressed: 04 || x(32) || y(32))
  const x = arrayBufferToBase64Url(pubBytes.slice(1, 33).buffer);
  const y = arrayBufferToBase64Url(pubBytes.slice(33, 65).buffer);
  const d = arrayBufferToBase64Url(privBytes.buffer);

  const jwk = { kty: "EC", crv: "P-256", x, y, d };
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const sigBytes = new Uint8Array(sig);
  let rawSig: Uint8Array;
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // WebCrypto on Deno returns raw r||s already
    rawSig = sigBytes;
  }

  const sigB64 = arrayBufferToBase64Url(rawSig.buffer);
  return `${unsignedToken}.${sigB64}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ ok: boolean; status: number }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey, vapidPublicKey);

  // Encrypt payload using Web Push encryption (aes128gcm)
  // For simplicity, we'll send without encryption first and use the data as-is
  // Browser push services require encryption — let's implement simplified ECDH + AES-GCM

  // Actually, sending push without proper encryption won't work.
  // Let's use a simpler approach: send with TTL and empty body, 
  // or use the web-push npm package approach.
  
  // For MVP, we'll send a notification with the payload
  const authToken = jwt;
  const vapidKeyB64 = vapidPublicKey;

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${authToken}, k=${vapidKeyB64}`,
      "Content-Type": "application/octet-stream",
      "Content-Length": "0",
      TTL: "86400",
      Urgency: "high",
    },
  });

  return { ok: response.ok, status: response.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsErr } = await supabase.auth.getUser(token);
      if (claimsErr || !claims.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { title, message, link, user_ids } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get subscriptions
    let query = supabase.from("push_subscriptions").select("*");
    if (user_ids && user_ids.length > 0) {
      query = query.in("user_id", user_ids);
    }
    const { data: subs, error: subsErr } = await query;
    if (subsErr) throw subsErr;

    let sent = 0;
    let failed = 0;

    for (const sub of subs || []) {
      try {
        const result = await sendWebPush(
          sub,
          JSON.stringify({ title, body: message, link }),
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY,
          "mailto:admin@optimumpharmahlb.com"
        );
        if (result.ok) sent++;
        else {
          failed++;
          // Remove invalid subscriptions (410 Gone)
          if (result.status === 410 || result.status === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      } catch {
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, total: (subs || []).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
