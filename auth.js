var CASAuthentication = require('cas-authentication');
var inspect = require('util').inspect;
var _ = require('lodash');
var wsse = require('./vendor/wsse');

const database = require('./database.json');

// retrieve a property from an object without case sensitivity
var getProp = function(obj, name) {
    var realName = _.findKey(obj, function(value, key) {
        return key.toLowerCase() === name.toLowerCase();
    });
    return obj[realName];
};

var cas = new CASAuthentication({
    // cas_url: 'https://fed.princeton.edu/cas',
    cas_url: 'https://cast.cs.princeton.edu/cas',
    service_url: 'http://localhost:3000',
    cas_version: '2.0',
    renew: false,
    is_dev_mode: false,
    dev_mode_user: '',
    dev_mode_info: {},
    session_name: 'cas_user',
    session_info: 'cas_userinfo',
    destroy_session: false
});

function verifyWSSERequest(req) {
    var header = getProp(req.headers, "X-WSSE");
    var re =
        /UsernameToken +Username="(.+)", *PasswordDigest="(.+)", *Nonce="(.+)", *Created="(.+)"/g;

    var match = re.exec(header);
    return match;

}

exports.isAuthenticated = function(options) {
    return function(req, res, next) {
        // headers should be case insensitive
        if (getProp(req.headers, "Authorization") &&
            getProp(req.headers, "Authorization") ==
            'WSSE profile="UsernameToken"') {
            var wsseString = getProp(req.headers, 'X-WSSE');
            var verify = verifyWSSERequest(req);

            if (!verify) {
                // return cas.block(req, res, next);
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            var digest = verify[2];

            var usernameSplit = verify[1].split('+');

            var username = usernameSplit[0];
            var service = "generic";
            if (usernameSplit.length >= 2) {
                service = usernameSplit[1];
            }

            console.log(service);
            console.log(username);

            // we assume nonce is in base64 form
            var nonce64 = verify[3];
            var nonce = Buffer.from(nonce64, 'base64').toString('utf-8');

            var created = verify[4];

            // in an actual app, this should be pulled from a database
            // or something
            var key = _.find(database.keys, function(key) {
                return (key.username === username && key.service === service);
            });

            console.log(key);

            if (!key) {
                // return cas.block(req, res, next);
                return res.status(401);
            }

            // TODO: how do we protect these keys?
            var password = key['wsse-key'];

            var token = new wsse.UsernameToken({
                username: username + "+" + service,
                password: password,
                created: created,
                nonce: nonce
            });

            console.log(token.getWSSEHeader({
                nonceBase64: true
            }));
            console.log(wsseString);

            if (digest === token.getPasswordDigest()) {
                // successful validation!
                console.log("VALIDATED");
                return next();
            }

            console.log("Not auth")
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        // if for some reason we still have CAS credentials, use that.
        // cas.block(req, res, next);
        return res.status(401).json({
            error: "Unauthorized"
        });
    }
}

exports.casRedirect = function() {
    return cas.bounce;
}

exports.casBlock = function() {
    return cas.block;
}

exports.casLogout = function() {
    return cas.logout;
}

exports.session_name = cas.session_name;