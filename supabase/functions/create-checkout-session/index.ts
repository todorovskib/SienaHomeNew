const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  main_image_url: string | null;
  in_stock: boolean;
  is_published: boolean;
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
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

const encodeStripeForm = (values: Record<string, string | number>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    params.append(key, String(value));
  });
  return params;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const stripeSecretKey = getRequiredEnv('STRIPE_SECRET_KEY');
    const siteUrl = Deno.env.get('SITE_URL') ?? req.headers.get('origin') ?? 'http://localhost:5173';
    const currency = (Deno.env.get('CHECKOUT_CURRENCY') ?? 'mkd').toLowerCase();
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items as CheckoutItemInput[] : [];
    const language = typeof body.language === 'string' ? body.language : 'mk';
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId : null;

    const sanitizedItems = items
      .map((item) => ({
        productId: String(item.productId ?? ''),
        quantity: Math.min(Math.max(Number(item.quantity) || 1, 1), 99),
      }))
      .filter((item) => item.productId.length > 0);

    if (sanitizedItems.length === 0) {
      return jsonResponse({ error: 'No checkout items provided.' }, 400);
    }

    const productIds = [...new Set(sanitizedItems.map((item) => item.productId))];
    const productsResponse = await supabaseFetch(
      `products?select=id,name,slug,price,main_image_url,in_stock,is_published&id=in.(${productIds.join(',')})`,
    );

    if (!productsResponse.ok) {
      return jsonResponse({ error: 'Could not load products for checkout.' }, 500);
    }

    const products = await productsResponse.json() as ProductRow[];
    const productsById = new Map(products.map((product) => [product.id, product]));

    const checkoutItems = sanitizedItems.map((item) => {
      const product = productsById.get(item.productId);
      if (!product || !product.is_published || !product.in_stock || product.price <= 0) {
        throw new Error(`Product is not available for checkout: ${item.productId}`);
      }

      return {
        product,
        quantity: item.quantity,
        lineTotal: Number(product.price) * item.quantity,
      };
    });

    const amountTotal = checkoutItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const orderResponse = await supabaseFetch('checkout_orders?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        provider: 'stripe',
        status: 'pending',
        currency: currency.toUpperCase(),
        amount_total: amountTotal,
        analytics_visitor_id: visitorId,
        metadata: { language },
      }),
    });

    if (!orderResponse.ok) {
      return jsonResponse({ error: 'Could not create checkout order.' }, 500);
    }

    const [order] = await orderResponse.json();
    const orderId = order.id as string;

    await supabaseFetch('checkout_order_items', {
      method: 'POST',
      body: JSON.stringify(
        checkoutItems.map((item) => ({
          order_id: orderId,
          product_id: item.product.id,
          product_name: item.product.name,
          product_slug: item.product.slug,
          unit_price: item.product.price,
          quantity: item.quantity,
          line_total: item.lineTotal,
        })),
      ),
    });

    const stripeBody: Record<string, string | number> = {
      mode: 'payment',
      success_url: `${siteUrl}/${language}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${language}/products?checkout=cancelled`,
      'metadata[order_id]': orderId,
    };

    checkoutItems.forEach((item, index) => {
      stripeBody[`line_items[${index}][price_data][currency]`] = currency;
      stripeBody[`line_items[${index}][price_data][product_data][name]`] = item.product.name;
      stripeBody[`line_items[${index}][price_data][unit_amount]`] = Math.round(Number(item.product.price) * 100);
      stripeBody[`line_items[${index}][quantity]`] = item.quantity;

      if (item.product.main_image_url) {
        stripeBody[`line_items[${index}][price_data][product_data][images][0]`] = item.product.main_image_url;
      }
    });

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encodeStripeForm(stripeBody),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok || !session.url) {
      return jsonResponse({ error: session.error?.message ?? 'Could not create payment session.' }, 500);
    }

    await supabaseFetch(`checkout_orders?id=eq.${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        provider_session_id: session.id,
        checkout_url: session.url,
        updated_at: new Date().toISOString(),
      }),
    });

    return jsonResponse({ url: session.url, orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed.';
    return jsonResponse({ error: message }, 500);
  }
});
