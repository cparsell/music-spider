const config = {
  // Spotify API keys
  'clientIdSpotify': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'clientSecretSpotify': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',  
  // Ticketmaster API keys
  'key': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 'secret': 'xxxxxxxxxxxxxxxxx',
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
    // enable debug for verbose logging in Apps Script Executions log
  'debug': false,
};

// const ticketmasterConfig = {
//   'key': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
//   'secret': 'xxxxxxxxxxxxxxxxx',
//   'latlong': '34.052235,-118.243683',  // get your latlong from a website like https://www.latlong.net/
//   'radius': 40,
//   'unit': 'miles',
// }

// Artists that may show up in Spotify but should be ignored because
// they're long deceased, you're not interested in their concert, etc.
const artistsToIgnore = [
  'David Bowie',
  'Lou Reed',
  'The Velvet Underground',
  'The Beatles',
  'J Dilla',
];

