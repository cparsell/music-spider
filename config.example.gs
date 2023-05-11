const config = {
  // Spreadsheet ID is in the spreadsheet URL:
  // https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit#gid=0
  'spreadsheetId': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // Spotify API keys
  'clientIdSpotify': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'clientSecretSpotify': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',  
  // Ticketmaster API keys
  'keyTM': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // Ticketmaster search params
  'latlong': '34.052235,-118.243683',  // get your latlong from a website like https://www.latlong.net/
  'radius': 40,
  'unit': 'miles',
  // Spotify preferances
  'getTopArtists': true,
  'getArtistsFromPlaylist': true,
  'playlistId': 'xxxxxxxxxxxxxxxxxxxxxxx',
  // Email(s) to send newsletter to
  'email': 'somebody@somewhere.com',
  'createCalendarEvents': true,
  'calendarId': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx@group.calendar.google.com',
  // enable debug for verbose logging in Apps Script Executions log
  'debug': false,

};

// Artists that may show up in Spotify but should be ignored because
// they're long deceased, you're not interested in their concert, etc.
const artistsToIgnore = [
  'David Bowie',
  'Lou Reed',
  'The Velvet Underground',
  'The Beatles',
  'J Dilla',
];

