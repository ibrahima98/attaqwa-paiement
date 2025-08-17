import { error, log } from './logger';

type CreateInvoiceParams = {
  planId: 'BOOK_PART_2'|'BOOK_PART_3';
  amount: number;
  description: string;
  callbackUrl: string; // IPN webhook
  cancelUrl: string;
  returnUrl: string;
};

export async function createCheckoutInvoice(p: CreateInvoiceParams) {
  const { PAYDUNYA_MODE, PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN, PAYDUNYA_MERCHANT_NAME } = process.env;
  
  if (!PAYDUNYA_MASTER_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN) {
    throw new Error('PayDunya keys missing');
  }

  const BASE = PAYDUNYA_MODE === 'live' 
    ? 'https://app.paydunya.com/api/v1' 
    : 'https://app.paydunya.com/sandbox-api/v1';

  const payload = {
    invoice: {
      items: [{
        name: p.description,
        price: p.amount,
        quantity: 1
      }],
      total_amount: p.amount,
      description: p.description,
      return_url: p.returnUrl,
      cancel_url: p.cancelUrl,
      custom_data: {
        planId: p.planId
      }
    },
    store: {
      name: PAYDUNYA_MERCHANT_NAME || 'AT-TAQWA'
    },
    actions: {
      callback_url: p.callbackUrl,
      return_url: p.returnUrl,
      cancel_url: p.cancelUrl
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
    'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
    'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN,
  };

  try {
    log('Creating PayDunya invoice:', { planId: p.planId, amount: p.amount });
    
    const response = await fetch(`${BASE}/checkout-invoice/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.response_code === '00') {
      log('PayDunya invoice created successfully:', { token: data.token });
      return {
        token: data.token,
        checkout_url: data.response_text,
        provider_ref: data.token
      };
    } else {
      error('PayDunya invoice creation failed:', data);
      throw new Error(`PayDunya error: ${data.response_text || 'Unknown error'}`);
    }
  } catch (err) {
    error('PayDunya API error:', err);
    throw err;
  }
}

export function verifyIpnSignature(req: Request, _rawBody: string): boolean {
  // TODO: Implémenter la vérification HMAC selon la documentation PayDunya
  // Pour l'instant, on retourne true pour la compatibilité
  // En production, il faudra vérifier la signature avec la clé privée
  
  const signature = req.headers.get('x-paydunya-signature');
  if (!signature) {
    log('No PayDunya signature found in headers');
    return false;
  }

  // TODO: Vérifier la signature HMAC
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.PAYDUNYA_PRIVATE_KEY!)
  //   .update(rawBody)
  //   .digest('hex');
  
  log('PayDunya signature verification (placeholder):', { signature });
  return true; // Placeholder - à implémenter selon la doc PayDunya
} 