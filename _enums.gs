
// This grabs all of the API keys and preferences from the User Properties service
/**
 * Config object
 * @type {{SPREADSHEET_ID: string, CLIENT_ID_SPOTIFY: string, CLIENT_SECRET_SPOTIFY: string, KEY_TM: string,
 * LAT_LONG: string, RADIUS: string, UNIT: string, GET_TOP_ARTISTS: string, GET_FOLLOWING: string,
 * GET_ARTISTS_FROM_PLAYLIST: string, PLAYLIST_ID: string, SEARCH_MANUALLY_ADDED: string,
 * SEARCH_MANUALLY_ADDED: string, EMAIL: string, CREATE_CALENDAR_EVENTS: string, CALENDAR_ID: string, DEBUG: string }}
 */
const Config = Object.freeze({
  SEARCH_TICKETMASTER:
    SCRIPT_PROPS.getProperty(`searchTicketmaster`).toLowerCase() === "true",
  SPREADSHEET_ID: SCRIPT_PROPS.getProperty(`spreadsheetId`),
  CLIENT_ID_SPOTIFY: SCRIPT_PROPS.getProperty(`clientIdSpotify`),
  CLIENT_SECRET_SPOTIFY: SCRIPT_PROPS.getProperty(`clientSecretSpotify`),
  KEY_TM: SCRIPT_PROPS.getProperty(`keyTM`),
  LAT_LONG: SCRIPT_PROPS.getProperty(`latlong`),
  RADIUS: Number(SCRIPT_PROPS.getProperty(`radius`)),
  UNIT: SCRIPT_PROPS.getProperty(`unit`),
  // these booleans get converted into strings by the Properties Service - this will turn them back into booleans
  SEARCH_RA: SCRIPT_PROPS.getProperty(`searchRA`).toLowerCase() === "true",
  REGION_RA: SCRIPT_PROPS.getProperty(`regionRA`),
  SEARCH_SEAT_GEEK:
    SCRIPT_PROPS.getProperty(`searchSeatGeek`).toLowerCase() === "true",
  SEAT_GEEK_CLIENT_ID: SCRIPT_PROPS.getProperty(`seatGeekClientID`),
  SEAT_GEEK_CLIENT_SECRET: SCRIPT_PROPS.getProperty(`seatGeekClientSecret`),
  GET_TOP_ARTISTS:
    SCRIPT_PROPS.getProperty(`getTopArtists`).toLowerCase() === "true",
  GET_FOLLOWING:
    SCRIPT_PROPS.getProperty(`getFollowing`).toLowerCase() === "true",
  GET_ARTISTS_FROM_PLAYLIST:
    SCRIPT_PROPS.getProperty(`getArtistsFromPlaylist`).toLowerCase() === "true",
  PLAYLIST_ID: SCRIPT_PROPS.getProperty(`playlistId`),
  SEARCH_MANUALLY_ADDED:
    SCRIPT_PROPS.getProperty(`searchManuallyAdded`).toLowerCase() === "true",
  EMAIL: SCRIPT_PROPS.getProperty(`email`),
  CREATE_CALENDAR_EVENTS:
    SCRIPT_PROPS.getProperty(`createCalendarEvents`).toLowerCase() === "true",
  CALENDAR_ID: SCRIPT_PROPS.getProperty(`calendarId`),
  DEBUG: SCRIPT_PROPS.getProperty(`debug`).toLowerCase() === "true",
});

const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();
const ARTIST_SHEET = SPREADSHEET.getSheetByName("Artists (Spotify)");
const EVENT_SHEET = SPREADSHEET.getSheetByName("Events");
const LOGGER_SHEET = SPREADSHEET.getSheetByName("Logger");
const CUSTOM_ARTIST_SHEET = SPREADSHEET.getSheetByName("Artists (Custom)");

const SHEETS = Object.freeze({
  ARTISTS : SPREADSHEET.getSheetByName("Artists (Spotify)"),
  EVENTS : SPREADSHEET.getSheetByName("Events"),
  LOGGER : SPREADSHEET.getSheetByName("Logger"),
  CUSTOM_ARTIST : SPREADSHEET.getSheetByName("Artists (Custom)")  
});

const SERVICE_NAME = `Music Spider`;
const SUPPORT_ALIAS = GmailApp.getAliases()[0];

// SEAT GEEK
const SEAT_GEEK_URL = "https://api.seatgeek.com/2";
const SEAT_GEEK_EVENTS = SEAT_GEEK_URL + "/events";

