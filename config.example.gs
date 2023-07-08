// Here is where you provide API keys and set search preferences
// These are stored in the User Properties to be retrieved by the code elsewhere
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
    'searchManuallyAdded': false, // If true, will search any artists added to called 'Artists (Manual)'
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
  SPREADSHEET_ID: USER_PROPS.getProperty(`spreadsheetId`),
  CLIENT_ID_SPOTIFY: USER_PROPS.getProperty(`clientIdSpotify`),
  CLIENT_SECRET_SPOTIFY: USER_PROPS.getProperty(`clientSecretSpotify`),
  KEY_TM: USER_PROPS.getProperty(`keyTM`),
  LAT_LONG: USER_PROPS.getProperty(`latlong`),
  RADIUS: Number(USER_PROPS.getProperty(`radius`)),
  UNIT: USER_PROPS.getProperty(`unit`),
  GET_TOP_ARTISTS: (USER_PROPS.getProperty(`getTopArtists`) === 'true'),
  GET_FOLLOWING: (USER_PROPS.getProperty(`getFollowing`) === 'true'),
  GET_ARTISTS_FROM_PLAYLIST: (USER_PROPS.getProperty(`getArtistsFromPlaylist`) === 'true'),
  PLAYLIST_ID: USER_PROPS.getProperty(`playlistId`),
  EMAIL: USER_PROPS.getProperty(`email`),
  CREATE_CALENDAR_EVENTS: (USER_PROPS.getProperty(`createCalendarEvents`) === 'true'),
  CALENDAR_ID: USER_PROPS.getProperty(`calendarId`),
  DEBUG: (USER_PROPS.getProperty(`debug`) === 'true'),
};