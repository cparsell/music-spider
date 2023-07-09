
/**
 * ----------------------------------------------------------------------------------------------------------------
 * refreshArtists
 * Trigger - reach out to Spotify API to get listening history.
 * Writes the list artists to sheet
 */
const refreshArtists = async () => 
{
  // Logs to 'Logger' sheet
  let topArtists = new Array;
  let playlistArtists = new Array;
  let followedArtists = new Array;
  let ignoreUpperCase = ARTISTS_TO_IGNORE.map((x) => { return x.toUpperCase(); })
  if (Config.GET_TOP_ARTISTS) 
  {
    try 
    {
    // Get Top Artists from Spotify
      topArtists = await getTopArtists(ignoreUpperCase);
      Logger.log(`${topArtists.length} Top Artists`);
      Log.Debug(`Top Artists: ${topArtists}`);
    } catch (err) 
    {
      Log.Error(`${err} : getTopArtists failed`);
    }
  }
  if (Config.GET_ARTISTS_FROM_PLAYLIST) 
  {
    try 
    {
      // Get Artists from a playlist on Spotify
      playlistArtists = await getPlaylistArtists(ignoreUpperCase);
      Logger.log(`${playlistArtists.length} Playlist Artists`);
      Log.Debug(`plastlistArtists: ${playlistArtists}`);
    } catch (err) 
    {
      Log.Error(`${err} : getArtistsFromPlaylist failed`);
    }
  }
  if (Config.GET_FOLLOWING) 
  { 
    try 
    {
    // Get Artists you follow
    followedArtists = await getFollowedArtists(ignoreUpperCase);
    Logger.log(`${followedArtists.length} Followed Artists`);
    Log.Debug(`followedArtists: ${followedArtists}`);
    } catch (err) 
    {
      Log.Error(`${err} : getFollowing failed`);
    }
  }
  // Combine arrays
  let combined = topArtists.concat(playlistArtists).concat(followedArtists);
  Log.Debug(`Artists combined: ${combined}`);
  // Remove duplicates
  let artistsArr = CommonLib.arrayRemoveDupes(combined);
  if (artistsArr.length == 0) 
  {
    Log.Warning(`Unable to retrieve a list of artists from Spotify playlist - check playlist ID, Spotify client ID, or client secret`);
    return;
  }
  Log.Info(`${artistsArr.length} artists total added`);
  if (artistsArr.length > 0) 
  {
    // Clear previous artist list
    CommonLib.clearSheetData(ARTIST_SHEET, 2);
    // clearSheetData(ARTIST_SHEET);
    // Write new artists to sheet
    CommonLib.writeArrayToColumn(artistsArr, ARTIST_SHEET, 1);
    Log.Debug(`Total Artists, duplicates removed: ${artistsArr}`);
  } else 
  {
    Logger.log("Unable to retrieve a list of artists from Spotify");
    Log.Info("Unable to retrieve a list of artists from Spotify");
  }
  // Set alignment of column to 'left' - artist names that are just numbers get aligned right
  ARTIST_SHEET.getRange(1,1,ARTIST_SHEET.getLastRow(),1).setHorizontalAlignment('left');
}

/**
   * ----------------------------------------------------------------------------------------------------------------
   * Fetch data from Spotify API
   * @param {array} array
   * @returns {array} array
   */
