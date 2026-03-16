const { sql, getPool } = require('../config/db');

const Mortalite = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Mortalite ORDER BY mortalite_id');
    return result.recordset;
  },

  async getByLot(lotId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('lotId', sql.Int, lotId)
      .query('SELECT * FROM Mortalite WHERE lot_id = @lotId ORDER BY date_mort');
    return result.recordset;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Mortalite WHERE mortalite_id = @id');
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();

    // Validation : nombre_morts ne doit pas dépasser les poulets vivants
    const checkReq = await pool.request()
      .input('lotId', sql.Int, data.lot_id)
      .query(`
        SELECT l.nombre_initial
          - ISNULL((SELECT SUM(m.nombre_morts) FROM Mortalite m WHERE m.lot_id = l.lot_id), 0) AS nombre_actuel
        FROM Lot l
        WHERE l.lot_id = @lotId
      `);
    const row = checkReq.recordset[0];
    if (!row) {
      const err = new Error('Lot introuvable.');
      err.statusCode = 404;
      throw err;
    }
    const nombreActuel = row.nombre_actuel;
    if (Number(data.nombre_morts) > nombreActuel) {
      const err = new Error(`Seulement ${nombreActuel} poulet(s) vivant(s) dans ce lot.`);
      err.statusCode = 422;
      throw err;
    }

    const result = await pool.request()
      .input('lot_id',       sql.Int,          data.lot_id)
      .input('date_mort',    sql.Date,         data.date_mort)
      .input('nombre_morts', sql.Int,          data.nombre_morts ?? 1)
      .input('cause',        sql.VarChar(200), data.cause ?? null)
      .query(`
        INSERT INTO Mortalite (lot_id, date_mort, nombre_morts, cause)
        OUTPUT INSERTED.*
        VALUES (@lot_id, @date_mort, @nombre_morts, @cause)
      `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();

    // Récupérer l'enregistrement original pour le calcul de disponibilité
    const originalReq = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT lot_id, nombre_morts FROM Mortalite WHERE mortalite_id = @id');
    const original = originalReq.recordset[0];
    if (!original) {
      const err = new Error('Enregistrement introuvable.');
      err.statusCode = 404;
      throw err;
    }

    // Validation : nombre_morts ne doit pas dépasser les poulets vivants + l'original déjà enregistré
    const checkReq = await pool.request()
      .input('lotId', sql.Int, original.lot_id)
      .query(`
        SELECT l.nombre_initial
          - ISNULL((SELECT SUM(m.nombre_morts) FROM Mortalite m WHERE m.lot_id = l.lot_id), 0) AS nombre_actuel
        FROM Lot l
        WHERE l.lot_id = @lotId
      `);
    const row = checkReq.recordset[0];
    const nombreActuel = row ? row.nombre_actuel : 0;
    const disponible = nombreActuel + original.nombre_morts;
    if (Number(data.nombre_morts) > disponible) {
      const err = new Error(`Seulement ${disponible} poulet(s) disponible(s) dans ce lot.`);
      err.statusCode = 422;
      throw err;
    }

    const result = await pool.request()
      .input('id',           sql.Int,          id)
      .input('date_mort',    sql.Date,         data.date_mort)
      .input('nombre_morts', sql.Int,          data.nombre_morts)
      .input('cause',        sql.VarChar(200), data.cause ?? null)
      .query(`
        UPDATE Mortalite SET date_mort = @date_mort, nombre_morts = @nombre_morts, cause = @cause
        OUTPUT INSERTED.*
        WHERE mortalite_id = @id
      `);
    return result.recordset[0] || null;
  },

  async delete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Mortalite OUTPUT DELETED.mortalite_id WHERE mortalite_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = Mortalite;
