// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Razorpay from "https://esm.sh/razorpay@2.9.2?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Payment Process Function Loaded");

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...data } = await req.json()
    console.log(`Received request: ${action}`);

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      throw new Error("Server configuration error: Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Initialize Razorpay
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    console.log("Razorpay Config Check:", { 
      hasKeyId: !!keyId, 
      hasKeySecret: !!keySecret 
    });

    if (!keyId || !keySecret) {
      console.error("Missing Razorpay credentials");
      throw new Error("Server configuration error: Missing Razorpay credentials");
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    if (action === 'create_order') {
      const { amount, currency = 'INR' } = data
      
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt: `rcpt_${Date.now()}`,
      }

      const order = await razorpay.orders.create(options)
      return new Response(JSON.stringify(order), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'verify_payment') {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        registrationData 
      } = data

      // Verify Signature
      const body = razorpay_order_id + "|" + razorpay_payment_id
      
      const encoder = new TextEncoder();
      const keyData = encoder.encode(Deno.env.get('RAZORPAY_KEY_SECRET')!);
      const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const generated_signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      if (generated_signature !== razorpay_signature) {
        throw new Error('Invalid payment signature')
      }

      // Call RPC to register user
      // We extract eventName for email, but don't pass it to RPC
      const { eventName, ...rpcData } = registrationData;

      const { data: result, error: rpcError } = await supabase.rpc('register_user_for_event', {
        ...rpcData,
        p_payment_id: razorpay_payment_id,
        p_payment_status: 'completed'
      });

      if (rpcError) throw rpcError;
      
      // Send Email
      await supabase.functions.invoke('send-registration-email', {
        body: {
          to: rpcData.p_email,
          type: 'registration_confirmation',
          data: {
            name: rpcData.p_full_name,
            eventName: eventName || 'Event',
          }
        }
      })

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'verify_fest_payment') {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        registrationData 
      } = data

      // Verify Signature
      const body = razorpay_order_id + "|" + razorpay_payment_id
      
      const encoder = new TextEncoder();
      const keyData = encoder.encode(Deno.env.get('RAZORPAY_KEY_SECRET')!);
      const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const generated_signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      if (generated_signature !== razorpay_signature) {
        throw new Error('Invalid payment signature')
      }

      // Generate Fest Code
      const festCode = `KZN-${Math.floor(100000 + Math.random() * 900000)}`;

      // Update Profile
      // We use upsert to ensure profile exists or update it
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          email: registrationData.email,
          full_name: registrationData.fullName,
          phone: registrationData.phone,
          college: registrationData.college,
          year: registrationData.year,
          branch: registrationData.branch,
          education: registrationData.education,
          fest_payment_status: 'completed',
          fest_payment_id: razorpay_payment_id,
          is_fest_registered: true,
          fest_registration_code: festCode
        }, { onConflict: 'email' })
        .select()
        .single();

      if (profileError) throw profileError;

      // Send Email
      await supabase.functions.invoke('send-registration-email', {
        body: {
          to: registrationData.email,
          type: 'fest_code_approval',
          data: {
            name: registrationData.fullName,
            festCode: festCode
          }
        }
      })

      return new Response(JSON.stringify({ success: true, festCode }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action')

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

