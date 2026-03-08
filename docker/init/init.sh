#!/bin/bash
# Wait for SQL Server to be fully ready, then initialize ONLY if the DB does not exist yet.

HOST="sqlserver"
PORT="1433"
SA_PASS="AviFarm@2024!"

echo "Attente que SQL Server soit pret sur $HOST:$PORT ..."

for i in $(seq 1 30); do
  /opt/mssql-tools18/bin/sqlcmd -S "$HOST,$PORT" -U sa -P "$SA_PASS" -Q "SELECT 1" -C -l 2 > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "SQL Server est pret."
    break
  fi
  echo "   Tentative $i/30 -- nouveau essai dans 5s ..."
  sleep 5
done

# Verifier si la base existe deja
DB_EXISTS=$(/opt/mssql-tools18/bin/sqlcmd \
  -S "$HOST,$PORT" -U sa -P "$SA_PASS" -C \
  -h -1 -W \
  -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = 'ElevagePoulets'" \
  2>/dev/null | tr -d ' \r\n')

if [ "$DB_EXISTS" = "1" ]; then
  echo "INFO: La base ElevagePoulets existe deja -- initialisation ignoree."
  echo "      (Supprimez le volume 'sqlserver_data' pour repartir de zero.)"
  exit 0
fi

# Premiere execution : creer la base et les tables
echo "Premiere initialisation -- execution du script SQL ..."
/opt/mssql-tools18/bin/sqlcmd -S "$HOST,$PORT" -U sa -P "$SA_PASS" -i /docker-init/database.sql -C

if [ $? -eq 0 ]; then
  echo "Base de donnees ElevagePoulets initialisee avec succes !"
else
  echo "ERREUR lors de l'initialisation de la base de donnees."
  exit 1
fi