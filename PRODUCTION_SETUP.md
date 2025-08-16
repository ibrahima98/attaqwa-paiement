# 🚀 Configuration Production PayDunya + App Mobile

## 📱 **Deep Links pour App Mobile**

### **Qu'est-ce qu'un Deep Link ?**
Un deep link est une URL qui ouvre directement votre app mobile au lieu d'un navigateur.

**Exemples :**
```
attaqwa://paydunya/success  // Paiement réussi
attaqwa://paydunya/cancel   // Paiement annulé
attaqwa://paydunya/failed   // Paiement échoué
```

### **Configuration Deep Links**

#### **Android (AndroidManifest.xml)**
```xml
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="attaqwa" />
    </intent-filter>
</activity>
```

#### **iOS (Info.plist)**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.attaqwa.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>attaqwa</string>
        </array>
    </dict>
</array>
```

## 🔧 **Configuration Production**

### **1. Variables d'environnement Production**

```bash
# .env.production
PAYDUNYA_ENV=live
PAYDUNYA_MASTER_KEY=3T9S0zED-0LOy-6WWg-98Ra-c4JbSf1BduVk
PAYDUNYA_PRIVATE_KEY=live_private_0K10Tk8yZn25WE406q3G5D2QgcM
PAYDUNYA_TOKEN=EkVFX4BZQsfVwYy3IQ03
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel
NEXT_PUBLIC_BASE_URL=https://votre-app.vercel.app
POSTGRES_URL=postgres://...
```

### **2. URLs de Production**

**API Endpoints :**
- `POST /api/paydunya/checkout` - Créer une facture
- `GET /api/entitlements?userId=xxx` - Vérifier les accès
- `POST /api/paydunya/ipn` - Webhook PayDunya

**URLs PayDunya :**
- Production : `https://app.paydunya.com/api/v1/checkout-invoice/create`
- IPN Endpoint : `https://votre-app.vercel.app/api/paydunya/ipn`

## 📱 **Intégration App Mobile**

### **Flux de paiement complet :**

```javascript
// 1. Vérifier les accès actuels
const entitlements = await fetch('https://votre-app.vercel.app/api/entitlements?userId=user123');

// 2. Créer une facture PayDunya
const invoice = await fetch('https://votre-app.vercel.app/api/paydunya/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 15000,
    userId: 'user123',
    itemName: 'Accès Livre Partie 2 & 3'
  })
});

// 3. Rediriger vers PayDunya
const { checkout_url } = await invoice.json();
// Ouvrir checkout_url dans un WebView ou navigateur

// 4. Gérer le retour via deep link
// L'app s'ouvre automatiquement avec attaqwa://paydunya/success
```

### **Gestion des Deep Links dans l'app :**

```javascript
// React Native
import { Linking } from 'react-native';

// Écouter les deep links
Linking.addEventListener('url', (event) => {
  const { url } = event;
  
  if (url.includes('attaqwa://paydunya/success')) {
    // Paiement réussi - vérifier les entitlements
    checkEntitlements();
  } else if (url.includes('attaqwa://paydunya/cancel')) {
    // Paiement annulé
    showCancelMessage();
  }
});

// Vérifier les entitlements après paiement
async function checkEntitlements() {
  const response = await fetch(`https://votre-app.vercel.app/api/entitlements?userId=${userId}`);
  const { access } = await response.json();
  
  if (access.part2 && access.part3) {
    // Débloquer le contenu
    unlockContent();
  }
}
```

## 🔒 **Sécurité Production**

### **1. Validation des tokens**
```javascript
// Vérifier que le token PayDunya est valide
async function validatePayment(token) {
  const response = await fetch(`https://app.paydunya.com/api/v1/checkout-invoice/confirm/${token}`, {
    headers: {
      'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
      'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
      'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN,
    }
  });
  
  const data = await response.json();
  return data.status === 'completed';
}
```

### **2. Protection CORS**
```javascript
// Limiter les origines autorisées
const CORS = {
  "Access-Control-Allow-Origin": "https://votre-app.vercel.app",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
```

## 🚀 **Déploiement Vercel**

### **1. Variables d'environnement Vercel**
```bash
# Dans Vercel Dashboard > Project Settings > Environment Variables
PAYDUNYA_ENV=live
PAYDUNYA_MASTER_KEY=3T9S0zED-0LOy-6WWg-98Ra-c4JbSf1BduVk
PAYDUNYA_PRIVATE_KEY=live_private_0K10Tk8yZn25WE406q3G5D2QgcM
PAYDUNYA_TOKEN=EkVFX4BZQsfVwYy3IQ03
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel
NEXT_PUBLIC_BASE_URL=https://votre-app.vercel.app
POSTGRES_URL=postgres://...
```

### **2. Configuration PayDunya**
Dans votre dashboard PayDunya :
- **IPN Endpoint** : `https://votre-app.vercel.app/api/paydunya/ipn`
- **Return URL** : `attaqwa://paydunya/success`
- **Cancel URL** : `attaqwa://paydunya/cancel`

## 📊 **Monitoring Production**

### **Logs à surveiller :**
- Création de factures PayDunya
- Réceptions d'IPN
- Mises à jour d'entitlements
- Erreurs de base de données

### **Métriques importantes :**
- Taux de conversion des paiements
- Temps de traitement des IPN
- Erreurs de validation des tokens 