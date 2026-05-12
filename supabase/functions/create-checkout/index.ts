// Edge Function : crée une Stripe Checkout Session pour une mission Swiple
// Deploy : supabase functions deploy create-checkout
// Secret  : supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx

import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
});

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, amount, missionTitle, clientEmail } = await req.json();

    if (!orderId || !amount) {
      return Response.json({ error: 'orderId et amount requis' }, { status: 400, headers: corsHeaders });
    }

    // Frais de service 10%
    const totalCents = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name:        missionTitle ?? 'Mission Swiple',
            description: 'Paiement sécurisé — libéré à la validation de la livraison',
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      mode:               'payment',
      customer_email:     clientEmail ?? undefined,
      // Redirige vers une page de confirmation simple après paiement
      success_url:        'https://swiple.app/payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:         'https://swiple.app/payment/cancel',
      metadata:           { orderId },
      payment_intent_data: {
        metadata: { orderId },
        description: `Mission Swiple — ${missionTitle ?? orderId}`,
      },
    });

    return Response.json(
      { url: session.url, sessionId: session.id },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error('[create-checkout]', err);
    return Response.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
});