let getSpotifyData = async (accessToken, url, getAllPages = false) =>
{
  let headers = 
  {
    "Authorization": "Bearer " + accessToken,
    "Content-Type": "application/json"
  };

  let options = 
  {
    "muteHttpExceptions": true,
    "headers": headers
  };
  try {
    let response = await UrlFetchApp.fetch(url, options);
    let firstPage = await response.getContentText();
    let responseCode = await response.getResponseCode();
    Log.Info(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);
    if (responseCode == 200 || responseCode == 201) 
    {
      Log.Debug(CommonLib.prettifyJson(firstPage));
      // Bail out if we only wanted the first page
      if (!getAllPages)
      {
        return [firstPage];
      }

      // Put first page in array for return with following pages
      let data = [firstPage];

      let pageObj = JSON.parse(firstPage);
      // Strip any outer shell, if there is one
      if (Object.values(pageObj).length == 1)
      {
        pageObj = Object.values(pageObj)[0];
      }

      // Retrieve URL for next page
      let nextPageUrl = pageObj["next"];
      while (nextPageUrl)
      {
        // Retrieve the next page
        nextPage = UrlFetchApp.fetch(nextPageUrl, options).getContentText();
        data.push(nextPage);

        // Retrieve URL for next page
        pageObj = JSON.parse(nextPage);
        // Strip any outer shell, if there is one
        if (Object.values(pageObj).length == 1)
        {
          pageObj = Object.values(pageObj)[0];
        }
        nextPageUrl = pageObj["next"];
      }
      return data;
    } else {
      Log.Error(`Failed to get data from ${url} - `);
      return false;
    }
  } catch (err) {
    Log.Error(`Failed to get data from ${url} - ${err}`);
    return {};
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of all artists from Saved Tracks on Spotify
 * Caution: will return ALL artists from Saved Tracks. If you have
 * a lot of Saved Tracks, it may be artists you aren't that 
 * interested in seeing live ;)
 * @param {bool} ignoreUpperCase 
 */
const getSavedTracksArtists = async (ignoreUpperCase) => 
{
  const sheet = ARTIST_SHEET;
  // Retrieve auth
  let accessToken = await retrieveAuth();
  Log.Debug(`Access token: ${JSON.stringify(accessToken)}`);
  
  // Retrieve data
  let params = "?limit=50";
  Log.Info(`Getting artists from saved tracks`);
  let data = await getSpotifyData(accessToken, SAVED_TRACKS_URL + params, true);

  // Fold array of responses into single structure
  if (data) 
  {
    data = CommonLib.collateArrays("items", data);
    let artistsArr = [];
    data.forEach(track =>
    {
      track.track?.artists.forEach(artist =>
      {
        // if (ignoreUpperCase.includes(artist.name.toUpperCase())) Log.Debug(`getSaveTracksArtists Ignoring: ${artist.name}`);
        if (!ignoreUpperCase.includes(artist.name.toUpperCase())) artistsArr.push(artist.name);  
      });
    });

    artistsArr = CommonLib.arrayRemoveDupes(artistsArr);
    lastRow = sheet.getLastRow();

    Log.Debug(`Artists Array: ${artistsArr}`);
    // if (artistsArr.length > 0) writeArrayToColumn(artistsArr, sheet, 1);
    return artistsArr;
  } else {
    Log.Warning("Unable to get artists from saved tracks");
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * getFollowedArtists
 * Returns an array of all artists followed on Spotify
 * @param {bool} ignoreUpperCase 
 */
const getFollowedArtists = async (ignoreUpperCase) =>
{
  // Retrieve auth
  let accessToken = await retrieveAuth();
  
  // API reference: https://developer.spotify.com/documentation/web-api/reference/get-followed
  let params = "?type=artist&limit=50";
  
  // Retrieve data
  let data = await getSpotifyData(accessToken, FOLLOW_URL + params, true);

  // Fold array of responses into single structure
  data = CommonLib.collateArrays("artists.items", data);

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
    // if (ignoreUpperCase.includes(artist.name.toUpperCase())) Log.Debug(`getFollowedArtists Ignoring: ${artist.name}`);
    if (!ignoreUpperCase.includes(artist.name.toUpperCase())) artistsArr.push(artist.name);  
    // artistsArr.push(JSON.stringify(artist.name));
  });
  Log.Debug(`artistsArr ${artistsArr}`);
  return artistsArr;
}


/**
 * ----------------------------------------------------------------------------------------------------------------
 * getPlaylsitArtists
 * Returns an array of artists from a Playlist
 * Playlist ID is supplied in Config.gs
 * @param {bool} ignoreUpperCase
 */
const getPlaylistArtists = async (ignoreUpperCase) => 
{
  const playlistId = Config.PLAYLIST_ID;
  // Retrieve auth
  let accessToken = await retrieveAuth();
  Log.Debug(`Access token: ${JSON.stringify(accessToken)}`);

  // Retrieve data
  let params = "?playlist_id=" + playlistId;
  params += `&limit=50`
  Logger.log("Getting artists from playlists")
  let data = await getSpotifyData(accessToken, `${PLAYLIST_URL}/${playlistId}${params}`, true);


  // Fold array of responses into single structure
  if (data[0]) 
  {
    let newData = JSON.parse(data);
    let items = newData.tracks.items;
    // Logger.log(newData.tracks.items);
    // Log.Info(JSON.stringify(newData.tracks.items));
    let artistsArr = [];

    items.forEach(item => 
    {
      let artists = item.track.album.artists;
      artists.forEach(artist =>
      { 
        // if (ignoreUpperCase.includes(artist.name.toUpperCase())) Log.Debug(`getPlayListArtists Ignoring: ${artist.name}`);
        if (!ignoreUpperCase.includes(artist.name.toUpperCase())) artistsArr.push(artist.name);  
        // artistsArr.push(artist.name);
      });
    })

    artistsArr = CommonLib.arrayRemoveDupes(artistsArr);

    Log.Debug(`Playlist Artists: ${artistsArr}`);

    return artistsArr;
  } else {
    write.Info("No data received from your watch playlist");
  }
  
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * getTopArtists
 * Returns an array of Top Artists as gathered by Spotify
 * This searches "long term", "medium term", and "short term"
 * @param {bool} ignoreUpperCase
 */
const getTopArtists = async (ignoreUpperCase) => 
{
  let artistsArr = new Array;
  // Request for LONG TERM top artists
  artistsArr = artistsArr.concat(await getTopData("long_term", 0, ignoreUpperCase));
  
  // Request for LONG TERM top artists OFFSET +48
  artistsArr = artistsArr.concat(await getTopData("long_term", 48, ignoreUpperCase));

  // Re-request for MEDIUM TERM top artists
  artistsArr = artistsArr.concat(await getTopData("medium_term", 0, ignoreUpperCase));

  // Re-request for SHORT TERM top artists
  artistsArr = artistsArr.concat(await getTopData("short_term", 0, ignoreUpperCase));
  
  let final = new Array;

  if (artistsArr.length == 0) {
    Logger.log(`Returned 0 top artists somehow`)
    return artistsArr;
  }
  final = CommonLib.arrayRemoveDupes(artistsArr);
  return final;
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of Top Artists as gathered by Spotify
 * This searches "long term", "medium term", and "short term"
 * @param {string} term expects "long_term", "medium_term", or "short_term"
 * @param {integer} offset 
 * @param {bool} ignoreUpperCase Uppercase array of artists
 */
const getTopData = async (term, offset, ignoreUpperCase) => {
  // Retrieve auth
  let accessToken = await retrieveAuth();
  Log.Debug(`Access token: ${JSON.stringify(accessToken)}`);
  // params for Top Artists 
  // reference: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  let params = `?time_range=${term}`;
  params += `&limit=50`;
  params += `&offset=${offset}`;

  let resp = undefined;
  Logger.log(`Getting top artists (${term})...`)

  // getSpotifyData = CommonLib.dataResponseTime(getSpotifyData)
  resp = await getSpotifyData(accessToken, TOP_ARTISTS_URL + params, true);

  let artistsArr = new Array;
  // Fold array of responses into single structure
  if (resp[0]) 
  {
    data = CommonLib.collateArrays("items", resp);
    let ignoree = false;
    
    data.forEach(artist =>
    { 
      // if (ignoreUpperCase.includes(artist.name.toUpperCase())) Log.Debug(`getTopData Ignoring: ${artist.name}`);
      if (!ignoreUpperCase.includes(artist.name.toUpperCase())) artistsArr.push(artist.name);
    });
  } else 
  {
    Logger.log(`No data received (${term})`);
  }
  return artistsArr;
}