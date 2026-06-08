const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required secret: ${key}`);
  }
  return value;
};

const supabaseFetch = async (
  path: string,
  options: RequestInit = {},
) => {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL');
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const safeCompare = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

const verifyStripeSignature = async (rawBody: string, signatureHeader: string | null, secret: string) => {
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(',').map((part) => part.split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expectedSignature = toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));

  return signatures.some((signature) => safeCompare(signature, expectedSignature));
};

const updateOrder = async (orderId: string, updates: Record<string, unknown>) =>
  supabaseFetch(`checkout_orders?id=eq.${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...updates,
      updated_at: new Date().toISOString(),
    }),
  });

const getOrder = async (orderId: string) => {
  const response = await supabaseFetch(`checkout_orders?select=*&id=eq.${orderId}&limit=1`);
  if (!response.ok) {
    return null;
  }

  const orders = await response.json();
  return Array.isArray(orders) ? orders[0] : null;
};

const insertAnalyticsEvent = async (event: Record<string, unknown>) =>
  supabaseFetch('analytics_events', {
    method: 'POST',
    body: JSON.stringify(event),
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET');
    const rawBody = await req.text();
    const isVerified = await verifyStripeSignature(rawBody, req.headers.get('Stripe-Signature'), webhookSecret);

    if (!isVerified) {
      return jsonResponse({ error: 'Invalid Stripe signature.' }, 400);
    }

    const event = JSON.parse(rawBody);
    const stripeObject = event.data?.object ?? {};
    const orderId = stripeObject.metadata?.order_id;

    if (!orderId) {
      return jsonResponse({ received: true, ignored: 'Missing order_id metadata.' });
    }

    const order = await getOrder(orderId);
    const visitorId = order?.analytics_visitor_id || `checkout-${orderId}`;
    const amountTotal = typeof stripeObject.amount_total === 'number'
      ? stripeObject.amount_total / 100
      : Number(order?.amount_total ?? 0);
    const currency = typeof stripeObject.currency === 'string'
      ? stripeObject.currency.toUpperCase()
      : order?.currency;
    const customerEmail = stripeObject.customer_details?.email ?? stripeObject.customer_email ?? order?.customer_email ?? null;

    if (event.type === 'checkout.session.completed') {
      await updateOrder(orderId, {
        status: 'paid',
        provider_session_id: stripeObject.id,
        amount_total: amountTotal,
        currency,
        customer_email: customerEmail,
        metadata: {
          ...(order?.metadata ?? {}),
          stripe_event_id: event.id,
          payment_status: stripeObject.payment_status,
        },
      });

      await insertAnalyticsEvent({
        visitor_id: visitorId,
        session_id: stripeObject.id,
        event_name: 'purchase_completed',
        event_value: amountTotal,
        entity_type: 'checkout',
        entity_id: orderId,
        metadata: {
          provider: 'stripe',
          provider_session_id: stripeObject.id,
          currency,
          customer_email: customerEmail,
          payment_status: stripeObject.payment_status,
          stripe_event_id: event.id,
        },
      });
    }

    if (event.type === 'checkout.session.expired') {
      await updateOrder(orderId, {
        status: 'cancelled',
        provider_session_id: stripeObject.id,
        metadata: {
          ...(order?.metadata ?? {}),
          stripe_event_id: event.id,
        },
      });

      await insertAnalyticsEvent({
        visitor_id: visitorId,
        session_id: stripeObject.id,
        event_name: 'checkout_expired',
        entity_type: 'checkout',
        entity_id: orderId,
        metadata: {
          provider: 'stripe',
          provider_session_id: stripeObject.id,
          stripe_event_id: event.id,
        },
      });
    }

    return jsonResponse({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook failed.';
    return jsonResponse({ error: message }, 500);
  }
});
