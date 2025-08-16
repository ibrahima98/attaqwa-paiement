# 📱 Intégration PayDunya dans une App Mobile

## 🔗 **Deep Links Configuration**

### **URLs de redirection actuelles**
```
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel
```

### **Configuration dans l'app mobile**

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

## 🔄 **Flux de paiement mobile**

### **1. Création de la facture**
```javascript
// Dans votre app mobile
const createPayment = async (userId, amount) => {
  try {
    const response = await fetch('https://votre-api.vercel.app/api/test-paydunya', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        amount: amount,
        itemName: "Accès Livre Partie 2 & 3"
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Ouvrir l'URL de paiement PayDunya
      openPayDunyaCheckout(data.checkout_url);
    }
  } catch (error) {
    console.error('Erreur création paiement:', error);
  }
};
```

### **2. Ouverture du checkout PayDunya**
```javascript
// React Native
import { Linking } from 'react-native';

const openPayDunyaCheckout = (checkoutUrl) => {
  Linking.openURL(checkoutUrl);
};

// Flutter
import 'package:url_launcher/url_launcher.dart';

Future<void> openPayDunyaCheckout(String checkoutUrl) async {
  if (await canLaunchUrl(Uri.parse(checkoutUrl))) {
    await launchUrl(Uri.parse(checkoutUrl));
  }
}
```

### **3. Gestion des deep links de retour**

#### **React Native**
```javascript
import { Linking } from 'react-native';

useEffect(() => {
  const handleDeepLink = (url) => {
    if (url.includes('attaqwa://paydunya/success')) {
      // Paiement réussi
      handlePaymentSuccess();
    } else if (url.includes('attaqwa://paydunya/cancel')) {
      // Paiement annulé
      handlePaymentCancel();
    }
  };

  Linking.addEventListener('url', handleDeepLink);
  
  return () => {
    Linking.removeEventListener('url', handleDeepLink);
  };
}, []);

const handlePaymentSuccess = () => {
  // Vérifier les entitlements
  checkUserEntitlements();
  // Afficher un message de succès
  showSuccessMessage();
};

const handlePaymentCancel = () => {
  // Afficher un message d'annulation
  showCancelMessage();
};
```

#### **Flutter**
```dart
import 'package:uni_links/uni_links.dart';

class PaymentHandler {
  StreamSubscription? _subscription;

  void initDeepLinkHandler() {
    _subscription = uriLinkStream.listen((Uri? uri) {
      if (uri != null) {
        if (uri.toString().contains('attaqwa://paydunya/success')) {
          handlePaymentSuccess();
        } else if (uri.toString().contains('attaqwa://paydunya/cancel')) {
          handlePaymentCancel();
        }
      }
    }, onError: (err) {
      print('Deep link error: $err');
    });
  }

  void handlePaymentSuccess() {
    // Vérifier les entitlements
    checkUserEntitlements();
    // Afficher un message de succès
    showSuccessMessage();
  }

  void handlePaymentCancel() {
    // Afficher un message d'annulation
    showCancelMessage();
  }

  void dispose() {
    _subscription?.cancel();
  }
}
```

## 🔐 **Gestion des tokens et sécurité**

### **1. Stockage sécurisé des tokens**
```javascript
// React Native avec AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const storePaymentToken = async (token) => {
  try {
    await AsyncStorage.setItem('payment_token', token);
  } catch (error) {
    console.error('Erreur stockage token:', error);
  }
};

const getPaymentToken = async () => {
  try {
    return await AsyncStorage.getItem('payment_token');
  } catch (error) {
    console.error('Erreur récupération token:', error);
    return null;
  }
};
```

