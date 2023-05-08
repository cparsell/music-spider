const refreshArtists = async () => 
{
  // Logs to 'Logger' sheet
  const writer = new WriteLogger();
  var topArtists = new Array;
  var playlistArtists = new Array;
  var followedArtists = new Array;
  if (config.getTopArtists) {
    // Get Top Artists from Spotify ()
    topArtists = await getTopArtists(writer);
    Logger.log(`${topArtists.length} Top Artists`);
    debugLog(`Top Artists`, topArtists);
  }
  if (config.getArtistsFromPlaylist) {
    playlistArtists = await getPlaylistArtists(writer);
    Logger.log(`${playlistArtists.length} Playlist Artists`);
    debugLog("plastlistArtists", playlistArtists);
  }
  if (config.getFollowing) { 
    followedArtists = await getFollowedArtists(writer);
    Logger.log(`${followedArtists.length} Followed Artists`);
    debugLog("followedArtists", followedArtists);
  }
  // Combine both arrays
  let combined = topArtists.concat(playlistArtists).concat(followedArtists);
  debugLog(`combined`, combined);
  // Remove duplicates
  let artistsArr = arrUnique(combined);
  Logger.log(`${artistsArr.length} artists total added`);
  if (artistsArr.length > 0) {
    // Clear previous artist list
    clearData(artistSheet);
    // Write new artists to sheet
    writeArrayToColumn(artistsArr, artistSheet, 1);
    debugLog("Total Artists", artistsArr);
  } else {
    Logger.log("Unable to retrieve a list of artists from Spotify");
    writer.Info("Unable to retrieve a list of artists from Spotify");
  }
  artistSheet.getRange(1,1,artistSheet.getLastRow(),1).setHorizontalAlignment('left');
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of all artists from Saved Tracks on Spotify
 * Caution: will return ALL artists from Saved Tracks. If you have
 * a lot of Saved Tracks, it may be artists you aren't that 
 * interested in seeing live ;)
 * @param {writer} instance of WriteLogger
 */
const getSavedTracksArtists = async (writer) => 
{
  const sheet = artistSheet;
  // Retrieve auth
  // const writer = new WriteLogger();
  var accessToken = await retrieveAuth();
  debugLog(`Access token`,JSON.stringify(accessToken));
  
  // Retrieve data
  var params = "?limit=50";
  Logger.log("Getting artists from saved tracks")
  var data = await getData(accessToken, savedTracksUrl + params, true);

  // Fold array of responses into single structure
  if (data) {
    data = common.collateArrays("items", data);
    let artistsArr = [];
    data.forEach(track =>
    {
      track.track.artists.forEach(artist =>
      {
          artistsArr.push(artist.name);
      });
    });

    artistsArr = arrUnique(artistsArr);
    lastRow = sheet.getLastRow();

    debugLog(`Artists Array`, artistsArr);
    // if (artistsArr.length > 0) writeArrayToColumn(artistsArr, sheet, 1);
    return artistsArr;
  } else {
    writer.Info("Unable to get artists from saved tracks");
  }
}

const getFollowedArtists = async (writer) =>
{
  // Retrieve auth
  var accessToken = await retrieveAuth();

  // Retrieve data
  var params = "?type=artist&limit=50";
  var data = await getData(accessToken, followUrl + params, true);

  // Fold array of responses into single structure
  data = common.collateArrays("artists.items", data);

  // Sort artists by name
  data.sort((first, second) =>
  {
    if (first.name < second.name)
    {
      return -1;
    }
    if (first.name > second.name)
    {
      return 1;
    }
    // names must be equal
    return 0;
  });
  let artistsArr = new Array;
  data.forEach(artist =>
  {
    if (artistsToIgnore.includes(artist.name)) Logger.log(`Ignoring ${artist.name}`)
    if (!artistsToIgnore.includes(artist.name)) artistsArr.push(artist.name);  
    // artistsArr.push(JSON.stringify(artist.name));
  });
  Logger.log(artistsArr);
  return artistsArr;
}


/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of artists from a Playlist
 * Playlist ID is supplied in config.gs
 * @param {writer} instance of WriteLogger
 */
