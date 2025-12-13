import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.10";

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

        // Using secrets from Supabase Dashboard
        const SMTP_EMAIL = Deno.env.get("SMTP_EMAIL");
        const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

        if (!SMTP_EMAIL || !SMTP_PASSWORD) {
            throw new Error("SMTP credentials not configured in Supabase Secrets");
        }

        // Create Nodemailer Transporter with explicit settings
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // use SSL
            auth: {
                user: SMTP_EMAIL,
                pass: SMTP_PASSWORD,
            },
        });

        // Verify connection configuration
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) {
                    console.error("SMTP Connection Error:", error);
                    reject(error);
                } else {
                    console.log("SMTP Server is ready to take our messages");
                    resolve(success);
                }
            });
        });

        switch (type) {
            case "registration_confirmation":
                subject = `Registration Confirmed: ${data.eventName}`;
                htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h1 style="color: #dc2626; text-align: center;">Welcome to KAIZEN!</h1>
            <p>Hi ${data.name},</p>
            <p>You have successfully registered for <strong>${data.eventName}</strong>.</p>
            <p>We look forward to seeing you there!</p>
          </div>
        `;
                break;
            case "payment_update":
                if (data.paymentStatus?.toLowerCase() === 'completed') {
                    subject = `Payment Verified - Registration Confirmed for ${data.eventName}`;
                    htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h1 style="color: #16a34a; text-align: center;">Payment Verified!</h1>
                <p>Hi <strong>${data.name}</strong>,</p>
                <p>Congratulations! Your payment for <strong>${data.eventName}</strong> has been successfully verified.</p>
                
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a;">
                    <h3 style="margin-top: 0; color: #166534;">Your QR Code Ticket is Ready</h3>
                    <p style="margin-bottom: 0;">You can now access your entry pass on our website.</p>
                </div>

                <h3>How to access your QR Code:</h3>
                <ol>
                    <li>Visit <a href="https://www.kaizen-ritp.in" style="color: #dc2626; text-decoration: none;">www.kaizen-ritp.in</a></li>
                    <li>Login with your registered email</li>
                    <li>Go to your <strong>Profile / Dashboard</strong></li>
                    <li>Click on <strong>"My Events"</strong> to view your QR Pass</li>
                </ol>
                
                <p style="margin-top: 30px; font-size: 12px; color: #666;">If you have any questions, please reply to this email.</p>
              </div>
            `;
                } else {
                    subject = `Payment Status Update: ${data.eventName}`;
                    htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h1>Payment Update</h1>
                <p>Hi ${data.name},</p>
                <p>Your payment for <strong>${data.eventName}</strong> has been marked as <strong>${data.paymentStatus}</strong>.</p>
              </div>
            `;
                }
                break;
            default:
                subject = "Notification from KAIZEN";
                htmlContent = `<p>${data.message}</p>`;
        }

        // Send Email
        const info = await transporter.sendMail({
            from: `"KAIZEN Admin" <${SMTP_EMAIL}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });

        console.log("Email sent:", info.messageId);

        return new Response(JSON.stringify({ success: true, id: info.messageId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
};

serve(handler);
