const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config({ path: '.env.local' });

// Configuration Firebase (même que l'app mobile)
const firebaseConfig = {
  apiKey: "AIzaSyAxEHjynhNxiWP6HFdeWamSFk3YJy0-rto",
  authDomain: "at-taqwa-app-14b7f.firebaseapp.com",
  projectId: "at-taqwa-app-14b7f",
  storageBucket: "at-taqwa-app-14b7f.appspot.com",
  messagingSenderId: "569440550273",
  appId: "1:569440550273:web:70b659a16255e0a643fc80"
};

async function generateTestToken() {
  try {
    console.log('🔥 Génération d\'un token Firebase de test...\n');

    // Initialiser Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Utiliser des credentials de test (vous devez créer cet utilisateur dans Firebase)
    const testEmail = process.env.TEST_FIREBASE_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_FIREBASE_PASSWORD || 'testpassword123';

    console.log(`📧 Tentative de connexion avec: ${testEmail}`);

    // Se connecter
    const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;

    console.log('✅ Connexion réussie!');
    console.log(`👤 UID: ${user.uid}`);
    console.log(`📧 Email: ${user.email}`);

    // Obtenir le token
    const token = await user.getIdToken();
    console.log('\n🎫 Token Firebase généré:');
    console.log('='.repeat(50));
    console.log(token);
    console.log('='.repeat(50));

    // Sauvegarder dans .env.local pour les tests
    const fs = require('fs');
    const envPath = '.env.local';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Ajouter ou mettre à jour TEST_FIREBASE_TOKEN
    if (envContent.includes('TEST_FIREBASE_TOKEN=')) {
      envContent = envContent.replace(/TEST_FIREBASE_TOKEN=.*/g, `TEST_FIREBASE_TOKEN=${token}`);
    } else {
      envContent += `\nTEST_FIREBASE_TOKEN=${token}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('\n💾 Token sauvegardé dans .env.local');

    return token;

  } catch (error) {
    console.error('❌ Erreur lors de la génération du token:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 Solution: Créez un utilisateur de test dans Firebase Console');
      console.log('1. Allez sur https://console.firebase.google.com');
      console.log('2. Sélectionnez votre projet: at-taqwa-app-14b7f');
      console.log('3. Authentication > Users > Add User');
      console.log('4. Créez: test@example.com / testpassword123');
    }
    
    return null;
  }
}

generateTestToken(); 