// Spotify URLs
const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";
// Spotify Endpoints
const PLAYLIST_URL = SPOTIFY_BASE_URL + "/playlists";
// Spotify Profile URL
const PROFILE_URL = SPOTIFY_BASE_URL + "/me";
// Your saved libraries
const FOLLOW_URL = SPOTIFY_BASE_URL + "/me/following";
const SAVED_TRACKS_URL = SPOTIFY_BASE_URL + "/me/tracks";
const SAVED_ALBUMS_URL = SPOTIFY_BASE_URL + "/me/albums";
const SAVED_SHOWS_URL = SPOTIFY_BASE_URL + "/me/shows";
const SAVED_EPISODERS_URL = SPOTIFY_BASE_URL + "/me/episodes";
const TOP_ARTISTS_URL = SPOTIFY_BASE_URL + "/me/top/artists";
const PLAYLISTS_URL = SPOTIFY_BASE_URL + "/me/playlists";



/**
 * MONTH_NAMES object
 * @type {Array<string>}
 */
const MONTH_NAMES = Object.freeze([
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
]);
const DAY_NAMES = Object.freeze([
  "Sun",
  "Mon",
  "Tues",
  "Wed",
  "Thur",
  "Fri",
  "Sat",
]);

const TICKETMASTER_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";

/**
 * HEADERNAMES object
 * @type {{eName: string, venue: string, city: string, date: string, url: string, image: string, acts: string, address: string }}
 */
const HEADERNAMES = Object.freeze({
  eName: `Event Name`,
  venue: `Venue`,
  city: `City`,
  date: `Date`,
  url: `URL`,
  url2: `Alt URL`,
  image: `Image`,
  acts: "Acts",
  address: "Address",
});

/**
 * RESPONSECODES object
 * @type {{integer: string }}
 */
const RESPONSECODES = Object.freeze({
  200: `OK`,
  201: `Created`,
  202: `Accepted`,
  203: `Non-Authoritative Information`,
  204: `No Content`,
  205: `Reset Content`,
  206: `Partial Content`,
  207: `Multi-Status (WebDAV)`,
  208: `Already Reported (WebDAV)`,
  226: `IM Used`,
  300: `Multiple Choices`,
  301: `Moved Permanently`,
  302: `Found`,
  303: `See Other`,
  304: `Not Modified`,
  305: `Use Proxy`,
  306: `(Unused)`,
  307: `Temporary Redirect`,
  308: `Permanent Redirect (experimental)`,
  400: `Bad Request`,
  401: `Unauthorized`,
  402: `Payment Required`,
  403: `Forbidden / Not Authorized`,
  404: `Not Found`,
  405: `Method Not Allowed`,
  406: `Not Acceptable`,
  407: `Proxy Authentication Required`,
  408: `Request Timeout`,
  409: `Conflict`,
  410: `Gone`,
  411: `Length Required`,
  412: `Precondition Failed`,
  413: `Request Entity Too Large`,
  414: `Request-URI Too Long`,
  415: `Unsupported Media Type`,
  416: `Requested Range Not Satisfiable`,
  417: `Expectation Failed`,
  418: `I'm a teapot (RFC 2324)`,
  420: `Enhance Your Calm (Twitter)`,
  422: `Unprocessable Entity (WebDAV)`,
  423: `Locked (WebDAV)`,
  424: `Failed Dependency (WebDAV)`,
  425: `Reserved for WebDAV`,
  426: `Upgrade Required`,
  428: `Precondition Required`,
  429: `Too Many Requests`,
  431: `Request Header Fields Too Large`,
  444: `No Response (Nginx)`,
  449: `Retry With (Microsoft)`,
  450: `Blocked by Windows Parental Controls (Microsoft)`,
  451: `Unavailable For Legal Reasons`,
  499: `Client Closed Request (Nginx)`,
  500: `Internal Server Error`,
  501: `Not Implemented`,
  502: `Bad Gateway`,
  503: `Service Unavailable`,
  504: `Gateway Timeout`,
  505: `HTTP Version Not Supported`,
  506: `Variant Also Negotiates (Experimental)`,
  507: `Insufficient Storage (WebDAV)`,
  508: `Loop Detected (WebDAV)`,
  509: `Bandwidth Limit Exceeded (Apache)`,
  510: `Not Extended`,
  511: `Network Authentication Required`,
  598: `Network read timeout error`,
  599: `Network connect timeout error`,
});
