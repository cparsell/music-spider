
const config = {
  // Spotify
    'clientId': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'clientSecret': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'getArtistsFromPlaylist': true,
    'getTopArtists': true,
    'playlistId': 'xxxxxxxxxxxxxxxxxxxxxxx',
    // Email(s) to send newsletter to
    'email': 'somebody@somewhere.com',
    'debug': false,
};

const ticketmasterConfig = {
  'key': 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'secret': 'xxxxxxxxxxxxxxxxx',
  'latlong': '34.052235,-118.243683',  // get your latlong from a website like https://www.latlong.net/
}

// Artists that may show up in Spotify but should be ignored because
// they're long deceased, you're not interested in their concert, etc.
const artistsToIgnore = [
  'David Bowie',
  'Lou Reed',
  'The Velvet Underground',
  'The Beatles',
  'J Dilla',
];

