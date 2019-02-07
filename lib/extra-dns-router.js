/**
 * Create wrap interface for PowerDNS REST
 * API like https://developers.digitalocean.com/documentation/v2/#domains
 * 
 * POST /domains << {name:'mydomen.com', ip_address: '192.168.1.69'}  
 * PUT  /domains/mydomen.com << {ip_address: '192.168.1.69'}  
 * 
 * GET /domains/:name/records << {type, name, ttl}
 * POST /domains/$DOMAIN_NAME/records << {type,name,ttl,data}
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
     * Create new zone  
     * POST /domains << {name:'mydomen.com', ip_address: '192.168.1.69'}  
     *
     * @param {JSON} body - request body
     * @param {String} body.name - zone name
     * @param {String} body.ip_address
     */
    router.post('/', function (req, res) {
        let zone = req.body.name; 
        let ip_address = req.body.ip_address;
        
        new Promise(resolve => resolve())
        .then(()=> master.createZone(zone, { hostmaster: 'hostmaster.'+ config.ns1, soa_edit_api: 'EPOCH' }) )
        .then(()=> master.createRecord(zone, 'A', `${zone}.`, ip_address))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    
    /**
     * Modify domain's properties  
     * Note: now support 'ip_address' only
     * PUT /domains/$DOMAIN_NAME << {ip_address: '192.168.1.69'}  
     *
     * @param {String} zone - zone (domain) name
     * @param {JSON} body - request body
     * @param {String} body.ip_address
     */
    router.put('/:zone', function (req, res) {
        let zone = req.params.zone;
        let ip_address = req.body.ip_address;
        
        new Promise(resolve => resolve())
        .then(()=> master.createRecord(zone, 'A', `${zone}.`, ip_address))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    
    /**
     * GET /${domain}
     * @param params.zone - domain name
     */
    router.get('/:zone', function (req, res) { // type,name,ttl,data
        new Promise(resolve => resolve())
        .then(()=> master.getZone(req.params.zone))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    
    /**
     * Delete zone  
     * DELETE /domains/:zone  
     * @param zone - zone name
     */
    router.delete('/:zone', function (req, res) {
        new Promise(resolve => resolve())
        .then(()=> master.deleteZone(req.params.zone))
        .then(()=> slave.deleteZone(req.params.zone))
        .then(request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
        
    
    /**
     * Get domain records list
     * GET /:name/records << {type, name, ttl}
     * @param {String} zone - zone(domain) name
     * @param {JSON} body - include filter for fileds (type, name, ttl)
     * @return {Object[]}
     * @example GET /domain.com/records << {type: 'CNAME'}
     */
    router.get('/:zone/records', function (req, res) {
        new Promise(resolve => resolve())
        .then(()=> master.getZone(req.params.zone)) // req.body.type, req.body.name, req.body.data, req.body.ttl? { ttl: req.body.ttl }: 0
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
     * @param {String} zone - zone(domain) name
     * @param {JSON} body - request body
     * @param {String} body.name - for CNAME = `www.${domain}.`
     * @param {String} body.type - now supported CNAME | A | AAAA
     * @param {String} body.content - for CNAME = `${domain}.`
     * @param {Integer} body.ttl
     * @expamle master.createRecord,   el.domain, 'CNAME', `www.${el.domain}.`, `${el.domain}.`))
     * @expamle {"name": "test.example.org.", "type": "A", "ttl": 86400, "content": "192.0.5.4"} 
     */
    router.post('/:zone/records', function (req, res) { // type,name,ttl,data
        let params = {};
        if (req.body.ttl)
            params.ttl = req.body.ttl;
        
        new Promise(resolve => resolve())
        .then(()=> master.createRecord(req.params.zone, req.body.type, req.body.name, req.body.content, params))
        .then (request_result.bind(this, res, 0))
        .catch(request_result.bind(this, res))
    });
    
    /**
     * Remove record
     */
    router.delete('/:zone/records/:type/:name', function (req, res) { // type,name,ttl,data
        new Promise(resolve => resolve())
        .then(()=> master.deleteRecord(req.params.zone, req.params.type, req.params.name))
        
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
