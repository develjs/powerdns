/**
 * Test for creating zone
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

let pdns = new PowerDNS(config.host, config.port, config.token, [config.ns1+'.', config.ns2+'.'])

let run = new Promise(resolve => resolve())

// create all CNAME from zones
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(pdns, pdns.createZone,     el.domain, { hostmaster: 'hostmaster.'+ config.ns1, soa_edit_api: 'EPOCH' }))
    .then(echo(pdns, pdns.createRecord,   el.domain, 'A', `${el.domain}.`, el.ip))
    .then(echo(pdns, pdns.createRecord,   el.domain, 'CNAME', `www.${el.domain}.`, `${el.domain}.`))
    //.then(echo(pdns.exportZone,     el.domain)).then(res=>console.log(res.zone))
, run);

// check
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(this, nslookup, el.domain, config.ns1)).then(console.log)
    .then(echo(this, nslookup, 'www.' + el.domain, config.ns2)).then(console.log)
, run);

// remove
run = TEST_ZONES.reduce((next, el) => next
     .then(echo(pdns, pdns.deleteZone, el.domain))
, run);

//.then(echo(pdns, pdns.getZone,        domain))
//.then(echo(pdns, pdns.notifyZone,     domain))
//.then(echo(pdns, pdns.exportZone,     domain)).then(res=>console.log(res.zone))
//.then(echo(pdns, pdns.getZones))
