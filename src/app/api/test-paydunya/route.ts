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
      PAYDUNYA_TOKEN,
      PAYDUNYA_RETURN_URL,
      PAYDUNYA_CANCEL_URL,
      NEXT_PUBLIC_BASE_URL,
    } = process.env;

    if (!PAYDUNYA_MASTER_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN) {
      return NextResponse.json({ error: "PayDunya keys missing" }, { status: 500, headers: CORS });
    }

    const BASE = PAYDUNYA_ENV === "sandbox"
      ? "https://app.paydunya.com/sandbox-api/v1"
      : "https://app.paydunya.com/api/v1";

    const origin = NEXT_PUBLIC_BASE_URL || "";
    const callbackUrl = origin ? `${origin}/api/paydunya/ipn` : "";

    // Structure selon la documentation PayDunya HTTP/JSON
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

    // Headers selon la documentation PayDunya HTTP/JSON
    const headers = {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": PAYDUNYA_MASTER_KEY,
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
    
    // Vérifier la réponse selon la documentation PayDunya
    if (res.data && res.data.response_code === "00") {
      const token = res.data.token;
      const checkoutUrl = res.data.response_text; // URL de paiement PayDunya
      
      // Sauvegarder en base de données (optionnel pour les tests)
      if (process.env.POSTGRES_URL) {
        try {
          await db.insert(payments).values({
            token,
            userId,
            amount,
            status: "pending",
            providerData: JSON.stringify(res.data),
          }).onConflictDoUpdate({
            target: payments.token,
            set: { userId, amount, status: "pending", providerData: JSON.stringify(res.data) },
          });
          console.log("✅ Transaction sauvegardée en base de données");
        } catch (dbError) {
          console.error("⚠️ Database error (non bloquant):", dbError instanceof Error ? dbError.message : String(dbError));
          // Continue même si la DB échoue
        }
      } else {
        console.log("ℹ️ Base de données non configurée - transaction non sauvegardée");
      }

      // Retourner la réponse selon la documentation PayDunya
      return NextResponse.json({
        success: true,
        response_code: res.data.response_code,
        response_text: res.data.response_text,
        description: res.data.description,
        token: res.data.token,
        checkout_url: checkoutUrl,
        message: "Facture créée avec succès. Redirection vers PayDunya...",
      }, { headers: CORS });
    }

    // Si response_code n'est pas "00", c'est une erreur
    return NextResponse.json({
      error: res.data.response_text || "Erreur PayDunya",
      response_code: res.data.response_code,
      details: res.data
    }, { status: 400, headers: CORS });

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