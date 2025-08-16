# 🚀 Guide de Déploiement Production - PayDunya

## 📋 **Checklist de Production**

### **✅ Étape 1 : Backend Vercel**

#### **1. Déploiement automatique**
- ✅ Code poussé sur GitHub
- ✅ Vercel déploie automatiquement depuis `main`

#### **2. Variables d'environnement Vercel**
Dans votre dashboard Vercel → Project Settings → Environment Variables :

```bash
# Production PayDunya
PAYDUNYA_ENV=live
PAYDUNYA_MASTER_KEY=votre_clé_master_production
PAYDUNYA_PRIVATE_KEY=votre_clé_privée_production
PAYDUNYA_TOKEN=votre_token_production

# URLs de redirection
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel

# Backend URL
NEXT_PUBLIC_BASE_URL=https://votre-backend.vercel.app

# Base de données
POSTGRES_URL=postgres://neondb_owner:npg_DUw48mozIsXb@ep-icy-boat-adugt8mk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### **✅ Étape 2 : Configuration PayDunya**

#### **1. Dashboard PayDunya**
Connectez-vous à votre compte PayDunya Business :

1. **Aller dans** : Intégrer notre API
2. **Sélectionner** votre application `at-taqwa`
3. **Configurer** :
   - **IPN Endpoint** : `https://votre-backend.vercel.app/api/paydunya/ipn`
   - **Return URL** : `attaqwa://paydunya/success`
   - **Cancel URL** : `attaqwa://paydunya/cancel`
   - **Activer IPN** : Oui

#### **2. Clés de Production**
Récupérez vos clés de production dans le dashboard PayDunya :

```bash
# Clés de Production (pas de test)
PAYDUNYA_MASTER_KEY=live_3T9S0zED-0LOy-6WWg-98Ra-c4JbSf1BduVk
PAYDUNYA_PRIVATE_KEY=live_private_0K10Tk8yZn25WE406q3G5D2QgcM
PAYDUNYA_TOKEN=live_EkVFX4BZQsfVwYy3IQ03
```

### **✅ Étape 3 : Application Mobile**

#### **1. Variables d'environnement**
Dans votre app mobile, ajoutez :

```bash
# .env ou app.config.js
EXPO_PUBLIC_BACKEND_URL=https://votre-backend.vercel.app
```

#### **2. Build de production**
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

#### **3. Soumission aux stores**
- **Google Play Store** : Upload APK/AAB
- **App Store** : Upload via App Store Connect

## 🔧 **Configuration Détaillée**

### **1. Backend Vercel**

#### **URL de votre backend**
Après déploiement, votre backend sera accessible sur :
```
https://attaqwa-paiement.vercel.app
```

#### **APIs disponibles**
- `GET https://attaqwa-paiement.vercel.app/api/entitlements?userId=xxx`
- `POST https://attaqwa-paiement.vercel.app/api/paydunya/checkout`
- `POST https://attaqwa-paiement.vercel.app/api/paydunya/ipn` (webhook)

### **2. Test de Production**

#### **Test des APIs**
```bash
# Test entitlements
curl "https://attaqwa-paiement.vercel.app/api/entitlements?userId=test123"

# Test création paiement
curl -X POST https://attaqwa-paiement.vercel.app/api/paydunya/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": 15000, "userId": "test123"}'
```

#### **Test des deep links**
```bash
# Tester les deep links sur appareil physique
npx uri-scheme open "attaqwa://paydunya/success" --android
npx uri-scheme open "attaqwa://paydunya/success" --ios
```

### **3. Monitoring Production**

#### **Logs Vercel**
- Dashboard Vercel → Functions → Logs
- Surveiller les erreurs d'API

#### **Logs PayDunya**
- Dashboard PayDunya → Transactions
- Vérifier les IPN reçus

#### **Base de données**
- Dashboard Neon → Queries
- Vérifier les tables `entitlements` et `payments`

## 🚨 **Sécurité Production**

### **1. Variables d'environnement**
- ✅ Ne jamais committer les clés de production
- ✅ Utiliser les variables Vercel
- ✅ Limiter l'accès aux clés

### **2. CORS**
```typescript
// Limiter les origines autorisées
const CORS = {
  "Access-Control-Allow-Origin": "https://votre-app.vercel.app",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
```

### **3. Validation des tokens**
```typescript
// Vérifier les tokens PayDunya
const validatePayDunyaToken = async (token: string) => {
  const response = await fetch(`https://app.paydunya.com/api/v1/checkout-invoice/confirm/${token}`, {
    headers: {
      'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
      'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
      'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN,
    }
  });
  return response.json();
};
```

## 📊 **Métriques de Production**

### **1. KPIs à surveiller**
- Taux de conversion des paiements
- Temps de traitement des IPN
- Erreurs de validation des tokens
- Performance des APIs

### **2. Alertes à configurer**
- Erreurs 500 sur les APIs
- IPN non reçus
- Échecs de paiement PayDunya
- Base de données inaccessible

## 🔄 **Rollback Plan**

### **En cas de problème :**

#### **1. Backend**
- Revenir à la version précédente sur Vercel
- Vérifier les variables d'environnement
- Tester les APIs

#### **2. App Mobile**
- Publier une version de rollback
- Désactiver temporairement les paiements
- Rediriger vers une page de maintenance

#### **3. PayDunya**
- Vérifier la configuration IPN
- Tester avec les clés de sandbox
- Contacter le support PayDunya si nécessaire

## ✅ **Checklist Finale**

### **Avant de lancer en production :**
- [ ] Backend déployé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Clés PayDunya production activées
- [ ] IPN endpoint configuré
- [ ] App mobile buildée et testée
- [ ] Deep links fonctionnels
- [ ] Base de données accessible
- [ ] Monitoring configuré
- [ ] Plan de rollback préparé

### **Après le lancement :**
- [ ] Tester un paiement réel
- [ ] Vérifier les IPN reçus
- [ ] Confirmer les entitlements mis à jour
- [ ] Surveiller les logs
- [ ] Valider les deep links

## 🎉 **Lancement en Production**

Une fois tout configuré :

1. **Activer** les clés PayDunya production
2. **Publier** l'app mobile sur les stores
3. **Tester** un premier paiement réel
4. **Surveiller** les métriques
5. **Valider** le flux complet

Votre intégration PayDunya est maintenant **prête pour la production** ! 🚀 