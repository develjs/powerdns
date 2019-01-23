/**
 * Access to Rest DNS wraper. Use as example
 */
const request = require('request');

module.exports = class RestDNS {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey || '';
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
                        reject(err)
                    else
                        resolve(body)
                }
            );
        });
    }
    
    /**
     * POST /domains << {name:'mydomen.com', ip_address: '192.168.1.69'}  
     */
    createDomain(name, ip_address) {
        return this.query('/domains', {name, ip_address}, 'POST')
    }
    
    createCname(domain, alias) {
        return this.query('/domains/' + domain + '/records',
            {
                type: 'CNAME',
                name: `${alias}.${domain}.`,
                data: `${domain}.`
            },
            'POST')
    }
    
    /**
     * Create custom dns record
     * POST /domains/$DOMAIN_NAME/records << {type,name,ttl,data}
     *      type=A,AAAA; data=IP; [ttl=1800]
     *      type=CNAME; name=www.mydomen.com.; [ttl=1800]
     */
    createRecord(domain, type, name, data, ttl) {
        return this.query('/domains/' + domain + '/records', { type, name, ttl, data }, 'POST')
    }
    
    /**
     * DELETE /domains/:name
     */
    deleteDomain(name) {
        return this.query('/domains/' + name, {}, 'DELETE')
    }
}