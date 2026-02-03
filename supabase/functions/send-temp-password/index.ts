import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      console.error("Missing email in request");
      return new Response(
        JSON.stringify({ error: "Email richiesta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing password reset for email: ${email}`);

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      return new Response(
        JSON.stringify({ error: "Errore durante la ricerca dell'utente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log(`User not found for email: ${email}`);
      // Return success anyway to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true, message: "Se l'email esiste, riceverai le credenziali" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    console.log(`Generated temp password for user: ${user.id}`);

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Errore durante l'aggiornamento della password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Password updated successfully for user: ${user.id}`);

    // Send email with Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { error: emailError } = await resend.emails.send({
      from: "DialRoad <onboarding@resend.dev>",
      to: [email],
      subject: "Le tue credenziali di accesso - DialRoad",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d; text-align: center;">DialRoad</h1>
          <div style="background: #f7fafc; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <h2 style="color: #2d3748; margin-top: 0;">Ecco le tue credenziali di accesso</h2>
            <p style="color: #4a5568;">Utilizza queste credenziali per accedere all'app:</p>
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 16px; margin: 16px 0;">
              <p style="margin: 8px 0;"><strong>Username (Email):</strong></p>
              <p style="color: #3182ce; font-size: 16px; margin: 4px 0 16px 0;">${email}</p>
              <p style="margin: 8px 0;"><strong>Password temporanea:</strong></p>
              <p style="color: #3182ce; font-size: 18px; font-family: monospace; margin: 4px 0;">${tempPassword}</p>
            </div>
            <p style="color: #e53e3e; font-size: 14px;">
              ⚠️ <strong>Importante:</strong> Ti consigliamo di cambiare la password dopo il primo accesso.
            </p>
          </div>
          <p style="color: #718096; font-size: 12px; text-align: center;">
            Se non hai richiesto queste credenziali, ignora questa email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: "Errore durante l'invio dell'email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Email sent successfully to: ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Credenziali inviate via email" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Errore interno del server" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
