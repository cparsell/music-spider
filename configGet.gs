// This grabs all of the API keys and preferences from the User Properties service
/**
 * Config object
 * @type {{SPREADSHEET_ID: string, CLIENT_ID_SPOTIFY: string, CLIENT_SECRET_SPOTIFY: string, KEY_TM: string, 
 * LAT_LONG: string, RADIUS: string, UNIT: string, GET_TOP_ARTISTS: string, GET_FOLLOWING: string, 
 * GET_ARTISTS_FROM_PLAYLIST: string, PLAYLIST_ID: string, SEARCH_MANUALLY_ADDED: string, 
 * SEARCH_MANUALLY_ADDED: string, EMAIL: string, CREATE_CALENDAR_EVENTS: string, CALENDAR_ID: string, DEBUG: string }}
 */
const Config = Object.freeze({
  SPREADSHEET_ID: SCRIPT_PROPS.getProperty(`spreadsheetId`),
  CLIENT_ID_SPOTIFY: SCRIPT_PROPS.getProperty(`clientIdSpotify`),
  CLIENT_SECRET_SPOTIFY: SCRIPT_PROPS.getProperty(`clientSecretSpotify`),
  KEY_TM: SCRIPT_PROPS.getProperty(`keyTM`),
  LAT_LONG: SCRIPT_PROPS.getProperty(`latlong`),
  RADIUS: Number(SCRIPT_PROPS.getProperty(`radius`)),
  UNIT: SCRIPT_PROPS.getProperty(`unit`),
  // these booleans get converted into strings by the Properties Service - this will turn them back into booleans
  GET_TOP_ARTISTS: (SCRIPT_PROPS.getProperty(`getTopArtists`).toLowerCase()  === 'true'), 
  GET_FOLLOWING: (SCRIPT_PROPS.getProperty(`getFollowing`).toLowerCase()  === 'true'),
  GET_ARTISTS_FROM_PLAYLIST: (SCRIPT_PROPS.getProperty(`getArtistsFromPlaylist`).toLowerCase()  === 'true'),
  PLAYLIST_ID: SCRIPT_PROPS.getProperty(`playlistId`),
  SEARCH_MANUALLY_ADDED: (SCRIPT_PROPS.getProperty(`searchManuallyAdded`).toLowerCase() === 'true'),
  EMAIL: SCRIPT_PROPS.getProperty(`email`),
  CREATE_CALENDAR_EVENTS: (SCRIPT_PROPS.getProperty(`createCalendarEvents`).toLowerCase()  === 'true'),
  CALENDAR_ID: SCRIPT_PROPS.getProperty(`calendarId`),
  DEBUG: (SCRIPT_PROPS.getProperty(`debug`).toLowerCase()  === 'true'),
});