/**
 * Test for creating, lookuping and removing zones
 * 
 * Note: Test remove zones from HOST and NS2 because PowerDNS slave can't remove zone automaticaly
 * 
 * See also: 
 * https://doc.powerdns.com/md/httpapi/api_spec/
 * https://raw.githubusercontent.com/PowerDNS/pdns/master/docs/http-api/swagger/authoritative-api-swagger.yaml
 *
 * createZone(name, params)
 * createRecord(zone, type, name, data, params)
 * deleteZone(name)
 * 
 */
const 
    pdns_config = require('../pdns-config.json'), // only for check
    rest_config = require('../rest-config.json'), 
    TEST_ZONES = require('./domains'),
    BASE_URL = 'http://' + (rest_config.host || 'localhost') + ':' + (rest_config.port || 8082)+ '/domains';


const ExtraDNSClient = require('../lib/extra-dns-client');
const {echo, nslookup} = require('./misc');

let rest_dns = new ExtraDNSClient( BASE_URL, {headers: {'X-API-Key': rest_config.token}} )

let run = new Promise(resolve => resolve())

// create all CNAME from zones
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(rest_dns, rest_dns.createZone, el.domain, el.ip))
    .then(echo(rest_dns, rest_dns.createAlias,  el.domain, 'www'))
, run);

// check
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(this, nslookup, el.domain, pdns_config.ns1))
    .then(echo(this, nslookup, 'www.' + el.domain, pdns_config.ns2))
, run);

/* // show all records
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(rest_dns, rest_dns.getRecords,  el.domain, {type:'CNAME'}))
, run);*/

// get alias list
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(rest_dns, rest_dns.getAliases, el.domain))
, run);


// remove alias
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(rest_dns, rest_dns.deleteAlias,  el.domain, 'www'))
, run);

// check deleted
run = TEST_ZONES.reduce((next, el) => next
    .then(echo(this, nslookup, 'www.' + el.domain, pdns_config.ns1))
, run);

// remove
run = TEST_ZONES.reduce((next, el) => next
     .then(echo(rest_dns, rest_dns.deleteZone, el.domain))
, run);

