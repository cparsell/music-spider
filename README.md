# music-spider
Finds concerts near you based on Spotify listening history, emails them to you

Developed by https://github.com/cparsell
Made for Google Apps Script
  
Requirements:
- Google account
- Spotify account
- Ticketmaster API account

Setup:
- Create a new copy of the template Google Spreadsheet
- From the sheet, go Extensions > Apps Script to create a new script project
- Add a new script file for each of the files in this repo
- Copy the contents into them
- Modify the config.example.gs and name it config.gs
- Replace values in config.gs to match your API keys ([Spotify API](https://developer.spotify.com/dashboard/applications), [Ticketmaster](https://developer.ticketmaster.com/)) and set other settings
  - If you use a Spotify playlist, get the playlist ID from the end of the playlist URL but before the ? character
- in Apps Script, click Deploy > New Deployment > Web app > copy the link.
- Go to this link in your browser. This page will give you further instructions to:
    1. Navigate to your app via the Spotify App Dashboard (https://developer.spotify.com/dashboard/applications)
    2. Add the given URI (on this page) to the 'Redirect URIs' field, found under "Edit Settings"
    3. Go to the given URL, log into the desired user's Spotify account, and approve access.
    4. You should be redirected back to a success page on Google App Script.
- Now the script should have authorization to get your user's info (playlists, top artists, etc)
- NOTE: Use the address given in the text of the web app page, not the one you copied from Google Script. For me at least, they were slightly different.
 
 Sources:
 - I borrowed many core Spotify API code from https://github.com/Nitemice/spotify-backup-gas
