const path = require('path');
const fs = require('fs');

const express = require('express');
const app = express();

const request = require('superagent');

const session = require('express-session');
const bodyParser = require('body-parser');
const cons = require('consolidate');
const auth = require('./auth');
const _ = require('lodash');

const crypto = require('crypto');
const url = require('url');

const wsse = require('./vendor/wsse');

const database = require('./database.json');

// uggghhhh
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'vendor')));

app.use(session({
    secret: 'super secret key',
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('port', process.env.PORT || 3000);
app.set('env', 'DEVELOPMENT');

// assign the swig engine to .html files 
app.engine('html', cons.nunjucks);

// set .html as the default extension 
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

app.route('/me')
    .get(auth.casBlock(), function(req, res) {
        res.json({
            username: req.session[auth.session_name]
        });
    });

app.route("/protected")
    .get(auth.isAuthenticated(), function(req, res) {

        res.send("WSSE Authentication Successful.");
    });

app.route('/')
    .get(auth.casRedirect(), function(req, res) {
        res.sendFile(path.join(__dirname, '/index.html'));
    });

app.route('/login')
    .get(auth.casRedirect(), function(req, res) {
        if (req.session.return) {
            res.redirect(req.session.return);
        }
        else {
            res.redirect('/');
        }

    });
app.route('/logout')
    .get(auth.casLogout());

// PROXY FOR TIGERBOOK

app.route('/tigerbook/getKey')
    .get(function(req, res, next) {
        console.log("Retrieving key");
        request.get('https://tigerbook.herokuapp.com/api/v1/getkey').pipe(res);
    })

app.route('/tigerbook/undergraduates/:netid')
    .get(function(req, res, next) {
        request.get('https://tigerbook.herokuapp.com/api/v1/undergraduates/' + req.params.netid)
            .set(req.headers)
            .pipe(res);
    })

function generateWSSEKeyForService(username, service) {

    var key = _.find(database.keys, function(key) {
        return (key.username === username && key.service === service);
    });

    if (!key) {
        // return res.status(401, "No such user found");

        // you can also create a key here instead.
        key = {
            username: username,
            service: service
        };
        database.keys.push(key);
    }

    var password = crypto.randomBytes(32).toString('hex');

    // pull this from the database or something.
    // TODO: how do we protect these keys?
    key['wsse-key'] = password;

    fs.writeFileSync("database.json", JSON.stringify(database, null, 2));

    console.log("Writing to database");

    return password;

}
app.route('/wsse')
    .get(auth.casRedirect(), function(req, res) {

        var username = req.session[auth.session_name];
        var service = 'generic';

        console.log(service);
        console.log(username);

        var password = generateWSSEKeyForService(username, service);

        res.send(password);
    })
app.route('/wsse/:service')
    .get(auth.casRedirect(), function(req, res) {

        var username = req.session[auth.session_name];
        var service = req.params.service;

        console.log(service);

        var password = generateWSSEKeyForService(username, service);

        res.send(password);
    })
app.listen(app.get('port'), function() {
    console.log(
        'Express server listening on port %d in %s mode',
        app.get('port'), app.get('env'));
});