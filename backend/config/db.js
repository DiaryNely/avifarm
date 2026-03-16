const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;
let schemaEnsured = false;

async function ensureSchema(currentPool) {
  if (schemaEnsured) return;

  await currentPool.request().query(`
    IF COL_LENGTH('Race', 'capacite_ponte_max') IS NULL
    BEGIN
      ALTER TABLE Race
      ADD capacite_ponte_max INT NOT NULL CONSTRAINT DF_Race_CapacitePonteMax DEFAULT(0) WITH VALUES;
    END
  `);

  await currentPool.request().query(`
    IF COL_LENGTH('Race', 'capacite_ponte_max') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM sys.check_constraints
         WHERE name = 'CK_Race_CapacitePonteMax'
           AND parent_object_id = OBJECT_ID('Race')
       )
    BEGIN
      ALTER TABLE Race
      ADD CONSTRAINT CK_Race_CapacitePonteMax CHECK (capacite_ponte_max >= 0);
    END
  `);

  await currentPool.request().query(`
    IF COL_LENGTH('Incubation', 'taux_perte_pct') IS NULL
    BEGIN
      ALTER TABLE Incubation
      ADD taux_perte_pct DECIMAL(5,2) NOT NULL CONSTRAINT DF_Incubation_TauxPerte DEFAULT(0) WITH VALUES;
    END
  `);

  await currentPool.request().query(`
    IF COL_LENGTH('Incubation', 'taux_reussite_pct') IS NOT NULL
       AND COL_LENGTH('Incubation', 'taux_perte_pct') IS NOT NULL
    BEGIN
      UPDATE Incubation
      SET taux_perte_pct = CASE
        WHEN taux_reussite_pct IS NULL THEN taux_perte_pct
        ELSE 100 - taux_reussite_pct
      END
      WHERE taux_perte_pct = 0;
    END
  `);

  await currentPool.request().query(`
    IF COL_LENGTH('Incubation', 'taux_perte_pct') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM sys.check_constraints
         WHERE name = 'CK_Incubation_TauxPerte'
           AND parent_object_id = OBJECT_ID('Incubation')
       )
    BEGIN
      ALTER TABLE Incubation
      ADD CONSTRAINT CK_Incubation_TauxPerte CHECK (taux_perte_pct >= 0 AND taux_perte_pct <= 100);
    END
  `);

  schemaEnsured = true;
}

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    await ensureSchema(pool);
    console.log('Connexion SQL Server établie');
  }
  return pool;
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { sql, getPool, closePool };
