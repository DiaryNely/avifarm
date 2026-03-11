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
    nombre_non_eclos INT              NULL,              -- Oeufs non éclos / pourris (renseigné à l'éclosion)
    statut          VARCHAR(20)       DEFAULT 'en_cours' -- 'en_cours', 'eclos', 'echoue'
        CHECK (statut IN ('en_cours', 'eclos', 'echoue')),

    CONSTRAINT FK_Incubation_Oeuf FOREIGN KEY (oeuf_id)      REFERENCES EnregistrementOeufs(oeuf_id),
    CONSTRAINT FK_Incubation_Lot  FOREIGN KEY (lot_issu_id)  REFERENCES Lot(lot_id)
);
GO

ALTER TABLE [Incubation] 
ADD nombre_non_eclos int;
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

-- Race
INSERT INTO Race (nom, prix_nourrit_g, prix_vente_g, prix_oeuf, semaine_ponte, duree_incubation)
VALUES ('Cobb 500', 150, 200, 500, 20, 45);



-- Lot
INSERT INTO Lot (numero, race_id, nombre_initial, date_entree)
VALUES ('Lot 1', 1, 100, '2026-03-09');

-- Coût d'achat
INSERT INTO CoutAchat (lot_id, cout_total, date_achat)
VALUES (1, 500000, '2026-03-09');

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