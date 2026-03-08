const { sql, getPool } = require('../config/db');

const VentePoulets = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM VentePoulets ORDER BY vente_id');
    return result.recordset;
  },

  async getByLot(lotId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('lotId', sql.Int, lotId)
      .query('SELECT * FROM VentePoulets WHERE lot_id = @lotId ORDER BY date_vente');
    return result.recordset;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM VentePoulets WHERE vente_id = @id');
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();

    // Validation : nombre_vendus ne doit pas dépasser les poulets vivants disponibles
    const checkReq = await pool.request()
      .input('lotId', sql.Int, data.lot_id)
      .query(`
        SELECT l.nombre_initial
          - ISNULL((SELECT SUM(m.nombre_morts) FROM Mortalite m WHERE m.lot_id = l.lot_id), 0)
          - ISNULL((SELECT SUM(vp.nombre_vendus) FROM VentePoulets vp WHERE vp.lot_id = l.lot_id), 0) AS nombre_actuel
        FROM Lot l
        WHERE l.lot_id = @lotId
      `);
    const row = checkReq.recordset[0];
    if (!row) {
      const err = new Error('Lot introuvable.');
      err.statusCode = 404;
      throw err;
    }
    if (Number(data.nombre_vendus) > row.nombre_actuel) {
      const err = new Error(`Seulement ${row.nombre_actuel} poulet(s) vivant(s) disponible(s) dans ce lot.`);
      err.statusCode = 422;
      throw err;
    }

    const result = await pool.request()
      .input('lot_id',        sql.Int,          data.lot_id)
      .input('date_vente',    sql.Date,         data.date_vente)
      .input('nombre_vendus', sql.Int,          data.nombre_vendus)
      .input('poids_moyen_g', sql.Decimal(10,2),data.poids_moyen_g)
      .input('prix_vente_g',  sql.Decimal(10,2),data.prix_vente_g)
      .query(`
        INSERT INTO VentePoulets (lot_id, date_vente, nombre_vendus, poids_moyen_g, prix_vente_g)
        OUTPUT INSERTED.*
        VALUES (@lot_id, @date_vente, @nombre_vendus, @poids_moyen_g, @prix_vente_g)
      `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();

    // Récupérer l'enregistrement original pour le calcul de disponibilité
    const originalReq = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT lot_id, nombre_vendus FROM VentePoulets WHERE vente_id = @id');
    const original = originalReq.recordset[0];
    if (!original) {
      const err = new Error('Enregistrement introuvable.');
      err.statusCode = 404;
      throw err;
    }

    // Validation : nombre_vendus ne doit pas dépasser les poulets vivants disponibles
    const checkReq = await pool.request()
      .input('lotId', sql.Int, original.lot_id)
      .query(`
        SELECT l.nombre_initial
          - ISNULL((SELECT SUM(m.nombre_morts) FROM Mortalite m WHERE m.lot_id = l.lot_id), 0)
          - ISNULL((SELECT SUM(vp.nombre_vendus) FROM VentePoulets vp WHERE vp.lot_id = l.lot_id), 0) AS nombre_actuel
        FROM Lot l
        WHERE l.lot_id = @lotId
      `);
    const row = checkReq.recordset[0];
    const disponible = row ? row.nombre_actuel + original.nombre_vendus : 0;
    if (Number(data.nombre_vendus) > disponible) {
      const err = new Error(`Seulement ${disponible} poulet(s) disponible(s) dans ce lot.`);
      err.statusCode = 422;
      throw err;
    }

    const result = await pool.request()
      .input('id',            sql.Int,          id)
      .input('date_vente',    sql.Date,         data.date_vente)
      .input('nombre_vendus', sql.Int,          data.nombre_vendus)
      .input('poids_moyen_g', sql.Decimal(10,2),data.poids_moyen_g)
      .input('prix_vente_g',  sql.Decimal(10,2),data.prix_vente_g)
      .query(`
        UPDATE VentePoulets SET
          date_vente = @date_vente, nombre_vendus = @nombre_vendus,
          poids_moyen_g = @poids_moyen_g, prix_vente_g = @prix_vente_g
        OUTPUT INSERTED.*
        WHERE vente_id = @id
      `);
    return result.recordset[0] || null;
  },

  async delete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM VentePoulets OUTPUT DELETED.vente_id WHERE vente_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = VentePoulets;
