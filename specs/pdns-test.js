/**
 * Test for creating, lookuping and removing zones
 * 
 * Note: Test remove zones from HOST and NS2 because PowerDNS slave can't remove zone automaticaly
 * 
 * See also: 
 * https://doc.powerdns.com/md/httpapi/api_spec/
 * https://raw.githubusercontent.com/PowerDNS/pdns/master/docs/http-api/swagger/authoritative-api-swagger.yaml
 * powerdns api:
 * getZones()
 * getZone(name)
 * createZone(name, params)
 * createRecord(zone, type, name, data, params)
 * exportZone(name)
 * deleteZone(name)
 * notifyZone(name)
 * 
 */
const PowerDNS = require('../lib/powerdns');
const config = require('../pdns-config.json');
const {echo, nslookup} = require('./misc');
const TEST_ZONES = require('./test-domains');

let master = new PowerDNS(config.host, config.port, config.token, [config.ns1+'.', config.ns2+'.']) // list of ns need to create zones
let slave = new PowerDNS(config.ns2, config.port, config.token)

let run = new Promise(resolve => resolve())

// create all CNAME from zones
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(master, master.createZone,     el.domain, { hostmaster: 'hostmaster.'+ config.ns1, soa_edit_api: 'EPOCH' }))
    .then(echo(master, master.createRecord,   el.domain, 'A', `${el.domain}.`, el.ip))
    .then(echo(master, master.createRecord,   el.domain, 'CNAME', `www.${el.domain}.`, `${el.domain}.`))
    //.then(echo(master.exportZone,     el.domain)).then(res=>console.log(res.zone))
, run);

// check
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(this, nslookup, el.domain, config.ns1)).then(console.log)
    .then(echo(this, nslookup, 'www.' + el.domain, config.ns2)).then(console.log)
, run);

// remove
run = TEST_ZONES.reduce((next, el) => next
     .then(echo(master, master.deleteZone, el.domain))
     .then(echo(slave, slave.deleteZone, el.domain))
, run);

run
//.then(echo(master, master.getZone,        domain))
//.then(echo(master, master.notifyZone,     domain))
//.then(echo(master, master.exportZone,     domain)).then(res=>console.log(res.zone))
.then(echo(master, master.getZones))
.then(console.log)
.then(echo(slave, slave.getZones))
.then(console.log)
