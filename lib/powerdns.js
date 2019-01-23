/**
 * See:  
 * https://doc.powerdns.com/md/httpapi/api_spec/  
 * https://doc.powerdns.com/md/httpapi/README/  
 * 
 * class PowerDNS {
 *    {String} apiKey 
 *    {String} baseUrl
 *    query() 
 *    getZones()
 *    getZone(zoneName)
 *    createZone(zone)
 *    createZone(name, params)
 *    createRecord(zone, type, params)
 *    exportZone(name)    
 *    deleteZone(name)
 *    notifyZone(name)
 * }
 * 
 */
const request = require('request');

module.exports = class PowerDNS {
    /**
     * @param {String} host - rest-server address
     * @param {Integer} port
     * @param {String[]} nameservers - DNS format addresses (dot-ended), default is [{host}.], ex:[ns1.example.com., ns2.example.com.]
     * @param {String} kind - Authoritative: Native, Master(default) or Slave; Recursor: Native, or Forwarded 
     * @param {String} server - dns server local dns name, default is 'localhost'
     */
    constructor(host, port, apiKey, nameservers, kind = 'Master', server = 'localhost') {
        this.host = host; 
        this.nameservers = nameservers || [host+'.'];
        this.kind = kind;
        this.baseUrl = `http://${host}:${port}/api/v1/servers/${server}`;
        this.apiKey = apiKey;
    }
    
    /**
     * Custom server query
     * @param {String} url - request path only, ex: '/zones'
     * @param {Object} body - request params in json format
     * @param {String} method - GET(default) | PUT | POST | DELETE | PATCH
     */
    query(url, body = '', method='GET') {
        return new Promise((resolve, reject) => {
            url = this.baseUrl + url;
            request({ 
                    url, 
                    method, 
                    body,
                    headers: {
                        'X-API-Key': this.apiKey,
                        'Accept': 'application/json'
                    },
                    json: true
                }, 
                (err, response, body) => {
                    if (!err && (response.statusCode >= 300))
                        err = new Error(JSON.stringify(response.body));
                    if (err) 
                        reject(err);
                    else
                        resolve(body)
                }
            );
        });
    }
    
    /**
     *  Get zones list
     */
    getZones() {
        return this.query('/zones')
    }
    
    /**
     * Get zone info
     * @return {Object}
     */
    getZone(name) {
        return this.query(`/zones/${name}`)
    }

    /**
     * ex. {"name":"example.org.", "kind": "Native", "masters": [], "nameservers": ["ns1.example.org.", "ns2.example.org."]}
     * @param {String} name - zone name (without endedn dot)
     * @param {Object} params - all params see here: https://doc.powerdns.com/md/httpapi/api_spec
     * @param {String} params.kind - Authoritative: Native, Master or Slave; Recursor: Native, or Forwarded
     * @param {String} params.soa_edit_api- INCREMENT-WEEKS | INCEPTION-EPOCH | INCEPTION-INCREMENT..., see https://doc.powerdns.com/md/authoritative/dnssec/#soa-edit-ensure-signature-freshness-on-slaves
     * @param {String[]} params.masters - ex.: ["<ip>", ...]
     * @param {String[]} params.nameservers - DNS format addresses (dot-ended)
     * @return {Object} - full zone record
     */
    createZone(name, params) {
        if (!/\.$/.test(name)) name += '.';
        return this.query('/zones', Object.assign({
                name,
                kind: this.kind,
                nameservers: this.nameservers
            }, params), 'POST')
    }

    /**
     * Make or update DNS record
     * @param {String} zone - zone name (without ended dot)
     * @param {String} type - type of record = A,AAAA,CNAME...
     * @param {String} name - for A records is domain/subdomain, full domains must be ended by dot (.), for CNAME - full domain (dot-ended)
     * @param {String} data - for A records is IP address, CNAME - bind address, usualy zone name with dot
     * @param {Object} params
     * @param {Integer} params.ttl - default is 86400
     * @param {String} params.changetype - default is REPLACE
     * 
     * @description
     *      # Add a new record to the new zone (would replace any existing test.example.org/A records)
     *      {"name": "test.example.org.", "type": "A", "ttl": 86400, "changetype": "REPLACE", "records": [ {"content": "192.0.5.4", "disabled": false } ] } 
     */
    createRecord(zone, type, name, data, params) {
        return this.query(
            `/zones/${zone}`,
            { rrsets: [ Object.assign({
                    name,
                    type,
                    ttl: 86400, // = 1 day
                    changetype: 'REPLACE',
                    records: [{
                        content: data, 
                        disabled: false
                    }]
                }, params)]
            },
            'PATCH'
        )
    }

    /** 
     * Get zone description in BIND format 
     * @param {String} name
     * @return {Object} = { zone: <String> }
     */
    exportZone(name) {
        return this.query(`/zones/${name}/export`)
    }

    /**
     * Remove whole zone
     * @param name
     */
    deleteZone(name) {
        return this.query(`/zones/${name}`,'', 'DELETE');
    }
    
    /**
     * Send a DNS NOTIFY to all slaves
     */
    notifyZone(name) {
        return this.query(`/zones/${name}/notify`, '', 'PUT')
    }
};

