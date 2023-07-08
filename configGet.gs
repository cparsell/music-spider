// This grabs all of the API keys and preferences from the User Properties service
/**
 * Config object
 * @type {{SPREADSHEET_ID: string, CLIENT_ID_SPOTIFY: string, CLIENT_SECRET_SPOTIFY: string, KEY_TM: string, 
 * LAT_LONG: string, RADIUS: string, UNIT: string, GET_TOP_ARTISTS: string, GET_FOLLOWING: string, 
 * GET_ARTISTS_FROM_PLAYLIST: string, PLAYLIST_ID: string, SEARCH_MANUALLY_ADDED: string, 
 * SEARCH_MANUALLY_ADDED: string, EMAIL: string, CREATE_CALENDAR_EVENTS: string, CALENDAR_ID: string, DEBUG: string }}
 */
const Config = Object.freeze({
  SPREADSHEET_ID: USER_PROPS.getProperty(`spreadsheetId`),
  CLIENT_ID_SPOTIFY: USER_PROPS.getProperty(`clientIdSpotify`),
  CLIENT_SECRET_SPOTIFY: USER_PROPS.getProperty(`clientSecretSpotify`),
  KEY_TM: USER_PROPS.getProperty(`keyTM`),
  LAT_LONG: USER_PROPS.getProperty(`latlong`),
  RADIUS: Number(USER_PROPS.getProperty(`radius`)),
  UNIT: USER_PROPS.getProperty(`unit`),
  // these booleans get converted into strings by the Properties Service - this will turn them back into booleans
  GET_TOP_ARTISTS: (USER_PROPS.getProperty(`getTopArtists`).toLowerCase()  === 'true'), 
  GET_FOLLOWING: (USER_PROPS.getProperty(`getFollowing`).toLowerCase()  === 'true'),
  GET_ARTISTS_FROM_PLAYLIST: (USER_PROPS.getProperty(`getArtistsFromPlaylist`).toLowerCase()  === 'true'),
  PLAYLIST_ID: USER_PROPS.getProperty(`playlistId`),
  SEARCH_MANUALLY_ADDED: (USER_PROPS.getProperty(`searchManuallyAdded`).toLowerCase() === 'true'),
  EMAIL: USER_PROPS.getProperty(`email`),
  CREATE_CALENDAR_EVENTS: (USER_PROPS.getProperty(`createCalendarEvents`).toLowerCase()  === 'true'),
  CALENDAR_ID: USER_PROPS.getProperty(`calendarId`),
  DEBUG: (USER_PROPS.getProperty(`debug`).toLowerCase()  === 'true'),
});