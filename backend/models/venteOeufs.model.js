const { sql, getPool } = require('../config/db');

const VenteOeufs = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM VenteOeufs ORDER BY vente_id');
    return result.recordset;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM VenteOeufs WHERE vente_id = @id');
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('oeuf_id',       sql.Int,          data.oeuf_id)
      .input('nombre_vendus', sql.Int,          data.nombre_vendus)
      .input('prix_unitaire', sql.Decimal(10,2),data.prix_unitaire)
      .input('date_vente',    sql.Date,         data.date_vente)
      .query(`
        INSERT INTO VenteOeufs (oeuf_id, nombre_vendus, prix_unitaire, date_vente)
        OUTPUT INSERTED.*
        VALUES (@oeuf_id, @nombre_vendus, @prix_unitaire, @date_vente)
      `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',            sql.Int,          id)
      .input('nombre_vendus', sql.Int,          data.nombre_vendus)
      .input('prix_unitaire', sql.Decimal(10,2),data.prix_unitaire)
      .input('date_vente',    sql.Date,         data.date_vente)
      .query(`
        UPDATE VenteOeufs SET
          nombre_vendus = @nombre_vendus, prix_unitaire = @prix_unitaire, date_vente = @date_vente
        OUTPUT INSERTED.*
        WHERE vente_id = @id
      `);
    return result.recordset[0] || null;
  },

  async delete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM VenteOeufs OUTPUT DELETED.vente_id WHERE vente_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = VenteOeufs;
