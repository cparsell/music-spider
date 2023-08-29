
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
 * BarMenu
 * Trigger - Create menu when spreadsheet is opened
 * @returns {void}
 */
const BarMenu = () => 
{
  SpreadsheetApp.getUi()
    .createMenu(`Music Spider`)
    // .addItem(`Configure`, `configSidebar`)
    .addItem(`Refresh Artists`, `refreshArtists`)
    .addItem(`Refresh Events`, `refreshEvents`)
    .addItem(`Send Email Newsletter`, `sendEmail`)
    .addSeparator()
    .addItem(`Delete Blank Rows`, `deleteEmptyRows`)
    .addToUi();
};


/**
 * ----------------------------------------------------------------------------------------------------------------
 * Add array to sheet
 * @param {object} sheet
 * @param {integer} column
 * @param {array} values
 * @returns {void}
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




