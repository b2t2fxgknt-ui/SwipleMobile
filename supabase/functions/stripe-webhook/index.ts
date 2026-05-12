// Edge Function : reçoit les webhooks Stripe et met à jour les orders
// Deploy   : supabase functions deploy stripe-webhook
// Secrets  : supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
//            supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
// Dans Stripe Dashboard → Webhooks → ajouter endpoint :
//   https://<ref>.supabase.co/functions/v1/stripe-webhook
//   Événements à écouter : checkout.session.completed, payment_intent.payment_failed

import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')        ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body      = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    );
  } catch (err) {
    console.error('[stripe-webhook] signature invalide:', err.message);
    return new Response('Signature invalide', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status:     'paid',
          stripe_session_id:  session.id,
          stripe_payment_intent: session.payment_intent as string ?? null,
        })
        .eq('id', orderId);

      if (error) {
        console.error('[stripe-webhook] update order error:', error.message);
        return new Response('DB error', { status: 500 });
      }
      console.log('[stripe-webhook] order payé:', orderId);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent  = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