### **2. Vérification des entitlements**
```javascript
const checkUserEntitlements = async (userId) => {
  try {
    const response = await fetch(`https://votre-api.vercel.app/api/entitlements?userId=${userId}`);
    const data = await response.json();
    
    if (data.access.part2 && data.access.part3) {
      // L'utilisateur a accès aux parties 2 et 3
      unlockContent();
    } else {
      // L'utilisateur n'a pas encore accès
      showPaymentPrompt();
    }
  } catch (error) {
    console.error('Erreur vérification entitlements:', error);
  }
};
```

## 📊 **Gestion des états de paiement**

### **États possibles**
1. **pending** : Paiement en cours
2. **completed** : Paiement réussi
3. **cancelled** : Paiement annulé
4. **failed** : Paiement échoué

### **Polling pour vérifier le statut**
```javascript
const pollPaymentStatus = async (token, maxAttempts = 10) => {
  let attempts = 0;
  
  const poll = async () => {
    try {
      const response = await fetch(`https://votre-api.vercel.app/api/payment-status?token=${token}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        handlePaymentSuccess();
        return;
      } else if (data.status === 'cancelled' || data.status === 'failed') {
        handlePaymentFailure(data.status);
        return;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000); // Poll toutes les 2 secondes
      }
    } catch (error) {
      console.error('Erreur polling:', error);
    }
  };
  
  poll();
};
```

## 🚀 **API Endpoints pour Mobile**

### **1. Créer un paiement**
```
POST /api/test-paydunya
{
  "userId": "string",
  "amount": number,
  "itemName": "string"
}
```

### **2. Vérifier les entitlements**
```
GET /api/entitlements?userId=string
```

### **3. Vérifier le statut d'un paiement**
```
GET /api/payment-status?token=string
```

## 🔧 **Configuration pour la production**

### **Variables d'environnement**
```bash
# Production
PAYDUNYA_ENV=live
PAYDUNYA_MASTER_KEY=votre_clé_production
PAYDUNYA_PRIVATE_KEY=votre_clé_privée_production
PAYDUNYA_TOKEN=votre_token_production
PAYDUNYA_RETURN_URL=attaqwa://paydunya/success
PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel
NEXT_PUBLIC_BASE_URL=https://votre-api.vercel.app
```

### **URL IPN pour PayDunya**
```
https://votre-api.vercel.app/api/paydunya/ipn
```

## 📱 **Exemple d'implémentation complète**

### **React Native**
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Linking } from 'react-native';

const PaymentScreen = ({ userId }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkEntitlements();
    setupDeepLinkHandler();
  }, []);

  const checkEntitlements = async () => {
    try {
      const response = await fetch(`https://votre-api.vercel.app/api/entitlements?userId=${userId}`);
      const data = await response.json();
      setHasAccess(data.access.part2 && data.access.part3);
    } catch (error) {
      console.error('Erreur vérification accès:', error);
    }
  };

  const setupDeepLinkHandler = () => {
    Linking.addEventListener('url', handleDeepLink);
  };

  const handleDeepLink = (url) => {
    if (url.includes('attaqwa://paydunya/success')) {
      Alert.alert('Succès', 'Paiement effectué avec succès !');
      checkEntitlements(); // Re-vérifier les accès
    } else if (url.includes('attaqwa://paydunya/cancel')) {
      Alert.alert('Annulé', 'Paiement annulé');
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://votre-api.vercel.app/api/test-paydunya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: 15000,
          itemName: "Accès Livre Partie 2 & 3"
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Linking.openURL(data.checkout_url);
      } else {
        Alert.alert('Erreur', 'Impossible de créer le paiement');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      {hasAccess ? (
        <Text>Vous avez accès aux parties 2 et 3 !</Text>
      ) : (
        <TouchableOpacity onPress={handlePayment} disabled={isLoading}>
          <Text>{isLoading ? 'Chargement...' : 'Acheter l\'accès (15000 FCFA)'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

## ✅ **Points clés pour l'intégration mobile**

1. **Deep Links** : Configurez `attaqwa://` dans votre app
2. **Gestion des retours** : Écoutez les deep links de retour
3. **Vérification des entitlements** : Polling ou vérification après retour
4. **Gestion d'erreurs** : Gestion robuste des erreurs réseau
5. **UX** : Feedback utilisateur pendant le processus de paiement
6. **Sécurité** : Stockage sécurisé des tokens sensibles 