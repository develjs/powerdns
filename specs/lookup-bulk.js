/**
 * Brute force lookup for all domains in several treads and several times
 */
const PowerDNS = require('../lib/powerdns');
const config = require('../pdns-config.json');
const {echo, nslookup, runBulk} = require('./misc');

const MAX_TREADS = 9;
const REPEATS = 10;
let pdns = new PowerDNS(config.host, config.port, config.token, [config.ns1+'.', config.ns2+'.'])

let startTime;
let zonesCount;
pdns.getZones()
// make run funcs
.then(zones=>{
    zonesCount = zones.length;
    startTime = Date.now();
    console.log('--- start ---');

    let treads = new Promise(resolve=>resolve());
    for (let i=0; i<REPEATS; i++) {
        treads = treads.then(()=>checkBulk(zones));
    }
    return treads;
})
.then(()=>{
    console.log('--- done ---');
    console.log(
        'zones:', zonesCount, 
        '* repeats:', REPEATS, '=', 
        (Date.now() - startTime)/1000 +'sec', ',', 
        Math.round(zonesCount*REPEATS/((Date.now() - startTime)/1000) * 100)/100,'zones/sec'
    );
});

function checkBulk(zones) {
    return runBulk(
        zones.map(zone => function() {
            return Promise.all([
                nslookup(zone.name.replace(/\.$/,''), config.ns1).then(ip=>console.log(zone.name,ip)),
                nslookup('www.' + zone.name.replace(/\.$/,''), config.ns2).then(ip=>console.log(zone.name,ip))
            ])
        }), 
        MAX_TREADS
    );
}