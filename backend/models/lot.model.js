const { sql, getPool } = require('../config/db');
const sim = require('../simulation');
const Incubation = require('./incubation.model');

function daysBetween(dateEntree, refDate) {
  const ref = refDate ? new Date(refDate) : sim.getDate();
  const ms = ref.getTime() - new Date(dateEntree).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}


function computePoidsMoyen(croissance, jours) {
  const semaineComplete = Math.floor(jours / 7);
  const joursRestants   = jours % 7;           // 0-6

  let poids = 0;
  let gainSemaineSuivante = 0;

  for (const c of croissance) {
    if (c.semaine === 0) {
      poids += parseFloat(c.poids_initial) || 0;
    } else if (c.semaine <= semaineComplete) {
      poids += parseFloat(c.gain_poids) || 0;
    } else if (c.semaine === semaineComplete + 1) {
      gainSemaineSuivante = parseFloat(c.gain_poids) || 0;
    }
  }

  // Pas d'interpolation pendant S0 (les poules ne mangent pas encore)
  if (semaineComplete > 0) {
    poids += gainSemaineSuivante * (joursRestants / 7);
  }

  return Math.round(poids * 100) / 100;
}


function computeNourritureJour(croissance, jours, nombreActuel) {
  const semaineCourante = Math.floor(jours / 7);
  let nourritSemaine = 0;
  for (const c of croissance) {
    if (c.semaine === semaineCourante) {
      nourritSemaine = parseFloat(c.nourrit_semaine) || 0;
      break;
    }
  }
  return (nourritSemaine / 7) * nombreActuel;
}

function computeNourritureTotal(croissance, jours, nombreActuel) {
  const semaineComplete = Math.floor(jours / 7);
  const joursRestants   = jours % 7;

  let total = 0;
  let nourritSemaineCourante = 0;

  for (const c of croissance) {
    if (c.semaine < semaineComplete) {
      total += parseFloat(c.nourrit_semaine) || 0;
    } else if (c.semaine === semaineComplete) {
      nourritSemaineCourante = parseFloat(c.nourrit_semaine) || 0;
    }
  }

  total += nourritSemaineCourante * (joursRestants / 7);

  return total * nombreActuel;
}

function buildSituation(lot, mortsMap, croissanceMap, oeufsMap, coutAchatMap, refDate) {
  const totalMorts    = mortsMap.get(lot.lot_id) || 0;
  const nombreActuel  = lot.nombre_initial - totalMorts;
  const jours         = daysBetween(lot.date_entree, refDate);
  const semaine       = Math.floor(jours / 7);
  const croissance    = croissanceMap.get(lot.race_id) || [];

  const poidsMoyenG   = computePoidsMoyen(croissance, jours);
  const poidsTotalG   = poidsMoyenG * nombreActuel;
  const valeurPoulets = poidsTotalG * parseFloat(lot.prix_vente_g);
  const nourritTotalG = computeNourritureTotal(croissance, jours, nombreActuel);
  const coutNourrit   = nourritTotalG * parseFloat(lot.prix_nourrit_g);
  const nourritJourG  = computeNourritureJour(croissance, jours, nombreActuel);
  const coutNourritJour = nourritJourG * parseFloat(lot.prix_nourrit_g);
  const totalOeufs         = oeufsMap.get(lot.lot_id) || 0;
  const coutAchat          = parseFloat(coutAchatMap.get(lot.lot_id) || 0);
  const valeurOeufs        = totalOeufs * parseFloat(lot.prix_oeuf || 0);
  const valeurEstimeeTotale = valeurPoulets + valeurOeufs;

  return {
    lot_id:           lot.lot_id,
    numero:           lot.numero,
    race:             lot.race_nom,
    date_entree:      lot.date_entree,
    actif:            lot.actif,
    jour_actuel:      jours,
    semaine_actuelle: semaine,
    nombre_actuel:    nombreActuel,
    total_morts:      totalMorts,
    taux_mortalite:   lot.nombre_initial > 0
      ? parseFloat(((totalMorts / lot.nombre_initial) * 100).toFixed(1))
      : 0,
    poids_moyen_g:    poidsMoyenG,
    poids_total_g:    poidsTotalG,
    valeur_poulets_ar: valeurPoulets,
    nourrit_total_g:  nourritTotalG,
    cout_nourrit_ar:  coutNourrit,
    nourrit_jour_g:   nourritJourG,
    cout_nourrit_jour_ar: coutNourritJour,
    total_oeufs:      totalOeufs,
    valeur_oeufs_ar:         valeurOeufs,
    cout_achat_ar:           coutAchat,
    valeur_estimee_totale_ar: valeurEstimeeTotale,
    benefice_estime_ar:       valeurEstimeeTotale - coutNourrit - coutAchat,
  };
}


