
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Show Configuration Sidebar
 * @returns {void} 
 */
const configSidebar = async () => {
  const ui = SpreadsheetApp.getUi();
  let template = HtmlService.createTemplateFromFile('sidebar')
  template.currentProps = {...Config};
  let html = HtmlService
    .createHtmlOutput(
      template.evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .getBlob()
        .setName(`${SERVICE_NAME} Setup`)
      ).setWidth(400)
  ui.showSidebar(html);
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Process form data
 * @param {object} formObject
 * @returns {void} 
 */
const ProcessForm = (formObject) => {
  let type = ``, names = []; 
  // console.info(formObject);
  // console.info("Form submitted");
  // Object.entries(formObject).forEach( pair => {
  //   console.info(`Key: ${pair[0]}, Value: ${pair[1]}`);
  // //   if(pair[0] == `type`) type = pair[1];
  // //   if(pair[0] == `names`) names = pair[1];
  // })
  // console.info((formObject['GET_TOP_ARTISTS']));

  try {
    SCRIPT_PROPS.setProperties(
    {
      'spreadsheetId': formObject['spreadsheetId'],
      'clientIdSpotify': formObject['clientIdSpotify'],
      'clientSecretSpotify': formObject['clientSecretSpotify'],
      'keyTM': formObject['keyTM'],
      'latlong': formObject['latlong'],
      'radius': formObject['radius'],
      'unit': formObject['unit'],
      'getTopArtists': (formObject['getTopArtists']==="on"),
      'getFollowing': (formObject['getFollowing']==="on"), 
      'getArtistsFromPlaylist': (formObject['getArtistsFromPlaylist']==="on"),
      'playlistId': formObject['playlistId'],
      'searchManuallyAdded': (formObject['searchManuallyAdded']==="on"), 
      'email': formObject['email'],
      'createCalendarEvents': (formObject['createCalendarEvents']==="on"),
      'calendarId': formObject['calendarId'],
      'debug': (formObject['debug']==="on"),
    });
  } catch (err) {
    console.log(`Sidebar - Set User Properties Error: ${err.message}`);
  }
}