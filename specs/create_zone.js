/**
 * Test for creating zone
 * See also: https://doc.powerdns.com/md/httpapi/api_spec/
 */
const { exec } = require('child_process');
const PowerDNS = require('../lib/powerdns');
const config = require('../pdns-config.json');


const TEST_DOMEN = 'a.com'; // regitered domain
const TEST_IP = '10.0.0.2'; // ip to join

let pdns = new PowerDNS(config.host, config.port, config.token, [config.ns1+'.', config.ns2+'.'])

new Promise(resolve => resolve())

.then(() => {
    console.log('--- getZones() ---');
    return pdns.getZones();
})
.then(res => {
    console.log('ok:', res);
})


.then(() => {
    console.log(`--- Register domain: ${TEST_DOMEN} ---`)
    return pdns.createZone(TEST_DOMEN, {});
})
.then(res => {
    console.log('ok:',res)
})


.then(()=>{
    console.log(`--- create main A record: ${TEST_DOMEN} => ${TEST_IP} ---`);
    return pdns.createRecord(TEST_DOMEN, 'A', `${TEST_DOMEN}.`, TEST_IP);
})
.then(res => {
    console.log('ok:', res);
})


.then(() => {
    console.log(`--- create main CNAME record: www.${TEST_DOMEN} ---`);
    return pdns.createRecord(TEST_DOMEN, 'CNAME', `www.${TEST_DOMEN}.`, `${TEST_DOMEN}.`);
})
.then(res => {
    console.log('ok:', res);
})


.then(() => {
    console.log(`--- getZone: ${TEST_DOMEN} ---`);
    return pdns.getZone(TEST_DOMEN);
})
.then(res => {
    console.log('ok:', res);
})


.then(() => {
    console.log(`--- exportZone: ${TEST_DOMEN} ---`);
    return pdns.exportZone(TEST_DOMEN);
})
.then(res => {
    console.log('ok:', res.zone);
})


.then(() => {
    console.log(`--- Check domain: ${TEST_DOMEN} ---`);
    return nslookup(TEST_DOMEN, config.host);
})
.then(res => {
    console.log('ok:',res)
})


.then(() => {
    console.log(`--- Check domain: www.${TEST_DOMEN} ---`);
    return nslookup('www.'+TEST_DOMEN, config.host);
})
.then(res => {
    console.log('ok:',res)
})


.then(done)
.catch(error => {
    console.error(error)
    done();
})


function done() {
    console.log(`--- Remove domain: ${TEST_DOMEN} ---`);
    pdns.deleteZone(TEST_DOMEN)
    
    .then(()=>{
        console.log(`--- getZones ---`);
        pdns.getZones();
    })
    .then(res => {
        console.log('ok', res);
    })
    .catch(console.error)
}


function nslookup(domain, server) {
    return new Promise((resolve, reject) => {
        exec('nslookup ' + domain + ' ' + server, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            console.log(stdout);
            resolve();
        })
        
    })
}