/**
 * Miscellaneous common functions
 */
const { exec } = require('child_process');

module.exports = {
    /**
     * @param {String} domain
     * @param {String} server
     */
    nslookup: function(domain, server) {
        return new Promise((resolve, reject) => {
            exec('nslookup ' + domain + ' ' + server, (error, stdout, stderr) => {
                if (error && stderr) {
                    reject(error.message || error)
                }
                else if (error) {
                    resolve({error: error.message || error});
                }
                else {
                    let res = /Name\:\s*(\S+)\s+Address\:\s*(\S+)/im.exec(stdout)
                    let ip = res && res[2];
                    if (ip)
                        resolve({result:'ok', data: ip});
                    else
                        resolve({error: 'No result'});
                }
            })
        })
    },


    /**
     * Function wrapper for logging the operation.
     * Arguments passed in Function.call format
     * @param thisArg - this object to call
     * @param {Function} func - function to run
     * @param {Any} args - arg1[, arg2[, ...]]
     */
    echo: function(thisArg, func, args) {
        args = [].slice.call(arguments,2);
        
        return function() {
            return new Promise(resolve => resolve())
            .then(()=>{
                process.stdout.write(
                    `${func.name}: ` 
                    + args.map(arg=> ((typeof arg=='string') && (arg.length<10))? arg: '').join(' ') 
                    + '.......');
            })
            .then(()=>func.apply(thisArg, args))
            .then(res => {
                console.log((res && res.result && !res.result.error)? 'Ok!': 'Fail');
                if (res && res.error)
                    console.error(res.error)
                if (res && res.data) {
                    console.log(res.data)
                }
                return res;
            })
            .catch(console.error)    
        }
    },
    
    /**
     * Start processes in several threads
     * @param {Function[]} funcs = [func():Promise, ...]
     * @param {Integer} max - max thread to start
     */
    runBulk: function(funcs, max) {
        return new Promise(resolve => {
            let started=[];
            run();
            
            function run() {
                if (!funcs.length){
                    if (!started.length)
                        resolve()
                    return;
                }
                
                if (started.length < max) {
                    started.push(
                        funcs.shift()().then(done).catch(done)  // run next
                    );
                    run();
                }
            }
            
            function done(tread){
                started.splice(started.indexOf(tread), 1);
                run();
            }
        })
    }
}
