const USER_PROPS = PropertiesService.getUserProperties();
try {
  USER_PROPS.setProperties(
  {
    // Spreadsheet ID is in the spreadsheet URL:
    // https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit#gid=0
    'spreadsheetId': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    // Spotify API keys (create at https://developer.spotify.com/dashboard/applications)
    'clientIdSpotify': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'clientSecretSpotify': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',  
    // Ticketmaster API keys (create at https://developer.ticketmaster.com/)
    'keyTM': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    // Ticketmaster search params
    'latlong': '34.052235,-118.243683',  // get your latlong from a website like https://www.latlong.net/
    'radius': 40,
    'unit': 'miles',
    // Spotify preferances
    'getTopArtists': true,
    'getFollowing': true, 
    'getArtistsFromPlaylist': false,
    'playlistId': 'xxxxxxxxxxxxxxxxxxxxxxx',
    // Email(s) to send newsletter to
    'email': 'somebody@somewhere.com',
    'createCalendarEvents': false,
    'calendarId': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx@group.calendar.google.com',
    // enable debug for verbose logging in Apps Script Executions log
    'debug': false,
  });
} catch (err) {
    console.log(`Failed with error: ${err.message}`);
}

// Artists that may show up in Spotify but will not be added to the Artists sheet
// because they're long deceased, you're not interested in their concert, etc.
const ARTISTS_TO_IGNORE = 
[
  'David Bowie',
  'Lou Reed',
  'The Velvet Underground',
  'The Beatles',
  'J Dilla',
];

const Config = {
  SPREADSHEET_ID: userProps.getProperty(`spreadsheetId`),
  CLIENT_ID_SPOTIFY: userProps.getProperty(`clientIdSpotify`),
  CLIENT_SECRET_SPOTIFY: userProps.getProperty(`clientSecretSpotify`),
  KEY_TM: userProps.getProperty(`keyTM`),
  LAT_LONG: userProps.getProperty(`latlong`),
  RADIUS: Number(userProps.getProperty(`radius`)),
  UNIT: userProps.getProperty(`unit`),
  GET_TOP_ARTISTS: userProps.getProperty(`getTopArtists`),
  GET_FOLLOWING: userProps.getProperty(`getFollowing`),
  GET_ARTISTS_FROM_PLAYLIST: userProps.getProperty(`getArtistsFromPlaylist`),
  PLAYLIST_ID: userProps.getProperty(`playlistId`),
  EMAIL: userProps.getProperty(`email`),
  CREATE_CALENDAR_EVENTS: userProps.getProperty(`createCalendarEvents`),
  CALENDAR_ID: userProps.getProperty(`calendarId`),
  DEBUG: (userProps.getProperty(`debug`) === 'true'),
};