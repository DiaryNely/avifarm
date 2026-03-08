const { sql, getPool } = require('../config/db');

const CroissanceRace = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM CroissanceRace ORDER BY race_id, semaine');
    return result.recordset;
  },

  async getByRace(raceId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('raceId', sql.Int, raceId)
      .query('SELECT * FROM CroissanceRace WHERE race_id = @raceId ORDER BY semaine');
    return result.recordset;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM CroissanceRace WHERE croissance_id = @id');
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('race_id',        sql.Int,            data.race_id)
      .input('semaine',        sql.Int,            data.semaine)
      .input('poids_initial',  sql.Decimal(10,2), data.poids_initial ?? null)
      .input('gain_poids',     sql.Decimal(10,2), data.gain_poids ?? null)
      .input('nourrit_semaine',sql.Decimal(10,2), data.nourrit_semaine)
      .query(`
        INSERT INTO CroissanceRace (race_id, semaine, poids_initial, gain_poids, nourrit_semaine)
        OUTPUT INSERTED.*
        VALUES (@race_id, @semaine, @poids_initial, @gain_poids, @nourrit_semaine)
      `);
    return result.recordset[0];
  },

  async update(id, data) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id',             sql.Int,            id)
      .input('poids_initial',  sql.Decimal(10,2), data.poids_initial ?? null)
      .input('gain_poids',     sql.Decimal(10,2), data.gain_poids ?? null)
      .input('nourrit_semaine',sql.Decimal(10,2), data.nourrit_semaine)
      .query(`
        UPDATE CroissanceRace SET
          poids_initial = @poids_initial, gain_poids = @gain_poids, nourrit_semaine = @nourrit_semaine
        OUTPUT INSERTED.*
        WHERE croissance_id = @id
      `);
    return result.recordset[0] || null;
  },

  async delete(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM CroissanceRace OUTPUT DELETED.croissance_id WHERE croissance_id = @id');
    return result.recordset[0] || null;
  },

  // Tableau cumulatif : poids_actuel et nourrit_cumul calculés semaine par semaine
  async getTableauByRace(raceId) {
    const pool = await getPool();
    const result = await pool.request()
      .input('raceId', sql.Int, raceId)
      .query(`
        SELECT cr.*, r.prix_nourrit_g
        FROM CroissanceRace cr
        JOIN Race r ON r.race_id = cr.race_id
        WHERE cr.race_id = @raceId
        ORDER BY cr.semaine
      `);
    const rows = result.recordset;
    let poids = 0;
    let nourritCumul = 0;
    return rows.map(r => {
      const prixNourrit = parseFloat(r.prix_nourrit_g) || 0;
      if (r.semaine === 0) {
        poids = parseFloat(r.poids_initial) || 0;
      } else {
        poids += parseFloat(r.gain_poids) || 0;
      }
      nourritCumul += parseFloat(r.nourrit_semaine) || 0;
      return {
        ...r,
        poids_actuel:        parseFloat(poids.toFixed(2)),
        nourrit_cumul:       parseFloat(nourritCumul.toFixed(2)),
        cout_nourrit_semaine: parseFloat((r.nourrit_semaine * prixNourrit).toFixed(2)),
        cout_nourrit_cumul:   parseFloat((nourritCumul * prixNourrit).toFixed(2)),
      };
    });
  },
};

module.exports = CroissanceRace;
