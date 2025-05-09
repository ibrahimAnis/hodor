#!/bin/bash

echo "Creating PoC Users, Role Model, User Role Assigments and Clients"

./bin/kcadm.sh config credentials --server 'http://localhost:8081' --realm master --user 'anisibrahim21@gmail.com' --password 'admin'

# Enable openfga-events
./bin/kcadm.sh update events/config -s 'eventsListeners=["openfga-events-publisher","jboss-logging"]'

# Clients
./bin/kcadm.sh create clients -r master -s clientId=portal -s publicClient=true -s 'redirectUris=["http://localhost:9090/callback"]' -s 'webOrigins=["http://localhost:9090"]' -s 'attributes={ "post.logout.redirect.uris": "http://localhost:9090/home?action=logout", "access.token.lifespan": 3600}' -o
./bin/kcadm.sh create clients -r master -s clientId=apisix -s 'redirectUris=["http://localhost:9090/callback"]'  -s 'secret=jnxDqhu0GTaCCWuKxodUnSdKzEIBquKT' -o

# Users
./bin/kcadm.sh create users -r master -s username=paula -s firstName=Paula -s lastName=Von -s enabled=true -s email=paula@demo.com
./bin/kcadm.sh set-password -r master --username paula --new-password demo1234!
./bin/kcadm.sh create users -r master -s username=peter -s firstName=Peter -s lastName=Anderson -s enabled=true -s email=peter@demo.com
./bin/kcadm.sh set-password -r master --username peter --new-password demo1234!
./bin/kcadm.sh create users -r master -s username=richard  -s firstName=Richard -s lastName=Miles -s enabled=true -s email=richard@demo.com
./bin/kcadm.sh set-password -r master --username richard --new-password demo1234!


# Create the parent roles as composite = true
./bin/kcadm.sh create roles -r master \
  -s name=admin-catalog \
  -s composite=true \
  -s 'description=Admin Catalog'

./bin/kcadm.sh create roles -r master \
  -s name=analyst-catalog \
  -s composite=true \
  -s 'description=Analyst Catalog'

# Create the child roles (these do not need composite=true):
./bin/kcadm.sh create roles -r master \
  -s name=view-product \
  -s 'description=View product'

./bin/kcadm.sh create roles -r master \
  -s name=edit-product \
  -s 'description=Edit product'

# Now you can add child roles to the composite parent roles:
./bin/kcadm.sh add-roles -r master \
  --rname analyst-catalog \
  --rolename view-product

./bin/kcadm.sh add-roles -r master \
  --rname admin-catalog \
  --rolename view-product

./bin/kcadm.sh add-roles -r master \
  --rname admin-catalog \
  --rolename edit-product


# User Role Assignments
./bin/kcadm.sh add-roles -r master --uusername paula --rolename analyst-catalog
./bin/kcadm.sh add-roles -r master --uusername richard --rolename admin-catalog
