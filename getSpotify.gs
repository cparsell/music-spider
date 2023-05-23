const refreshArtists = async () => 
{
  // Logs to 'Logger' sheet
  const writer = new WriteLogger();
  let topArtists = new Array;
  let playlistArtists = new Array;
  let followedArtists = new Array;
  let ignoreUpperCase = ARTISTS_TO_IGNORE.map(function(x){ return x.toUpperCase(); })
  if (Config.GET_TOP_ARTISTS) 
  {
    try 
    {
    // Get Top Artists from Spotify ()
      
      topArtists = await getTopArtists(ignoreUpperCase, writer);
      Logger.log(`${topArtists.length} Top Artists`);
      writer.Debug(`Top Artists: ${topArtists}`);
    } catch (err) 
    {
      writer.Error(`${err} : getTopArtists failed`);
    }
  }
  if (Config.GET_ARTISTS_FROM_PLAYLIST) 
  {
    try 
    {
      playlistArtists = await getPlaylistArtists(ignoreUpperCase, writer);
      Logger.log(`${playlistArtists.length} Playlist Artists`);
      writer.Debug(`plastlistArtists: ${playlistArtists}`);
    } catch (err) 
    {
      writer.Error(`${err} : getArtistsFromPlaylist failed`);
    }
  }
  if (Config.GET_FOLLOWING) 
  { 
    try {
    followedArtists = await getFollowedArtists(ignoreUpperCase, writer);
    Logger.log(`${followedArtists.length} Followed Artists`);
    writer.Debug(`followedArtists: ${followedArtists}`);
    } catch (err) 
    {
      writer.Error(`${err} : getFollowing failed`);
    }
  }
  // Combine both arrays
  let combined = topArtists.concat(playlistArtists).concat(followedArtists);
  writer.Debug(`Artists combined: ${combined}`);
  // Remove duplicates
  let artistsArr = Common.arrayRemoveDupes(combined);
  if (artistsArr.length == 0) 
  {
    writer.Warning(`Unable to retrieve a list of artists from Spotify playlist - check playlist ID, Spotify client ID, or client secret`);
    return;
  }
  writer.Info(`${artistsArr.length} artists total added`);
  if (artistsArr.length > 0) 
  {
    // Clear previous artist list
    clearData(ARTIST_SHEET);
    // Write new artists to sheet
    writeArrayToColumn(artistsArr, ARTIST_SHEET, 1);
    writer.Debug(`Total Artists, duplicates removed: ${artistsArr}`);
  } else 
  {
    Logger.log("Unable to retrieve a list of artists from Spotify");
    writer.Info("Unable to retrieve a list of artists from Spotify");
  }
  // Set alignment of column to 'left' - artist names that are just numbers get aligned right
  ARTIST_SHEET.getRange(1,1,ARTIST_SHEET.getLastRow(),1).setHorizontalAlignment('left');
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of all artists from Saved Tracks on Spotify
 * Caution: will return ALL artists from Saved Tracks. If you have
 * a lot of Saved Tracks, it may be artists you aren't that 
 * interested in seeing live ;)
 * @param {writer} instance of WriteLogger
 */
const getSavedTracksArtists = async (ignoreUpperCase, writer) => 
{
  const sheet = ARTIST_SHEET;
  // Retrieve auth
  // const writer = new WriteLogger();
  let accessToken = await retrieveAuth();
  writer.Debug(`Access token: ${JSON.stringify(accessToken)}`);
  
  // Retrieve data
  let params = "?limit=50";
  writer.Info(`Getting artists from saved tracks`);
  let data = await getSpotifyData(accessToken, SAVED_TRACKS_URL + params, writer, true);

  // Fold array of responses into single structure
  if (data) 
  {
    data = Common.collateArrays("items", data);
    let artistsArr = [];
    data.forEach(track =>
    {
      track.track.artists.forEach(artist =>
      {
        if (ignoreUpperCase.includes(artist.name.toUpperCase())) writer.Debug(`getSaveTracksArtists Ignoring: ${artist.name}`);
        if (!ignoreUpperCase.includes(artist.name.toUpperCase())) artistsArr.push(artist.name);  
      });
    });

    artistsArr = Common.arrayRemoveDupes(artistsArr);
    lastRow = sheet.getLastRow();

    writer.Debug(`Artists Array: ${artistsArr}`);
    // if (artistsArr.length > 0) writeArrayToColumn(artistsArr, sheet, 1);
    return artistsArr;
  } else {
    writer.Warning("Unable to get artists from saved tracks");
  }
}

