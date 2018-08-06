var express = require('express');
var router = express.Router();
var client = require('../init');
const {
  google
} = require('googleapis');
const fs = require('fs');
const os = require('os');
const uuid = require('uuid');
const path = require('path');
var HOME_TITLE = "Home Page"
var FIND_TITLE = "Find Page"

module.exports = function (io) {

  const TOKEN_PATH = 'token.json';

  const drive = null;
  /* GET home page. */
  router.get('/', function (req, res, next) {
    client.authorize(async (isContainFile, auth) => {
      if (!isContainFile)
        res.redirect('/token')
      else {
        this.drive = google.drive({
          version: 'v3',
          auth: auth
        });
        try {
          let files = await listFiles({
            keyword: '',
            token: ''
          })
          // console.log(files)
          res.render('index', {
            files: files.files,
            nextPageToken : files.nextPageToken,
            keyword: files.keyword,
            title : HOME_TITLE
          });
        } catch (err) {
          console.log(err)
          res.render('error', {
            message: 'Fail to get data',
            error: {
              status: err.code,
              stack: err.errors[0].message,
            }
          })
        }
      }
    })

  });
  router.get('/find', function (req, res, next) {
    client.authorize(async (isContainFile, auth) => {
      if (!isContainFile)
        res.redirect('/token')
      else {
        this.drive = google.drive({
          version: 'v3',
          auth: auth
        });
        try {
          let files = await listFiles({
            keyword: req.query.q,
            token: ''
          })
          // console.log(files)
          res.render('index', {
            files: files.files,
            nextPageToken : files.nextPageToken,
            keyword: req.query.q,
            title : FIND_TITLE
          });
        } catch (err) {
          console.log(err)
          res.render('error', {
            message: 'Fail to get data',
            error: {
              status: err.code,
              stack: err.errors[0].message,
            }
          })
        }
      }
    })

  });

  // GENERATE TOKEN START
  router.get('/token', (req, res) => {
    res.send(`<form method="POST" >
              <input id="token" name="token" class="form-control" type="text">
              <input type="submit" value="Submit">
              </form>`);
  })
  router.post('/token', (req, res) => {
    if (req.body) {
      //   console.log(req.body.token)
      client.oAuth2Client.getToken(req.body.token, (err, token) => {
        // if (err) { res.send(err) ; return ;}
        client.oAuth2Client.setCredentials(token);
        // // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
          res.redirect('/')
        });

        // callback(oAuth2Client);
      });
    }
  })

  // GENERATE TOKEN END


  async function listFiles(token) {


    // console.log('token la : ')
    // console.log(token)
    // console.log(token.keyword )
    return new Promise((resolve, reject) => {
      this.drive.files.list({
        pageSize: 12,
        pageToken: token.token,
        q: "name contains '" + token.keyword + "' and trashed=false and mimeType!='application/vnd.google-apps.folder' ",

        fields: 'nextPageToken, files(id,name,fullFileExtension,createdTime,size,thumbnailLink,kind,webContentLink,iconLink)',
        // fields: 'nextPageToken, files(*)',
      }, (err, res) => {
        if (err) {
          reject(err)
          return console.log('The API returned an error: ' + err);
        }
        const files = res.data.files;
        // files.nextPageToken = res.data.nextPageToken;
        // files.keyword = token.keyword;
        if (files.length) {
          // console.log('Files:');
          // files.map((file) => {
          //   console.log(`${file.name} (${file.id})`);
          // });
        } else {
          console.log('No files found.');
        }
        resolve({files : files,
          nextPageToken : res.data.nextPageToken,
          keyword  : token.keyword
        })
        // return files

      });
    })

  }


  FetchFile = (id, name, size) => {
    // console.log(id)
    return new Promise((resolve, reject) => {
      var fileId = id;
      var progress = 0;
      // const filePath = path.join(os.tmpdir(), uuid.v4() + name);
      const filePath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads/' + name);
      var dest = fs.createWriteStream(filePath);
      this.drive.files.get({
        fileId: fileId,
        alt: 'media',
        // fields: 'file(id, name)',
      }, {
        responseType: 'stream'
      }, (err, rs) => {
        if (err) reject(err)
        rs.data
          .on('end', () => {
            console.log('Done downloading file.');
            resolve(filePath);
          })
          .on('error', err => {
            console.error('Error downloading file.');
            reject(err);
          })
          .on('data', d => {
            progress += d.length;
            // process.stdout.clearLine();
            // process.stdout.cursorTo(0);
            // process.stdout.write(`Downloaded ${progress} bytes`);
            io.emit('dowloadEvt', Math.round((progress / size) * 100))
          })
          .pipe(dest);

      })



    });

  }
  //Socket.IO
  io.on('connection', function (socket) {
    console.log('User has connected to Index');
    socket.on('dowloadEvt', function (item) {
      // console.log('message: ' + item.id);
      client.authorize(((isContainFile, auth) => {
        if (!isContainFile)
          res.redirect('/token')
        else {
          this.drive = google.drive({
            version: 'v3',
            auth: auth
          });
          FetchFile(item.id, item.name, item.size).then((rs) => {

          }, (err) => {
            console.log(err)
          })
        }
      }))
    });
    socket.on('nextPageEvt', function (item) {
      // console.log('message: ' + item.id);
      client.authorize((async (isContainFile, auth) => {
        if (!isContainFile)
          res.redirect('/token')
        else {
          this.drive = google.drive({
            version: 'v3',
            auth: auth
          });

          try {
            let files = await listFiles({
              token: item.nextPageToken,
              keyword: item.keyword
            })
            // console.log(files)
            // console.log(files)
            io.emit('nextPageEvt', {
              isSuccess: true,
              files: files.files,
              nextPageToken : files.nextPageToken,
              keyword : files.keyword
            });
          } catch (err) {
            io.emit('nextPageEvt', {
              isSuccess: false,
              message: 'Fail to get data',
              error: {
                status: err.code,
                stack: err.errors[0].message,
              }
            })
          }


        }
      }))
    });
    // socket.on('dowloadEvt', function (msg) {
    //   io.emit('dowloadEvt', 'asdlfkj');
    // });
    //End ON Events
  });

  return router;
};