# 📱 Guide d'Intégration Mobile - Firebase + PayDunya

## 🔐 Authentification Firebase

L'app mobile utilise déjà Firebase Auth. Le backend vérifie maintenant les tokens Firebase pour sécuriser les APIs.

### Utilisation du Service de Paiement

```typescript
import { usePaymentService } from '../lib/paymentService';

function PaymentScreen() {
  const { 
    checkEntitlements, 
    createPayment, 
    openPayDunyaCheckout 
  } = usePaymentService();

  const handlePayment = async () => {
    try {
      // 1. Vérifier les accès actuels
      const entitlements = await checkEntitlements();
      console.log('Accès actuels:', entitlements);
      
      if (entitlements.part2) {
        alert('Vous avez déjà accès à la Partie 2');
        return;
      }

      // 2. Créer le paiement
      const payment = await createPayment('BOOK_PART_2');
      
      if (payment.success && payment.checkoutUrl) {
        // 3. Ouvrir PayDunya
        await openPayDunyaCheckout(payment.checkoutUrl);
      } else {
        alert('Erreur: ' + payment.error);
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      alert('Erreur lors du paiement');
    }
  };

  return (
    <Button onPress={handlePayment} title="Acheter Partie 2" />
  );
}
```

### Vérification des Accès

```typescript
import { usePaymentService } from '../lib/paymentService';

function BookScreen() {
  const [entitlements, setEntitlements] = useState({ part2: false, part3: false });
  const { checkEntitlements } = usePaymentService();

  useEffect(() => {
    const loadEntitlements = async () => {
      try {
        const access = await checkEntitlements();
        setEntitlements(access);
      } catch (error) {
        console.error('Erreur chargement accès:', error);
      }
    };

    loadEntitlements();
  }, []);

  return (
    <View>
      {entitlements.part2 ? (
        <Text>✅ Partie 2 débloquée</Text>
      ) : (
        <Text>🔒 Partie 2 verrouillée</Text>
      )}
    </View>
  );
}
```

## 🔄 Gestion des Deep Links

L'app mobile gère déjà les deep links PayDunya. Assurez-vous que `App.tsx` contient :

```typescript
// Dans App.tsx
const handleUrl = (url?: string | null) => {
  if (!url) return;
  const parsed = Linking.parse(url);
  
  // Gestion des deep links PayDunya
  if (parsed?.hostname === 'paydunya') {
    const action = parsed?.path;
    
    if (action === 'success') {
      console.log('🎉 Paiement PayDunya réussi !');
      // Recharger les entitlements
      // Naviguer vers l'écran de succès
    } else if (action === 'cancel') {
      console.log('❌ Paiement PayDunya annulé');
      // Naviguer vers l'écran d'annulation
    }
  }
};
```

## 🚀 Variables d'Environnement

Ajoutez dans votre `.env` ou `app.config.js` :

```javascript
// app.config.js
export default {
  expo: {
    // ...
    extra: {
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://attaqwa-paiement.vercel.app',
    },
  },
};
```

## 🔧 Dépannage

### Erreur "Utilisateur non connecté"
- Vérifiez que l'utilisateur est connecté via Firebase Auth
- Vérifiez que `auth.currentUser` n'est pas null

### Erreur 401 "Unauthorized"
- Vérifiez que le token Firebase est valide
- Vérifiez que l'utilisateur est bien connecté

### Erreur réseau
- Vérifiez `EXPO_PUBLIC_BACKEND_URL`
- Vérifiez la connexion internet

## 📊 Structure des Réponses

### GET /api/entitlements
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
    }
  ]
}
```

### POST /api/paydunya/checkout
```json
{
  "paymentId": 123,
  "token": "paydunya_token",
  "checkout_url": "https://checkout.paydunya.com/..."
}
```

## 🔒 Sécurité

- ✅ Tokens Firebase vérifiés côté serveur
- ✅ Aucune clé PayDunya exposée côté client
- ✅ Rate limiting sur les APIs
- ✅ Logs d'audit complets

## 🎯 Prochaines Étapes

1. **Tester l'intégration** avec un utilisateur connecté
2. **Configurer les deep links** PayDunya
3. **Déployer en production** avec les vraies clés PayDunya
4. **Monitorer les logs** pour détecter les problèmes

---

**Note**: Le backend utilise maintenant Firebase Admin SDK pour vérifier les tokens. Assurez-vous que l'utilisateur est connecté avant d'appeler les APIs de paiement. 