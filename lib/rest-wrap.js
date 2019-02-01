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
     * @param {String} name - domain name
     * @param {String} ip_address
     */
    createDomain(name, ip_address) {
        return this.query('/', {name, ip_address}, 'POST')
    }
    
    getDomainRow(domain) {
        return this.query('/' + domain, {}, 'GET')
    }
    
    /**
     * Get record list
     * @param {String} domain
     * @param {Object} filters - filtering fileds (type, name, ttl)
     */
    getRecords(domain, filters) {
        return this.query('/' + domain + '/records', filters||{}, 'GET');
    }
    
    getAliases(domain) {
        return this.query('/' + domain + '/aliases', {}, 'GET');
    }
    
    /**
     * Make CNAME record
     * @param {String} domain
     * @param {String} alias
     */
    createAlias(domain, alias) {
        return this.query('/' + domain + '/records',
            {
                type: 'CNAME',
                name: `${alias}.${domain}.`,
                data: `${domain}.`
            },
            'POST')
    }
    
    deleteAlias(domain, alias) {
        return this.query('/' + domain + '/aliases/' + alias, {}, 'DELETE');
    }
    
    /**
     * Create custom dns record
     * POST /domains/$DOMAIN_NAME/records << {type,name,ttl,data}
     *      type=A,AAAA; data=IP; [ttl=1800]
     *      type=CNAME; name=www.mydomen.com.; [ttl=1800]
     * Note: use 
     * @param {String} name - domain name
     * @param {String} type
     * @param {String} name
     * @param {String} data
     * @param {Integer} ttl
     */
    createRecord(domain, type, name, data, ttl) {
        return this.query('/' + domain + '/records', { type, name, ttl, data }, 'POST')
    }
    
    /**
     * DELETE /domains/:name
     * @param {String} name - domain name
     */
    deleteDomain(name) {
        return this.query('/' + name, {}, 'DELETE')
    }
}