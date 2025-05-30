/**
 * ----------------------------------------------------------------------------------------------------------------
 * refreshArtists
 * Trigger - reach out to Spotify API to get listening history.
 * Writes the list artists to sheet
 */
const refreshArtists = async () => {
  let topArtists = [];
  let playlistArtists = [];
  let followedArtists = [];

  if (Config.getTopArtists()) {
    try {
      // Get Top Artists from Spotify
      topArtists = await getTopArtists();
      Log.Info(`Top Artists found: ${topArtists.length}`);
      Log.Debug(`Top Artists list: ${topArtists}`);
    } catch (err) {
      Log.Error(`${err} : getTopArtists failed`);
    }
  }
  if (Config.getArtistsFromPlaylist()) {
    try {
      // Get Artists from a playlist on Spotify
      playlistArtists = await getPlaylistArtists();
      Log.Info(`Artists from playlists: ${playlistArtists.length}`);
      Log.Debug(`Artists from playlists: ${playlistArtists}`);
    } catch (err) {
      Log.Error(`getPlaylistArtists() error - ${err}`);
    }
  }
  if (Config.getFollowing()) {
    try {
      // Get Artists you follow
      followedArtists = await getFollowedArtists();
      Log.Info(`Artists followed: ${followedArtists.length}`);
      Log.Debug(`Artists followed list: ${followedArtists}`);
    } catch (err) {
      Log.Error(`${err} : getFollowing failed`);
    }
  }
  // Combine arrays
  let combined = topArtists.concat(playlistArtists).concat(followedArtists);
  
  // Remove duplicates
  let removeDupes = CommonLib.arrayRemoveDupes(combined);
  let artistsArr = removeDupes.filter(artist => !getIgnoredArtists().includes(artist));
  if (artistsArr.length == 0) {
    Log.Warn(
      `Unable to retrieve a list of artists from Spotify playlist - check playlist ID, Spotify client ID, or client secret`
    );
    return;
  }
  Log.Info(`Total artists found: ${artistsArr.length}`);
  if (artistsArr.length > 0) {
    // Clear previous artist list
    CommonLib.clearSheetData(ARTIST_SHEET, 2);

    // Write new artists to sheet
    CommonLib.writeArrayToColumn(artistsArr, ARTIST_SHEET, 1);
    Log.Debug(`Total Artists, duplicates removed: ${artistsArr}`);
  } else {
    Logger.log("Unable to retrieve a list of artists from Spotify");
    Log.Info("Unable to retrieve a list of artists from Spotify");
  }
  // Set alignment of column to 'left' - artist names that are just numbers get aligned right
  ARTIST_SHEET.getRange(
    1,
    1,
    ARTIST_SHEET.getLastRow(),
    1
  ).setHorizontalAlignment("left");
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Fetch data from Spotify API
 * @param {array} array
 * @returns {array} array
 */
let getSpotifyData = async (url, getAllPages = false) => {
  const accessToken = await retrieveAuth();
  Log.Debug(`getSpotifyData() Access token: ${JSON.stringify(accessToken)}`);
  let headers = {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json",
  };

  let options = {
    muteHttpExceptions: true,
    headers: headers,
  };
  try {
    let response = await UrlFetchApp.fetch(url, options);
    let firstPage = await response.getContentText();
    let responseCode = await response.getResponseCode();
    Log.Debug(
      `getSpotifyData() - Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`
    );
    if (responseCode == 200 || responseCode == 201) {
      Log.Debug(CommonLib.prettifyJson(firstPage));
      // Bail out if we only wanted the first page
      if (!getAllPages) {
        return [firstPage];
      }

      // Put first page in array for return with following pages
      let data = [firstPage];

      let pageObj = JSON.parse(firstPage);
      // Strip any outer shell, if there is one
      if (Object.values(pageObj).length == 1) {
        pageObj = Object.values(pageObj)[0];
      }

      // Retrieve URL for next page
      let nextPageUrl = pageObj["next"];
      while (nextPageUrl) {
        // Retrieve the next page
        nextPage = UrlFetchApp.fetch(nextPageUrl, options).getContentText();
        data.push(nextPage);

        // Retrieve URL for next page
        pageObj = JSON.parse(nextPage);
        // Strip any outer shell, if there is one
        if (Object.values(pageObj).length == 1) {
          pageObj = Object.values(pageObj)[0];
        }
        nextPageUrl = pageObj["next"];
      }
      return data;
    } else {
      Log.Error(
        `getSpotifyData() Failed - Response Code ${responseCode} - ${RESPONSECODES[responseCode]} from ${url}`
      );
      return false;
    }
  } catch (err) {
    Log.Error(`getSpotifyData() Failed to get data from ${url} - ${err}`);
    return {};
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of all artists from Saved Tracks on Spotify
 * Caution: will return ALL artists from Saved Tracks. If you have
 * a lot of Saved Tracks, it may be artists you aren't that
 * interested in seeing live ;)
 */
const getSavedTracksArtists = async () => {
  const sheet = ARTIST_SHEET;
  // Retrieve auth

  Log.Debug(`Access token: ${JSON.stringify(accessToken)}`);

  // Retrieve data
  let params = "?limit=50";
  Log.Info(`Getting artists from saved tracks`);
  let data = await getSpotifyData(SAVED_TRACKS_URL + params, true);

  // Fold array of responses into single structure
  if (data) {
    data = CommonLib.collateArrays("items", data);
    let artistsArr = [];
    data.forEach((track) => {
      track.track?.artists.forEach((artist) => {
        artistsArr.push(artist.name);
      });
    });

    artistsArr = CommonLib.arrayRemoveDupes(artistsArr);
    lastRow = sheet.getLastRow();

    Log.Debug(`getSavedTracksArtists() Artists Array: ${artistsArr}`);
    // if (artistsArr.length > 0) writeArrayToColumn(artistsArr, sheet, 1);
    return artistsArr;
  } else {
    Log.Warn(
      "getSavedTracksArtists() Unable to get artists from saved tracks"
    );
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * getFollowedArtists
 * Returns an array of all artists followed on Spotify
 */
const getFollowedArtists = async () => {
  // API reference: https://developer.spotify.com/documentation/web-api/reference/get-followed
  let params = "?type=artist&limit=50";

  // Retrieve data
  let data = await getSpotifyData(FOLLOW_URL + params, true);

  // Fold array of responses into single structure
  data = CommonLib.collateArrays("artists.items", data);

  // Sort artists by name
  data.sort((first, second) => {
    if (first.name < second.name) {
      return -1;
    }
    if (first.name > second.name) {
      return 1;
    }
    // names must be equal
    return 0;
  });
  let artistsArr = new Array();
  data.forEach((artist) => {
    artistsArr.push(artist.name);
  });
  Log.Debug(`artistsArr ${artistsArr}`);
  return artistsArr;
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * getPlaylistArtists
 * Returns an array of artists from a Playlist
 * Playlist ID is supplied in Configuration
 */
const getPlaylistArtists = async () => {
  // If multiple IDs are separated with commas, it will pull from each playlist
  const playlistId = Config.playlistID().split(",");
  Log.Debug("Getting artists from playlists", playlistId);

  let artistsArr = new Array();

  for (let i = 0; i < playlistId.length; i++) {
    // Retrieve data
    Log.Debug(`Getting artists from playlist: ${playlistId[i]}`);
    let params = "?playlist_id=" + playlistId[i];
    params += `&limit=50`;

    let data = await getSpotifyData(
      `${PLAYLIST_URL}/${playlistId[i]}${params}`,
      true
    );

    if (data[0]) {
      const newData = await JSON.parse(data);
      const items = newData?.tracks?.items;

      // For each track, loop through the listed artists for the track and push the arist names to an array
      items.forEach((item) => {
        let artists = item?.track?.album?.artists;
        artists.forEach((artist) => {
          artistsArr.push(artist.name);
        });
      });

      Log.Debug(`getPlaylistArtists() Playlist Artists: ${artistsArr}`);
    } else {
      Log.Info(
        `getPlaylistArtists() No data received from playlist ID: ${playlistId[i]}`
      );
    }
  }

  // Remove any duplicates before we finish
  artistsArr = CommonLib.arrayRemoveDupes(artistsArr);

  return artistsArr;
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * getTopArtists
 * Returns an array of Top Artists as gathered by Spotify
 * This searches "long term", "medium term", and "short term"
 */
const getTopArtists = async () => {
  let artistsArr = new Array();
  // Request for LONG TERM top artists
  try {
    artistsArr = artistsArr.concat(
      await getTopData("long_term", 0)
    );

    // Request for LONG TERM top artists OFFSET +48
    artistsArr = artistsArr.concat(
      await getTopData("long_term", 48)
    );

    // Re-request for MEDIUM TERM top artists
    artistsArr = artistsArr.concat(
      await getTopData("medium_term", 0)
    );

    // Re-request for SHORT TERM top artists
    artistsArr = artistsArr.concat(
      await getTopData("short_term", 0)
    );

    let final = new Array();

    if (artistsArr.length == 0)
      throw new Error(`Returned 0 top artists somehow`);

    final = CommonLib.arrayRemoveDupes(artistsArr);
    return final;
  } catch (err) {
    Log.Error(`getTopArtists() error - ${err}`);
    return [];
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns an array of Top Artists as gathered by Spotify
 * This searches "long term", "medium term", and "short term"
 * @param {string} term expects "long_term", "medium_term", or "short_term"
 * @param {integer} offset
 */
const getTopData = async (term, offset) => {
  // Retrieve auth
  const accessToken = await retrieveAuth();
  Log.Debug(`Access token: ${JSON.stringify(accessToken)}`);
  // params for Top Artists
  // reference: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  let params = `?time_range=${term}`;
  params += `&limit=50`;
  params += `&offset=${offset}`;

  Log.Debug(`getTopData() Getting data(${term})...`);

  // getSpotifyData = CommonLib.dataResponseTime(getSpotifyData)
  const resp = await getSpotifyData(TOP_ARTISTS_URL + params, true);

  let artistsArr = new Array();
  // Fold array of responses into single structure
  if (resp[0]) {
    data = CommonLib.collateArrays("items", resp);

    data.forEach((artist) => {
      artistsArr.push(artist.name);
    });
  } else {
    Logger.log(`getTopData() - No data received (${term})`);
  }
  return artistsArr;
};
