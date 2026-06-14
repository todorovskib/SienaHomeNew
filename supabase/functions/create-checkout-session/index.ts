const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CheckoutItemInput {
  productId: string;
  quantity: number;
  selectedOptions?: SelectedOptionsInput;
}

interface SelectedOptionsInput {
  color?: {
    name?: string;
    value?: string;
  };
  dimensionOption?: {
    id?: string;
    label?: string;
    width?: number;
    height?: number;
  };
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
  main_image_url: string | null;
  colors: unknown;
  dimensions: unknown;
  in_stock: boolean;
  is_published: boolean;
}

interface ProductColor {
  name: string;
  value: string;
}

interface ProductDimensionOption {
  id: string;
  label: string;
  width: number;
  height: number;
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

const sanitizeText = (value: unknown, maxLength = 500) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const defaultProductColors: ProductColor[] = [
  { name: 'Black', value: '#111111' },
  { name: 'White', value: '#ffffff' },
  { name: 'Gray', value: '#808080' },
  { name: 'Red', value: '#b91c1c' },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toSafeNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const normalizeOptionId = (label: string, index: number) => {
  const normalized = label
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `option-${index + 1}`;
};

const getBaseDimensions = (value: unknown) => ({
  width: isRecord(value) ? toSafeNumber(value.width, 55) : 55,
  height: isRecord(value) ? toSafeNumber(value.height, 55) : 55,
});

const getDefaultDimensionOptions = (dimensions: unknown): ProductDimensionOption[] => {
  const base = getBaseDimensions(dimensions);
  return [
    { id: 'standard', label: 'Standard', width: base.width, height: base.height },
    { id: 'large', label: 'Large', width: base.width + 10, height: base.height },
  ];
};

const normalizeProductColors = (value: unknown): ProductColor[] => {
  if (!Array.isArray(value)) {
    return defaultProductColors;
  }

  const parsed = value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }
      const name = sanitizeText(item.name, 60);
      const colorValue = sanitizeText(item.value, 40);
      return name && colorValue ? { name, value: colorValue } : null;
    })
    .filter((item): item is ProductColor => item !== null);

  if (parsed.length === 0) {
    return defaultProductColors;
  }

  if (parsed.length >= defaultProductColors.length) {
    return parsed;
  }

  const existing = new Set(parsed.map((color) => color.name.toLowerCase()));
  return [
    ...parsed,
    ...defaultProductColors.filter((color) => !existing.has(color.name.toLowerCase())),
  ].slice(0, defaultProductColors.length);
};

const normalizeDimensionOptions = (dimensions: unknown): ProductDimensionOption[] => {
  const fallback = getDefaultDimensionOptions(dimensions);
  const optionsValue = isRecord(dimensions) ? dimensions.options : undefined;
  if (!Array.isArray(optionsValue)) {
    return fallback;
  }

  const parsed = optionsValue
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }
      const label = sanitizeText(item.label, 80) || `Option ${index + 1}`;
      const width = toSafeNumber(item.width, 0);
      const height = toSafeNumber(item.height, 0);
      if (width <= 0 || height <= 0) {
        return null;
      }
      return {
        id: sanitizeText(item.id, 80) || normalizeOptionId(label, index),
        label,
        width,
        height,
      };
    })
    .filter((item): item is ProductDimensionOption => item !== null)
    .slice(0, 2);

  if (parsed.length === 0) {
    return fallback;
  }
  if (parsed.length === 1) {
    return [parsed[0], fallback[1]];
  }
  return parsed;
};

const resolveSelectedOptions = (product: ProductRow, selectedOptions?: SelectedOptionsInput) => {
  const colors = normalizeProductColors(product.colors);
  const dimensions = normalizeDimensionOptions(product.dimensions);
  const requestedColor = selectedOptions?.color;
  const requestedDimension = selectedOptions?.dimensionOption;

  const color = requestedColor
    ? colors.find((item) =>
      item.name.toLowerCase() === String(requestedColor.name ?? '').toLowerCase() ||
      item.value.toLowerCase() === String(requestedColor.value ?? '').toLowerCase()
    )
    : colors[0];

  if (!color) {
    throw new Error(`Selected color is not available for product: ${product.id}`);
  }

  const dimensionOption = requestedDimension
    ? dimensions.find((item) =>
      item.id === requestedDimension.id ||
      (item.width === Number(requestedDimension.width) && item.height === Number(requestedDimension.height))
    )
    : dimensions[0];

  if (!dimensionOption) {
    throw new Error(`Selected dimensions are not available for product: ${product.id}`);
  }

  return { color, dimensionOption };
};

const formatProductNameWithOptions = (
  productName: string,
  selectedOptions: { color: ProductColor; dimensionOption: ProductDimensionOption },
) =>
  `${productName} - ${selectedOptions.color.name}, ${selectedOptions.dimensionOption.width}x${selectedOptions.dimensionOption.height} cm`;

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

    const sanitizedItems = items
      .map((item) => ({
        productId: String(item.productId ?? ''),
        quantity: Math.min(Math.max(Number(item.quantity) || 1, 1), 99),
        selectedOptions: item.selectedOptions,
      }))
      .filter((item) => item.productId.length > 0);

    if (sanitizedItems.length === 0) {
      return jsonResponse({ error: 'No checkout items provided.' }, 400);
    }

    const productIds = [...new Set(sanitizedItems.map((item) => item.productId))];
    const productsResponse = await supabaseFetch(
      `products?select=id,name,slug,price,main_image_url,colors,dimensions,in_stock,is_published&id=in.(${productIds.join(',')})`,
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
      const selectedOptions = resolveSelectedOptions(product, item.selectedOptions);

      return {
        product,
        quantity: item.quantity,
        lineTotal: Number(product.price) * item.quantity,
        selectedOptions,
        productName: formatProductNameWithOptions(product.name, selectedOptions),
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
        customer_email: customer.email || null,
        metadata: {
          language,
          customer,
          payment_method: 'online_card_wallet',
          items: checkoutItems.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            selected_options: item.selectedOptions,
          })),
        },
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
          product_name: item.productName,
          product_slug: item.product.slug,
          unit_price: item.product.price,
          quantity: item.quantity,
          line_total: item.lineTotal,
        })),
      ),
    });

    const stripeBody: Record<string, string | number> = {
      mode: 'payment',
      success_url: `${siteUrl}/${language}/checkout/success?checkout=success&payment=online&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${language}/checkout?checkout=cancelled`,
      'metadata[order_id]': orderId,
      'metadata[payment_method]': 'online_card_wallet',
      'phone_number_collection[enabled]': 'true',
      billing_address_collection: 'auto',
    };

    if (customer.email) {
      stripeBody.customer_email = customer.email;
    }

    checkoutItems.forEach((item, index) => {
      stripeBody[`line_items[${index}][price_data][currency]`] = currency;
      stripeBody[`line_items[${index}][price_data][product_data][name]`] = item.productName;
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
