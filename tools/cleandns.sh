#!/bin/bash
# This script check all local zones if exists in its master (from SOA)
# and remove unexisted
# all removed zones are saving to  cleandns.log
# used: dig [domain] @[server] - for check correctness zone info
# used: pdnsutil for list zones and remove
# note: the script skip domain if master is unaccessible or domain has wrong SOA record
for zone in `pdnsutil list-all-zones`
do
        # calc master address
        ns2=$(pdnsutil list-zone $zone)
        if [[ $ns2  =~ SOA[[:space:]]+([^[:space:]]+) ]]; then
                master=${BASH_REMATCH[1]} # founded master
                
                # get zone info from master
                ns1=$(dig "$zone" @$master)
                # check right answer
                if [[ $ns1 == *"QUESTION SECTION:"* ]]; then
                        # check answer has right dns record
                        if [[ $ns1 == *"ANSWER SECTION:"* ]] || [[ $ns1 == *"AUTHORITY SECTION:"* ]]; then
                                echo zone $zone is ok! - skip
                        else
                                echo zone $zone is FAIL - remove
                                # backup zone to log
                                printf %s\\n%s\\n\\n "; zone $zone was removed at $(date '+%d/%m/%Y %H:%M:%S')" "$ns2" >> cleandns.log
                                # remove zone
                                pdnsutil delete-zone $zone
                        fi
                else
                        echo Error: Master NS is unaccesible
                        break
                fi
        else
                echo "Warning: no naster for $zone" 
        fi
done