# Node.js wrapper for PowerDNS REST API


## Init server params

    npm run init


## For test run

    npm run test


## API

see lib/powerdns.js

## See also
PowerDNS documentation:  
 https://doc.powerdns.com/md/httpapi/api_spec/  
 https://doc.powerdns.com/md/httpapi/README/  


## Install PowerDNS Master server 

    # install MySQL
    sudo apt-get install mysql-server mysql-client

    # install pdns-backend-mysql
    # Enter and remember while install
    # MySQL username: pdns@localhost
    # MySQL password: 1234	
    sudo apt-get install pdns-backend-mysql

    # enable REST API service
    # see also:  https://doc.powerdns.com/md/httpapi/README/

    # generate key for REST api
    head /dev/urandom | tr -dc A-Za-z0-9 | head -c 36 ; echo ''
    > qwertyuiopasdfghjklzxcvbnm1234567890

    # configure PowerDNS
    sudo nano /etc/powerdns/pdns.conf

    # enable REST API access
    api=yes
    # insert generated key
    api-key=qwertyuiopasdfghjklzxcvbnm1234567890
    # address of IP interface to listen on (use ifconfig info, or "Private IPs" for AWS)
    webserver-address=192.168.1.1
    # webserver/API access is only allowed from these subnets
    webserver-allow-from=127.0.0.1,::1,192.168.1.0/24
    
    # used when creating SOA dns records
    default-soa-name=ns1.example.com
    # allow zonetransfers to slave
    allow-axfr-ips=192.168.1.2/32
    # other options
    slave=no
    daemon=yes
    # set listening interface, to avoid conflict with systemd-resolved
    local-address=192.168.1.1

    # re-start PowerDNS
    sudo service pdns start
    # or
    sudo service pdns restart
    # check status
    sudo service pdns status

    # Errors:
    sudo: unable to resolve host ip-172-12-34-56: Resource temporarily unavailable
    # add to /etc/hosts the line 
    ip-172-12-34-56 172.12.34.56

    curl: (52) Empty reply from server
    # add access from local ip subnet 


## Install PowerDNS SuperSlave

    # install MySQL
    sudo apt-get install mysql-server mysql-client

    # imrove security for mysql
    sudo mysql_secure_installation

    # install pdns-backend-mysql
    # Enter and remember while install
    # MySQL username: pdns@localhost
    # MySQL password: 1234	
    sudo apt-get install pdns-backend-mysql

    # disable master config in
    sudo nano /etc/powerdns/pdns.d/bind.conf
    #bind-config=/etc/powerdns/named.conf

    # enable slave mode in 
    sudo nano /etc/powerdns/pdns.conf
    slave=yes
    slave-cycle-interval=60
    disable-axfr=yes
    # set listening interface, to avoid conflict with systemd-resolved
    local-address=192.168.1.2
    
    # enable REST API access
    api=yes
    # insert generated key
    api-key=qwertyuiopasdfghjklzxcvbnm1234567890
    # address of IP interface to listen on (use ifconfig info, or "Private IPs" for AWS)
    webserver-address=192.168.1.2
    # webserver/API access is only allowed from these subnets
    webserver-allow-from=127.0.0.1,::1,192.168.1.0/24
    
    # link to master
    # register master in mysql DB (for example: ns.server.net 10.0.0.1)
    sudo mysql -u root -D pdns -p 

    > INSERT INTO supermasters VALUES('10.0.0.1','ns.server.net','master');
    > quit

    sudo service pdns start

    # base configuration for slave
    # main zone name and master IP
    sudo pdnsutil create-slave-zone ns.server.net 10.0.0.1  
    # retrive zone
    sudo pdns_control retrieve ns.server.net
    

## Useful commands

    sudo pdnsutil list-all-zones
    sudo nano /etc/powerdns/pdns.conf
    sudo service pdns restart
    sudo netstat -antup


## Sources
pdns-config.json  - PowerDNS access configuration
rest-config.json  - RestServer access configuration

/lib                    - libraries  
/lib/powerdns.js        - main library to access any PowerDNS server by native REST API  
/lib/rest-router.js     - Express.js router for create REST-service to manage PowerDNS servers  
/lib/rest-wrap.js       - example for using Express.js router API remotly  

/specs                  - tests  
/specs/pdns-test.js     - Main test for creating, lookuping and removing zones (npm run test)    
/specs/domains.json     - test domains list  
/specs/pdns-bulk.js     - test for pdns domains lookup (npm run lookup)  
/specs/rest-test.js     - Main test for REST-router  
/specs/misc.js          - miscellaneous helper functions  

/tools                  - help tools  
/tools/init.script.js   - init script for create pdns-config.json  
/tools/rest.server.js   - simple express server for run rest router  
/tools/cleandns.sh      - PowerDNS slave cleanup script, remove domains deleted from master  
