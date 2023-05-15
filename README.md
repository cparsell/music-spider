# music-spider
![logo](https://i.postimg.cc/GtnY2t84/music-spider-logo-inv-nobg.png)

Finds concerts near you based on your Spotify listening history and emails them to you. It can also create Google Calendar events for the concerts it finds.

This was made so that I can find out when artists I love are in town. I want something that just focuses on the artists I listen to. No artists recommended by an AI. No newsletters listing concerts I'm not interested in.


Developed by https://github.com/cparsell

Made for Google Apps Script
  
  
  
## What it does:
It can gather the names of artists from Spotify's API from three sources:
- **Top Artists** - Spotify keeps a list of the artists you listen to the most. The API will return this list based on long-term, medium-term, and short-term listening history
- **Artists you follow**
- **Artists in a specified playlist**

These are all optional and you can configure it to gather these from any or all of these in the **config.gs** file. It writes the artist's names to the Artist Sheet.

It then searches Ticketmaster's API for events with these artist's names as keywords and in the area you specify. It writes any event matches into the Event Sheet.

Then it sends an email (e.g. weekly) listing these events.
  

## Requirements:
- Google account
- Spotify account
- Ticketmaster API account


## TL;DR Setup
1. Copy [template Google Spreadsheet](https://docs.google.com/spreadsheets/d/1H4pvSK4jpRikHO11PtpJGSdycpVmM566XLQzRot4E_g/edit?usp=sharing) to your drive
2. Set up API keys for ([Spotify API](https://developer.spotify.com/dashboard/applications), [Ticketmaster](https://developer.ticketmaster.com/)). Put keys in config file.
3. Set up triggers in Apps Script

## Step by step setup

### 1. Template file
- Go to the  [template Google Spreadsheet](https://docs.google.com/spreadsheets/d/1H4pvSK4jpRikHO11PtpJGSdycpVmM566XLQzRot4E_g/edit?usp=sharing) and make a copy of it on your Google Drive. This will copy the Apps Script code with it.
- Rename config.example.gs to **config.gs**
- Replace values in **config.gs** to match your API keys ([Spotify API](https://developer.spotify.com/dashboard/applications), [Ticketmaster](https://developer.ticketmaster.com/)) and set other settings
  - If you use a Spotify playlist, get the playlist ID from the end of the playlist URL but before the ? character

### 2. Spotify Authorization:
- Go to Apps Script from the sheet (**Extensions > Apps Script**), then click **Deploy > New Deployment > Web app** and copy the link.
- Go to this link in your browser. This page will give you further instructions to:
    1. Navigate to your app via the **[Spotify App Dashboard](https://developer.spotify.com/dashboard/applications)**
    2. Add the given URI **(the one given on this page, don't use the URL you went to)** to the **Redirect URIs** field, found under "Edit Settings"
    3. Go to the given URL, log into the desired user's Spotify account, and approve access.
    4. You should be redirected back to a success page on Google App Script.
- Now the script should have authorization to get your user's info (playlists, top artists, etc)

### 3. Google Triggers
This will set up Apps Script to regularly update artists, events, and send you an email. Feel free to change the timing of these to your preference.

- In the Apps Script project, go to **Triggers** on the left sidebar
- Click **Add Trigger**
  - Function to run: **refreshArtists**   (the function that updates your Spotify artists)
  - Event source: **Time-driven**
  - **Week timer**
  - **Every Monday** (or your preference)
  - **2am to 3am**
  - Save.

- Click **Add Trigger**
  - Function to run: **refreshEvents**   (the function that looks for new events on Ticketmaster)
  - Event source: **Time-driven**
  - **Day timer** (or your preference)
  - **4am to 5am**
  - Save.

- Click **Add Trigger**
  - Function to run: **sendEmail**    (send out a regular email with events)
  - Event source: **Time-driven**
  - **Week timer** 
  - **Every Monday** 
  - **7am to 8am**
  - Save.

- Click **Add Trigger**
  - Function to run: **barMenu**    (adds a menu in the spreadsheet)
  - Event source: **From Spreadsheet**
  - Event type: **On Open**
  - Save.




NOTE: Use the address given in the text of the web app page, not the one you copied from Google Script. For me at least, they were slightly different.
 
### Sources:
 - Functions from [Spotify-Backup-GAS](https://github.com/Nitemice/spotify-backup-gas) were adapted and extremely helpful in figuring out how Spotify API authentication works