const getPlaylistArtists = async (writer) => 
{
  const playlistId = config.playlistId;
  // Retrieve auth
  var accessToken = await retrieveAuth();
  debugLog(`Access token`,JSON.stringify(accessToken));

  // Retrieve data
  var params = "?playlist_id=" + playlistId;
  params += `&limit=50`
  Logger.log("Getting artists from playlists")
  var data = await getData(accessToken, `${playlistUrl}/${playlistId}${params}`);
  // Logger.log(data);

  // Fold array of responses into single structure
  if (data[0]) {
    // var newData = common.collateArrays("items", data);
    var newData = JSON.parse(data);
    var items = newData.tracks.items;
    // Logger.log(newData.tracks.items);
    // writer.Info(JSON.stringify(newData.tracks.items));
    let artistsArr = [];
    items.forEach(item => {
      let artists = item.track.album.artists;
      artists.forEach(artist =>
      { 
        if (artistsToIgnore.includes(artist.name)) Logger.log(`Ignoring ${artist.name}`)
        if (!artistsToIgnore.includes(artist.name)) artistsArr.push(artist.name);  
        // artistsArr.push(artist.name);
      });
    })

    artistsArr = arrUnique(artistsArr);
  //   lastRow = sheet.getLastRow();
  //   Logger.log("Artist Array");
    debugLog("Playlist Artists", artistsArr);
  //   Logger.log(`Artists Array length: ${artistsArr.length}`);
  //   if (artistsArr.length > 0) writeArrayToColumn(artistsArr, sheet, 1);
    return artistsArr;
  } else {
    write.Info("No data received from your watch playlist");
  }
  
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of Top Artists as gathered by Spotify
 * This searches "long term", "medium term", and "short term"
 * @param {writer} instance of WriteLogger
 */
const getTopArtists = async (writer) => 
{
  // Retrieve auth
  var accessToken = await retrieveAuth();
  debugLog(`Access token`,JSON.stringify(accessToken));

  // Request for LONG TERM top artists
  var params = "?time_range=long_term";
  params += `&limit=50`;
  var resp = undefined;
  Logger.log("Getting top artists (long term)...")
  resp = await getData(accessToken, topArtistsUrl + params,true);
  var artistsArr = [];
  // Fold array of responses into single structure
  if (resp[0]) {
    data = common.collateArrays("items", resp);
    var ignoree = false;
    data.forEach(artist =>
    { 
      if (artistsToIgnore.includes(artist.name)) Logger.log(`Ignoring ${artist.name}`)
      if (!artistsToIgnore.includes(artist.name)) artistsArr.push(artist.name);
    });
  } else {
    Logger.log("No data received (long term)");
  }
  
  // Request for LONG TERM top artists OFFSET +48
  params = "?time_range=medium_term";
  params += `&limit=50`;
  params += `&offset=48`;
  resp = undefined;
  Logger.log("Getting top artists (long term) with offset...")
  resp = await getData(accessToken, topArtistsUrl + params,true);
  // Fold array of responses into single structure
  if (resp[0]) {
    data = common.collateArrays("items", resp);
    data.forEach(artist =>
    {
      if (artistsToIgnore.includes(artist.name)) Logger.log(`Ignoring ${artist.name}`)
      if (!artistsToIgnore.includes(artist.name)) artistsArr.push(artist.name);
    });
  } else {
    Logger.log("No data received (long term) with offset");
  }

  // Re-request for MEDIUM TERM top artists
  params = "?time_range=medium_term";
  params += `&limit=50`;
  resp = undefined;
  Logger.log("Getting top artists (medium term)...")
  resp = await getData(accessToken, topArtistsUrl + params,true);

  // Fold array of responses into single structure
  if (resp[0]) {
    data = common.collateArrays("items", resp);
    data.forEach(artist =>
    {
      if (artistsToIgnore.includes(artist.name)) Logger.log(`Ignoring ${artist.name}`)
      if (!artistsToIgnore.includes(artist.name)) artistsArr.push(artist.name);
    });
  } else {
    Logger.log("No data received (medium term)");
  }

  // Re-request for SHORT TERM top artists
  params = "?time_range=short_term";
  params += `&limit=50`;
  resp = undefined;
  Logger.log("Getting top artists (short term)...")
  resp = await getData(accessToken, topArtistsUrl + params,true);

  // Fold array of responses into single structure
  if (resp[0]) {
    data = common.collateArrays("items", resp);
    data.forEach(artist =>
    {
      if (artistsToIgnore.includes(artist.name)) Logger.log(`Ignoring ${artist.name}`)
      if (!artistsToIgnore.includes(artist.name)) artistsArr.push(artist.name);
    });
  } else {
    Logger.log("No data received (short term)");
  }
  
  let final = new Array;

  if (artistsArr.length > 0) {
    // Logger.log("Top Artists Array");
    // Logger.log(artistsArr);
    // Logger.log(`Artists Array length: ${artistsArr.length}`);
    final = arrUnique(artistsArr);
  }
  return final;
}