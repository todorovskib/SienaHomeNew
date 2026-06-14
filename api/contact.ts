interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  status: (statusCode: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

interface ContactRequestBody {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  preferredContactMethod?: unknown;
  language?: unknown;
  website?: unknown;
}

const getEnvironment = () =>
  (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env ?? {};

const sanitizeText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const getHeader = (
  headers: ApiRequest['headers'],
  name: string,
) => {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const parseBody = (body: unknown): ContactRequestBody => {
  if (typeof body === 'string') {
    const parsed = JSON.parse(body) as unknown;
    return typeof parsed === 'object' && parsed !== null
      ? parsed as ContactRequestBody
      : {};
  }

  return typeof body === 'object' && body !== null
    ? body as ContactRequestBody
    : {};
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone: string) =>
  /^[+\d][\d\s()./-]{5,24}$/.test(phone);

const isSameOrigin = (req: ApiRequest) => {
  const origin = getHeader(req.headers, 'origin');
  const forwardedHost = getHeader(req.headers, 'x-forwarded-host');
  const host = forwardedHost ?? getHeader(req.headers, 'host');

  if (!origin || !host) {
    return true;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

const sendError = (
  res: ApiResponse,
  status: number,
  error: string,
) => {
  res.status(status).json({ error });
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'Method not allowed.');
    return;
  }

  if (!isSameOrigin(req)) {
    sendError(res, 403, 'Request origin is not allowed.');
    return;
  }

  const contentLength = Number(getHeader(req.headers, 'content-length') ?? 0);
  if (contentLength > 32_000) {
    sendError(res, 413, 'Request is too large.');
    return;
  }

  try {
    const body = parseBody(req.body);

    // Bots commonly complete hidden fields. Return success without storing spam.
    if (sanitizeText(body.website, 200)) {
      res.status(200).json({ success: true });
      return;
    }

    const name = sanitizeText(body.name, 120);
    const phone = sanitizeText(body.phone, 30);
    const email = sanitizeText(body.email, 180).toLowerCase();
    const subject = sanitizeText(body.subject, 180);
    const message = sanitizeText(body.message, 5000);
    const requestedMethod = sanitizeText(body.preferredContactMethod, 20);
    let preferredContactMethod = ['phone', 'email', 'whatsapp'].includes(requestedMethod)
      ? requestedMethod
      : 'phone';
    const language = body.language === 'en' ? 'en' : 'mk';

    if (name.length < 2) {
      sendError(res, 400, 'Please enter your name.');
      return;
    }
    if (!phone && !email) {
      sendError(res, 400, 'Please enter a phone number or email address.');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      sendError(res, 400, 'Please enter a valid phone number.');
      return;
    }
    if (email && !isValidEmail(email)) {
      sendError(res, 400, 'Please enter a valid email address.');
      return;
    }
    if (message.length < 2) {
      sendError(res, 400, 'Please enter a message.');
      return;
    }
    if (preferredContactMethod === 'email' && !email && phone) {
      preferredContactMethod = 'phone';
    } else if (
      (preferredContactMethod === 'phone' || preferredContactMethod === 'whatsapp')
      && !phone
      && email
    ) {
      preferredContactMethod = 'email';
    }

    const environment = getEnvironment();
    const supabaseUrl = environment.SUPABASE_URL ?? environment.VITE_SUPABASE_URL;
    const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Contact API is missing Supabase server environment variables.');
      sendError(res, 500, 'The contact service is temporarily unavailable.');
      return;
    }

    const supabaseResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/contact_messages`,
      {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          name,
          phone: phone || null,
          email: email || null,
          subject: subject || null,
          message,
          preferred_contact_method: preferredContactMethod,
          language,
          source: 'website',
          user_agent: sanitizeText(getHeader(req.headers, 'user-agent'), 500) || null,
        }),
      },
    );

    if (!supabaseResponse.ok) {
      console.error(
        'Supabase rejected a contact message:',
        supabaseResponse.status,
        await supabaseResponse.text(),
      );
      sendError(res, 500, 'The message could not be sent. Please try again.');
      return;
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Contact message submission failed:', error);
    sendError(res, 500, 'The message could not be sent. Please try again.');
  }
}
