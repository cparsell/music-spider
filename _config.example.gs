// Get script properties, which holds all of the API keys and configuration settings
const SCRIPT_PROPS = PropertiesService.getUserProperties();

/* This is where you put your API keys and preferences */
try {
  SCRIPT_PROPS.setProperties(
  {
    // Spreadsheet ID is in the spreadsheet URL:
    // https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit#gid=0
    
    // Spotify API keys (create at https://developer.spotify.com/dashboard/applications)
    'clientIdSpotify': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'clientSecretSpotify': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',  

    'searchTicketmaster': true,
    'searchRA': false, 
    'searchSeatGeek': false, // SeatGeek seems to have disabled access to API keys 

    // Ticketmaster API keys (create at https://developer.ticketmaster.com/)
    'keyTM': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    // Ticketmaster search params
    'latlong': '34.052235,-118.243683',  // get your latlong from a website like https://www.latlong.net/
    'radius': 30,
    'unit': 'miles',

    
    // Resident Advisor settings - note: RA needs no API key
    // see resAdv_enums for known region codes. What is listed are all the ones
    // I could reverse engineer.
    // 218 is Bay Area, 8 is New York, 23 is Los Angeles
    'regionRA': 23, 

    // Seat Geek preferences
    // Seat Geek API key can be created at https://seatgeek.com/account/develop  - you must have a Seat Geek account to make one
    'seatGeekClientID': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'seatGeekClientSecret': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

    // Spotify preferances
    'getTopArtists': true,
    'getFollowing': true, 
    'getArtistsFromPlaylist': false,
    'playlistId': 'xxxxxxxxxxxxxxxxxxxxxxx', // To pull artists from multiple playlists, separate IDs by commas eg. 1d128df3123,23kh34jkjk45
    'searchManuallyAdded': false, // If true, will search any artists directly added to the sheet to called 'Artists (Manual)'

    // Email(s) to send newsletter to
    'email': 'somebody@somewhere.com',
    // Create an event in a Google Calendar?
    'createCalendarEvents': false,
    'calendarId': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx@group.calendar.google.com',

    // enable debug for verbose logging in Apps Script Executions log
    'debug': false,
  });
} catch (err) {
    console.log(`Failed with error: ${err.message}`);
}
