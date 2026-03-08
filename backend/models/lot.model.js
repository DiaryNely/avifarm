const { sql, getPool } = require('../config/db');

// ── Helpers calcul métier ──────────────────────────────────

function weeksBetween(dateEntree) {
  const ms = Date.now() - new Date(dateEntree).getTime();
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

function computePoidsMoyen(croissance, semaine) {
  let poids = 0;
  for (const c of croissance) {
    if (c.semaine === 0) poids += parseFloat(c.poids_initial) || 0;
    else if (c.semaine <= semaine) poids += parseFloat(c.gain_poids) || 0;
  }
  return poids;
}

function computeNourritureTotal(croissance, semaine, nombreActuel) {
  let total = 0;
  for (const c of croissance) {
    if (c.semaine <= semaine) total += parseFloat(c.nourrit_semaine) || 0;
  }
  return total * nombreActuel;
}

function buildSituation(lot, mortsMap, croissanceMap, oeufsMap, venteOeufsMap, coutAchatMap, vendusMap, revenuVentePouletsMap) {
  const totalMorts    = mortsMap.get(lot.lot_id) || 0;
  const totalVendus   = vendusMap.get(lot.lot_id) || 0;
  const nombreActuel  = lot.nombre_initial - totalMorts - totalVendus;
  const semaine       = weeksBetween(lot.date_entree);
  const croissance    = croissanceMap.get(lot.race_id) || [];

  const poidsMoyenG   = computePoidsMoyen(croissance, semaine);
  const poidsTotalG   = poidsMoyenG * nombreActuel;
  const valeurPoulets = poidsTotalG * parseFloat(lot.prix_vente_g);
  const nourritTotalG = computeNourritureTotal(croissance, semaine, nombreActuel);
  const coutNourrit   = nourritTotalG * parseFloat(lot.prix_nourrit_g);
  const totalOeufs         = oeufsMap.get(lot.lot_id) || 0;
  const revenuOeufs        = parseFloat(venteOeufsMap.get(lot.lot_id) || 0);
  const coutAchat          = parseFloat(coutAchatMap.get(lot.lot_id) || 0);
  const revenuVentePoulets = parseFloat(revenuVentePouletsMap.get(lot.lot_id) || 0);

  return {
    lot_id:           lot.lot_id,
    numero:           lot.numero,
    race:             lot.race_nom,
    date_entree:      lot.date_entree,
    actif:            lot.actif,
    semaine_actuelle: semaine,
    nombre_actuel:    nombreActuel,
    total_morts:      totalMorts,
    total_vendus:     totalVendus,
    taux_mortalite:   lot.nombre_initial > 0
      ? parseFloat(((totalMorts / lot.nombre_initial) * 100).toFixed(1))
      : 0,
    poids_moyen_g:    poidsMoyenG,
    poids_total_g:    poidsTotalG,
    valeur_poulets_ar: valeurPoulets,
    nourrit_total_g:  nourritTotalG,
    cout_nourrit_ar:  coutNourrit,
    total_oeufs:      totalOeufs,
    revenu_oeufs_ar:         revenuOeufs,
    cout_achat_ar:           coutAchat,
    revenu_vente_poulets_ar: revenuVentePoulets,
    benefice_ar:             revenuVentePoulets + revenuOeufs - coutNourrit - coutAchat,
  };
}

// ── Requêtes brutes (réutilisées par getSituation / getSituationById) ──

async function fetchRawSituationData(pool, lotId) {
  const lotFilter   = lotId != null ? 'WHERE l.lot_id = @lotId' : '';
  const mortsFilter = lotId != null ? 'WHERE lot_id = @lotId' : '';
  const oeufsFilter = lotId != null ? 'WHERE e.lot_id = @lotId' : '';
  const coutFilter  = lotId != null ? 'WHERE lot_id = @lotId' : '';

  const makeReq = () => {
    const r = pool.request();
    if (lotId != null) r.input('lotId', sql.Int, lotId);
    return r;
  };

  const [lots, morts, croissance, oeufs, venteOeufs, coutAchat, ventePoulets] = await Promise.all([
    makeReq().query(`
      SELECT l.lot_id, l.numero, l.race_id, l.nombre_initial, l.date_entree, l.actif,
             r.nom AS race_nom, r.prix_nourrit_g, r.prix_vente_g
      FROM Lot l JOIN Race r ON l.race_id = r.race_id
      ${lotFilter} ORDER BY l.lot_id
    `),
    makeReq().query(`SELECT lot_id, SUM(nombre_morts) AS total_morts FROM Mortalite ${mortsFilter} GROUP BY lot_id`),
    pool.request().query(`SELECT race_id, semaine, poids_initial, gain_poids, nourrit_semaine FROM CroissanceRace ORDER BY race_id, semaine`),
    makeReq().query(`SELECT e.lot_id, SUM(e.nombre_oeufs) AS total_oeufs FROM EnregistrementOeufs e ${oeufsFilter} GROUP BY e.lot_id`),
    makeReq().query(`
      SELECT e.lot_id, SUM(v.nombre_vendus * v.prix_unitaire) AS revenu_oeufs
      FROM VenteOeufs v JOIN EnregistrementOeufs e ON v.oeuf_id = e.oeuf_id
      ${oeufsFilter} GROUP BY e.lot_id
    `),
    makeReq().query(`SELECT lot_id, cout_total FROM CoutAchat ${coutFilter}`),
    makeReq().query(`SELECT lot_id, SUM(nombre_vendus) AS total_vendus, SUM(montant_total) AS revenu_vente FROM VentePoulets ${coutFilter} GROUP BY lot_id`),
  ]);

  const mortsMap       = new Map(morts.recordset.map(m => [m.lot_id, m.total_morts]));
  const oeufsMap       = new Map(oeufs.recordset.map(o => [o.lot_id, o.total_oeufs]));
  const venteOeufsMap  = new Map(venteOeufs.recordset.map(v => [v.lot_id, v.revenu_oeufs]));
  const coutAchatMap          = new Map(coutAchat.recordset.map(c => [c.lot_id, parseFloat(c.cout_total)]));
  const vendusMap             = new Map(ventePoulets.recordset.map(v => [v.lot_id, v.total_vendus]));
  const revenuVentePouletsMap = new Map(ventePoulets.recordset.map(v => [v.lot_id, parseFloat(v.revenu_vente || 0)]));

  const croissanceMap  = new Map();
  for (const row of croissance.recordset) {
    if (!croissanceMap.has(row.race_id)) croissanceMap.set(row.race_id, []);
    croissanceMap.get(row.race_id).push(row);
  }

  return { lots: lots.recordset, mortsMap, croissanceMap, oeufsMap, venteOeufsMap, coutAchatMap, vendusMap, revenuVentePouletsMap };
}

// ── Modèle ─────────────────────────────────────────────────

const Lot = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Lot ORDER BY lot_id');
    return result.recordset;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Lot WHERE lot_id = @id');
    return result.recordset[0] || null;
  },

  // Situation complète — calculs métier côté backend
  async getSituation() {
    const pool = await getPool();
    const { lots, mortsMap, croissanceMap, oeufsMap, venteOeufsMap, coutAchatMap, vendusMap, revenuVentePouletsMap } =
      await fetchRawSituationData(pool);
    return lots.map(lot => buildSituation(lot, mortsMap, croissanceMap, oeufsMap, venteOeufsMap, coutAchatMap, vendusMap, revenuVentePouletsMap));
  },

  async getSituationById(id) {
    const pool = await getPool();
    const { lots, mortsMap, croissanceMap, oeufsMap, venteOeufsMap, coutAchatMap, vendusMap, revenuVentePouletsMap } =
      await fetchRawSituationData(pool, id);
    if (lots.length === 0) return null;
    return buildSituation(lots[0], mortsMap, croissanceMap, oeufsMap, venteOeufsMap, coutAchatMap, vendusMap, revenuVentePouletsMap);
  },

  async create(data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('numero',         sql.VarChar(20), data.numero)
      .input('race_id',        sql.Int,          data.race_id)
      .input('nombre_initial', sql.Int,          data.nombre_initial)
      .input('date_entree',    sql.Date,         data.date_entree)
      .input('lot_parent_id',  sql.Int,          data.lot_parent_id ?? null)
      .query(`
        INSERT INTO Lot (numero, race_id, nombre_initial, date_entree, lot_parent_id)
        OUTPUT INSERTED.*
        VALUES (@numero, @race_id, @nombre_initial, @date_entree, @lot_parent_id)
      `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',             sql.Int,          id)
      .input('numero',         sql.VarChar(20), data.numero)
      .input('race_id',        sql.Int,          data.race_id)
      .input('nombre_initial', sql.Int,          data.nombre_initial)
      .input('date_entree',    sql.Date,         data.date_entree)
      .input('lot_parent_id',  sql.Int,          data.lot_parent_id ?? null)
      .input('actif',          sql.Bit,          data.actif ?? 1)
      .query(`
        UPDATE Lot SET
          numero = @numero, race_id = @race_id, nombre_initial = @nombre_initial,
          date_entree = @date_entree, lot_parent_id = @lot_parent_id, actif = @actif
        OUTPUT INSERTED.*
        WHERE lot_id = @id
      `);
    return result.recordset[0] || null;
  },

  async delete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Lot OUTPUT DELETED.lot_id WHERE lot_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = Lot;
