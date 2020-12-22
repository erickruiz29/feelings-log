var request = require('request');
var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');

let spotifyApi = undefined
var spotifyEnabled = process.env.SPOTIFY_API_ENABLED

if (spotifyEnabled) {
    spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
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

function getRelevantTrackData(callback) {
    var trackData = {};
    if (spotifyEnabled && spotifyApi !== undefined && spotifyApi.getAccessToken() !== undefined) {
        spotifyApi.getMyCurrentPlayingTrack()
            .then(function(data) {
                if (data.body && data.body.is_playing) {
                    // console.log(data.body.item.album);
                    trackData = {
                        id: data.body.item.id,
                            preview_url: data.body.item.preview_url,
                        artists: data.body.item.artists,
                        progress_ms: data.body.item.progress_ms,
                        duration_ms: data.body.item.duration_ms,
                        name: data.body.item.name,
                        external_urls: data.body.item.external_urls,
                        image: data.body.item.album.images[0]
                    }

                    if (typeof callback === "function") {
                        callback(trackData)
                    } else {
                        return trackData
                    }
                } else {
                    callback(trackData)
                }
            }, function(err) {
                return {error: `"Error with Spotify"`}
            });
    } else {
        callback(trackData)
    }
}

router.get('/getTrackData', (req, res, next) => {
    getRelevantTrackData((trackData) => {
        res.json(trackData)
    })
})

router.get('/log', function(req, res, next) {
    var authd = req.query["authd"];
    authd = authd === undefined ? `""` : `"${authd}"`;

    let spotifyBtnEnabled = spotifyEnabled;
    let currentMusic = `""`
    let args = { title: 'Feelings Log', test: req.get("test") === "true", authd: authd,
        spotifyBtnEnabled: spotifyBtnEnabled, currentMusic: currentMusic, error: `""`, musicImgUrl: `""`};

    if (spotifyEnabled && spotifyApi !== undefined && spotifyApi.getAccessToken() !== undefined) {
        getRelevantTrackData((trackData) => {
            if (Object.keys(trackData).length > 0) {
                if (trackData.error) {
                    args.error = trackData.error;
                } else {
                    args.currentMusic = `"${trackData.name} by ${trackData.artists[0].name}"`;
                    args.musicImgUrl = `"${trackData.image.url}"`
                    args.spotifyBtnEnabled = `false`;
                }
            } else {
                args.currentMusic = `"No music playing"`
                args.spotifyBtnEnabled = `false`;
            }
            res.render('log', args);
        })
    } else {
        res.render('log', args);
    }
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

    getRelevantTrackData((trackData) => {
        body.trackData = trackData
        request.post(reqUri, { json: body }, function(error, response, resBody){
            // console.log(resBody);
            if(resBody.includes("event_created")) {
                res.send("CREATED!")
            } else {
                res.send("NOT OKAY!")
            }
        });
    })

  } else {
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

            res.redirect('/log?authd=Spotify');

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
