/**
 * For more delails see:  
 * https://doc.powerdns.com/md/httpapi/api_spec/  
 * https://doc.powerdns.com/md/httpapi/README/  
 * 
 * class PowerDNS {
 *    {String} apiKey 
 *    {String} baseUrl
 *    query(url, body, method) 
 * 
 *    getZones()
 *    getZone(zone)
 *    createZone(zone, params)
 *    exportZone(zone)    
 *    deleteZone(zone)
 *    notifyZone(zone)
 * 
 *    createRecord(zone, type, params)
 *    deleteRecord(zone, type, name)
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
     * @param {String} zone
     * @return {Object}
     */
    getZone(zone) {
        return this.query(`/zones/${zone}`)
    }

    /**
     * ex. {"name":"example.org.", "kind": "Native", "masters": [], "nameservers": ["ns1.example.org.", "ns2.example.org."]}
     * @param {String} zone - zone name (without endedn dot)
     * @param {Object} params - all params see here: https://doc.powerdns.com/md/httpapi/api_spec
     * @param {String} params.kind - Authoritative: Native, Master or Slave; Recursor: Native, or Forwarded
     * @param {String} params.soa_edit_api- INCREMENT-WEEKS | INCEPTION-EPOCH | INCEPTION-INCREMENT..., see https://doc.powerdns.com/md/authoritative/dnssec/#soa-edit-ensure-signature-freshness-on-slaves
     * @param {String[]} params.masters - ex.: ["<ip>", ...]
     * @param {String[]} params.nameservers - DNS format addresses (dot-ended)
     * @return {Object} - full zone record
     */
    createZone(zone, params) {
        return this.query('/zones', Object.assign({
                name: zone.endsWith('.')? zone: zone + '.',
                kind: this.kind,
                nameservers: this.nameservers
            }, params), 'POST')
    }
    
    /** 
     * Get zone description in BIND format 
     * @param {String} zone
     * @return {Object} = { zone: <String> }
     */
    exportZone(zone) {
        return this.query(`/zones/${zone}/export`)
    }

    /**
     * Remove whole zone
     * @param {String} zone
     */
    deleteZone(zone) {
        return this.query(`/zones/${zone}`,'', 'DELETE');
    }
    
    /**
     * Send a DNS NOTIFY to all slaves
     * @param {String} zone
     */
    notifyZone(zone) {
        return this.query(`/zones/${zone}/notify`, '', 'PUT')
    }


    /**
     * Make or update DNS record
     * 
     * @param {String} zone - zone name (without ended dot)
     * @param {String} type - type of record = A,AAAA,CNAME...
     * @param {String} name - for A records is domain/subdomain, full domains must be ended by dot (.), for CNAME - full domain (dot-ended)
     * @param {String| String[]} content - for A records is IP address, CNAME - bind address, usualy zone name with dot, you can use array
     * @param {Object} params
     * @param {Integer} params.ttl - default is 86400
     * @param {String} params.changetype - default is REPLACE
     * @return returns 204 No Content on success.
     * @description
     *      # Add a new record to the new zone (would replace any existing test.example.org/A records)  
     *      {"name": "test.example.org.", "type": "A", "ttl": 86400, "changetype": "REPLACE", "records": [ {"content": "192.0.5.4", "disabled": false } ] }  
     */
    createRecord(zone, type, name, content, params) {
        content = content instanceof Array? content: [content];
        return this.query(
            `/zones/${zone}`,
            { rrsets: [ Object.assign({
                    name,
                    type,
                    ttl: 86400, // = 1 day
                    changetype: 'REPLACE',
                    records: content.map(content=>({ content, disabled: false }))
                }, params)]
            },
            'PATCH'
        )
    }
    
    /**
     * Remove zone
     * 
     * @param {String} zone - zone name (without ended dot)
     * @param {String} type - type of record = A,AAAA,CNAME...
     * @param {String} name - record  name, see createRecord()
     */
    deleteRecord(zone, type, name) {
        return this.query(
            `/zones/${zone}`,
            { rrsets: [ Object.assign({
                    name,
                    type,
                    changetype: 'DELETE'
                })]
            },
            'PATCH'
        )
    }

};

