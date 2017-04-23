var wsse = require('../vendor/wsse');

function getData(netid, wsse) {
    var route = "/photo/" + netid;
    if (wsse) {
        return $.ajax({
            url: route,
            type: 'GET',
            headers: {
                'Authorization': 'WSSE profile="UsernameToken"',
                'X-WSSE': wsse
            }
        });
    }
    return $.ajax({
        url: route,
        type: 'GET'
    });
}

function getMe() {
    return $.ajax({
        url: '/me',
        type: 'GET'
    });
}

// calls the wsse endpoint to obtain a wsseString, that is then saved as a cookie
function setWSSECookie() {
    return $.ajax({
        url: "/wsse/webqueue",
        type: "GET"
    }).then(function(result) {
        // Setting a cookie value
        return new Promise(function(resolve, reject) {
            Cookies.set('wsse', result);
            resolve(result);
        })
    }).catch(function(error) {
        console.log(error);
        return new Promise(function(resolve, reject) {
            reject(error);
        })
    })
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

// fetches image from Tigerbook
function onClick(netid) {

    function updateImage(tigerbookData) {
        var jsonResult = JSON.parse(tigerbookData);
        var img = $('<img />', {
            id: 'tigerbook-image',
            src: jsonResult.photo_link,
            alt: 'tigerbook-image'
        });
        $('#image').empty();
        img.appendTo('#image');
    }

    function authenticate(wsseKey) {
        getMe().then(function(me) {
            console.log(me);
            var wsse = setWSSEHeader(me.username, "webqueue", wsseKey);
            console.log(wsse);
            getData(netid, wsse).then(updateImage).catch(function(error) {

                console.log("Couldn't get data");
                console.log(error);

                // wsse cookie is outdated
                if (error.status == 401) {
                    Cookies.expire('wsse');
                    console.log(error);
                    return setWSSECookie().then(function(result) {
                        wsseKey = Cookies.get('wsse');
                        authenticate(wsseKey);

                    }).catch(function() {
                        window.location.href = '/login';
                    })

                }

            })

        }).catch(function(err) {
            window.location.href = '/login';
        })

    }

    var wsseKey = Cookies.get('wsse');
    console.log(wsseKey);

    if (!wsseKey) {
        console.log("Setting cookie");
        return setWSSECookie().then(function(result) {
            wsseKey = Cookies.get('wsse');
            authenticate(wsseKey);
        });
    }
    else {
        authenticate(wsseKey);
    }

}

$("#submit").click(function() {
    console.log("Clicked")
    onClick($('#netid').val());
});