/**
 * Test for creating zone
 * See also: https://doc.powerdns.com/md/httpapi/api_spec/
 */
const { exec } = require('child_process');
const PowerDNS = require('../lib/powerdns');
const config = require('../pdns-config.json');

const TEST_ZONES = [
    // register domain, ip to join
    {domain: 'a.com', ip: '10.0.0.1'},
    {domain: 'e.com', ip: '10.0.0.2'},
]
const TEST_DOMEN = 'a.com'; 
const TEST_IP = '10.0.0.1'; 

let pdns = new PowerDNS(config.host, config.port, config.token, [config.ns1+'.', config.ns2+'.'])

TEST_ZONES.reduce((next, el) => next.then( () => make_zone(el.domain, el.ip, true) ), new Promise(resolve => resolve()))

function make_zone(domain, ip, log=true, remove=true) {
    const IDLE=function(){};
    return new Promise(resolve => resolve())
    .then(echo(pdns.createZone,     domain, { hostmaster: 'hostmaster.'+ config.ns1, soa_edit_api: 'EPOCH' }))
    .then(echo(pdns.createRecord,   domain, 'A', `${domain}.`, ip))
    .then(echo(pdns.createRecord,   domain, 'CNAME', `www.${domain}.`, `${domain}.`))
    .then(echo(nslookup,            domain, config.ns1)).then(log? console.log: IDLE)
    .then(echo(nslookup,            'www.'+domain, config.ns2)).then(log? console.log: IDLE)
    .then(remove? echo(pdns.deleteZone,     domain): IDLE)
    //.then(echo(pdns.getZone,        domain))
    //.then(echo(pdns.notifyZone,     domain))
    //.then(echo(pdns.exportZone,     domain)).then(res=>console.log(res.zone))
    //.then(echo(pdns.getZones))
    .then(echo(nslookup,            domain, config.ns1)).then(log? console.log: IDLE)
    .catch(error => {
        console.error(error)
        return echo(pdns.deleteZone, domain)
    })
}



// -----------------------------

function nslookup(domain, server) {
    return new Promise((resolve, reject) => {
        exec('nslookup ' + domain + ' ' + server, (error, stdout, stderr) => {
            if (error)
                reject(error);
            else 
                resolve(stdout);
        })
    })
}

/**
 * Function wrapper for logging the operation
 */
function echo(func, args) {
    args = [].slice.call(arguments,1);
    
    return function() {
        return new Promise(resolve => resolve())
        .then(()=>{
            process.stdout.write(
                `${func.name}: ` 
                + args.map(arg=> ((typeof arg=='string') && (arg.length<10))? arg: '').join(' ') 
                + '.......');
        })
        .then(()=>func.apply(pdns, args))
        .then(res => {
            console.log('OK!');
            return res;
        })
        .catch(console.error)    
    }
}
