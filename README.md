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

    # this command my raise an error, because port :53 is busy
    # stop default DNS resolver for successful run PowerDNS
    sudo systemctl disable systemd-resolved.service
    sudo systemctl stop systemd-resolved

    # enable REST API service
    # see also:  https://doc.powerdns.com/md/httpapi/README/

    # generate key for REST api
    head /dev/urandom | tr -dc A-Za-z0-9 | head -c 36 ; echo ''
    > qwertyuiopasdfghjklzxcvbnm1234567890

    # configure PowerDNS
    sudo nano /etc/powerdns/pdns.conf

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

    # re-start PowerDNS
    sudo service pdns start
    # or
    sudo service pdns restart
    # check status
    sudo service pdns status

    # create main zone - need for dns resolving
    sudo pdnsutil create-zone example.com ns1.example.com
    sudo pdnsutil add-record example.com ns1 A 192.168.1.1
    sudo pdnsutil add-record example.com ns2 A 192.168.1.2

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

    # stop default resolver for run powerdns
    sudo systemctl disable systemd-resolved.service
    sudo systemctl stop systemd-resolved

    # disable master config in
    sudo nano /etc/powerdns/pdns.d/bind.conf
    #bind-config=/etc/powerdns/named.conf

    # enable slave mode in 
    sudo nano /etc/powerdns/pdns.conf
    slave=yes
    slave-cycle-interval=60
    disable-axfr=yes

    # link to master
    # register master in mysql DB (for example: ns.server.net 10.0.0.1)
    sudo mysql -u root -D pdns -p 

    > INSERT INTO supermasters VALUES('10.0.0.1','ns.server.net','master');
    > quit

    sudo service pdns start

    # base configuration for slave
    # main zone name and master IP
    sudo pdnsutil create-slave-zone 8b.io 192.168.1.1  
    # retrive zone
    sudo pdns_control retrieve 8b.io 
    
