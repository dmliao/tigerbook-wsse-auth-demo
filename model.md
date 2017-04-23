wssekeys

{
    username: (belongsToUser)
    key: (string)
    service: (string)
}

Endpoint to create a key must have service as an endpoint or as a parameter

When getting keys, it doesn't matter which one you get. So querying for keys don't need the service

* Solution: get username as
netid+service
    to avoid having to loop through all the wssekeys associated with a person!