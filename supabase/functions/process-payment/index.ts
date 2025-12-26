// @ts-nocheck - Deno edge function with URL imports
/// <reference types="https://deno.land/x/types/deploy/stable/index.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Razorpay from "https://esm.sh/razorpay@2.9.2?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Deno global namespace declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface RpcResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

interface RegistrationData {
  email?: string;
  fullName?: string;
  phone?: string;
  college?: string;
  education?: string;
  year?: string;
  branch?: string;
  p_email?: string;
  p_full_name?: string;
  eventName?: string;
  p_payment_proof_url?: string | null;
  [key: string]: unknown;
}

interface CreateOrderData {
  amount: number;
  currency?: string;
}

interface PaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  registrationData: RegistrationData;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Process Payment Function Loaded");

serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] === NEW REQUEST ===`);
  console.log(`[${requestId}] Method: ${req.method}, URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...data } = await req.json() as { action: string; [key: string]: unknown }
    console.log(`[${requestId}] Received request: ${action}`);
    console.log(`[${requestId}] Data keys:`, Object.keys(data));

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] CRITICAL: Missing Supabase credentials`);
      console.error(`[${requestId}] SUPABASE_URL present: ${!!supabaseUrl}`);
      console.error(`[${requestId}] SUPABASE_SERVICE_ROLE_KEY present: ${!!supabaseKey}`);
      throw new Error("Server configuration error: Missing Supabase credentials");
    }
    console.log(`[${requestId}] Supabase client initialized successfully`);

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Initialize Razorpay credentials (or determine test mode)
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const envTestMode = Deno.env.get('RAZORPAY_TEST_MODE') === 'true';

    // Check settings table for enable_razorpay_test flag (fall back to env var)
    let dbTestMode = false;
    try {
      const { data: settingData, error: settingError } = await supabase.from('settings').select('value').eq('key', 'enable_razorpay_test').single();
      if (settingError) {
        console.warn(`[${requestId}] Could not read enable_razorpay_test setting:`, settingError);
      } else if (settingData && settingData.value) {
        const parsed = JSON.parse(settingData.value);
        dbTestMode = Boolean(parsed);
        console.log(`[${requestId}] DB test mode setting:`, dbTestMode);
      }
    } catch (e) {
      console.warn(`[${requestId}] Exception reading enable_razorpay_test setting:`, e);
    }

    const testMode = envTestMode || dbTestMode;
    console.log(`[${requestId}] Test Mode Active:`, testMode, `(env: ${envTestMode}, db: ${dbTestMode})`);

    if (!testMode && (!keyId || !keySecret)) {
      console.error(`[${requestId}] CRITICAL: Missing Razorpay credentials in production mode`);
      console.error(`[${requestId}] RAZORPAY_KEY_ID present: ${!!keyId}`);
      console.error(`[${requestId}] RAZORPAY_KEY_SECRET present: ${!!keySecret}`);
      throw new Error("Server configuration error: Missing Razorpay credentials");
    }
    console.log(`[${requestId}] Razorpay credentials verified`);

    const razorpay = testMode ? null : new Razorpay({
      key_id: keyId as string,
      key_secret: keySecret as string,
    })

    if (action === 'create_order') {
      console.log(`[${requestId}] Processing create_order action`);
      const { amount, currency = 'INR' } = data as unknown as CreateOrderData
      console.log(`[${requestId}] Order details - Amount: ${amount}, Currency: ${currency}`);

      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt: `rcpt_${Date.now()}`,
      }
      console.log(`[${requestId}] Order options:`, options);

      if (testMode) {
        console.log(`[${requestId}] Creating test order (test mode active)`);
        // Return a fake order for local / test environments
        const fakeOrder = {
          id: `order_test_${Date.now()}`,
          amount: options.amount,
          currency: options.currency,
          receipt: options.receipt,
          status: 'created'
        };
        console.log(`[${requestId}] Test order created:`, fakeOrder);
        return new Response(JSON.stringify({ ...fakeOrder, key_id: 'test' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[${requestId}] Creating Razorpay order...`);
      try {
        const order = await razorpay.orders.create(options)
        console.log(`[${requestId}] Razorpay order created successfully:`, order.id);
        return new Response(JSON.stringify({ ...order, key_id: keyId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (razorpayError: any) {
        console.error(`[${requestId}] Razorpay order creation failed:`, razorpayError);
        throw new Error(`Razorpay order creation failed: ${razorpayError?.message || razorpayError}`);
      }
    }

    if (action === 'verify_fest_payment') {
      console.log(`[${requestId}] Processing verify_fest_payment action`);
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        registrationData
      } = data as unknown as PaymentData
      console.log(`[${requestId}] Payment IDs - Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);
      console.log(`[${requestId}] Registration email:`, registrationData?.email);

      // Verify Signature (skip verification if test mode)
      if (!testMode) {
        console.log(`[${requestId}] Verifying payment signature...`);
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
      const { email = '' } = registrationData;
      let profileId;

      console.log(`[${requestId}] Checking for existing profile with email: ${email}`);
      // Check if profile exists
      const { data: existingProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (profileFetchError && profileFetchError.code !== 'PGRST116') {
        console.error(`[${requestId}] Error fetching profile:`, profileFetchError);
      }

      if (existingProfile) {
        profileId = existingProfile.id;
        console.log(`[${requestId}] Found existing profile: ${profileId}`);
        // Optionally update profile details if needed
        const { error: updateError } = await supabase.from('profiles').update({
          full_name: registrationData.fullName || '',
          phone: registrationData.phone || '',
          college: registrationData.college || '',
          education: registrationData.education || '',
          year: registrationData.year || '',
          branch: registrationData.branch || '',
        }).eq('id', profileId);
        
        if (updateError) {
          console.error(`[${requestId}] Error updating profile:`, updateError);
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }
        console.log(`[${requestId}] Profile updated successfully`);
      } else {
        console.log(`[${requestId}] Creating new profile...`);
        // Create new profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            full_name: registrationData.fullName || '',
            email: email,
            phone: registrationData.phone || '',
            college: registrationData.college || '',
            education: registrationData.education || '',
            year: registrationData.year || '',
            branch: registrationData.branch || '',
            // user_id is null for public registration
          })
          .select()
          .single();

        if (createProfileError) {
          console.error(`[${requestId}] Error creating profile:`, createProfileError);
          throw new Error(`Failed to create profile: ${createProfileError.message}`);
        }
        profileId = newProfile.id;
        console.log(`[${requestId}] New profile created: ${profileId}`);
      }

      // Create Fest Registration (mark as pending for admin approval)
      console.log(`[${requestId}] Creating fest registration for profile: ${profileId}`);
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

      if (festRegError) {
        console.error(`[${requestId}] Error creating fest registration:`, festRegError);
        throw new Error(`Failed to create fest registration: ${festRegError.message}`);
      }
      console.log(`[${requestId}] Fest registration created: ${festReg.id}`);

      // Update Profile to reflect pending payment verification
      console.log(`[${requestId}] Updating profile payment status to pending...`);
      const { error: statusUpdateError } = await supabase.from('profiles').update({
        is_fest_registered: false,
        fest_payment_status: 'pending'
      }).eq('id', profileId);
      
      if (statusUpdateError) {
        console.error(`[${requestId}] Error updating profile status:`, statusUpdateError);
        throw new Error(`Failed to update profile status: ${statusUpdateError.message}`);
      }
      console.log(`[${requestId}] Profile status updated successfully`);

      // Notify user that payment was received and is pending verification
      console.log(`[${requestId}] Sending fest registration email to: ${email}`);
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-registration-email', {
          body: {
            to: email,
            type: 'fest_registration_received',
            data: {
              name: registrationData.fullName || ''
            }
          }
        });
        if (emailError) {
          console.error(`[${requestId}] Email function error:`, emailError);
        } else {
          console.log(`[${requestId}] Payment received email sent successfully:`, emailData);
        }
      } catch (emailError) {
        console.error(`[${requestId}] Failed to invoke email function:`, emailError);
      }

      console.log(`[${requestId}] Fest payment verification completed successfully`);
      return new Response(JSON.stringify({ success: true, message: 'Payment received and pending admin approval' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'verify_payment') {
      console.log(`[${requestId}] Processing verify_payment action`);
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        registrationData
      } = data as unknown as PaymentData
      console.log(`[${requestId}] Event registration - Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);
      console.log(`[${requestId}] Registration email:`, registrationData?.p_email);

      // Verify Signature (skip verification if test mode)
      if (!testMode) {
        console.log(`[${requestId}] Verifying payment signature for event registration...`);
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
      const { eventName, ...rpcData } = registrationData as Required<RegistrationData>;

      // Ensure p_payment_proof_url is null if not provided
      if (!rpcData.p_payment_proof_url) {
        rpcData.p_payment_proof_url = null;
      }

      const rpcParams = {
        ...rpcData,
        p_payment_id: razorpay_payment_id,
        p_payment_status: 'completed'
      };
      console.log(`[${requestId}] Calling RPC register_user_for_event with:`, JSON.stringify(rpcParams, null, 2));

      const { data: result, error: rpcError } = await supabase.rpc('register_user_for_event', rpcParams);

      if (rpcError) {
        console.error(`[${requestId}] === RPC ERROR ===`);
        console.error(`[${requestId}] Error Message:`, rpcError.message);
        console.error(`[${requestId}] Error Code:`, rpcError.code);
        console.error(`[${requestId}] Error Details:`, rpcError.details);
        console.error(`[${requestId}] Error Hint:`, rpcError.hint);
        console.error(`[${requestId}] RPC Parameters:`, JSON.stringify(rpcParams, null, 2));
        console.error(`[${requestId}] ================`);
        
        // Check for specific RPC errors
        if (rpcError.message && rpcError.message.includes("function") && rpcError.message.includes("does not exist")) {
             throw new Error("Database function signature mismatch. Please contact admin.");
        }
        throw new Error(rpcError.message || 'Registration failed during database update');
      }
      console.log(`[${requestId}] RPC call successful, result:`, result);

      // Defensive: if RPC returned success:false, surface as an error
      if (result && (result as RpcResult).success === false) {
        console.error(`[${requestId}] RPC returned success=false:`, (result as RpcResult).message);
        throw new Error((result as RpcResult).message || 'Registration RPC reported failure');
      }

      // Trigger Email Function (Fire and Forget)
      console.log(`[${requestId}] Triggering event registration email for:`, rpcData.p_email);
      supabase.functions.invoke('send-registration-email', {
        body: {
          to: rpcData.p_email,
          type: 'registration_confirmation',
          data: {
            name: rpcData.p_full_name,
            eventName: eventName || 'Event',
          }
        }
      }).then(({ error }: { error: any }) => {
        if (error) console.error(`[${requestId}] Error sending event registration email:`, error);
        else console.log(`[${requestId}] Event registration email trigger sent successfully`);
      });

      console.log(`[${requestId}] Event payment verification completed successfully`);
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.error(`[${requestId}] Invalid action requested: ${action}`);
    throw new Error('Invalid action')

  } catch (error: unknown) {
    // Enhanced error logging with context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error("=== ERROR IN PROCESS-PAYMENT FUNCTION ===");
    console.error("Error Name:", errorName);
    console.error("Error Message:", errorMessage);
    console.error("Error Stack:", errorStack);
    console.error("Request URL:", req.url);
    console.error("Request Method:", req.method);
    console.error("Timestamp:", new Date().toISOString());
    
    // Log additional context if available
    try {
      const requestBody = await req.clone().text();
      console.error("Request Body (raw):", requestBody);
    } catch (bodyError) {
      console.error("Could not log request body:", bodyError);
    }
    
    console.error("==========================================");
    
    // Determine appropriate HTTP status code
    let statusCode = 400;
    if (errorMessage.includes('configuration error') || 
        errorMessage.includes('Missing') || 
        errorMessage.includes('does not exist')) {
      statusCode = 500; // Server configuration error
    } else if (errorMessage.includes('Invalid payment signature')) {
      statusCode = 401; // Unauthorized
    } else if (errorMessage.includes('Invalid action')) {
      statusCode = 400; // Bad request
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      errorType: errorName,
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