const getFollowedArtists = async (ignoreUpperCase, writer) =>
{
  // Retrieve auth
  let accessToken = await retrieveAuth();
  
  // API reference: https://developer.spotify.com/documentation/web-api/reference/get-followed
  let params = "?type=artist&limit=50";
  
  // Retrieve data
  let data = await getSpotifyData(accessToken, FOLLOW_URL + params, writer, true);

  // Fold array of responses into single structure
  data = Common.collateArrays("artists.items", data);

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
    if (ignoreUpperCase.includes(artist.name.toUpperCase())) writer.Debug(`getFollowedArtists Ignoring: ${artist.name}`);
    if (!ignoreUpperCase.includes(artist.name.toUpperCase())) artistsArr.push(artist.name);  
    // artistsArr.push(JSON.stringify(artist.name));
  });
  writer.Debug(`artistsArr ${artistsArr}`);
  return artistsArr;
}


/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of artists from a Playlist
 * Playlist ID is supplied in Config.gs
 * @param {writer} instance of WriteLogger
 */
const getPlaylistArtists = async (ignoreUpperCase, writer) => 
{
  const playlistId = Config.PLAYLIST_ID;
  // Retrieve auth
  let accessToken = await retrieveAuth();
  writer.Debug(`Access token: ${JSON.stringify(accessToken)}`);

  // Retrieve data
  let params = "?playlist_id=" + playlistId;
  params += `&limit=50`
  Logger.log("Getting artists from playlists")
  let data = await getSpotifyData(accessToken, `${PLAYLIST_URL}/${playlistId}${params}`, writer);


  // Fold array of responses into single structure
  if (data[0]) 
  {
    let newData = JSON.parse(data);
    let items = newData.tracks.items;
    // Logger.log(newData.tracks.items);
    // writer.Info(JSON.stringify(newData.tracks.items));
    let artistsArr = [];

    items.forEach(item => 
    {
      let artists = item.track.album.artists;
      artists.forEach(artist =>
      { 
        if (ignoreUpperCase.includes(artist.name.toUpperCase())) writer.Debug(`getPlayListArtists Ignoring: ${artist.name}`);
        if (!ignoreUpperCase.includes(artist.name.toUpperCase())) artistsArr.push(artist.name);  
        // artistsArr.push(artist.name);
      });
    })

    artistsArr = Common.arrayRemoveDupes(artistsArr);
  //   lastRow = sheet.getLastRow();
  //   Logger.log("Artist Array");
  writer.Debug(`Playlist Artists: ${artistsArr}`);
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
 * @param {object} writer instance of WriteLogger
 */
const getTopArtists = async (ignoreUpperCase, writer) => 
{
  let artistsArr = new Array;
  // Request for LONG TERM top artists
  artistsArr = artistsArr.concat(await getTopData("long_term", 0, ignoreUpperCase, writer));
  
  // Request for LONG TERM top artists OFFSET +48
  artistsArr = artistsArr.concat(await getTopData("long_term", 48, ignoreUpperCase, writer));

  // Re-request for MEDIUM TERM top artists
  artistsArr = artistsArr.concat(await getTopData("medium_term", 0, ignoreUpperCase, writer));

  // Re-request for SHORT TERM top artists
  artistsArr = artistsArr.concat(await getTopData("short_term", 0, ignoreUpperCase, writer));
  
  let final = new Array;

  if (artistsArr.length == 0) {
    Logger.log(`Returned 0 top artists somehow`)
    return artistsArr;
  }
  final = Common.arrayRemoveDupes(artistsArr);
  return final;
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of Top Artists as gathered by Spotify
 * This searches "long term", "medium term", and "short term"
 * @param {string} term expects "long_term", "medium_term", or "short_term"
 * @param {integer} offset 
 * @param {array} artistsToIgnore Uppercase array of artists
 */
const getTopData = async (term, offset, ignoreUpperCase, writer) => {
  // Retrieve auth
  let accessToken = await retrieveAuth();
  writer.Debug(`Access token: ${JSON.stringify(accessToken)}`);
  // params for Top Artists 
  // reference: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  let params = `?time_range=${term}`;
  params += `&limit=50`;
  params += `&offset=${offset}`;

  let resp = undefined;
  Logger.log(`Getting top artists (${term})...`)
  resp = await getSpotifyData(accessToken, TOP_ARTISTS_URL + params, writer, true);
  let artistsArr = new Array;
  // Fold array of responses into single structure
  if (resp[0]) 
  {
    data = Common.collateArrays("items", resp);
    let ignoree = false;
    
    data.forEach(artist =>
    { 
      if (ignoreUpperCase.includes(artist.name.toUpperCase())) writer.Debug(`getTopData Ignoring: ${artist.name}`);
      if (!ignoreUpperCase.includes(artist.name.toUpperCase())) artistsArr.push(artist.name);
    });
  } else 
  {
    Logger.log(`No data received (${term})`);
  }
  return artistsArr;
}