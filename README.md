# benevoles-quincaillerit

Planning de bénévoles sans compte : on ouvre le lien, on saisit son prénom, on s'inscrit sur un créneau.
Les données sont un unique JSON (`planning.json`) stocké dans un Vercel Blob privé.

## Mise en route

1. Créer un store Blob **privé** relié au projet Vercel (onglet Storage, ou `vercel blob create-store <nom> --access private --yes`).
2. `vercel env pull .env.local` pour récupérer les variables Blob en local.
3. `npm install`, puis `vercel dev` (sert le front et `/api/planning`).

Le blob est créé automatiquement au premier appel de l'API : un créneau 8h-13h chaque samedi et dimanche, d'aujourd'hui jusqu'au 31/12/2027.
`npm run seed` force cette création sans ouvrir le site ; il n'écrase jamais un planning existant.