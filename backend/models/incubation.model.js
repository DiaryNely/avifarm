const { sql, getPool } = require('../config/db');

function toDateStr(d) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d).split('T')[0];
}

const Incubation = {
  async getAll() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT i.*,
             e.lot_id, e.date_collecte, e.nombre_oeufs,
             l.numero AS lot_numero,
             r.nom    AS race_nom, r.duree_incubation,
             li.numero AS lot_issu_numero
      FROM Incubation i
      JOIN EnregistrementOeufs e ON i.oeuf_id    = e.oeuf_id
      JOIN Lot l                 ON e.lot_id      = l.lot_id
      JOIN Race r                ON l.race_id     = r.race_id
      LEFT JOIN Lot li           ON i.lot_issu_id = li.lot_id
      ORDER BY i.incubation_id DESC
    `);
    return result.recordset;
  },

  async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT i.*,
               e.lot_id, e.date_collecte, e.nombre_oeufs,
               l.numero AS lot_numero,
               r.nom    AS race_nom, r.duree_incubation,
               li.numero AS lot_issu_numero
        FROM Incubation i
        JOIN EnregistrementOeufs e ON i.oeuf_id    = e.oeuf_id
        JOIN Lot l                 ON e.lot_id      = l.lot_id
        JOIN Race r                ON l.race_id     = r.race_id
        LEFT JOIN Lot li           ON i.lot_issu_id = li.lot_id
        WHERE i.incubation_id = @id
      `);
    return result.recordset[0] || null;
  },

  async create(data) {
    const pool = await getPool();

    // 1. Fetch oeuf record + race for duree_incubation
    const oeufRes = await pool.request()
      .input('oeuf_id', sql.Int, data.oeuf_id)
      .query(`
        SELECT e.oeuf_id, e.nombre_oeufs, e.lot_id, r.duree_incubation
        FROM EnregistrementOeufs e
        JOIN Lot  l ON e.lot_id  = l.lot_id
        JOIN Race r ON l.race_id = r.race_id
        WHERE e.oeuf_id = @oeuf_id
      `);
    const oeuf = oeufRes.recordset[0];
    if (!oeuf) throw Object.assign(new Error('Enregistrement d\'oeufs introuvable'), { statusCode: 404 });

    const nombreIncubes = parseInt(data.nombre_incubes, 10);
    if (isNaN(nombreIncubes) || nombreIncubes < 1)
      throw Object.assign(new Error('Le nombre d\'oeufs à incuber doit être ≥ 1'), { statusCode: 422 });
    if (nombreIncubes > oeuf.nombre_oeufs)
      throw Object.assign(new Error(`Seulement ${oeuf.nombre_oeufs} oeufs disponibles dans cet enregistrement`), { statusCode: 422 });

    // 2. Auto-calculate date_eclosion = date_debut + duree_incubation
    const dateDebut = new Date(data.date_debut);
    if (isNaN(dateDebut.getTime()))
      throw Object.assign(new Error('Date de début invalide'), { statusCode: 422 });
    const dateEclosion = new Date(dateDebut);
    dateEclosion.setDate(dateDebut.getDate() + oeuf.duree_incubation);
    const dateEclosionStr = dateEclosion.toISOString().split('T')[0];

    // 3. Decrease nombre_oeufs in EnregistrementOeufs
    await pool.request()
      .input('id', sql.Int, data.oeuf_id)
      .input('nb', sql.Int, nombreIncubes)
      .query('UPDATE EnregistrementOeufs SET nombre_oeufs = nombre_oeufs - @nb WHERE oeuf_id = @id');

    // 4. Insert incubation
    const result = await pool.request()
      .input('oeuf_id',        sql.Int,  data.oeuf_id)
      .input('nombre_incubes', sql.Int,  nombreIncubes)
      .input('date_debut',     sql.Date, data.date_debut)
      .input('date_eclosion',  sql.Date, dateEclosionStr)
      .query(`
        INSERT INTO Incubation (oeuf_id, nombre_incubes, date_debut, date_eclosion, statut)
        OUTPUT INSERTED.*
        VALUES (@oeuf_id, @nombre_incubes, @date_debut, @date_eclosion, 'en_cours')
      `);
    return result.recordset[0];
  },

  async enregistrerEclosion(id, data) {
    const pool = await getPool();

    // 1. Fetch incubation with lot + race context
    const incRes = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT i.incubation_id, i.nombre_incubes, i.date_eclosion, i.statut,
               e.lot_id, l.numero AS lot_numero, l.race_id
        FROM Incubation i
        JOIN EnregistrementOeufs e ON i.oeuf_id = e.oeuf_id
        JOIN Lot l                 ON e.lot_id  = l.lot_id
        WHERE i.incubation_id = @id
      `);
    const inc = incRes.recordset[0];
    if (!inc) throw Object.assign(new Error('Incubation non trouvée'), { statusCode: 404 });
    if (inc.statut !== 'en_cours')
      throw Object.assign(new Error('Cette incubation est déjà terminée (éclos ou échouée)'), { statusCode: 422 });

    const nombreEclos = parseInt(data.nombre_eclos, 10);
    if (isNaN(nombreEclos) || nombreEclos < 0 || nombreEclos > inc.nombre_incubes)
      throw Object.assign(new Error(`Le nombre de poussins éclos doit être entre 0 et ${inc.nombre_incubes}`), { statusCode: 422 });
    const nombreNonEclos = inc.nombre_incubes - nombreEclos;

    // 2. Date d'entrée du nouveau lot = date d'éclosion prévue
    const dateEclosionStr = toDateStr(inc.date_eclosion);

    // 3. Auto-generated lot name (max 20 chars)
    const parentShort = inc.lot_numero.replace(/\s+/g, '');
    const dateShort   = (dateEclosionStr || '').replace(/-/g, '').slice(2); // YYMMDD
    const lotNumero   = `Ecl-${parentShort}-${dateShort}`.slice(0, 20);

    // 4. Create new chick lot
    const lotRes = await pool.request()
      .input('numero',         sql.VarChar(20), lotNumero)
      .input('race_id',        sql.Int,          inc.race_id)
      .input('nombre_initial', sql.Int,          nombreEclos)
      .input('date_entree',    sql.Date,         dateEclosionStr)
      .input('lot_parent_id',  sql.Int,          inc.lot_id)
      .query(`
        INSERT INTO Lot (numero, race_id, nombre_initial, date_entree, lot_parent_id)
        OUTPUT INSERTED.*
        VALUES (@numero, @race_id, @nombre_initial, @date_entree, @lot_parent_id)
      `);
    const newLot = lotRes.recordset[0];

    // 5. Mark incubation as eclos and link created lot
    const result = await pool.request()
      .input('id',               sql.Int, id)
      .input('lot_issu_id',      sql.Int, newLot.lot_id)
      .input('nombre_non_eclos', sql.Int, nombreNonEclos)
      .query(`
        UPDATE Incubation SET statut = 'eclos', lot_issu_id = @lot_issu_id, nombre_non_eclos = @nombre_non_eclos
        OUTPUT INSERTED.*
        WHERE incubation_id = @id
      `);
    return { incubation: result.recordset[0], lot_cree: newLot };
  },

  async delete(id) {
    const pool = await getPool();

    const incRes = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT oeuf_id, nombre_incubes, statut FROM Incubation WHERE incubation_id = @id');
    const inc = incRes.recordset[0];
    if (!inc) return null;

    if (inc.statut === 'eclos')
      throw Object.assign(new Error('Impossible de supprimer une incubation éclos — un lot de poussins a déjà été créé'), { statusCode: 422 });

    // Restore nombre_oeufs in the source recording
    await pool.request()
      .input('id', sql.Int, inc.oeuf_id)
      .input('nb', sql.Int, inc.nombre_incubes)
      .query('UPDATE EnregistrementOeufs SET nombre_oeufs = nombre_oeufs + @nb WHERE oeuf_id = @id');

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Incubation OUTPUT DELETED.incubation_id WHERE incubation_id = @id');
    return result.recordset[0] || null;
  },
};

module.exports = Incubation;
