// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Razorpay from "https://esm.sh/razorpay@2.9.2?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Process Payment Function Loaded");

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

    // Initialize Razorpay credentials (or determine test mode)
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const envTestMode = Deno.env.get('RAZORPAY_TEST_MODE') === 'true';

    // Check settings table for enable_razorpay_test flag (fall back to env var)
    let dbTestMode = false;
    try {
      const { data: settingData } = await supabase.from('settings').select('value').eq('key', 'enable_razorpay_test').single();
      if (settingData && settingData.value) {
        const parsed = JSON.parse(settingData.value);
        dbTestMode = Boolean(parsed);
      }
    } catch (e) {
      console.warn('Could not read enable_razorpay_test setting:', e);
    }

    const testMode = envTestMode || dbTestMode;

    if (!testMode && (!keyId || !keySecret)) {
      console.error("Missing Razorpay credentials");
      throw new Error("Server configuration error: Missing Razorpay credentials");
    }

    const razorpay = testMode ? null : new Razorpay({
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

      if (testMode) {
        // Return a fake order for local / test environments
        const fakeOrder = {
          id: `order_test_${Date.now()}`,
          amount: options.amount,
          currency: options.currency,
          receipt: options.receipt,
          status: 'created'
        };
        return new Response(JSON.stringify({ ...fakeOrder, key_id: 'test' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const order = await razorpay.orders.create(options)
      return new Response(JSON.stringify({ ...order, key_id: keyId }), {
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

      // Verify Signature (skip verification if test mode)
      if (!testMode) {
        const body = razorpay_order_id + "|" + razorpay_payment_id

        const encoder = new TextEncoder();
        const keyData = encoder.encode(keySecret);
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const generated_signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        if (generated_signature !== razorpay_signature) {
          throw new Error('Invalid payment signature')
        }
      } else {
        console.log('Test mode active: skipping signature verification')
      }

      // Check or Create Profile
      const { email } = registrationData;
      let profileId;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingProfile) {
        profileId = existingProfile.id;
        // Optionally update profile details if needed
        await supabase.from('profiles').update({
          full_name: registrationData.fullName,
          phone: registrationData.phone,
          college: registrationData.college,
          education: registrationData.education,
          year: registrationData.year,
          branch: registrationData.branch,
        }).eq('id', profileId);
      } else {
        // Create new profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            full_name: registrationData.fullName,
            email: email,
            phone: registrationData.phone,
            college: registrationData.college,
            education: registrationData.education,
            year: registrationData.year,
            branch: registrationData.branch,
            // user_id is null for public registration
          })
          .select()
          .single();

        if (createProfileError) throw createProfileError;
        profileId = newProfile.id;
      }

      // Create Fest Registration (mark as pending for admin approval)
      const { data: festReg, error: festRegError } = await supabase
        .from('fest_registrations')
        .insert({
          profile_id: profileId,
          payment_status: 'pending',
          payment_proof_url: 'razorpay:' + razorpay_payment_id,
          registration_code: null
        })
        .select()
        .single();

      if (festRegError) throw festRegError;

      // Update Profile to reflect pending payment verification
      await supabase.from('profiles').update({
        is_fest_registered: false,
        fest_payment_status: 'pending'
      }).eq('id', profileId);

      // Notify user that payment was received and is pending verification
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-registration-email', {
          body: {
            to: email,
            type: 'fest_registration_received',
            data: {
              name: registrationData.fullName
            }
          }
        });
        if (emailError) console.error("Email function error:", emailError);
        else console.log("Payment received email sent successfully:", emailData);
      } catch (emailError) {
        console.error("Failed to invoke email function:", emailError);
      }

      return new Response(JSON.stringify({ success: true, message: 'Payment received and pending admin approval' }), {
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

      // Verify Signature (skip verification if test mode)
      if (!testMode) {
        const body = razorpay_order_id + "|" + razorpay_payment_id

        const encoder = new TextEncoder();
        const keyData = encoder.encode(keySecret);
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const generated_signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

        if (generated_signature !== razorpay_signature) {
          throw new Error('Invalid payment signature')
        }
      } else {
        console.log('Test mode active: skipping signature verification')
      }

      // Call RPC to register user
      const { eventName, ...rpcData } = registrationData;

      // Ensure p_payment_proof_url is null if not provided
      if (!rpcData.p_payment_proof_url) {
        rpcData.p_payment_proof_url = null;
      }

      const { data: result, error: rpcError } = await supabase.rpc('register_user_for_event', {
        ...rpcData,
        p_payment_id: razorpay_payment_id,
        p_payment_status: 'completed'
      });

      if (rpcError) throw rpcError;

      // Defensive: if RPC returned success:false, surface as an error
      if (result && (result as any).success === false) {
        throw new Error((result as any).message || 'Registration RPC reported failure');
      }

      // Trigger Email Function (Fire and Forget)
      console.log("Triggering email for:", rpcData.p_email);
      supabase.functions.invoke('send-registration-email', {
        body: {
          to: rpcData.p_email,
          type: 'registration_confirmation',
          data: {
            name: rpcData.p_full_name,
            eventName: eventName || 'Event',
          }
        }
      }).then(({ error }) => {
        if (error) console.error("Error sending email:", error);
        else console.log("Email trigger sent");
      });

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }



    throw new Error('Invalid action')

  } catch (error: any) {
    console.error("Error in process-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
