#! /usr/bin/env node
/**
 * create 
 * pdns-config.json << ns1, ns2, host, port, token
 * rest-config.json << port, token
 */
const fs = require('fs');
const readline = require('readline');
const PDNS_CONFIG = 'pdns-config.json';
const REST_CONFIG = 'rest-config.json';

new Promise(resolve=>resolve())

.then(() => ({ // substitution's are handled by subst()
    domain: 'example.domain', 
    ns1: 'ns1.${domain}',
    ns2: 'ns2.${domain}',
    host: '${ns1}', 
    port: 8081,
    token: ''
}))
.then(query('Enter you domain name', 'domain'))
.then(query('Enter primary name server address', 'ns1'))
.then(query('Enter secondary name server address', 'ns2'))
.then(query('Enter HTTP access server name', 'host'))
.then(query('Http access port', 'port'))
.then(query('Access token', 'token'))
.then(params => save(params, PDNS_CONFIG))
.then(() => console.log('PowerDNS server access config is saved to ' + PDNS_CONFIG))

.then(() => ({
    answer: 'yes'
}))
.then(query('Configure REST server?', 'answer'))
.then(result => new Promise((resolve, reject) => (result.answer=='yes'? resolve(): reject())))

.then(() => ({
    host: 'localhost',
    port: 8082,
    token: ''
}))
.then(query('Enter you host name', 'host'))
.then(query('Http access port', 'port'))
.then(query('Access token', 'token'))
.then(params => save(params, REST_CONFIG))
.then(() => console.log('REST server config is saved to ' + REST_CONFIG))
.catch(error => {
    if (error) console.error(error)
})



// --------------------------
function query(title, pname ) {
    return function(params) {
        return new Promise(resolve => {
            let defValue = subst(params[pname], params);
            
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            })
            
            rl.question(title + ' [' + defValue + ']:', answer => {
                rl.close();
                params[pname] = answer ||defValue;
                resolve(params)
            })
        })
    }
}

function save(data, path) {
    return new Promise((resolve,reject) => {
        if (typeof data !='string') {
            data = JSON.stringify(data, 0, '    ');
        }
        
        fs.writeFile(path, data, error => {
            if (error)
                reject(error)
            else
                resolve();
        })
    })
}

function subst(str, context){
    return str.replace? str.replace(/\${(\w+)}/g, (m,p1)=>context[p1]||''): str;
}
