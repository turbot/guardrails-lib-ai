const AIv2 = require('./v2');
const AI = require('./v1');

// Default export: AI (v1)
module.exports = AI;

// Named export: AI (v2)
module.exports.AI = AIv2;

// Named export: { AIv2 }
module.exports.AIv2 = AIv2;

