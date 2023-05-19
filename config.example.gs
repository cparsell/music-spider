const userProps = PropertiesService.getUserProperties();
try {
  userProps.setProperties(
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
const artistsToIgnore = 
[
  'David Bowie',
  'Lou Reed',
  'The Velvet Underground',
  'The Beatles',
  'J Dilla',
];

const config = {
  spreadsheetId: userProps.getProperty(`spreadsheetId`),
  clientIdSpotify: userProps.getProperty(`clientIdSpotify`),
  clientSecretSpotify: userProps.getProperty(`clientSecretSpotify`),
  keyTM: userProps.getProperty(`keyTM`),
  latlong: userProps.getProperty(`latlong`),
  radius: Number(userProps.getProperty(`radius`)),
  unit: userProps.getProperty(`unit`),
  getTopArtists: userProps.getProperty(`getTopArtists`),
  getFollowing: userProps.getProperty(`getFollowing`),
  getArtistsFromPlaylist: userProps.getProperty(`getArtistsFromPlaylist`),
  playlistId: userProps.getProperty(`playlistId`),
  email: userProps.getProperty(`email`),
  createCalendarEvents: userProps.getProperty(`createCalendarEvents`),
  calendarId: userProps.getProperty(`calendarId`),
  debug: userProps.getProperty(`debug`),
};