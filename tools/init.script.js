#! /usr/bin/env node
/**
 * fill vars: host, port, token
 * record to 'pdns-config.json'
 */
const fs = require('fs');
const readline = require('readline');
const CONFIG = 'pdns-config.json';


// check quiet -> auto set
if (process.argv.indexOf("quiet")>=0) {
    
}

// default params
let params = {
    domain: 'example.domain', 
    ns1: 'ns1.${domain}',
    ns2: 'ns2.${domain}',
    host: '${ns1}', 
    port: 8081,
    token: ''
};

queries([
    ['Enter you domain name', 'domain'],
    ['Enter primary name server address', 'ns1'],
    ['Enter secondary name server address', 'ns2'],
    ['Enter Http access server name', 'host'],
    ['Http access port', 'port'],
    ['Access token', 'token'],
    
], () => {
    saveJson(CONFIG, params, error => {
        if (error) console.error(error);
        console.log('REST server config is saved to ' + CONFIG);
    });
})


function queries(list, cb) {
    let query = list.shift();
    if (!query){
        if (cb) cb();
        return;
    }
    
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    let defValue = subst(params[query[1]], params);
    rl.question(query[0] + ' [' + defValue + ']:', answer => {
        rl.close();
        
        params[query[1]] = answer ||defValue;
        queries(list, cb)
    });
}

function saveConf(from, to, params, cb_error) {
    fs.readFile(from, 'utf8', (error, data) => {
        if (error) {
            cb_error(error);
            return;
        }
        
        data = subst(data, params);
        fs.writeFile(to, data, error => {
            if (error) {
                cb_error(error);
                return;
            }
            cb_error();
        })
    })
}

function saveJson(path, data, cb_error) {
    if (typeof data !='string') {
        data = JSON.stringify(data, 0, '    ');
    }
    
    fs.writeFile(path, data, error => {
        if (error) {
            cb_error(error);
            return;
        }
        cb_error();
    })
}

function subst(str, context){
    return str.replace? str.replace(/\${(\w+)}/g, (m,p1)=>context[p1]||''): str;
}
