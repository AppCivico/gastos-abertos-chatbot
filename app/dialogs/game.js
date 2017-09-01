var builder = require('botbuilder');

const library = new builder.Library('game');

library.dialog('/', [
]).cancelAction('cancelar', null, { matches: /^cancelar/i });

module.exports = library;