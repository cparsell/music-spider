
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Music Spider
 * 
 * Developed by https://github.com/cparsell
 * 
 * 
 * I borrowed many core Spotify API code from https://github.com/Nitemice/spotify-backup-gas
 * 
 * To setup:
 * - Create a new copy of the template Google Spreadsheet
 * - From the sheet, go Extensions > Apps Script to create a new script project
 * - Add a new script file for each of the files in this repo
 * - Modify the config.example.gs and name it config.gs
 * - Replace values in config.gs to match your API keys 
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
const BarMenu = () => {
  SpreadsheetApp.getUi()
    .createMenu(`Tickets Tool`)
    .addItem(`Refresh Artists`, `refreshArtists`)
    .addItem(`Refresh Events`, `refreshEvents`)
    // .addSeparator()
    .addItem(`Send Email Newsletter`, `sendEmail`)
    .addToUi();
};


/**
 * ----------------------------------------------------------------------------------------------------------------
 * Trigger 1 - On Submission
 * Reserved word: onFormSubmit() cannot be used here because it's reserved for simple triggers.
 * @param {Event} e
 */
const addArrayToSheet = (sheet, column, values) => 
{
  const range = [column, "1:", column, values.length].join("");
  const fn = function(v) {
    return [ v ];
  };
  sheet.getRange(range).setValues(values.map(fn));
}

const writeArrayToColumn = (array, sheet, col) => {
  let outerArray = [],
  tempArray = [],
  i=0;

  for (i=0;i<array.length;i+=1) {
    tempArray = [];
    tempArray.push(array[i]);
    outerArray.push(tempArray);
  };
  let range = sheet.getRange(sheet.getLastRow()+1, 1, array.length, 1);
  range.setValues(outerArray);
};

const getData = async (accessToken, url, getAllPages = false) =>
{
  var headers = {
      "Authorization": "Bearer " + accessToken,
      "Content-Type": "application/json"
  };

  var options = {
      "muteHttpExceptions": true,
      "headers": headers
  };

  var response = UrlFetchApp.fetch(url, options);
  var firstPage = response.getContentText();
  debugLog(`Response Code`, `${response.getResponseCode()} - ${RESPONSECODES[response.getResponseCode()]}`);
  // Bail out if we only wanted the first page
  if (!getAllPages)
  {
      return [firstPage];
  }

  // Put first page in array for return with following pages
  var data = [firstPage];

  var pageObj = JSON.parse(firstPage);
  // Strip any outer shell, if there is one
  if (Object.values(pageObj).length == 1)
  {
      pageObj = Object.values(pageObj)[0];
  }

  // Retrieve URL for next page
  var nextPageUrl = pageObj["next"];
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
}

// Just a wrapper function to simplify some code
const xmlElement = (type, text) =>
{
    return XmlService.createElement(type).setText(text);
}

const main = () =>
{
    // backupProfile();
    // backupLibrary();
    // getArtists();
    // backupPlaylists();
}

