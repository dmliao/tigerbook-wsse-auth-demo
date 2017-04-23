var http = require('https');
var wsse = require('./vendor/wsse');
var request = require('request');

// var host = "https://tigerbook.herokuapp.com";
var host = 'http://localhost:3000'

var endpoint;

// to get an image (still needs WSSE)
// endpoint = '/images/dmliao';

// to get a JSON for the student
// endpoint = '/api/v1/undergraduates/dmliao';

endpoint = "/photo/dmliao";

var username = "testuser+api";
var password = "test";

// NOTE: For WSSE, make sure that it's using SHA256, not SHA1! 
// We might have to alter the library to make it work.

var token = new wsse.UsernameToken({
    username: username,
    password: password
});

var wsseString = token.getWSSEHeader({
    nonceBase64: true
});

var re =
    /UsernameToken +Username="(.+)", *PasswordDigest="(.+)", *Nonce="(.+)", *Created="(.+)"/g;

var verify = re.exec(wsseString);

var username = verify[1];
var nonce = verify[3];
var created = verify[4];

var token2 = new wsse.UsernameToken({
    username: username,
    password: password,
    created: created,
    nonce: nonce
})

var digest1 = token.getPasswordDigest({
    nonceBase64: true
});
var digest2 = token2.getPasswordDigest({
    nonceBase64: true
});

var options = {
    url: host + endpoint,
    headers: {
        'Authorization': 'WSSE profile="UsernameToken"',
        'X-WSSE': wsseString
    },
    method: 'GET'
};

console.log(options);

var callback = function(error, response, body) {
    if (error) {
        console.log(error);
    }
    if (!error) {
        console.log(body);
    }
}

request(options, callback);