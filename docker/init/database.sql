-- ============================================================
--  BASE DE DONNÉES : GESTION D'ÉLEVAGE DE POULETS
--  SQL Server
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'ElevagePoulets')
    DROP DATABASE ElevagePoulets;
GO

CREATE DATABASE ElevagePoulets;
GO

USE ElevagePoulets;
GO

-- ============================================================
--  TABLE : Race
--  Définit les caractéristiques de chaque race de poulet
-- ============================================================
CREATE TABLE Race (
    race_id         INT IDENTITY(1,1) PRIMARY KEY,
    nom             VARCHAR(50)       NOT NULL UNIQUE,
    prix_nourrit_g  DECIMAL(10,2)     NOT NULL,   -- Prix nourriture en Ar/g
    prix_vente_g    DECIMAL(10,2)     NOT NULL,   -- Prix vente poulet en Ar/g
    prix_oeuf       DECIMAL(10,2)     NOT NULL,   -- Prix vente d'un oeuf en Ar
    semaine_ponte   INT               NOT NULL,   -- Semaine à partir de laquelle la ponte commence
    duree_incubation INT              NOT NULL,   -- Durée d'incubation en jours
    date_creation   DATETIME          DEFAULT GETDATE()
);
GO

-- ============================================================
--  TABLE : CroissanceRace
--  Modèle de croissance semaine par semaine par race
-- ============================================================
CREATE TABLE CroissanceRace (
    croissance_id   INT IDENTITY(1,1) PRIMARY KEY,
    race_id         INT               NOT NULL,
    semaine         INT               NOT NULL,   -- Numéro de semaine (0, 1, 2, ...)
    poids_initial   DECIMAL(10,2)     NULL,       -- Poids en g (uniquement semaine 0)
    gain_poids      DECIMAL(10,2)     NULL,       -- Gain de poids en g (semaines > 0)
    nourrit_semaine DECIMAL(10,2)     NOT NULL,   -- Nourriture consommée en g par poulet

    CONSTRAINT FK_CroissanceRace_Race FOREIGN KEY (race_id) REFERENCES Race(race_id),
    CONSTRAINT UQ_CroissanceRace UNIQUE (race_id, semaine)
);
GO

-- ============================================================
--  TABLE : Lot
--  Représente un groupe de poulets identiques
-- ============================================================
CREATE TABLE Lot (
    lot_id          INT IDENTITY(1,1) PRIMARY KEY,
    numero          VARCHAR(20)       NOT NULL UNIQUE,   -- Ex : "Lot 1"
    race_id         INT               NOT NULL,
    nombre_initial  INT               NOT NULL,          -- Nombre de poulets à l'entrée
    date_entree     DATE              NOT NULL,
    lot_parent_id   INT               NULL,              -- Si ce lot vient d'une incubation
    actif           BIT               DEFAULT 1,         -- 1 = actif, 0 = fermé/vendu
    date_creation   DATETIME          DEFAULT GETDATE(),

    CONSTRAINT FK_Lot_Race   FOREIGN KEY (race_id)      REFERENCES Race(race_id),
    CONSTRAINT FK_Lot_Parent FOREIGN KEY (lot_parent_id) REFERENCES Lot(lot_id)
);
GO

-- ============================================================
--  TABLE : Mortalite
--  Enregistre les morts dans un lot (par date)
-- ============================================================
CREATE TABLE Mortalite (
    mortalite_id    INT IDENTITY(1,1) PRIMARY KEY,
    lot_id          INT               NOT NULL,
    date_mort       DATE              NOT NULL,
    nombre_morts    INT               NOT NULL DEFAULT 1,
    cause           VARCHAR(200)      NULL,

    CONSTRAINT FK_Mortalite_Lot FOREIGN KEY (lot_id) REFERENCES Lot(lot_id)
);
GO

-- ============================================================
--  TABLE : EnregistrementOeufs
--  Recensement quotidien des oeufs produits par un lot
-- ============================================================
CREATE TABLE EnregistrementOeufs (
    oeuf_id         INT IDENTITY(1,1) PRIMARY KEY,
    lot_id          INT               NOT NULL,
    date_collecte   DATE              NOT NULL,
    nombre_oeufs    INT               NOT NULL,

    CONSTRAINT FK_Oeufs_Lot FOREIGN KEY (lot_id) REFERENCES Lot(lot_id)
);
GO

