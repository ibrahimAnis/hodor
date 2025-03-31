docker pull openfga/openfga
docker run -p 8080:8080 -p 3000:3000 openfga/openfga run
curl -X POST 'localhost:8080/stores' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "anees-labs"  
}'
