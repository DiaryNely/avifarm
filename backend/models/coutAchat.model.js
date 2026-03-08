const { sql, getPool } = require('../config/db');

const CoutAchat = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM CoutAchat ORDER BY achat_id');
    return result.recordset;
  },

  async getByLot(lotId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('lotId', sql.Int, lotId)
      .query('SELECT * FROM CoutAchat WHERE lot_id = @lotId');
    return result.recordset[0] || null;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM CoutAchat WHERE achat_id = @id');
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('lot_id',    sql.Int,           data.lot_id)
      .input('cout_total',sql.Decimal(15,2), data.cout_total)
      .input('date_achat',sql.Date,          data.date_achat)
      .input('notes',     sql.VarChar(300),  data.notes ?? null)
      .query(`
        INSERT INTO CoutAchat (lot_id, cout_total, date_achat, notes)
        OUTPUT INSERTED.*
        VALUES (@lot_id, @cout_total, @date_achat, @notes)
      `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',        sql.Int,           id)
      .input('cout_total',sql.Decimal(15,2), data.cout_total)
      .input('date_achat',sql.Date,          data.date_achat)
      .input('notes',     sql.VarChar(300),  data.notes ?? null)
      .query(`
        UPDATE CoutAchat SET cout_total = @cout_total, date_achat = @date_achat, notes = @notes
        OUTPUT INSERTED.*
        WHERE achat_id = @id
      `);
    return result.recordset[0] || null;
  },

  async delete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM CoutAchat OUTPUT DELETED.achat_id WHERE achat_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = CoutAchat;
