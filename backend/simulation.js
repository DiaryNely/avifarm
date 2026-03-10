// Date de simulation globale (en mémoire, réinitialisée au redémarrage)
let simulationDate = new Date();

module.exports = {
  getDate: ()  => new Date(simulationDate),
  setDate: (d) => { simulationDate = new Date(d); },
  reset:   ()  => { simulationDate = new Date(); },
};