-- ============================================================
--  TABLE : Incubation
--  Trace les oeufs mis en incubation → génère un nouveau lot
-- ============================================================
CREATE TABLE Incubation (
    incubation_id   INT IDENTITY(1,1) PRIMARY KEY,
    oeuf_id         INT               NOT NULL,          -- Enregistrement d'oeufs source
    nombre_incubes  INT               NOT NULL,          -- Nombre d'oeufs incubés
    date_debut      DATE              NOT NULL,          -- Début d'incubation
    date_eclosion   DATE              NOT NULL,          -- Calculé : date_debut + duree_incubation
    lot_issu_id     INT               NULL,              -- Lot créé après éclosion
    statut          VARCHAR(20)       DEFAULT 'en_cours' -- 'en_cours', 'eclos', 'echoue'
        CHECK (statut IN ('en_cours', 'eclos', 'echoue')),

    CONSTRAINT FK_Incubation_Oeuf FOREIGN KEY (oeuf_id)      REFERENCES EnregistrementOeufs(oeuf_id),
    CONSTRAINT FK_Incubation_Lot  FOREIGN KEY (lot_issu_id)  REFERENCES Lot(lot_id)
);
GO

-- ============================================================
--  TABLE : VenteOeufs
--  Enregistre les ventes d'oeufs
-- ============================================================
CREATE TABLE VenteOeufs (
    vente_id        INT IDENTITY(1,1) PRIMARY KEY,
    oeuf_id         INT               NOT NULL,          -- Enregistrement source
    nombre_vendus   INT               NOT NULL,
    prix_unitaire   DECIMAL(10,2)     NOT NULL,          -- Prix au moment de la vente
    date_vente      DATE              NOT NULL,
    montant_total   AS (nombre_vendus * prix_unitaire),  -- Colonne calculée

    CONSTRAINT FK_VenteOeufs_Oeuf FOREIGN KEY (oeuf_id) REFERENCES EnregistrementOeufs(oeuf_id)
);
GO

-- ============================================================
--  TABLE : VentePoulets
--  Enregistre les ventes de poulets d'un lot
-- ============================================================
CREATE TABLE VentePoulets (
    vente_id        INT IDENTITY(1,1) PRIMARY KEY,
    lot_id          INT               NOT NULL,
    date_vente      DATE              NOT NULL,
    nombre_vendus   INT               NOT NULL,
    poids_moyen_g   DECIMAL(10,2)     NOT NULL,          -- Poids moyen au moment de la vente
    prix_vente_g    DECIMAL(10,2)     NOT NULL,          -- Prix par gramme au moment de la vente
    montant_total   AS (nombre_vendus * poids_moyen_g * prix_vente_g),

    CONSTRAINT FK_VentePoulets_Lot FOREIGN KEY (lot_id) REFERENCES Lot(lot_id)
);
GO

-- ============================================================
--  TABLE : CoutAchat
--  Coût d'achat initial des poussins d'un lot
-- ============================================================
CREATE TABLE CoutAchat (
    achat_id        INT IDENTITY(1,1) PRIMARY KEY,
    lot_id          INT               NOT NULL UNIQUE,
    cout_total      DECIMAL(15,2)     NOT NULL,          -- Coût d'achat total du lot en Ar
    date_achat      DATE              NOT NULL,
    notes           VARCHAR(300)      NULL,

    CONSTRAINT FK_CoutAchat_Lot FOREIGN KEY (lot_id) REFERENCES Lot(lot_id)
);
GO


-- ============================================================
--  VUE : v_NombreActuelPoulets
--  Nombre de poulets vivants actuellement dans chaque lot
-- ============================================================
CREATE VIEW v_NombreActuelPoulets AS
SELECT
    l.lot_id,
    l.numero,
    l.nombre_initial,
    ISNULL(SUM(m.nombre_morts), 0)              AS total_morts,
    l.nombre_initial - ISNULL(SUM(m.nombre_morts), 0) AS nombre_actuel
FROM Lot l
LEFT JOIN Mortalite m ON l.lot_id = m.lot_id
GROUP BY l.lot_id, l.numero, l.nombre_initial;
GO