async function fetchRawSituationData(pool, lotId, refDate) {
  const effectiveRefDate = refDate ? new Date(refDate) : sim.getDate();
  const lotsWhere = [];
  if (lotId != null) lotsWhere.push('l.lot_id = @lotId');
  lotsWhere.push('l.date_entree <= @refDate');
  const lotFilter = lotsWhere.length ? `WHERE ${lotsWhere.join(' AND ')}` : '';
  const mortsWhere = [];
  if (lotId != null) mortsWhere.push('lot_id = @lotId');
  if (refDate) mortsWhere.push('date_mort <= @refDate');
  const mortsFilter = mortsWhere.length ? `WHERE ${mortsWhere.join(' AND ')}` : '';
  const oeufsFilter = lotId != null ? 'WHERE e.lot_id = @lotId' : '';
  const coutFilter  = lotId != null ? 'WHERE lot_id = @lotId' : '';

  const makeReq = () => {
    const r = pool.request();
    if (lotId != null) r.input('lotId', sql.Int, lotId);
    r.input('refDate', sql.Date, effectiveRefDate);
    return r;
  };

  const [lots, morts, croissance, oeufs, coutAchat] = await Promise.all([
    makeReq().query(`
      SELECT l.lot_id, l.numero, l.race_id, l.nombre_initial, l.date_entree, l.actif,
             r.nom AS race_nom, r.prix_nourrit_g, r.prix_vente_g, r.prix_oeuf
      FROM Lot l JOIN Race r ON l.race_id = r.race_id
      ${lotFilter} ORDER BY l.lot_id
    `),
    makeReq().query(`SELECT lot_id, SUM(nombre_morts) AS total_morts FROM Mortalite ${mortsFilter} GROUP BY lot_id`),
    pool.request().query(`SELECT race_id, semaine, poids_initial, gain_poids, nourrit_semaine FROM CroissanceRace ORDER BY race_id, semaine`),
    makeReq().query(`
      SELECT e.lot_id,
             SUM(
               CASE
                 WHEN i.oeuf_id IS NULL THEN e.nombre_oeufs
                 WHEN i.date_eclosion > @refDate THEN i.nombre_incubes
                 ELSE 0
               END
             ) AS total_oeufs
      FROM EnregistrementOeufs e
      JOIN Lot l ON e.lot_id = l.lot_id
      LEFT JOIN Incubation i ON i.oeuf_id = e.oeuf_id
      ${oeufsFilter}
      GROUP BY e.lot_id
    `),
    makeReq().query(`SELECT lot_id, cout_total FROM CoutAchat ${coutFilter}`),
  ]);

  const mortsMap       = new Map(morts.recordset.map(m => [m.lot_id, m.total_morts]));
  const oeufsMap       = new Map(oeufs.recordset.map(o => [o.lot_id, o.total_oeufs]));
  const coutAchatMap          = new Map(coutAchat.recordset.map(c => [c.lot_id, parseFloat(c.cout_total)]));

  const croissanceMap  = new Map();
  for (const row of croissance.recordset) {
    if (!croissanceMap.has(row.race_id)) croissanceMap.set(row.race_id, []);
    croissanceMap.get(row.race_id).push(row);
  }

  return { lots: lots.recordset, mortsMap, croissanceMap, oeufsMap, coutAchatMap };
}


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

  async getSituation(refDate) {
    await Incubation.processAutoEclosions(refDate || sim.getDate());
    const pool = await getPool();
    const { lots, mortsMap, croissanceMap, oeufsMap, coutAchatMap } =
      await fetchRawSituationData(pool, null, refDate);
    return lots.map(lot => buildSituation(lot, mortsMap, croissanceMap, oeufsMap, coutAchatMap, refDate));
  },

  async getSituationById(id, refDate) {
    await Incubation.processAutoEclosions(refDate || sim.getDate());
    const pool = await getPool();
    const { lots, mortsMap, croissanceMap, oeufsMap, coutAchatMap } =
      await fetchRawSituationData(pool, id, refDate);
    if (lots.length === 0) return null;
    return buildSituation(lots[0], mortsMap, croissanceMap, oeufsMap, coutAchatMap, refDate);
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


  async getPoidsAt(lotId, date) {
    const pool = await getPool();
    const lotResult = await pool.request()
      .input('lotId', sql.Int, lotId)
      .query(`
        SELECT l.race_id, l.date_entree, r.prix_vente_g
        FROM Lot l JOIN Race r ON l.race_id = r.race_id
        WHERE l.lot_id = @lotId
      `);
    const lot = lotResult.recordset[0];
    if (!lot) return null;

    const croissanceResult = await pool.request()
      .input('raceId', sql.Int, lot.race_id)
      .query('SELECT semaine, poids_initial, gain_poids FROM CroissanceRace WHERE race_id = @raceId ORDER BY semaine');

    const jours = daysBetween(lot.date_entree, date);
    const poids_moyen_g = computePoidsMoyen(croissanceResult.recordset, jours);
    return { poids_moyen_g, jours, prix_vente_g: parseFloat(lot.prix_vente_g) };
  },

  
  async getPoidsAkoho(raceId, datedebutsakafo, datefinsakafo) {
    const pool = await getPool();

    const raceResult = await pool.request()
      .input('raceId', sql.Int, raceId)
      .query('SELECT race_id, nom, prix_nourrit_g, prix_vente_g FROM Race WHERE race_id = @raceId');
    const race = raceResult.recordset[0];
    if (!race) return null;

    const croissanceResult = await pool.request()
      .input('raceId', sql.Int, raceId)
      .query('SELECT semaine, poids_initial, gain_poids, nourrit_semaine FROM CroissanceRace WHERE race_id = @raceId ORDER BY semaine');
    const croissance = croissanceResult.recordset;

    const jours   = daysBetween(datedebutsakafo, datefinsakafo);

    const poids_g = computePoidsMoyen(croissance, jours);

    return poids_g;
  },
};

module.exports = Lot;
