const { sql, getPool } = require('../config/db');
const Incubation = require('./incubation.model');

async function validateCapacitePonte(pool, lotId, dateCollecte, nombreOeufs) {
  const nb = parseInt(nombreOeufs, 10);
  if (!Number.isInteger(nb) || nb < 1) {
    throw Object.assign(new Error("Le nombre d'oeufs doit être un entier ≥ 1."), { statusCode: 422 });
  }

  const result = await pool.request()
    .input('lotId', sql.Int, lotId)
    .input('dateCollecte', sql.Date, dateCollecte)
    .query(`
      SELECT l.lot_id, l.date_entree, l.nombre_initial,
             r.capacite_ponte_max,
             ISNULL(SUM(CASE WHEN m.date_mort <= @dateCollecte THEN m.nombre_morts ELSE 0 END), 0) AS total_morts_date
      FROM Lot l
      JOIN Race r ON l.race_id = r.race_id
      LEFT JOIN Mortalite m ON m.lot_id = l.lot_id
      WHERE l.lot_id = @lotId
      GROUP BY l.lot_id, l.date_entree, l.nombre_initial, r.capacite_ponte_max
    `);

  const row = result.recordset[0];
  if (!row) {
    throw Object.assign(new Error('Lot non trouvé'), { statusCode: 404 });
  }

  const collecteDate = new Date(dateCollecte);
  const entreeDate = new Date(row.date_entree);
  if (collecteDate < entreeDate) {
    throw Object.assign(new Error('La date de collecte ne peut pas être avant la date d\'entrée du lot.'), { statusCode: 422 });
  }

  const vivants = Math.max(0, (parseInt(row.nombre_initial, 10) || 0) - (parseInt(row.total_morts_date, 10) || 0));
  const capacite = parseInt(row.capacite_ponte_max, 10) || 0;
  const maxOeufs = vivants * capacite;

  if (nb > maxOeufs) {
    throw Object.assign(
      new Error(`Nombre d'oeufs invalide: max autorisé = ${maxOeufs} (${vivants} vivants × capacité ${capacite}).`),
      { statusCode: 422 }
    );
  }
}

function parseTauxPerte(value) {
  const taux = parseFloat(value);
  if (Number.isNaN(taux)) return 0;
  if (taux < 0 || taux > 100) {
    throw Object.assign(new Error('Le pourcentage de perte doit être entre 0 et 100.'), { statusCode: 422 });
  }
  return taux;
}

const EnregistrementOeufs = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM EnregistrementOeufs ORDER BY oeuf_id');
    return result.recordset;
  },

  async getByLot(lotId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('lotId', sql.Int, lotId)
      .query('SELECT * FROM EnregistrementOeufs WHERE lot_id = @lotId ORDER BY date_collecte');
    return result.recordset;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM EnregistrementOeufs WHERE oeuf_id = @id');
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();

    await validateCapacitePonte(pool, data.lot_id, data.date_collecte, data.nombre_oeufs);
    const tauxPerte = parseTauxPerte(data.taux_perte_pct ?? data.taux_reussite_pct ?? 0);

    // // Vérifier que le lot a atteint la semaine de ponte de sa race
    // const lotInfo = await pool.request()
    //   .input('lotId', sql.Int, data.lot_id)
    //   .query(`
    //     SELECT l.date_entree, r.semaine_ponte, r.nom AS race_nom
    //     FROM Lot l JOIN Race r ON l.race_id = r.race_id
    //     WHERE l.lot_id = @lotId
    //   `);
    // if (lotInfo.recordset.length === 0) throw { status: 404, error: 'Lot non trouvé' };
    // const { date_entree, semaine_ponte, race_nom } = lotInfo.recordset[0];
    // const jours = Math.floor((new Date(data.date_collecte) - new Date(date_entree)) / (24 * 60 * 60 * 1000));
    // const semaine = Math.floor(jours / 7);
    // if (semaine < semaine_ponte) {
    //   throw { status: 400, error: `La race ${race_nom} ne peut pondre qu'à partir de la semaine ${semaine_ponte}. Le lot est actuellement à la semaine ${semaine}.` };
    // }

    const result = await pool.request()
      .input('lot_id',       sql.Int,  data.lot_id)
      .input('date_collecte',sql.Date, data.date_collecte)
      .input('nombre_oeufs', sql.Int,  data.nombre_oeufs)
      .query(`
        INSERT INTO EnregistrementOeufs (lot_id, date_collecte, nombre_oeufs)
        OUTPUT INSERTED.*
        VALUES (@lot_id, @date_collecte, @nombre_oeufs)
      `);
    const created = result.recordset[0];
    if (created?.oeuf_id) {
      await Incubation.ensureAutoIncubationForOeuf(created.oeuf_id, tauxPerte);
    }
    return created;
  },

  async update(id, data) {
    const pool = await getPool();

    const currentRes = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT lot_id FROM EnregistrementOeufs WHERE oeuf_id = @id');
    const current = currentRes.recordset[0];
    if (!current) return null;

    await validateCapacitePonte(pool, current.lot_id, data.date_collecte, data.nombre_oeufs);
    const tauxPerte = parseTauxPerte(data.taux_perte_pct ?? data.taux_reussite_pct ?? 0);

    const result = await pool.request()
      .input('id',           sql.Int,  id)
      .input('date_collecte',sql.Date, data.date_collecte)
      .input('nombre_oeufs', sql.Int,  data.nombre_oeufs)
      .query(`
        UPDATE EnregistrementOeufs SET date_collecte = @date_collecte, nombre_oeufs = @nombre_oeufs
        OUTPUT INSERTED.*
        WHERE oeuf_id = @id
      `);
    const updated = result.recordset[0] || null;
    if (updated?.oeuf_id) {
      await Incubation.syncAutoIncubationForOeuf(updated.oeuf_id, tauxPerte);
    }
    return updated;
  },

  async delete(id) {
    const pool = await getPool();

    const incRes = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT TOP 1 incubation_id, statut FROM Incubation WHERE oeuf_id = @id ORDER BY incubation_id DESC');
    const incubation = incRes.recordset[0];
    if (incubation?.statut === 'eclos') {
      throw Object.assign(new Error('Impossible de supprimer cet enregistrement: incubation déjà éclose et lot créé.'), { statusCode: 422 });
    }
    if (incubation?.statut === 'en_cours') {
      await pool.request()
        .input('incubationId', sql.Int, incubation.incubation_id)
        .query('DELETE FROM Incubation WHERE incubation_id = @incubationId');
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM EnregistrementOeufs OUTPUT DELETED.oeuf_id WHERE oeuf_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = EnregistrementOeufs;
