var request = require('request');
var express = require('express');
var router = express.Router();

let SpotifyWebApi = undefined;
let spotifyApi = undefined
var spotifyEnabled = process.env.SPOTIFY_API_ENABLED

if (spotifyEnabled) {
    SpotifyWebApi = require('spotify-web-api-node');
    spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECERT,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
}

var endpoint = process.env.POST_ENDPOINT

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Welcome!' });
});

router.get('/feelings', function(req, res, next) {
    console.log(spotifyEnabled)
    if (spotifyEnabled && spotifyApi !== undefined) {
        spotifyApi.getMyCurrentPlaybackState()
            .then(function(data) {
                // Output items
                if (data.body && data.body.is_playing) {
                    console.log("User is currently playing something!");
                } else {
                    console.log("User is not playing anything, or doing so in private.");
                }
            }, function(err) {
                console.log('Something went wrong!', err);
            });
    }
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
    request.post(endpoint, { json: body }, function(error, response, resBody){
        console.log(resBody);
        if(resBody.includes("event_created")) {
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
