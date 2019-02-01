/**
 * Create wrap REST interface for PowerDNS REST
 * API like https://developers.digitalocean.com/documentation/v2/#domains
 * 
 * POST /domains << {name:'mydomen.com', ip_address: '192.168.1.69'}  
 * PUT  /domains/mydomen.com << {ip_address: '192.168.1.69'}  
 * 
 * GET /domains/:name/records << {type, name, ttl}
 * POST /domains/$DOMAIN_NAME/records << {type,name,ttl,data}
 *
 * GET /domains/${domain}/aliases
 * POST /${domain}/aliases
 * DELETE /${domain}/aliases/${alias}
 * 
 * GET /${domain}
 * 
 * DELETE /domains/:name
 */
const express = require('express'),
    bodyParser = require('body-parser'),
    PowerDNS = require('./powerdns');

/**
 * Create router for control
 * 
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
    
    
    /**
     * Create new domain  
     * POST /domains << {name:'mydomen.com', ip_address: '192.168.1.69'}  
     *
     * @param body - request body - json
     * @param body.name - domain name
     * @param body.ip_address
     */
    router.post('/', function (req, res) {
        let domain = req.body.name; 
        let ip_address = req.body.ip_address;
        
        new Promise(resolve => resolve())
        .then(()=> master.createZone(domain, { hostmaster: 'hostmaster.'+ config.ns1, soa_edit_api: 'EPOCH' }) )
        .then(()=> master.createRecord(domain, 'A', `${domain}.`, ip_address))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    
    /**
     * Modify domain's properties  
     * Note: now support 'ip_address' only
     * PUT /domains/$DOMAIN_NAME << {ip_address: '192.168.1.69'}  
     *
     * @param params.name - domain name
     * @param body - request body - json
     * @param body.ip_address
     */
    router.put('/:name', function (req, res) {
        let domain = req.params.name 
        let ip_address = req.body.ip_address;
        
        new Promise(resolve => resolve())
        .then(()=> master.createRecord(domain, 'A', `${domain}.`, ip_address))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    
    /**
     * Get domain records list
     * GET /:name/records << {type, name, ttl}
     * @param {Object} body - include filter for fileds (type, name, ttl)
     * @return {Object[]}
     */
    router.get('/:name/records', function (req, res) {
        new Promise(resolve => resolve())
        .then(()=> master.getZone(req.params.name)) // req.body.type, req.body.name, req.body.data, req.body.ttl? { ttl: req.body.ttl }: 0
        .then(data => {
            if (data && data.rrsets) {
                data = data.rrsets;
                if (req.body) 
                    data = data.filter(item => {
                        for (p in req.body) {
                            if (item[p] != req.body[p]) return false;
                        }
                        return true;
                    })
                request_result(res, 0, data)
            }
            else
                request_result(res, 'Error: wrong data')
        })
        .catch(request_result.bind(this, res))
    });
    
    
    /**
     * Create custom DNS records
     * POST /domains/$DOMAIN_NAME/records << {type,name,ttl,data}
     *      type=A,AAAA; data=IP; [ttl=1800]
     *      type=CNAME; name=www.mydomen.com.; [ttl=1800]
     * 
     * Note: for CNAME records pdns support only full alias name (with main domain)
     * 
     * @param params.name - domain name
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
    });
    
    
    /**
     * Get domain aliases list (CNAME)
     * GET /${domain}/aliases
     * @return {Object[]}
     */
    router.get('/:name/aliases', function (req, res) {
        let domain = req.params.name;
        new Promise(resolve => resolve())
        .then(()=> master.getZone(domain)) // req.body.type, req.body.name, req.body.data, req.body.ttl? { ttl: req.body.ttl }: 0
        .then(data => {
            if (data && data.rrsets) {
                data = data.rrsets.filter(item => item.type == 'CNAME').map(item=>{
                    if (item.name.endsWith('.'+domain+'.')) return item.name.substr(0, item.name.length - domain.length - 2)
                    return item.name;
                })
                request_result(res, 0, data)
            }
            else
                request_result(res, 'Error: wrong data')
        })
        .catch(request_result.bind(this, res))
    });
    
    
    
    /**
     * Create domain alias
     * POST /${domain}/aliases
     * Note: you can use alias in two formats, if ended by dot - uses as full version, in another case appended with domain {alias}.{domain}.
     * Ex: "www.domain.com." or just "www"
     * @param {String} body.alias - alias for domain 
     */
    router.post('/:name/aliases', function (req, res) { // type,name,ttl,data
        let alias = req.body.alias;
        if (!alias.endsWith('.')) 
            alias = alias + '.' + req.params.name + '.';

        new Promise(resolve => resolve())
        .then(()=> master.createRecord(req.params.name, 'CNAME', alias, req.params.name + '.'))
        
        .then(request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    
    /**
     *  DELETE /${domain}/aliases/${alias}
     * @param {String} name - domain
     * @param {String} body.alias - alias
     */
    router.delete('/:name/aliases/:alias', function (req, res) { // type,name,ttl,data
        let alias = req.params.alias;
        if (!alias.endsWith('.')) 
            alias = alias + '.' + req.params.name + '.';
        
        new Promise(resolve => resolve())
        .then(()=> master.deleteRecord(req.params.name, 'CNAME', alias))
        
        .then(request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    
    /**
     * GET /${domain}
     */
    router.get('/:name', function (req, res) { // type,name,ttl,data
        new Promise(resolve => resolve())
        .then(()=> master.getZone(req.params.name))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    /**
     * Delete zone
     * DELETE /domains/:name
     * @param params.name - domain name
     */
    router.delete('/:name', function (req, res) {
        new Promise(resolve => resolve())
        .then(()=> master.deleteZone(req.params.name))
        .then(()=> slave.deleteZone(req.params.name))
        .then(request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
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
