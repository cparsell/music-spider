/**
 * ----------------------------------------------------------------------------------------------------------------
 * Music Spider
 *
 * Developed by https://github.com/cparsell
 *
 *
 * I borrowed many core Spotify API functions from https://github.com/Nitemice/spotify-backup-gas
 *
 * Full setup described at https://github.com/cparsell/music-spider
 *
 * To setup:
 * - Create a new copy of the template Google Spreadsheet (https://docs.google.com/spreadsheets/d/1H4pvSK4jpRikHO11PtpJGSdycpVmM566XLQzRot4E_g/)
 * - This will copy the Apps Script code with it
 * - From the new sheet, go Extensions > Apps Script
 * - Replace values in _config.example.gs to match your API keys and save.
 * - While still in Apps Script, click Deploy > New Deployment > Web app > copy the link.
 * - Go to this link in your browser. This page will give you further instructions to:
 *   1. Navigate to your app via the Spotify App Dashboard (https://developer.spotify.com/dashboard/applications)
 *   2. Add the given URI (on this page) to the 'Redirect URIs' field, found under "Edit Settings"
 *   3. Go to the given URL, log into the desired user's Spotify account, and approve access.
 *   4. You should be redirected back to a success page on Google App Script.
 * - Now the script should have authorization to get your user's info (playlists, top artists, etc)
 * - Create triggers for the functions refreshArtists, refreshEvents, and sendEmail
 * - NOTE: Use the address given in the text of the web app page, not the one you copied from Google Script. For me at least, they were slightly different.
 *
 * Other APIs:
 * - SeatGeek (worked - an API account requires approval now?) (https://developer.seatgeek.com/)
 * - StubHub (not implemented yet, https://developer.stubhub.com/docs/overview/introduction/)
 * - SeeTickets API (not public afaik)
 * - Songkick (paid only last I checked)
 */

/**
 * ----------------------------------------------------------------------------------------------------------------
 * refreshEvents
 * Trigger - Main function for Ticketmaster search. Searches Ticketmaster for artists found in Spotify or added manually.
 * Any events returned that contain the artist's name are added to the sheet
 */
const refreshEvents = async () => {
  Log.Debug("Deleting any empty rows. Removing any expired events");
  // Clear any empty rows if something was manually deleted
  CommonLib.deleteEmptyRows(EVENT_SHEET);
  // Remove events that have happened already
  removeExpiredEntries(EVENT_SHEET);

  Log.Debug("Building Artist Array and Events Array");
  // Get current list of artists from Artist Sheets
  let artistsArr = artistsList();

  // get list of known events from Events Sheet
  let existingEvents = buildEventsArr();

  // If 'searchSeatGeek' is set to TRUE in the Config then search SeatGeek
  // I prefer searching SeatGeek first since it can get all results in one go
  // and they sell tickets that came from other vendors like Ticketmaster, etc.
  if (Config.searchSeatGeek()) {
    Log.Info("Searching SeatGeek...");
    const sgEvents = await seatGeekTrigger(artistsArr);
    Log.Info("New SeatGeek events", sgEvents.newEvents);
    Log.Info("Existing events, alt listing", sgEvents.altEvents);
    // Write new events to events sheet
    writeEventsToSheet(sgEvents.newEvents);
    writeAltEventsToSheet(sgEvents.altEvents);
    // Write Calendar Event for new events if configured to
    if (Config.createCalendarEvents()) createCalEvents(sgEvents.newEvents);
  }

  // If 'searchRA' is set to TRUE in Config.gs then search Resident Advisor
  if (Config.searchRA()) {
    Log.Debug("Searching Resident Advisor...");
    const raEvents = searchRAMain(artistsArr);
    Log.Info("New Resident Advisor events", raEvents.newEvents);
    Log.Info("Existing events, alt listing", raEvents.altEvents);
    // Write new events to events sheet
    writeEventsToSheet(raEvents.newEvents);
    writeAltEventsToSheet(raEvents.altEvents);
    // Write Calendar Event for new events if configured to
    if (Config.createCalendarEvents()) createCalEvents(raEvents.newEvents);
  }

  // If 'searchTicketmaster' is set to TRUE in Config.gs then search Ticketmaster
  // Start Ticketmaster search loop
  // Ticketmaster API stops you if we try to get too many pages of data
  // So we can't just get all the events in an area and filter out the artists one likes (less requests)
  // Instead this sends a request for each artist - not very efficient but seems to be
  // the way it has to be done
  if (Config.searchTicketmaster()) {
    Log.Info("Searching Ticketmaster...");
    const tmEvents = await searchTMLoop(artistsArr, existingEvents);
    Log.Info("New TM events", tmEvents.newEvents);
    Log.Info("Existing events, alt listing", tmEvents.altEvents);
    // Write new events to events sheet
    writeEventsToSheet(tmEvents.newEvents);
    writeAltEventsToSheet(tmEvents.altEvents);
    // Write Calendar Event for new events if configured to
    if (Config.createCalendarEvents()) createCalEvents(tmEvents.newEvents);
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * BarMenu
 * Trigger - Create menu when spreadsheet is opened
 * @returns {void}
 */
const BarMenu = () => {
  SpreadsheetApp.getUi()
    .createMenu(`Music Spider`)
    // .addItem(`Configure`, `configSidebar`)
    .addItem(`Refresh Artists from Spotify`, `refreshArtists`)
    .addItem(`Refresh Events`, `refreshEvents`)
    .addItem(`Send Email Newsletter`, `sendEmail`)
    .addItem(`Create Calendar Event for Selected`, "createSelectedCalEvents")
    .addSeparator()
    .addItem(`Clear Blank Rows`, `deleteEmptyRows`)
    .addToUi();
};
