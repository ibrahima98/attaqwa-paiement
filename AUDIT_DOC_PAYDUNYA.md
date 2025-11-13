# 🔍 Audit Documentation PayDunya vs Notre Code

## ❌ PROBLÈMES IDENTIFIÉS

### 1. ENDPOINT DE CRÉATION INCORRECT

**Notre code actuel:**
```typescript
ENV.PAYDUNYA.SOFTPAY_CREATE_URL = "https://app.paydunya.com/api/v1/softpay/create"
```

**Documentation PayDunya:**
```
Endpoint: https://app.paydunya.com/api/v1/checkout-invoice/create
```

**❌ Notre endpoint n'existe pas dans la documentation!**

---

### 2. STRUCTURE DU PAYLOAD INCORRECTE

**Notre payload actuel:**
```typescript
{
  amount: 1000,
  currency: "XOF",
  description: "Livre Partie 2",
  metadata: { uid, planId },
  return_url: "...",
  cancel_url: "...",
  ipn_url: "..."
}
```

**Documentation PayDunya (structure correcte):**
```javascript
{
  "invoice": {
    "total_amount": 5000,
    "description": "Chaussure VANS dernier modèle",
    "items": {},      // optionnel
    "taxes": {}      // optionnel
  },
  "store": {
    "name": "Magasin le Choco",  // OBLIGATOIRE
    "tagline": "",               // optionnel
    "postal_address": "",
    "phone": "",
    "logo_url": "",
    "website_url": ""
  },
  "custom_data": {},  // optionnel
  "actions": {
    "callback_url": ""  // optionnel
  }
}
```

**❌ Nous n'utilisons pas la structure `invoice` et `store` requise!**

---

### 3. ENDPOINT D'EXÉCUTION INCORRECT

**Notre code actuel:**
```typescript
ENV.PAYDUNYA.SOFTPAY_EXECUTE_URL = "https://app.paydunya.com/api/v1/softpay/execute"
```

**Documentation PayDunya:**
Il n'existe **PAS** d'endpoint générique `/softpay/execute`. 

Il faut utiliser des endpoints **SPÉCIFIQUES** par méthode de paiement:

- `/api/v1/softpay/orange-money-senegal`
- `/api/v1/softpay/wave-senegal`
- `/api/v1/softpay/card`
- `/api/v1/softpay/free-money-senegal`
- `/api/v1/softpay/expresso-senegal`
- `/api/v1/softpay/wizall-senegal`
- etc.

**❌ Notre endpoint générique n'existe pas!**

---

### 4. STRUCTURE PAYLOAD POUR EXÉCUTION

**Notre payload actuel:**
```typescript
{
  token: "...",
  paymentMethod: "wallet",
  paymentData: { phone: "..." }
}
```

**Documentation PayDunya (exemple Orange Money):**
```javascript
{
  "orange_money_senegal_customer_fullname": "Camille",
  "orange_money_senegal_email": "[email protected]",
  "orange_money_senegal_phone_number": "97403627",
  "payment_token": "ERtyuILouhhRHICF0HboN"
}
```

**❌ Chaque méthode de paiement a sa propre structure!**

---

### 5. FLOW COMPLET SELON LA DOC

1. **Étape 1**: Créer une facture checkout
   - `POST /api/v1/checkout-invoice/create`
   - Payload: `{ invoice: {...}, store: {...} }`
   - Réponse: `{ token: "...", response_code: "00", ... }`

2. **Étape 2**: Effectuer le paiement selon la méthode
   - `POST /api/v1/softpay/{methode}`
   - Payload: Spécifique à la méthode (voir doc)
   - Réponse: `{ success: true, message: "..." }`

---

## ✅ CORRECTIONS NÉCESSAIRES

1. ✅ Changer l'endpoint de création vers `/api/v1/checkout-invoice/create`
2. ✅ Restructurer le payload avec `invoice` et `store`
3. ✅ Utiliser les endpoints spécifiques par méthode de paiement
4. ✅ Adapter le payload selon la méthode choisie
5. ✅ Ajouter l'objet `store` avec au minimum `name`

---

## 📝 RÉFÉRENCES

- [Documentation SoftPay Production](https://developers.paydunya.com/doc/FR/softpay)
- [Documentation Sandbox SoftPay](https://developers.paydunya.com/doc/FR/sandbox_softpay)





