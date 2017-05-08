var wsse = require('../vendor/wsse');

var wsseService = "sampleApp";

function sendRequest(route, method, data, wsse) {

    var ops = {
        url: route,
        type: method
    };
    if (data) {
        ops.data = data;
    }
    if (wsse) {
        ops.headers = {
            'Authorization': 'WSSE profile="UsernameToken"',
            'X-WSSE': wsse
        }
    }
    return $.ajax(ops);

}

function setWSSEHeader(username, service, wsseKey) {
    var token = wsse({
        username: username + "+" + service,
        password: wsseKey
    });

    var wsseString = token.getWSSEHeader({
        nonceBase64: true
    });

    return wsseString;
}

// calls the wsse endpoint to obtain a wsseString, that is then saved as a cookie
function setWSSECookie(getKeyURL, cookie) {
    return $.ajax({
        url: getKeyURL,
        type: "GET"
    }).then(function(result) {
        // Setting a cookie value
        return new Promise(function(resolve, reject) {
            Cookies.set(cookie, result);
            resolve(result);
        })
    }).catch(function(error) {
        console.log(error);
        return Promise.reject(error);
    })
}

function retrieveWSSEKey(getKeyURL, cookie) {
    var wsseKey = Cookies.get(cookie);

    if (!wsseKey) {
        return setWSSECookie(getKeyURL, cookie).then(function(result) {
            wsseKey = Cookies.get(cookie);
            return Promise.resolve(wsseKey);
        }).catch(function(error) {
            console.log(error);
            // window.location.href = '/login';
        });
    }
    return Promise.resolve(wsseKey);
}

function authenticateInternal(route, getKeyURL, cookie, method, data) {
    var w = '';
    console.log("Authenticating");
    return retrieveWSSEKey(getKeyURL, cookie).then(function(wsseKey) {
        console.log("Retrieved cookie");
        w = wsseKey;
        return sendRequest('/me', 'GET');
    }).then(function(me) {
        console.log(me);
        var wsse = setWSSEHeader(me.username, wsseService, w);
        console.log(wsse);
        console.log(w);
        return sendRequest(route, method, data, wsse);
    }).then(function(response) {
        return Promise.resolve(response);
    }).catch(function(err) {
        console.log("We reached the error");
        console.log(err);
        Cookies.expire(cookie);
        return Promise.reject(err);
    })

}

function authenticate(route, method, data) {
    method = method || 'GET';

    var getKeyURL = "/wsse/" + wsseService;
    var cookie = 'local-wsse';

    return authenticateInternal(route, getKeyURL, cookie, method, data);

}

function getTigerbook(netid, method, data) {
    method = method || 'GET';

    var route = '/tigerbook/undergraduates/' + netid;
    var getKeyURL = '/tigerbook/getKey';
    var cookie = 'tigerbook-wsse';

    return authenticateInternal(route, getKeyURL, cookie, method, data);

}

module.exports = {
    authenticate: authenticate,
    getTigerbook: getTigerbook,
    sendRequest: sendRequest
}