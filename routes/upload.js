var express = require('express');
var router = express.Router();
var client = require('../init');
const {
  google
} = require('googleapis');
const fs = require('fs');
const toStream = require('buffer-to-stream')
const drive = null;
var UPLOAD_TITLE = "Upload"
router.get('/', function (req, res, next) {

  res.render('upload',{
    title : UPLOAD_TITLE
  })
});
router.post('/', (req, res, next) => {
  client.authorize(((isContainFile, auth) => {
    if (!isContainFile)
      res.redirect('/token')
    else {
      this.drive = google.drive({
        version: 'v3',
        auth: auth
      });
      if (!req.files)
        return res.status(400).send('No files were uploaded.');
      upload(req.files.file.name, req.files.file.data).then((resolve) => {
        
        res.send(resolve)
        // res.send(resolve)
        // res.render('index', { files : resolve });
      }, (reject) => {
        console.log(reject)
        res.redirect('error')
      })

    }

  }))
})

upload = (fileName, data) => {
  return new Promise((resolve, reject) => {
    try{
      // const fileSize = fs.statSync(fileName).size;
      // console.log(fileSize)
      this.drive.files.create({
        resource: {
          'name': fileName,
        },
        fields: 'id',
        requestBody: {
          // a requestBody element is required if you want to use multipart
        },
        media: {
          body: toStream(Buffer.from(data))
        }
      }, {
      },(err,rs)=>{
        if(err) reject(err);
        else resolve(rs)
      })
    }
    catch(err){
      resolve(err);
    }
      // console.log(res.data);
      // resolve(res.data);
    
  }).then((resolve) => {
    
    this.drive.permissions.create({
      resource : {
        'role': "reader",
        'type': "anyone",
        // 'emailAddress': 'minhmeolavip@gmail.com'
      },
      fileId: resolve.data.id,
      fields : 'id',
    }, function (err, result) {

      return new Promise((resolve, reject) => {
        if (err) reject(err)
        else resolve('success')
      })
    });


  },(reject)=>{
    return new Promise((resolve,reject)=>{
      reject('fail to set permission');
    })
  })
}

module.exports = router;