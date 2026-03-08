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
