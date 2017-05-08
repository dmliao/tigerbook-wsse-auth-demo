# WSSE Server Test

Quick demo application for server routes / authentication with WSSE, backed by Princeton's CAS.

On the server, API routes require WSSE authentication (with SHA256 rather than SHA1 in the WSSE protocol), allowing clients with WSSE keys to consume the API. Clients get WSSE keys through CAS authentication, and there is a barebones jQuery frontend to automatically obtain WSSE keys upon CAS login, and store the WSSE keys as a cookie.

The idea then is that any client consuming such an API will be backed by CAS, and then be able to store WSSE keys, and generate new ones if the local storage / cookies doesn't have the proper WSSE key.

This has a problem if there are multiple clients, as client A can request a new key, and invalidate the key that client B stored, forcing constant regeneration of keys. To prevent this, each client is assigned a `service`, and the username associated with each WSSE key is a combination of the netID of the requesting user, as well as the service name, separated by `+`. For example, the user `user` requesting a WSSE key for the `web` client will send WSSE headers with `username=user+web`.

This demo server is an example app for communicating with Princeton's Tigerbook API, which also uses WSSE. The client is a simple jQuery app that allows you to type a netID into the input, then click the button to show that student's picture from Tigerbook.

## Usage

This project relies upon Node.JS and NPM. Tested on NodeJS 6.9.3 and NPM 3.10.10.

First, open up `database-SAMPLE.json` and replace the tigerbook username and wsse-key with your credentials, and save it as `database.json`. Then run:

    npm install
    npm start

which should compile the frontend code and start the server. Navigate to `localhost:3000` to run the sample app.

To run the command line client, use:

    node test

## Structure

The file structure is currently a giant mess. Almost all major pieces are in the top-level directory.

* `auth.js` - contains the verification middleware for WSSE checking, using a dummy json database.
* `build.js` - used to compile the frontend javascript files.
* `database.json` - stores the WSSE keys. In an actual app, please use a proper database.
    - The app is bundled with `database-SAMPLE.json`, which needs to have dummy keys replaced with proper WSSE keys and renamed `database.json` for the app to work.
* `index.html` - homepage for the sample client app.
* `model.md` - short documentation for how WSSE keys are produced from database.json
* `package.json` - npm package dependencies
* `server.js` - Express server
* `test.js` - sample client from the command line that requests Tigerbook data from the API route.
* `public/client.js` - client-side javascript app.

### Routes

The server has the following routes (all found in `server.js`:

* `/login` and `/logout` for CAS authentication
* `/wsse` - generates a new generic wsse key for the current user from CAS
* `/wsse/:service` - generates a wsse key for the provided service for the CAS user
* `/me` - returns the username of the current CAS user
* `photo/:netid` - example API route, returns Tigerbook information for a student
* `/` - homepage, example client page route, protected by CAS.

## Notes

The WSSE verifier in `auth.js` is incomplete - there should be some check to make sure nonces are not reused.

This app calls Tigerbook with a single application key for all users - which is not entirely ideal. In the ideal situation, the application would be able to procure an agent key for the user on their behalf, and use that key for their queries. However, we cannot do that for the following reasons:

1. We cannot consume API endpoints on the client, because that violates AJAX's cross-domain protections.
2. As a result, we use a proxy on the server to fetch Tigerbook requests. However, proxying through CAS to retrieve API keys becomes an issue.

2 can be solved by understanding and implementing CAS proxying. However, this requires a server specifically to handle the proxy tickets, which I'm not sure Princeton has.