This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your environment variables in `.env.local`:
   - Add your PayDunya API keys
   - Set `NEXT_PUBLIC_BASE_URL` to your Vercel deployment URL
   - Configure your PostgreSQL connection string

3. For production deployment on Vercel:
   - Go to your Vercel project settings
   - Add all environment variables in the "Environment Variables" section
   - Never commit `.env.local` to version control

## Intégration PayDunya

### Configuration

1. Configurez `NEXT_PUBLIC_BASE_URL` avec l'URL de votre déploiement Vercel (ex: https://attaqwa-paiement.vercel.app)

2. Sur PayDunya → Intégrer notre API → IPN:
   - **Endpoint IPN**: `https://attaqwa-paiement.vercel.app/api/paydunya/ipn`
   - **Activer**: Oui

### Flux de paiement

1. **Création de facture**: `POST /api/test-paydunya`
2. **Paiement**: L'utilisateur paie via PayDunya
3. **Webhook IPN**: PayDunya notifie `POST /api/paydunya/ipn`
4. **Déblocage**: Les entitlements sont mis à jour automatiquement

### API Endpoints

- `GET /api/entitlements?userId=xxx` - Vérifier les accès utilisateur
- `POST /api/test-paydunya` - Créer une facture PayDunya
- `POST /api/paydunya/ipn` - Webhook PayDunya (automatique)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
