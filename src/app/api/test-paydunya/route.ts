import { db } from "@/db/client";
import { payments } from "@/db/schema";
import axios from "axios";
import { NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Paydunya-Private-Key, Paydunya-Token, Paydunya-Master-Key",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  try {
    const { amount = 1000, itemName = "Accès Livre Partie 2 & 3", userId } = await req.json().catch(() => ({}));
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400, headers: CORS });

    const {
      PAYDUNYA_ENV,
      PAYDUNYA_MASTER_KEY,
      PAYDUNYA_PRIVATE_KEY,
      PAYDUNYA_PUBLIC_KEY,
      PAYDUNYA_TOKEN,
      PAYDUNYA_RETURN_URL,
      PAYDUNYA_CANCEL_URL,
      NEXT_PUBLIC_BASE_URL,
    } = process.env;

    if (!PAYDUNYA_PUBLIC_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN) {
      return NextResponse.json({ error: "PayDunya keys missing" }, { status: 500, headers: CORS });
    }

    const BASE = PAYDUNYA_ENV === "sandbox"
      ? "https://app.paydunya.com/sandbox-api/v1"
      : "https://app.paydunya.com/api/v1";

    const origin = NEXT_PUBLIC_BASE_URL || "";
    // Temporairement désactiver l'IPN pour les tests locaux
    const callbackUrl = ""; // origin ? `${origin}/api/paydunya/ipn` : "";

    // Structure selon la documentation PayDunya
    const payload = {
      invoice: {
        items: [{ name: itemName, price: amount, quantity: 1 }],
        total_amount: amount,
        description: "Déblocage contenu Partie 2 & 3",
        return_url: PAYDUNYA_RETURN_URL,
        cancel_url: PAYDUNYA_CANCEL_URL,
        custom_data: { userId },
      },
      store: { name: "At-Taqwa" },
      actions: {
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
        return_url: PAYDUNYA_RETURN_URL,
        cancel_url: PAYDUNYA_CANCEL_URL,
      },
    };

    const headers = {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": PAYDUNYA_PUBLIC_KEY, // Utiliser la clé publique ici !
      "PAYDUNYA-PRIVATE-KEY": PAYDUNYA_PRIVATE_KEY,
      "PAYDUNYA-TOKEN": PAYDUNYA_TOKEN,
    };

    console.log("PayDunya Request:", {
      url: `${BASE}/checkout-invoice/create`,
      payload,
      headers: {
        ...headers,
        "PAYDUNYA-MASTER-KEY": headers["PAYDUNYA-MASTER-KEY"]?.substring(0, 10) + "...",
        "PAYDUNYA-PRIVATE-KEY": headers["PAYDUNYA-PRIVATE-KEY"]?.substring(0, 10) + "...",
        "PAYDUNYA-TOKEN": headers["PAYDUNYA-TOKEN"]?.substring(0, 10) + "...",
      }
    });

    const res = await axios.post(`${BASE}/checkout-invoice/create`, payload, { headers });
    
    // Si la réponse est HTML (page de connexion), c'est un succès !
    if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) {
      // Extraire l'URL de paiement depuis la réponse HTML
      const checkoutUrl = `${BASE.replace('/api/v1', '').replace('/sandbox-api/v1', '')}/checkout/${res.headers['x-invoice-token'] || 'pending'}`;
      
      try {
        await db.insert(payments).values({
          token: res.headers['x-invoice-token'] || 'pending',
          userId, 
          amount, 
          status: "pending", 
          providerData: JSON.stringify({ html: res.data.substring(0, 200) + '...' }),
        }).onConflictDoUpdate({
          target: payments.token,
          set: { userId, amount, status: "pending", providerData: JSON.stringify({ html: res.data.substring(0, 200) + '...' }) },
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue même si la DB échoue
      }

      // Retourner l'URL de paiement pour le front
      return NextResponse.json({
        success: true,
        checkout_url: checkoutUrl,
        message: "Facture créée avec succès. Redirection vers PayDunya...",
        status: "pending"
      }, { headers: CORS });
    }

    // Si c'est du JSON (erreur ou succès)
    const providerData = res.data;
    const token = providerData?.token || providerData?.invoice_token || providerData?.invoice?.token || null;

    if (token) {
      try {
        await db.insert(payments).values({
          token, userId, amount, status: "pending", providerData: JSON.stringify(providerData),
        }).onConflictDoUpdate({
          target: payments.token,
          set: { userId, amount, status: "pending", providerData: JSON.stringify(providerData) },
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue même si la DB échoue
      }
    }

    // Retourner les données pour le front
    return NextResponse.json(providerData, { headers: CORS });
  } catch (e: unknown) {
    let errorMessage = "PayDunya create failed";
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'object' && e !== null && 'response' in e) {
      const axiosError = e as { response?: { data?: unknown } };
      errorMessage = axiosError.response?.data ? String(axiosError.response.data) : errorMessage;
    }
    console.error("PayDunya error:", e);
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: CORS });
  }
} 