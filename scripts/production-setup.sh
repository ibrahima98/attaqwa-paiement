#!/bin/bash

# 🚀 Script de Configuration Production - PayDunya
# Usage: ./scripts/production-setup.sh

echo "🚀 Configuration Production PayDunya"
echo "====================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet backend"
    exit 1
fi

print_status "Vérification de l'environnement..."

# Vérifier que git est configuré
if ! git config --get user.name > /dev/null 2>&1; then
    print_error "Git n'est pas configuré. Configurez votre nom et email :"
    echo "git config --global user.name 'Votre Nom'"
    echo "git config --global user.email 'votre.email@example.com'"
    exit 1
fi

# Vérifier que nous sommes sur la branche main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Vous n'êtes pas sur la branche main (actuellement sur $CURRENT_BRANCH)"
    read -p "Voulez-vous continuer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_status "Préparation du déploiement..."

# Vérifier s'il y a des changements non commités
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Il y a des changements non commités"
    git status --short
    
    read -p "Voulez-vous committer ces changements ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Message de commit: " COMMIT_MESSAGE
        git commit -m "$COMMIT_MESSAGE"
    else
        print_error "Veuillez committer vos changements avant de continuer"
        exit 1
    fi
fi

# Pousser vers GitHub
print_status "Poussage vers GitHub..."
if git push origin main; then
    print_success "Code poussé vers GitHub avec succès"
else
    print_error "Erreur lors du push vers GitHub"
    exit 1
fi

echo
echo "📋 Checklist de Production"
echo "=========================="

echo
echo "✅ ÉTAPE 1: Backend Vercel"
echo "---------------------------"
echo "1. Allez sur https://vercel.com/dashboard"
echo "2. Sélectionnez votre projet 'at-taqwa-backend'"
echo "3. Allez dans Settings → Environment Variables"
echo "4. Configurez les variables suivantes :"
echo
echo "   PAYDUNYA_ENV=live"
echo "   PAYDUNYA_MASTER_KEY=votre_clé_master_production"
echo "   PAYDUNYA_PRIVATE_KEY=votre_clé_privée_production"
echo "   PAYDUNYA_TOKEN=votre_token_production"
echo "   PAYDUNYA_RETURN_URL=attaqwa://paydunya/success"
echo "   PAYDUNYA_CANCEL_URL=attaqwa://paydunya/cancel"
echo "   NEXT_PUBLIC_BASE_URL=https://attaqwa-paiement.vercel.app"
echo "   POSTGRES_URL=postgres://neondb_owner:npg_DUw48mozIsXb@ep-icy-boat-adugt8mk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo
echo "✅ ÉTAPE 2: Configuration PayDunya"
echo "-----------------------------------"
echo "1. Connectez-vous à votre dashboard PayDunya Business"
echo "2. Allez dans 'Intégrer notre API'"
echo "3. Sélectionnez votre application 'at-taqwa'"
echo "4. Configurez :"
echo "   - IPN Endpoint: https://attaqwa-paiement.vercel.app/api/paydunya/ipn"
echo "   - Return URL: attaqwa://paydunya/success"
echo "   - Cancel URL: attaqwa://paydunya/cancel"
echo "   - Activer IPN: Oui"

echo
echo "✅ ÉTAPE 3: Test de Production"
echo "------------------------------"
echo "Une fois configuré, testez avec :"
echo
echo "curl \"https://attaqwa-paiement.vercel.app/api/entitlements?userId=test123\""
echo
echo "curl -X POST https://attaqwa-paiement.vercel.app/api/paydunya/checkout \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"amount\": 15000, \"userId\": \"test123\"}'"

echo
echo "✅ ÉTAPE 4: Application Mobile"
echo "------------------------------"
echo "1. Dans votre app mobile, ajoutez :"
echo "   EXPO_PUBLIC_BACKEND_URL=https://attaqwa-paiement.vercel.app"
echo
echo "2. Build de production :"
echo "   eas build --platform android --profile production"
echo "   eas build --platform ios --profile production"

echo
print_success "Configuration de production terminée !"
echo
echo "🎯 Prochaines étapes :"
echo "1. Configurez les variables d'environnement sur Vercel"
echo "2. Configurez PayDunya avec les URLs de production"
echo "3. Testez les APIs de production"
echo "4. Publiez l'app mobile sur les stores"
echo
echo "📚 Documentation complète : PRODUCTION_DEPLOYMENT.md" 