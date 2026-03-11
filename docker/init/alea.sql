INSERT INTO Race 
(nom, prix_nourrit_g, prix_vente_g, prix_oeuf, semaine_ponte, duree_incubation)
VALUES
('Borbonèze', 5, 15, 500, 30, 21);
INSERT INTO CroissanceRace 
(race_id, semaine, poids_initial, gain_poids, nourrit_semaine)
VALUES
(1,0,50,NULL,0),

(1,1,NULL,20,75),
(1,2,NULL,25,80),
(1,3,NULL,30,100),
(1,4,NULL,40,150),
(1,5,NULL,80,170),
(1,6,NULL,85,190),
(1,7,NULL,100,200),
(1,8,NULL,100,250),
(1,9,NULL,90,270),
(1,10,NULL,140,290),
(1,11,NULL,200,300),
(1,12,NULL,220,370),
(1,13,NULL,265,390),
(1,14,NULL,285,350),
(1,15,NULL,300,300),
(1,16,NULL,350,450),
(1,17,NULL,400,500),
(1,18,NULL,420,400),
(1,19,NULL,430,500),
(1,20,NULL,500,500),
(1,21,NULL,530,650),
(1,22,NULL,600,600),
(1,23,NULL,400,750),
(1,24,NULL,100,750),
(1,25,NULL,0,600);

INSERT INTO Lot (numero, race_id, nombre_initial, date_entree)
VALUES
('Lot 9', 1, 500, '2026-01-01');
INSERT INTO Mortalite (lot_id, date_mort, nombre_morts)
VALUES
(1,'2026-02-01',15);
INSERT INTO EnregistrementOeufs (lot_id, date_collecte, nombre_oeufs)
VALUES
(1,'2026-02-02',100),
(1,'2026-02-15',150);