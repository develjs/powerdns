/**
 * 
 */
const PowerDNS = require('./lib/powerdns');
const config = require('./pdns-config.json');

module.exports = new PowerDNS(config.host, config.port, config.token, [config.ns1, config.ns2]);