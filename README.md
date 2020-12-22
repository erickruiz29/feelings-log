# Summary
Simple page that posts json data to endpoint. 

# Data point Log

Project began as a journal of my feelings to an endpoint. This was made to track my moods over time and see trends.
I decided to fetch my music listening habits as a data point for more analysis; I'm constantly listening
to music!

# Current data points
- Name (self provided, optional)
- 'Current Feeling' (input field, required)
- Emoji (input field, optional)
- Spotify currrent track being played by user (automatically fetched, need to authorize)

# How to run

Add environment variables for your endpoint url:

`POST_ENDPOINT='https://myendpoint....'`

# Enable Spotify API:
See https://developer.spotify.com/documentation/web-api/quick-start/ for more details on getting credentials.

See https://github.com/thelinmichael/spotify-web-api-node for API reference

Environment variables required for Spotify functionality:
```
SPOTIFY_CLIENT_ID=''
SPOTIFY_CLIENT_SECRET=''
SPOTIFY_API_ENABLED=true
SPOTIFY_REDIRECT_URI=''
```

# Deploy to Heroku
`Instructions and one-click coming soon`


