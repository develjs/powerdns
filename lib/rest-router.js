/**
 * Create wrap REST interface for PowerDNS REST
 * API like https://developers.digitalocean.com/documentation/v2/#domains
 * 
 * POST /domains << {name:'mydomen.com', ip_address: '192.168.1.69'}  
 * POST /domains/$DOMAIN_NAME/records << {type,name,ttl,data}
 *      type=A,AAAA; data=IP; [ttl=1800]
 *      type=CNAME; name=www.mydomen.com.; [ttl=1800]
 * DELETE /domains/:name
 */
const express = require('express'),
    bodyParser = require('body-parser'),
    PowerDNS = require('./powerdns');

/**
 * @param config
 * @param config.host - restapi host
 * @param config.port - restapi port
 * @param config.token- restapi token
 * @param config.ns1 - master server
 * @param config.ns2 - slave server
 * 
 */
module.exports = function(config) {
    // init api access
    let master = new PowerDNS(config.host, config.port, config.token, [config.ns1+'.', config.ns2+'.']) // list of ns need to create zones
    let slave  = new PowerDNS(config.ns2,  config.port, config.token)

    let router = express.Router();
    
    // to support JSON-encoded bodies
    router.use(bodyParser.json()); 
    router.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies
    
    router.post('/', function (req, res) {
        let domain = req.body.name; 
        let ip_address = req.body.ip_address;
        
        new Promise(resolve => resolve())
        .then(()=> master.createZone(domain, { hostmaster: 'hostmaster.'+ config.ns1, soa_edit_api: 'EPOCH' }) )
        .then(()=> master.createRecord(domain, 'A', `${domain}.`, ip_address))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
        //zones_db.add_zone(domain, ip_address, request_result.bind(this,res));
    });
    
    /**
     * Create custom DNS records
     * Note: for CNAME records pdns support only full alias name (with main domain)
     * 
     * @param body - request body - json
     * @param body.name - for CNAME = `www.${domain}.`
     * @param body.type - now supported CNAME | A | AAAA
     * @param body.data - for CNAME = `${domain}.`
     * @param body.ttl
     * @expamle master.createRecord,   el.domain, 'CNAME', `www.${el.domain}.`, `${el.domain}.`))
     * @expamle {"name": "test.example.org.", "type": "A", "ttl": 86400, "changetype": "REPLACE", "records": [ {"content": "192.0.5.4", "disabled": false } ] } 
     */
    router.post('/:name/records', function (req, res) { // type,name,ttl,data
        new Promise(resolve => resolve())
        .then(()=> master.createRecord(req.params.name, req.body.type, req.body.name, req.body.data, req.body.ttl? { ttl: req.body.ttl }: 0))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
        //zones_db.make_record(domain, type, req.body, request_result.bind(this,res));
    });
    
    router.delete('/:name', function (req, res) {
        new Promise(resolve => resolve())
        .then(()=> master.deleteZone(req.params.name))
        .then(()=> slave.deleteZone(req.params.name))
        .then(request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
        //zones_db.del_zone(req.params.name, request_result.bind(this,res));
    });

    return router;
};


function request_result(res, error, data){
    let result;
    if (error)
        result = {error: error.message || error};
    else
        result = {result: "ok", data: data||''};
    res.send(JSON.stringify(result));
}