-- ============================================================
--  NOTE : Les fonctions fn_PoidsParSemaine, fn_NourritureParSemaine
--  et la vue v_SituationLot ont été supprimées.
--  Les calculs métier sont maintenant effectués côté backend (Node.js).
-- ============================================================


-- ============================================================
--  DONNÉES DE TEST
-- ============================================================

-- Races
INSERT INTO Race (nom, prix_nourrit_g, prix_vente_g, prix_oeuf, semaine_ponte, duree_incubation)
VALUES
    ('R1', 150, 200, 500, 20, 45),
    ('R2', 120, 180, 450, 22, 42);

-- Modèle de croissance R1
INSERT INTO CroissanceRace (race_id, semaine, poids_initial, gain_poids, nourrit_semaine)
VALUES
    (1, 0, 150,  NULL, 0),
    (1, 1, NULL, 30,   60),
    (1, 2, NULL, 40,   60),
    (1, 3, NULL, 50,   80),
    (1, 4, NULL, 60,   80),
    (1, 5, NULL, 70,   100),
    (1, 6, NULL, 80,   100);

-- Modèle de croissance R2
INSERT INTO CroissanceRace (race_id, semaine, poids_initial, gain_poids, nourrit_semaine)
VALUES
    (2, 0, 130,  NULL, 0),
    (2, 1, NULL, 25,   55),
    (2, 2, NULL, 35,   55),
    (2, 3, NULL, 45,   75),
    (2, 4, NULL, 55,   75),
    (2, 5, NULL, 65,   95);

-- Lots
INSERT INTO Lot (numero, race_id, nombre_initial, date_entree)
VALUES
    ('Lot 1', 1, 500,  '2025-03-04'),
    ('Lot 2', 1, 3000, '2025-02-01'),
    ('Lot 3', 2, 1000, '2025-01-15');

-- Coût d'achat
INSERT INTO CoutAchat (lot_id, cout_total, date_achat)
VALUES
    (1, 750000,   '2025-03-04'),
    (2, 4500000,  '2025-02-01'),
    (3, 1200000,  '2025-01-15');

-- Mortalité
INSERT INTO Mortalite (lot_id, date_mort, nombre_morts, cause)
VALUES
    (2, '2025-02-10', 20, 'Maladie'),
    (2, '2025-02-20', 30, 'Maladie');

-- Enregistrement oeufs (Lot 2 pond depuis semaine 20+)
INSERT INTO EnregistrementOeufs (lot_id, date_collecte, nombre_oeufs)
VALUES
    (2, '2025-03-01', 20),
    (2, '2025-03-02', 35),
    (2, '2025-03-03', 40);

-- Vente d'oeufs
INSERT INTO VenteOeufs (oeuf_id, nombre_vendus, prix_unitaire, date_vente)
VALUES
    (1, 20, 500, '2025-03-01'),
    (2, 35, 500, '2025-03-02');

-- Incubation (50 oeufs du jour 3 incubés)
INSERT INTO Incubation (oeuf_id, nombre_incubes, date_debut, date_eclosion, statut)
VALUES
    (3, 40, '2025-03-03', '2025-04-17', 'en_cours');

GO

-- ============================================================
--  REQUÊTES UTILES
-- ============================================================

-- La situation des lots est désormais calculée côté backend (Node.js)

-- Voir la croissance d'une race semaine par semaine
-- SELECT race_id, semaine, poids_initial, gain_poids, nourrit_semaine
-- FROM CroissanceRace WHERE race_id = 1 ORDER BY semaine;

-- Voir les oeufs produits par lot
-- SELECT l.numero, e.date_collecte, e.nombre_oeufs
-- FROM EnregistrementOeufs e
-- JOIN Lot l ON e.lot_id = l.lot_id
-- ORDER BY l.numero, e.date_collecte;

-- Voir les incubations en cours
-- SELECT i.*, l.numero AS lot_source
-- FROM Incubation i
-- JOIN EnregistrementOeufs e ON i.oeuf_id = e.oeuf_id
-- JOIN Lot l ON e.lot_id = l.lot_id
-- WHERE i.statut = 'en_cours';

PRINT 'Base de données ElevagePoulets créée avec succès !';
GO