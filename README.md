# 🚀 At-Taqwa Backend - PayDunya Integration

Backend Next.js sécurisé pour l'intégration PayDunya avec authentification Firebase et gestion des entitlements.

## 🏗️ Architecture

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL avec Drizzle ORM
- **Authentication**: Firebase Admin SDK
- **Payment**: PayDunya HTTP/JSON API
- **Deployment**: Vercel

## 🔐 Sécurité

- ✅ Authentification Firebase obligatoire pour toutes les routes utilisateur
- ✅ Clés PayDunya côté serveur uniquement
- ✅ Vérification de signature IPN (à implémenter)
- ✅ Rate limiting sur les APIs sensibles
- ✅ CORS configuré strictement
- ✅ Logs d'audit complets

## 📊 Structure de Base de Données

### Tables Principales
- `users` - Utilisateurs Firebase
- `payments` - Transactions PayDunya
- `entitlements` - Accès aux ressources (Livre Partie 2/3)
- `ipn_events` - Événements IPN (idempotence)
- `audit_logs` - Logs d'audit

### Tables Legacy (compatibilité)
- `entitlements_legacy` - Ancienne structure
- `payments_legacy` - Ancienne structure

## 🚀 Installation

### 1. Variables d'environnement

Copiez `env.example` vers `.env.local` :

```bash
# App
NODE_ENV=production

# Database
DATABASE_URL=postgres://...
POSTGRES_URL=postgres://...

# Base URL
BASE_URL=https://attaqwa-paiement.vercel.app
NEXT_PUBLIC_BASE_URL=https://attaqwa-paiement.vercel.app

# PayDunya Configuration
PAYDUNYA_MODE=sandbox
PAYDUNYA_MASTER_KEY=
PAYDUNYA_PRIVATE_KEY=
PAYDUNYA_TOKEN=
PAYDUNYA_MERCHANT_NAME=AT-TAQWA

# Firebase Admin SDK
FIREBASE_PROJECT_ID=at-taqwa-app-14b7f
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS
CORS_ORIGINS=https://attaqwa-paiement.vercel.app,https://expo.dev
```

### 2. Installation des dépendances

```bash
npm install
```

### 3. Migration de la base de données

```bash
# Générer les migrations
npx drizzle-kit generate

# Appliquer les migrations
node scripts/migrate-db.js

# Migrer les données legacy (si nécessaire)
node scripts/migrate-data.js
```

### 4. Démarrage

```bash
npm run dev
```

## 📡 APIs

### Authentification
Toutes les routes utilisateur nécessitent un token Firebase :
```
Authorization: Bearer <firebase_id_token>
```

### 1. GET /api/entitlements
Vérifier les accès d'un utilisateur.

**Headers requis**: `Authorization: Bearer <token>`

**Réponse**:
```json
{
  "userId": "firebase_uid",
  "resources": [
    {
      "id": "BOOK_PART_2",
      "granted": true,
      "grantedAt": "2024-01-01T00:00:00Z",
      "expiresAt": null,
      "sourcePaymentId": 123
    },
    {
      "id": "BOOK_PART_3",
      "granted": false,
      "grantedAt": null,
      "expiresAt": null,
      "sourcePaymentId": null
    }
  ]
}
```

### 2. POST /api/paydunya/checkout
Créer une facture PayDunya.

**Headers requis**: `Authorization: Bearer <token>`

**Body**:
```json
{
  "planId": "BOOK_PART_2"
}
```

**Réponse**:
```json
{
  "paymentId": 123,
  "token": "paydunya_token",
  "checkout_url": "https://checkout.paydunya.com/..."
}
```

### 3. GET /api/paydunya/status
Vérifier le statut d'un paiement.

**Query params**: `token=<paydunya_token>`

**Réponse**:
```json
{
  "status": "PAID"
}
```

### 4. POST /api/paydunya/ipn
Webhook PayDunya (idempotent).

**Utilisation**: Configuré automatiquement dans PayDunya.

## 🔧 Scripts Utiles

### Tests
```bash
# Tester les APIs refactorisées
node scripts/test-refactored-api.js

# Tester le flux complet
node scripts/test-complete-flow.js
```

### Production
```bash
# Configuration production
./scripts/production-setup.sh

# Migration de données
node scripts/migrate-data.js
```

## 🚀 Déploiement

### Vercel
1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel
3. Déployez automatiquement

### Variables Vercel Requises
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `PAYDUNYA_MASTER_KEY`
- `PAYDUNYA_PRIVATE_KEY`
- `PAYDUNYA_TOKEN`
- `DATABASE_URL`
- `BASE_URL`

## 📱 Intégration Mobile

### Configuration Expo
```javascript
// app.config.js
export default {
  expo: {
    // ...
    scheme: 'attaqwa',
    // ...
  }
};
```

### Deep Links
- `attaqwa://paydunya/success` - Paiement réussi
- `attaqwa://paydunya/cancel` - Paiement annulé
- `attaqwa://paydunya/failed` - Paiement échoué

### Service de Paiement
```typescript
import { PaymentService } from '@/lib/paymentService';

const paymentService = new PaymentService(userId);

// Vérifier les accès
const entitlements = await paymentService.checkEntitlements();

// Créer un paiement
const payment = await paymentService.createPayment('BOOK_PART_2');
```

## 🔍 Monitoring

### Logs
- Tous les événements sont loggés avec le préfixe `[AT-TAQWA]`
- Logs d'audit dans la table `audit_logs`
- Logs d'erreur détaillés

### Métriques
- Taux de conversion des paiements
- Temps de traitement des IPN
- Erreurs d'authentification
- Performance des APIs

## 🛡️ Sécurité

### Authentification
- Firebase ID Token obligatoire
- Vérification côté serveur
- Tokens expirés automatiquement rejetés

### PayDunya
- Clés côté serveur uniquement
- Vérification de signature IPN
- Idempotence des webhooks

### Rate Limiting
- 60 requêtes/minute par IP pour les APIs publiques
- 10 requêtes/minute par IP pour le checkout

## 📚 Documentation

- `PRODUCTION_DEPLOYMENT.md` - Guide de déploiement production
- `MOBILE_INTEGRATION.md` - Intégration mobile détaillée
- `scripts/` - Scripts utilitaires

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez les logs dans Vercel
2. Consultez la documentation PayDunya
3. Testez avec les scripts fournis

---

**Version**: 2.0.0  
**Dernière mise à jour**: Janvier 2024
