#!/bin/bash

echo "Creating PoC Users, Role Model, User Role Assigments and Clients"

./bin/kcadm.sh config credentials --server 'http://keycloak:8081' --realm master --user 'admin' --password 'admin'

# Enable openfga-events
./bin/kcadm.sh update events/config  -s 'eventsListeners=["openfga-events-publisher","jboss-logging"]'

# Clients
./bin/kcadm.sh create clients -r master -s clientId=todo-portal -s publicClient=true -s 'redirectUris=["http://localhost/oauth2/callback"]' -s 'webOrigins=["http://localhost/","http://localhost:3000", "http://todo-api:8000" ]' -s 'attributes={ "post.logout.redirect.uris": "http://localhost:3000", "access.token.lifespan": 3600}' -o

# Users
./bin/kcadm.sh create users -r master -s username=ibrahim -s firstName=ibrahim -s lastName=Von -s enabled=true -s email=ibrahim@demo.com
./bin/kcadm.sh set-password -r master --username ibrahim --new-password demo1234!
./bin/kcadm.sh create users -r master -s username=mustafa -s firstName=mustafa -s lastName=Anderson -s enabled=true -s email=mustafa@demo.com
./bin/kcadm.sh set-password -r master --username mustafa --new-password demo1234!
./bin/kcadm.sh create users -r master -s username=mariyam  -s firstName=mariyam -s lastName=Miles -s enabled=true -s email=mariyam@demo.com
./bin/kcadm.sh set-password -r master --username mariyam --new-password demo1234!


# Create the parent roles as composite = true
./bin/kcadm.sh create roles -r master \
  -s name=admin-roles \
  -s composite=true \
  -s 'description=Admin Roles'

./bin/kcadm.sh create roles -r master \
  -s name=user-roles \
  -s composite=true \
  -s 'description=User Roles'

./bin/kcadm.sh create roles -r master \
  -s name=guest-roles \
  -s composite=true \
  -s 'description=Guest Roles'

# Create the child roles (these do not need composite=true):

./bin/kcadm.sh create roles -r master \
  -s name=todo-add \
  -s 'description=Add Todo'

./bin/kcadm.sh create roles -r master \
  -s name=todo-edit \
  -s 'description=Edit Todo'

./bin/kcadm.sh create roles -r master \
  -s name=todo-view \
  -s 'description=View Todo'

./bin/kcadm.sh create roles -r master \
  -s name=todo-delete \
  -s 'description=Delete Todo'

# Now you can add child roles to the composite parent roles:
./bin/kcadm.sh add-roles -r master \
  --rname admin-roles \
  --rolename todo-view

./bin/kcadm.sh add-roles -r master \
  --rname admin-roles \
  --rolename todo-add

./bin/kcadm.sh add-roles -r master \
  --rname admin-roles \
  --rolename todo-edit

./bin/kcadm.sh add-roles -r master \
  --rname admin-roles \
  --rolename todo-delete

./bin/kcadm.sh add-roles -r master \
  --rname user-roles \
  --rolename todo-view

./bin/kcadm.sh add-roles -r master \
  --rname user-roles \
  --rolename todo-add

./bin/kcadm.sh add-roles -r master \
  --rname guest-roles \
  --rolename todo-view


# User Role Assignments
./bin/kcadm.sh add-roles -r master --uusername ibrahim --rolename admin-roles
./bin/kcadm.sh add-roles -r master --uusername mariyam --rolename user-roles
./bin/kcadm.sh add-roles -r master --uusername mustafa --rolename guest-roles
