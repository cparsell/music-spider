const SPREADSHEET = SpreadsheetApp.openById(Config.SPREADSHEET_ID);
const ARTIST_SHEET = SPREADSHEET.getSheetByName("Artists (Spotify)");
const EVENT_SHEET = SPREADSHEET.getSheetByName("Events");
const LOGGER_SHEET = SPREADSHEET.getSheetByName("Logger");
const CUSTOM_ARTIST_SHEET = SPREADSHEET.getSheetByName("Custom Artists");


const SERVICE_NAME = `Music Spider`;
const SUPPORT_ALIAS = GmailApp.getAliases()[0];

const BASE_URL = "https://api.spotify.com/v1";

// Profile URLs
const PROFILE_URL = BASE_URL + "/me";

// Library URLs
const FOLLOW_URL = BASE_URL + "/me/following";
const SAVED_TRACKS_URL = BASE_URL + "/me/tracks";
const PLAYLIST_URL = BASE_URL + "/playlists";
const SAVED_ALBUMS_URL = BASE_URL + "/me/albums";
const SAVED_SHOWS_URL = BASE_URL + "/me/shows";
const SAVED_EPISODERS_URL = BASE_URL + "/me/episodes";
const TOP_ARTISTS_URL = BASE_URL + "/me/top/artists";

const MONTH_NAMES = Object.freeze(["Jan", "Feb", "Mar", "Apr", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec"]);
const DAY_NAMES = Object.freeze(["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"]);

// Playlist URLs
const PLAYLISTS_URL = BASE_URL + "/me/playlists";

const TICKETMASTER_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'
const HEADERNAMES = Object.freeze({
  eName : `Event Name`,	
  venue : `Venue`,	
  city : `City`,	
  date : `Date`,	
  url : `URL`,	
  image : `Image`,	
	acts: "Acts",
  address: "Address",
});
const RESPONSECODES = Object.freeze({
	200 : `OK`,
	201 : `Created`,
	202 : `Accepted`,
	203 : `Non-Authoritative Information`,
	204 : `No Content`,
	205 : `Reset Content`,
	206 : `Partial Content`,
	207 : `Multi-Status (WebDAV)`,
	208 : `Already Reported (WebDAV)`,
	226 : `IM Used`,
	300 : `Multiple Choices`,
	301 : `Moved Permanently`,
	302 : `Found`,
	303 : `See Other`,
	304 : `Not Modified`,
	305 : `Use Proxy`,
	306 : `(Unused)`,
	307 : `Temporary Redirect`,
	308 : `Permanent Redirect (experimental)`,
 	400 : `Bad Request`,
	401 : `Unauthorized`,
	402 : `Payment Required`,
	403 : `Forbidden / Not Authorized`,
	404 : `Not Found`,
	405 : `Method Not Allowed`,
	406 : `Not Acceptable`,
	407 : `Proxy Authentication Required`,
	408 : `Request Timeout`,
	409 : `Conflict`,
	410 : `Gone`,
	411 : `Length Required`,
	412 : `Precondition Failed`,
	413 : `Request Entity Too Large`,
	414 : `Request-URI Too Long`,
	415 : `Unsupported Media Type`,
	416 : `Requested Range Not Satisfiable`,
	417 : `Expectation Failed`,
	418 : `I'm a teapot (RFC 2324)`,
	420 : `Enhance Your Calm (Twitter)`,
	422 : `Unprocessable Entity (WebDAV)`,
	423 : `Locked (WebDAV)`,
	424 : `Failed Dependency (WebDAV)`,
	425 : `Reserved for WebDAV`,
	426 : `Upgrade Required`,
	428 : `Precondition Required`,
	429 : `Too Many Requests`,
	431 : `Request Header Fields Too Large`,
	444 : `No Response (Nginx)`,
	449 : `Retry With (Microsoft)`,
	450 : `Blocked by Windows Parental Controls (Microsoft)`,
	451 : `Unavailable For Legal Reasons`,
	499 : `Client Closed Request (Nginx)`,
	500 : `Internal Server Error`,
	501 : `Not Implemented`,
	502 : `Bad Gateway`,
	503 : `Service Unavailable`,
	504 : `Gateway Timeout`,
	505 : `HTTP Version Not Supported`,
	506 : `Variant Also Negotiates (Experimental)`,
	507 : `Insufficient Storage (WebDAV)`,
	508 : `Loop Detected (WebDAV)`,
	509 : `Bandwidth Limit Exceeded (Apache)`,
	510 : `Not Extended`,
	511 : `Network Authentication Required`,
	598 : `Network read timeout error`,
	599 : `Network connect timeout error`,
});

