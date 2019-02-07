/**
 * Access to Rest DNS wraper. Use as example
 */
const request = require('request');

module.exports = class RestDNS {
    /**
     * @param {String} baseUrl - base url for request
     * @param {Object} params - request extra params
     * @param {Object} params.headers - request extra headers
     */
    constructor(baseUrl, params) {
        this.baseUrl = baseUrl;
        this.params = params;
    }
    
    
    /**
     * Custom server query
     * @param {String} url - request path only, ex: '/zones'
     * @param {Object} body - request params in json format
     * @param {String} method - GET(default) | PUT | POST | DELETE | PATCH
     */
    query(url, body = '', method='GET') {
        url = this.baseUrl + url;
        let params = Object.assign({}, this.params, {
            url,
            method,
            body,
            headers: Object.assign({ 'Accept': 'application/json' }, this.params? this.params.headers: {}),
            json: true
        });
        
        return new Promise((resolve, reject) => {
            request(params, 
                (err, response, body) => {
                    if (!err && (response.statusCode >= 300))
                        err = new Error(JSON.stringify(response.body));
                    if (err) 
                        reject(err)
                    else
                        resolve(body)
                }
            );
        });
    }
    
    
    /**
     * POST /domains << {name:'mydomen.com', ip_address: '192.168.1.69'}  
     * @param {String} zone - domain name
     * @param {String} ip_address
     */
    createZone(zone, ip_address) {
        return this.query('/', {name:zone, ip_address}, 'POST')
    }
    
    
    /**
     * Get row zone info
     */
    getZoneRow(zone) {
        return this.query('/' + zone, {}, 'GET')
    }
    
    
    /**
     * DELETE /domains/:zone
     * @param {String} zone - domain name
     */
    deleteZone(zone) {
        return this.query('/' + zone, {}, 'DELETE')
    }
    
    
    /**
     * Get record list
     * @param {String} zone
     * @param {Object} filters - filtering fileds (type, name, ttl)
     * @return {Object[]} - list of records, ex.: [{"comments":[],"name":"www.a.com.","records":[{"content":"a.com.","disabled":false}],"ttl":86400,"type":"CNAME"}]
     */
    getRecords(zone, filters) {
        return this.query('/' + zone + '/records', filters||{}, 'GET');
    }
    
    
    /**
     * Delete custom zone record
     * 
     * @param {String} zone
     * @param {String} type
     * @param {String} name
     */
    deleteRecord(zone, type, name) {
        return this.query(`/${zone}/records/${type}/${name}`, {}, 'DELETE');
    }
    
    
    /**
     * Create custom dns record
     * POST /domains/$ZONE_NAME/records << {type,name,ttl,data}
     *      type=A,AAAA; data=IP; [ttl=1800]
     *      type=CNAME; name=www.mydomen.com.; [ttl=1800]
     * 
     * @param {String} zone - domain name
     * @param {String} type
     * @param {String} name
     * @param {String} data
     * @param {Integer} ttl
     */
    createRecord(zone, type, name, content, ttl) {
        let params = { type, name, content };
        if (ttl) params.ttl = ttl;
        return this.query('/' + zone + '/records', params, 'POST')
    }
    
    
    /**
     * Get CNAME records
     * 
     * @param {String} zone - domain name
     */
    getAliases(zone) {
        return this.getRecords(zone, {type:'CNAME'})
            .then(data => { 
                if (!data.error) {
                    data.data = (data.data||[])
                        .filter(item=>!!item)
                        .map(item => 
                            item.name.endsWith('.'+zone+'.') // if ended by zone then remove it
                            ? item.name.substr(0, item.name.length - zone.length - 2)
                            : item.name
                        )
                }
                return data;
            })
    }
    
    
    /**
     * Make CNAME record
     * Note: you can use alias in two formats, if ended by dot - uses as full version, in another case appended with zone name {alias}.{zone}.
     * Ex: "www.domain.com." or just "www"
     * 
     * @param {String} zone
     * @param {String} alias 
     */
    createAlias(zone, alias) {
        if (!alias.endsWith('.')) 
            alias = alias + '.' + zone + '.';
        return this.createRecord(zone, 'CNAME', alias, `${zone}.`);
    }
    
    
    /**
     * Remove CNAME record
     * Note: you can use alias in two formats, if ended by dot - uses as full version, in another case appended with zone name {alias}.{zone}.
     * 
     * @param {String} zone
     * @param {String} alias 
     */
    deleteAlias(zone, alias) {
        if (!alias.endsWith('.'))
            alias = alias + '.' + zone + '.';
        return this.deleteRecord(zone, 'CNAME', alias);
    }
}
