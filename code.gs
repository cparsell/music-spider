
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Music Spider
 * 
 * Developed by https://github.com/cparsell
 * 
 * 
 * I borrowed many core Spotify API functions from https://github.com/Nitemice/spotify-backup-gas
 * 
 * To setup:
 * - Create a new copy of the template Google Spreadsheet
 * - From the sheet, go Extensions > Apps Script to create a new script project
 * - Add a new script file for each of the files in this repo
 * - Modify the Config.example.gs and name it Config.gs
 * - Replace values in Config.gs to match your API keys 
 * - in Apps Script, click Deploy > New Deployment > Web app > copy the link.
 * - Go to this link in your browser. This page will give you further instructions to:
 *   1. Navigate to your app via the Spotify App Dashboard (https://developer.spotify.com/dashboard/applications)
 *   2. Add the given URI (on this page) to the 'Redirect URIs' field, found under "Edit Settings"
 *   3. Go to the given URL, log into the desired user's Spotify account, and approve access.
 *   4. You should be redirected back to a success page on Google App Script.
 * - Now the script should have authorization to get your user's info (playlists, top artists, etc)
 * - NOTE: Use the address given in the text of the web app page, not the one you copied from Google Script. For me at least, they were slightly different.
 */



/**
 * ----------------------------------------------------------------------------------------------------------------
 * Trigger 1 - Create menu when spreadsheet is opened
 * Reserved word: onFormSubmit() cannot be used here because it's reserved for simple triggers.
 * @param {Event} e
 */
const BarMenu = () => 
{
  SpreadsheetApp.getUi()
    .createMenu(`Music Spider`)
    .addItem(`Refresh Artists`, `refreshArtists`)
    .addItem(`Refresh Events`, `refreshEvents`)
    .addItem(`Send Email Newsletter`, `sendEmail`)
    .addSeparator()
    .addItem(`Delete Blank Rows`, `deleteEmptyRows`)
    .addToUi();
};


/**
 * ----------------------------------------------------------------------------------------------------------------
 * 
 * 
 * @param {Event} e
 */
const addArrayToSheet = (sheet, column, values) => 
{
  let range = [column, "1:", column, values.length].join("");
  let fn = function(v) 
  {
    return [ v ];
  };
  sheet.getRange(range).setValues(values.map(fn));
}

const artistsList = () => 
{
  let artistRows = ARTIST_SHEET.getLastRow()-1;
  if (artistRows==0) artistRows=1;
  let artistsArr = ARTIST_SHEET.getRange(2,1,artistRows,1).getValues();
  let filtered = artistsArr.filter(n => n);
  return filtered;
}

const getSpotifyData = async (accessToken, url, writer, getAllPages = false) =>
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
    let response = UrlFetchApp.fetch(url, options);
    let firstPage = await response.getContentText();
    let responseCode = await response.getResponseCode();
    writer.Info(`Response Code ${response.getResponseCode()} - ${RESPONSECODES[response.getResponseCode()]}`);
    if (responseCode == 200 || responseCode == 201) 
    {

      writer.Debug(Common.prettifyJson(firstPage));
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
    } else {
      writer.Error(`Failed to get data from ${url} - `);
      return false;
    }
  } catch (err) {
    writer.Error(`Failed to get data from ${url} - ${err}`);
    return {};
  }

  return data;
}

// Just a wrapper function to simplify some code
// const xmlElement = (type, text) =>
// {
//     return XmlService.createElement(type).setText(text);
// }

const main = () =>
{
  // await refreshArtists();
  // await refreshEvents();
  // await sendEmail();
}

