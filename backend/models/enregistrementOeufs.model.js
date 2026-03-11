const { sql, getPool } = require('../config/db');

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

    // Vérifier que le lot a atteint la semaine de ponte de sa race
    const lotInfo = await pool.request()
      .input('lotId', sql.Int, data.lot_id)
      .query(`
        SELECT l.date_entree, r.semaine_ponte, r.nom AS race_nom
        FROM Lot l JOIN Race r ON l.race_id = r.race_id
        WHERE l.lot_id = @lotId
      `);
    if (lotInfo.recordset.length === 0) throw { status: 404, error: 'Lot non trouvé' };
    const { date_entree, semaine_ponte, race_nom } = lotInfo.recordset[0];
    const jours = Math.floor((new Date(data.date_collecte) - new Date(date_entree)) / (24 * 60 * 60 * 1000));
    const semaine = Math.floor(jours / 7);
    if (semaine < semaine_ponte) {
      throw { status: 400, error: `La race ${race_nom} ne peut pondre qu'à partir de la semaine ${semaine_ponte}. Le lot est actuellement à la semaine ${semaine}.` };
    }

    const result = await pool.request()
      .input('lot_id',       sql.Int,  data.lot_id)
      .input('date_collecte',sql.Date, data.date_collecte)
      .input('nombre_oeufs', sql.Int,  data.nombre_oeufs)
      .query(`
        INSERT INTO EnregistrementOeufs (lot_id, date_collecte, nombre_oeufs)
        OUTPUT INSERTED.*
        VALUES (@lot_id, @date_collecte, @nombre_oeufs)
      `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',           sql.Int,  id)
      .input('date_collecte',sql.Date, data.date_collecte)
      .input('nombre_oeufs', sql.Int,  data.nombre_oeufs)
      .query(`
        UPDATE EnregistrementOeufs SET date_collecte = @date_collecte, nombre_oeufs = @nombre_oeufs
        OUTPUT INSERTED.*
        WHERE oeuf_id = @id
      `);
    return result.recordset[0] || null;
  },

  async delete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM EnregistrementOeufs OUTPUT DELETED.oeuf_id WHERE oeuf_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = EnregistrementOeufs;
