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
	webserver-address=192.168.1.55

	# webserver/API access is only allowed from these subnets
	webserver-allow-from=127.0.0.1,::1,192.168.1.0/24

	# used when creating SOA dns records
	default-soa-name=ns1.example.com

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

