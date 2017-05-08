var wsse = require('../vendor/wsse');
var ajax = require('./ajax');

function updateImage(tigerbookData) {
    console.log(tigerbookData);
    var jsonResult = JSON.parse(tigerbookData);
    var img = $('<img />', {
        id: 'tigerbook-image',
        src: jsonResult.photo_link,
        alt: 'tigerbook-image'
    });
    $('#image').empty();
    img.appendTo('#image');
}
// fetches image from Tigerbook
function onClick(netid) {
    return ajax.getTigerbook(netid).then(function(response) {
        updateImage(response);
    }).catch(function(err) {
        console.log("Update image err");
        console.log(err);
    })
}

function getProtectedEndpoint() {

    $("#out").text("Requesting...");
    return ajax.authenticate('/protected').then(function(response) {
        $("#out").text(response);
    }).catch(function(err) {
        console.log("Generic error");

        // try again once
        return ajax.authenticate('/protected').then(function(response) {
            $("#out").text(response);
        }).catch(function(err) {
            console.log("Error again?");
            console.log(err);
        });
    })
}

$("#protected").click(function() {
    getProtectedEndpoint();
})

$("#submit").click(function() {
    console.log("Clicked")
    onClick($('#netid').val());
});