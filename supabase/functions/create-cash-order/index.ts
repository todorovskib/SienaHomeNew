const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

interface CheckoutCustomerInput {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
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

const sanitizeText = (value: unknown, maxLength = 500) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const currency = (Deno.env.get('CHECKOUT_CURRENCY') ?? 'mkd').toUpperCase();
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items as CheckoutItemInput[] : [];
    const language = typeof body.language === 'string' ? body.language : 'mk';
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId : null;
    const customerInput = (body.customer ?? {}) as CheckoutCustomerInput;
    const customer = {
      fullName: sanitizeText(customerInput.fullName, 120),
      email: sanitizeText(customerInput.email, 160),
      phone: sanitizeText(customerInput.phone, 80),
      address: sanitizeText(customerInput.address, 240),
      city: sanitizeText(customerInput.city, 120),
      postalCode: sanitizeText(customerInput.postalCode, 40),
      notes: sanitizeText(customerInput.notes, 800),
    };

    if (!customer.fullName || !customer.phone || !customer.address || !customer.city) {
      return jsonResponse({ error: 'Missing required delivery information.' }, 400);
    }

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
      `products?select=id,name,slug,price,in_stock,is_published&id=in.(${productIds.join(',')})`,
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
        provider: 'cash_on_delivery',
        status: 'pending',
        currency,
        amount_total: amountTotal,
        analytics_visitor_id: visitorId,
        customer_email: customer.email || null,
        metadata: {
          language,
          customer,
          payment_method: 'cash_on_delivery',
        },
      }),
    });

    if (!orderResponse.ok) {
      return jsonResponse({ error: 'Could not create pay-on-door order.' }, 500);
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

    await supabaseFetch('analytics_events', {
      method: 'POST',
      body: JSON.stringify({
        visitor_id: visitorId || `cash-${orderId}`,
        event_name: 'pay_on_door_order_created',
        event_value: amountTotal,
        entity_type: 'checkout',
        entity_id: orderId,
        metadata: {
          payment_method: 'cash_on_delivery',
          customer_email: customer.email || null,
          language,
        },
      }),
    });

    return jsonResponse({ orderId, amountTotal, currency });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pay-on-door order failed.';
    return jsonResponse({ error: message }, 500);
  }
});
