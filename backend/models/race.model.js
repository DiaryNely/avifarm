const { sql, getPool } = require('../config/db');

const Race = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Race ORDER BY race_id');
    return result.recordset;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Race WHERE race_id = @id');
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('nom',              sql.VarChar(50),   data.nom)
      .input('prix_nourrit_g',   sql.Decimal(10,2), data.prix_nourrit_g)
      .input('prix_vente_g',     sql.Decimal(10,2), data.prix_vente_g)
      .input('prix_oeuf',        sql.Decimal(10,2), data.prix_oeuf)
      .input('capacite_ponte_max', sql.Int,         data.capacite_ponte_max)
      .input('semaine_ponte',    sql.Int,            data.semaine_ponte)
      .input('duree_incubation', sql.Int,            data.duree_incubation)
      .query(`
        INSERT INTO Race (nom, prix_nourrit_g, prix_vente_g, prix_oeuf, capacite_ponte_max, semaine_ponte, duree_incubation)
        OUTPUT INSERTED.*
        VALUES (@nom, @prix_nourrit_g, @prix_vente_g, @prix_oeuf, @capacite_ponte_max, @semaine_ponte, @duree_incubation)
      `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',               sql.Int,            id)
      .input('nom',              sql.VarChar(50),   data.nom)
      .input('prix_nourrit_g',   sql.Decimal(10,2), data.prix_nourrit_g)
      .input('prix_vente_g',     sql.Decimal(10,2), data.prix_vente_g)
      .input('prix_oeuf',        sql.Decimal(10,2), data.prix_oeuf)
      .input('capacite_ponte_max', sql.Int,         data.capacite_ponte_max)
      .input('semaine_ponte',    sql.Int,            data.semaine_ponte)
      .input('duree_incubation', sql.Int,            data.duree_incubation)
      .query(`
        UPDATE Race SET
          nom = @nom, prix_nourrit_g = @prix_nourrit_g, prix_vente_g = @prix_vente_g,
          prix_oeuf = @prix_oeuf, capacite_ponte_max = @capacite_ponte_max,
          semaine_ponte = @semaine_ponte, duree_incubation = @duree_incubation
        OUTPUT INSERTED.*
        WHERE race_id = @id
      `);
    return result.recordset[0] || null;
  },

  async delete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Race OUTPUT DELETED.race_id WHERE race_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = Race;
