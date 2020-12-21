var request = require('request');
var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');

let spotifyApi = undefined
var spotifyEnabled = process.env.SPOTIFY_API_ENABLED

if (spotifyEnabled) {
    spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECERT,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
}

const scopes = [
    //'ugc-image-upload',
    'user-read-playback-state',
    //'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    //'user-read-email',
    //'user-read-private',
    //'playlist-read-collaborative',
    //'playlist-modify-public',
    'playlist-read-private',
    //'playlist-modify-private',
    //'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    //'user-follow-read',
    //'user-follow-modify'
];

var postEndpoint = process.env.POST_ENDPOINT,
    testEndpoint = process.env.TEST_ENDPOINT;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Welcome!' });
});

router.get('/log', function(req, res, next) {
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
  res.render('log', { title: 'Feelings Log', test: req.get("test") === "true" });
});

router.post('/log', function (req, res, next) {
    // Only requirement is that there is a feel param in body
  if ("feel" in req.body) {
    let body = req.body,
        date = new Date(),
        reqUri = req.body["test"] === "true" ? testEndpoint : postEndpoint;

    date = date.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' }) + " " +
           date.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' });

    body["date"] = date;

    request.post(reqUri, { json: body }, function(error, response, resBody){
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
});

// Spotify Endpoints

router.get('/auth/spotify', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

router.get('/callback/spotify', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi
        .authorizationCodeGrant(code)
        .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            const expires_in = data.body['expires_in'];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            console.log('access_token:', access_token);
            console.log('refresh_token:', refresh_token);

            console.log(
                `Sucessfully retreived access token. Expires in ${expires_in} s.`
            );
            res.send('Success! You can now close the window.');

            setInterval(async () => {
                const data = await spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];

                console.log('The access token has been refreshed!');
                console.log('access_token:', access_token);
                spotifyApi.setAccessToken(access_token);
            }, expires_in / 2 * 1000);
        })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.send(`Error getting Tokens: ${error}`);
        });
});

module.exports = router;
