📋 Modules et Fonctionnalités
1. Dashboard (Page d'accueil)
Tableau de bord centralisé affichant :

Statistiques globales (5 cartes)
Nombre total de races
Nombre total de lots
Lots actifs
Enregistrements de mortalités
Collectes d'œufs
Situation détaillée d'un lot
Sélecteur de lot avec KPI groupés en 5 catégories :

Élevage : effectif initial/actuel, total morts
Poids : semaine actuelle, poids moyen (g), poids total (kg)
Alimentation : nourriture consommée (kg), coût (Ar)
Revenus : ventes poulets + œufs, coût d'achat
Bilan : bénéfice coloré (vert/rouge)
Formule bénéfice :
B
e
ˊ
n
e
ˊ
fice
=
Revenus poulets
+
Revenus œufs
−
Co
u
ˆ
t nourriture
−
Co
u
ˆ
t achat
B 
e
ˊ
 n 
e
ˊ
 fice=Revenus poulets+Revenus œufs−Co 
u
ˆ
 t nourriture−Co 
u
ˆ
 t achat

Tableau récapitulatif
Liste de tous les lots avec colonnes cliquables (interaction dynamique)

2. Gestion des Races (/races)
CRUD complet : créer, lire, modifier, supprimer
Paramètres économiques :
Prix nourriture (Ar/g)
Prix vente poulet (Ar/g)
Prix vente œuf (Ar)
Paramètres biologiques :
Semaine de début de ponte
Durée d'incubation (jours)
3. Modèle de Croissance (/croissance)
Table de croissance semaine par semaine pour chaque race :

Semaine 0 : poids initial du poussin (g)
Semaines 1-N : gain de poids hebdomadaire (g)
Consommation : nourriture par poulet par semaine (g)
Calcul interpolé au jour près :

Poids moyen = poids complet des semaines révolues + interpolation linéaire de la semaine en cours
Nourriture totale = idem avec consommation cumulée
4. Gestion des Lots (/lots)
Groupes de poulets d'une même race entrés à la même date.

Champs
Numéro (ex : "Lot 1")
Race
Nombre initial
Date d'entrée
Lot parent (si issu d'incubation)
Statut : Actif / Fermé
Calcul automatique
Semaine actuelle : floor((maintenant - date_entrée) / 7 jours)
Effectif actuel : initial - morts - vendus
Poids moyen : calculé selon le modèle de croissance
Coût nourriture : nourriture totale × prix/g
5. Enregistrement des Mortalités (/mortalites)
Lot concerné
Date
Nombre de morts (min: 1)
Validation : vérifie que le stock de poulets vivants est suffisant
6. Collecte des Œufs (/oeufs)
Lot source
Date de collecte
Nombre d'œufs
Vérification : lot doit avoir atteint la semaine de ponte de sa race
7. Incubations (/incubations)
Workflow complet
Création :

Sélection d'une collecte d'œufs
Nombre à incuber
Date de début
Calcul auto : date d'éclosion = début + durée d'incubation de la race
Statuts :

en_cours : pendant l'incubation
eclos : création automatique d'un nouveau lot
echoue : incubation ratée
Éclosion (statut = eclos) :

Créer automatiquement un lot avec :
Numéro : Ecl-{parent}-{YYMMDD} (ex: "Ecl-Lot2-250417")
Même race que le parent
Effectif = nombre d'œufs incubés
lot_parent_id = lot source
Lier le nouveau lot à l'incubation
Transaction atomique SQL pour garantir la cohérence.

8. Vente d'Œufs (/vente-oeufs)
Sélection d'une collecte
Nombre d'œufs vendus
Prix unitaire (prérempli depuis la race)
Date de vente
Montant total auto-calculé : nombre × prix unitaire
Validation : stock disponible = collectés - incubés - déjà vendus
9. Vente de Poulets (/vente-poulets)
Lot concerné
Nombre de poulets vendus
Poids moyen au moment de la vente (g)
Prix de vente (Ar/g) prérempli depuis la race
Montant total : nombre × poids moyen × prix/g
Validation : stock disponible = effectif actuel - déjà vendus
10. Coûts d'Achat (/cout-achat)
Enregistrement des coûts d'achat initiaux des lots :

Lot concerné
Coût total (Ar)
Date d'achat
Notes optionnelles
11. Simulation / Test
Module de simulation pour tester l'application sans affecter les données réelles (selon simulation.js).

🎯 Fonctionnalités Transversales
Validations intelligentes côté backend
Vérification des stocks avant vente/mortalité
Validation des dates (semaine de ponte, etc.)
Calculs de disponibilité pour œufs et poulets
Calculs financiers automatiques
Coût nourriture basé sur consommation réelle
Revenus calculés selon poids et prix au moment de la vente
Bénéfice en temps réel par lot
Traçabilité complète
Lignée parent-enfant (incubations → nouveaux lots)
Historique des ventes, mortalités, collectes
Vue consolidée par lot
Architecture moderne
API REST complète avec 10 endpoints
SSR Angular 21 pour performance et SEO
Lazy loading des composants
Responsive design avec SCSS
🗄️ Base de Données
9 tables relationnelles dans SQL Server :

Race
CroissanceRace
Lot
Mortalite
EnregistrementOeufs
Incubation
VenteOeufs
VentePoulets
CoutAchat
Intégrité référentielle complète avec clés étrangères et contraintes.