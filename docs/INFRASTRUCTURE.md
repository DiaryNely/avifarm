# AviFarm — Infrastructure Docker

> [← Index](PROJECT.md)

---

## 1. Vue d'ensemble

| Composant | Technologie | Port |
|-----------|-------------|------|
| Base de données | SQL Server 2022 Express (Docker) | 1433 |
| Backend API | Node.js 20 (natif) | 3000 |
| Frontend | Angular 21 SSR (natif) | 4200 |

---

## 2. docker-compose.yml

Deux services Docker :

| Service | Image | Rôle |
|---------|-------|------|
| `sqlserver` | `mcr.microsoft.com/mssql/server:2022-latest` | SQL Server Express, persistant |
| `db-init` | même image | Script d'initialisation (s'exécute une seule fois) |

Le service `db-init` attend que `sqlserver` soit sain (healthcheck `SELECT 1`) avant d'exécuter le script SQL.

### Volume persistant

| Volume | Montage | Contenu |
|--------|---------|---------|
| `sqlserver_data` | `/var/opt/mssql` | Données SQL Server |

---

## 3. Répertoire `docker/init/`

| Fichier | Rôle |
|--------|------|
| `database.sql` | Création idempotente des tables, vues, et données de test |
| `init.sh` | Script Bash : attend SQL Server prêt, puis exécute le .sql |

### Idempotence

Les deux fichiers sont conçus pour être rejoués sans erreur :
- `init.sh` : vérifie si la base `ElevagePoulets` existe déjà avant d'exécuter `database.sql`
- `database.sql` : utilise `IF NOT EXISTS` / `IF OBJECT_ID(...) IS NULL` sur chaque table

**Important** : `init.sh` doit avoir des fins de lignes **LF** (Unix) — ne pas éditer sous Windows sans convertir. Si le container `db-init` échoue avec `\r: not found`, reconvertir avec :
```bash
dos2unix docker/init/init.sh
```

---

## 4. Variables d'environnement (`.env` backend)

```env
PORT=3000
DB_USER=sa
DB_PASSWORD=AviFarm@2024!
DB_SERVER=localhost
DB_NAME=ElevagePoulets
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

---

## 5. Commandes Docker

```bash
# Démarrer la base de données
docker compose up -d

# Voir les logs d'initialisation
docker compose logs db-init

# Arrêter
docker compose down

# Reset complet (supprime les données)
docker compose down -v
```

---

## 6. Démarrage complet

```bash
# 1. Démarrer la BDD
docker compose up -d

# 2. Démarrer le backend (dans /backend)
npm run dev        # développement (nodemon)
npm start          # production

# 3. Démarrer le frontend (dans /frontend)
ng serve           # développement (port 4200)
ng build           # build production
node dist/frontend/server/server.mjs   # SSR
```

---

## 7. Données de test incluses

La base est initialisée avec :

| Entité | Données |
|--------|---------|
| Races | R1 (ponte sem. 20, incubation 45j), R2 (ponte sem. 22, incubation 42j) |
| Lots | Lot 1 (500 poulets R1, 04/03/2025), Lot 2 (3000 poulets R1, 01/02/2025), Lot 3 (1000 poulets R2, 15/01/2025) |
| Coûts d'achat | Lot 1 : 750 000 Ar, Lot 2 : 4 500 000 Ar, Lot 3 : 1 200 000 Ar |
| Mortalités | Lot 2 : 20 morts le 10/02, 30 morts le 20/02 (maladie) |
| Oeufs | Lot 2 : 20, 35, 40 oeufs sur 3 jours |
| Ventes oeufs | Vente des 2 premiers enregistrements à 500 Ar/oeuf |
| Incubation | 40 oeufs du 03/03/2025, éclosion prévue le 17/04/2025, statut : `en_cours` |
