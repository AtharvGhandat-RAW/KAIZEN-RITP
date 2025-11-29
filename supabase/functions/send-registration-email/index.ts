import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    type: "registration_confirmation" | "payment_update" | "general_notification";
    data: {
        name: string;
        eventName?: string;
        paymentStatus?: string;
        message?: string;
    };
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { to, type, data }: EmailRequest = await req.json();

        let subject = "";
        let htmlContent = "";

        switch (type) {
            case "registration_confirmation":
                subject = `Registration Confirmed: ${data.eventName}`;
                htmlContent = `
          <h1>Welcome to KAIZEN!</h1>
          <p>Hi ${data.name},</p>
          <p>You have successfully registered for <strong>${data.eventName}</strong>.</p>
          <p>We look forward to seeing you there!</p>
        `;
                break;
            case "payment_update":
                subject = `Payment Status Update: ${data.eventName}`;
                htmlContent = `
          <h1>Payment Update</h1>
          <p>Hi ${data.name},</p>
          <p>Your payment for <strong>${data.eventName}</strong> has been marked as <strong>${data.paymentStatus}</strong>.</p>
        `;
                break;
            default:
                subject = "Notification from KAIZEN";
                htmlContent = `<p>${data.message}</p>`;
        }

        // Example using Resend (Preferred for Supabase)
        if (RESEND_API_KEY) {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "KAIZEN <onboarding@resend.dev>", // Update this with your verified domain
                    to: [to],
                    subject: subject,
                    html: htmlContent,
                }),
            });

            const responseData = await res.json();
            return new Response(JSON.stringify(responseData), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: res.status,
            });
        }

        // Example using Brevo (formerly Sendinblue)
        if (BREVO_API_KEY) {
            const res = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": BREVO_API_KEY,
                },
                body: JSON.stringify({
                    sender: { name: "KAIZEN Team", email: "no-reply@kaizen-ritp.com" }, // Update this
                    to: [{ email: to, name: data.name }],
                    subject: subject,
                    htmlContent: htmlContent,
                }),
            });

            const responseData = await res.json();
            return new Response(JSON.stringify(responseData), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: res.status,
            });
        }

        // Mock response if no API key is configured (for development)
        console.log("Mock Email Sent:", { to, subject });
        return new Response(
            JSON.stringify({ message: "Email mocked (no API key configured)", to, subject }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
};

serve(handler);
