# Calendriers cAH

Générateur des calendriers annuels des volées du **Centre André Henzelin** à partir d'un
Google Sheets public, avec export **PDF vectoriel**. Interface entièrement en français.
Tout tourne dans le navigateur — **aucun backend, aucune donnée envoyée à un serveur tiers**.

Construit avec **React + Vite + TypeScript + Tailwind** et habillé avec le **design system
cAHIntraV3** (polices Suisse Intl / Euclid Flex, accent doré `#CA9E67`, chrome sidebar/topbar).

## Prérequis : partage du classeur

Le classeur Google Sheets doit être partagé en **« Tout utilisateur disposant du lien : Lecteur »**.
L'application lit chaque onglet par son nom via l'endpoint public gviz
(`/gviz/tq?tqx=out:csv&sheet=…`), directement depuis le navigateur.

Si le fetch est bloqué (CORS ou partage insuffisant), un **import manuel de CSV**
(glisser-déposer, un fichier par onglet) est proposé en secours sur l'écran d'accueil.

## Installation & lancement

```bash
npm install
npm run dev        # serveur de développement (http://localhost:5173)
npm run build      # build de production
npm run test       # tests unitaires (vitest)
npm run check-data # vérifie le parsing contre le vrai classeur public
```

`npm run check-data` charge l'onglet `MTE Salvia 12 2 ans` et affiche le nombre de jours par
module — résultat attendu : **133 jours · M2=76 · M1=45 · MP=12** (nécessite un accès réseau
sortant vers `docs.google.com`).

## Écrans

1. **Accueil** — champ classeur (URL ou ID), « Charger », « Tester la connexion » (✓/✗ par
   onglet), import manuel de CSV en secours.
2. **Tableau de bord** — sélecteur d'année scolaire, bascule « Projection +1 an », volées
   cochables avec total de jours et détail des modules, panneau « Cours à reporter » (collisions
   avec les fériés).
3. **Aperçu** — rendu SVG de la volée sélectionnée (zoom ajusté), navigation précédent/suivant,
   export **« PDF de cette volée »** et **« PDF groupé »**.
4. **Fériés & vacances** — tableaux éditables, mémorisés par année scolaire, bouton
   « Pré-remplir (Vaud) » (fériés calculés par le Computus + Jeûne fédéral).
5. **Configuration** — mapping onglets ↔ programmes, palettes des modules (color pickers),
   textes de pied de page, et **import de polices personnalisées** (Euclid Flex, Suisse Intl,
   Poppins). Tout est persisté en `localStorage`.

### Programmes pris en charge

`MTE`, `AYU`, `PASS`, `TC`, `KINE`, `REFL`, `CRAN`, `MTC`, `HOM`. Chaque programme a sa palette de
modules, sa priorité de module et son pied de page par défaut (éditables) :

- **KINE / REFL / CRAN** (méthodes ORTRA TC) : module éponyme + modules du tronc commun
  (`BP1`, `BP2`, `BS`, `BM1`, `BM2`, `BM3`).
- **MTC / HOM** (ORTRA MA) : modules `M2`, `M1`, `MP`.

### Polices personnalisées

Dans **Configuration → Polices personnalisées**, importe tes fichiers de police
(`.woff2`, `.woff`, `.ttf`, `.otf`) pour **Euclid Flex**, **Suisse Intl** et **Poppins**. Elles sont
mémorisées en `localStorage` et injectées à l'exécution (interface, aperçu, et — pour Poppins —
PDF vectoriel). Recharge la page après l'import pour qu'elles s'appliquent partout.

## Ajouter une nouvelle année / volée

- **Nouvelle année scolaire** : sélectionne-la dans le Tableau de bord ; les fériés vaudois sont
  pré-remplis automatiquement (éditables ensuite dans « Fériés & vacances »).
- **Nouvelle volée** : écran **Configuration → « Ajouter une volée »**, puis renseigne le **nom
  exact de l'onglet**, le programme (`MTE`, `AYU`, `PASS`, `TC`), le titre et le sous-titre.
  Pour une nouvelle année, mappe simplement les nouveaux onglets vers les mêmes programmes.

## Notes techniques

- **Dates** : les dates de la colonne B sont parsées en **fuseau local** (`dd.mm.yyyy`,
  `dd/mm/yyyy`, `yyyy-mm-dd`) — jamais via `new Date(string)` qui interpréterait en UTC.
- **Classification** : le module dominant d'un jour est celui ayant le plus de séances, égalité
  départagée par priorité de programme. Un examen est détecté par
  `examen|évalu|certif|partiel` (sauf « complémentaire »).
- **Projection +1 an** : décale toutes les dates lues de **+364 jours** (préserve les jours de
  semaine). En projection, un cours qui tombe sur un férié (typiquement un férié pascal qui se
  déplace d'une année à l'autre) est **décalé vers une date libre proche** au lieu d'être retiré —
  le **nombre de jours est préservé**. Les décalages sont listés dans un panneau « Cours décalés ».
- **Mercredis 18h–22h en ligne** : les séances du soir / en ligne sont détectées d'après l'horaire
  (colonne D — mot-clé « en ligne » ou heure de début ≥ 17h) et signalées sur le PDF par un point
  sur la pastille + une entrée de légende « 18h–22h en ligne ».
- **Chargement du classeur** : le fetch CSV direct est tenté d'abord ; en cas de blocage CORS, un
  **repli JSONP** sur l'endpoint JSON gviz (chargé via une balise `<script>`, sans tiers) contourne
  le CORS. Si tout échoue, l'import manuel de CSV reste disponible.
- **PDF** : `jspdf` + `svg2pdf.js`, rendu vectoriel, page 1414 × 2000 pleine page. Les polices
  **Poppins** (400/500/600/700) sont chargées à l'exécution depuis le miroir Google Fonts de
  jsDelivr et embarquées dans le PDF ; en cas d'échec réseau, le texte retombe sur la police par
  défaut du PDF (le calendrier reste vectoriel).

## Arborescence

```
src/
  lib/        csv.ts · calendar.ts (+ calendar.test.ts) · render.ts · pdf.ts
  ds/         design system cAH (Icon, Button, Input, Checkbox, Chip, Card, Loader, Sidebar, Topbar)
  screens/    Accueil · Dashboard · Apercu · Feries · Configuration
  store/      AppStore (état global + persistance localStorage)
  components/ CalendarPreview · CsvUpload
  styles/     tokens du design system (colors, fonts, typography, layout)
  assets/     polices (Suisse Intl, Euclid Flex) et logos cAH
  volees.config.ts   volées, palettes, priorités, pieds de page
scripts/check-data.ts  vérification des chiffres de contrôle
```
