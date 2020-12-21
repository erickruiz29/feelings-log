var request = require('request');
var express = require('express');
var router = express.Router();

var endpoint = process.env.POST_ENDPOINT

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Welcome!' });
});

router.get('/feelings', function(req, res, next) {
  res.render('dingdong', { title: 'Feelings Log' });
});

router.post('/hello', function (req, res, next) {
    // Only requirement is that there is a feel param in body
  if ("feel" in req.body) {
    let body = req.body;
    let date = new Date()

    date = date.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' }) + " " +
           date.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' });

    body["date"] = date;
    request.post(endpoint, { json: body }, function(error, response, body){
        console.log(body);
        if(body.includes("event_created")) {
          res.send("CREATED!")
        } else {
          res.send("NOT OKAY!")
        }
      });
  }else {
    res.send("FAIL")
  }
})

module.exports = router;
