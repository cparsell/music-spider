# music-spider
Finds concerts near you based on Spotify listening history, emails them to you

Developed by https://github.com/cparsell

Made for Google Apps Script
  
Requirements:
- Google account
- Spotify account
- Ticketmaster API account

Setup:
- Go to the  [template Google Spreadsheet](https://docs.google.com/spreadsheets/d/1H4pvSK4jpRikHO11PtpJGSdycpVmM566XLQzRot4E_g/edit?usp=sharing) and make a copy of it on your Google Drive. This will copy the Apps Script code with it.
- Rename config.example.gs to **config.gs**
- Replace values in **config.gs** to match your API keys ([Spotify API](https://developer.spotify.com/dashboard/applications), [Ticketmaster](https://developer.ticketmaster.com/)) and set other settings
  - If you use a Spotify playlist, get the playlist ID from the end of the playlist URL but before the ? character

Spotify Authorization:
- in Apps Script, click **Deploy > New Deployment > Web app** and copy the link.
- Go to this link in your browser. This page will give you further instructions to:
    1. Navigate to your app via the **[Spotify App Dashboard](https://developer.spotify.com/dashboard/applications)**
    2. Add the given URI **(the one given on this page, don't use the URL you went to)** to the **Redirect URIs** field, found under "Edit Settings"
    3. Go to the given URL, log into the desired user's Spotify account, and approve access.
    4. You should be redirected back to a success page on Google App Script.
- Now the script should have authorization to get your user's info (playlists, top artists, etc)

Google Triggers
- In the Apps Script project, go to **Triggers** on the left sidebar
- Click **Add Trigger**
  - Function to run: **BarMenu**




NOTE: Use the address given in the text of the web app page, not the one you copied from Google Script. For me at least, they were slightly different.
 
 Sources:
 - I borrowed many core Spotify API functions from https://github.com/Nitemice/spotify-backup-gas
