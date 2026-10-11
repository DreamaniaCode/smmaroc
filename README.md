# SMMaroc

Panel Next.js 15 avec SQLite natif (Node.js 22.13 ou plus récent).

## Démarrage

- npm ci
- Copier .env.example vers .env et renseigner JWT_SECRET, ADMIN_INITIAL_EMAIL et ADMIN_INITIAL_PASSWORD.
- npm run dev

Accueil : / ; espace client : /orders/new ; administration : /dashboard.

## Production

npm run build puis npm start. Le worker se lance séparément avec npm run worker. Docker Compose partage le volume /app/data entre le site et le worker. DATABASE_URL=file:/app/data/prod.db configure SQLite ; le schéma est créé automatiquement au démarrage par src/lib/db.ts. Prisma n’est pas utilisé par le serveur.

## Catalogue

Dans Fournisseurs, utiliser Synchroniser les services. La synchronisation importe tous les services valides et recalcule les prix de vente avec une majoration de 80 % du tarif fournisseur (coût × 1,8). Les tarifs USD sont convertis en MAD avec un facteur fixe de 10 ; les tarifs MAD ne sont pas convertis. Pour appliquer cette règle au catalogue existant : `npx tsx scripts/set-rates.ts`. Le catalogue public et privé dispose de recherche et pagination. CLI : npx tsx scripts/sync-catalog.ts.

## Paiements

Dans Paramètres, saisir les coordonnées réelles des méthodes de paiement. Une méthode sans coordonnées reste désactivée. Les références de dépôt sont vérifiées manuellement par un administrateur ; une approbation ne crédite le solde qu’une fois. Aucune passerelle bancaire automatique n’est intégrée.

## Vérification

npx tsx scripts/smoke-test.ts utilise une base temporaire pour vérifier un import de 125 services, une nouvelle synchronisation, les prix de vente, les débits et les dépôts. Aucun achat fournisseur n’est effectué pendant les tests.

Les commandes payées sans solde fournisseur sont conservées en attente de traitement. Le worker les envoie après recharge, sans second débit client. Vérification toutes les 60 secondes : `npm run worker` (worker complet), ou `npx tsx scripts/queue-worker.ts` (file uniquement ; ne pas lancer les deux). Un envoi ambigu reste à vérifier pour éviter un doublon.

Paiements : un RIB commun, Binance Pay et PayPal (+5 % de frais de service). Le montant du portefeuille exclut les frais ; les frais et le total sont recalculés sur le serveur. Les virements classiques indiquent une confirmation pouvant prendre 48 h. Les justificatifs sont privés dans `data/payment-proofs` (à conserver dans le volume de données) et servis uniquement à leur propriétaire ou à un administrateur. Les demandes d’autres moyens de paiement et les réponses administrateur sont disponibles dans Support. Aucun crédit automatique sur simple déclaration de paiement. Test : `npx tsx scripts/payment-test.ts`.
