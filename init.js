'use strict';

/**
 * This is used by several samples to easily provide an oauth2 workflow.
 */

const {
  google
} = require('googleapis');
const opn = require('opn');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'credentials.json');
let keys = {
  redirect_uris: ['']
};
if (fs.existsSync(keyPath)) {
  const keyFile = require(keyPath);
  keys = keyFile.installed || keyFile.web;
}


class Client {

  constructor(options) {
    this._options = options || {
      scopes: []
    };
    this.TOKEN_PATH = 'token.json';
    this.SCOPES = ['https://www.googleapis.com/auth/drive'];
    // create an oAuth client to authorize the API call
    this.oAuth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      keys.redirect_uris[0]
    );
  }
  authorize(callback) {
    // Check if we have previously stored a token.
    fs.readFile(this.TOKEN_PATH, (err, token) => {
      let isContainFile = true;
      if (err) {
        isContainFile = false;
        this.authenticate()
      } else
        this.oAuth2Client.setCredentials(JSON.parse(token));
      callback(isContainFile, this.oAuth2Client);
    });
  }
  // Open an http server to accept the oauth callback. In this
  // simple example, the only request to our webserver is to
  // /oauth2callback?code=<code>
  authenticate() {

    opn(this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES
    }),{
      wait: false
    });
  }
}

module.exports = new Client();