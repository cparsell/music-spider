// This grabs all of the API keys and preferences from the User Properties service
/**
 * Config object
 * @type {{CLIENT_ID_SPOTIFY: string, CLIENT_SECRET_SPOTIFY: string, KEY_TM: string,
 * LAT_LONG: string, RADIUS: string, UNIT: string, GET_TOP_ARTISTS: string, GET_FOLLOWING: string,
 * GET_ARTISTS_FROM_PLAYLIST: string, PLAYLIST_ID: string, SEARCH_MANUALLY_ADDED: string,
 * SEARCH_MANUALLY_ADDED: string, EMAIL: string, CREATE_CALENDAR_EVENTS: string, CALENDAR_ID: string, DEBUG: string }}
 */

class Config {
  static initialize() {
    const scriptProps = PropertiesService.getScriptProperties();
    this.SEARCH_TICKETMASTER = scriptProps.getProperty('searchTicketmaster').toLowerCase() === 'true';
    this.CLIENT_ID_SPOTIFY = scriptProps.getProperty('clientIdSpotify');
    this.CLIENT_SECRET_SPOTIFY = scriptProps.getProperty('clientSecretSpotify');
    this.KEY_TM= SCRIPT_PROPS.getProperty(`keyTM`);
    this.LAT_LONG= SCRIPT_PROPS.getProperty(`latlong`);
    this.RADIUS= Number(SCRIPT_PROPS.getProperty(`radius`));
    this.UNIT= SCRIPT_PROPS.getProperty(`unit`);
  // these booleans get converted into strings by the Properties Service - this will turn them back into booleans
    this.SEARCH_RA= SCRIPT_PROPS.getProperty(`searchRA`).toLowerCase() === "true";
    this.REGION_RA= SCRIPT_PROPS.getProperty(`regionRA`);
    this.SEARCH_SEAT_GEEK =
        SCRIPT_PROPS.getProperty(`searchSeatGeek`).toLowerCase() === "true";
    this.SEAT_GEEK_CLIENT_ID = SCRIPT_PROPS.getProperty(`seatGeekClientID`);
    this.SEAT_GEEK_CLIENT_SECRET = SCRIPT_PROPS.getProperty(`seatGeekClientSecret`);
    this.GET_TOP_ARTISTS =
        SCRIPT_PROPS.getProperty(`getTopArtists`).toLowerCase() === "true";
    this.GET_FOLLOWING =
        SCRIPT_PROPS.getProperty(`getFollowing`).toLowerCase() === "true";
    this.GET_ARTISTS_FROM_PLAYLIST =
        SCRIPT_PROPS.getProperty(`getArtistsFromPlaylist`).toLowerCase() === "true";
    this.PLAYLIST_ID = SCRIPT_PROPS.getProperty(`playlistId`);
    this.SEARCH_MANUALLY_ADDED =
        SCRIPT_PROPS.getProperty(`searchManuallyAdded`).toLowerCase() === "true";
    this.EMAIL = SCRIPT_PROPS.getProperty(`email`);
    this.CREATE_CALENDAR_EVENTS =
        SCRIPT_PROPS.getProperty(`createCalendarEvents`).toLowerCase() === "true";
    this.CALENDAR_ID = SCRIPT_PROPS.getProperty(`calendarId`);
    this.DEBUG = SCRIPT_PROPS.getProperty(`debug`).toLowerCase() === "true";
  }

  // You can add methods to return specific properties if necessary
  static spotifyClientID() {
    return this.CLIENT_ID_SPOTIFY;
  }

  static spotifyClientSecret() {
    return this.CLIENT_SECRET_SPOTIFY;
  }

  static searchTicketmaster() {
    return this.SEARCH_TICKETMASTER;
  }

  static keyTM() {
    return this.KEY_TM;
  }

  static latLong() {
    return this.LAT_LONG;
  }
  
  static radius() {
    return this.RADIUS;
  }

  static unit() {
    return this.UNIT;
  }

  static searchRA() {
    return this.SEARCH_RA;
  }

  static regionRA() {
    return this.REGION_RA;
  }

  static searchSeatGeek() {
    return this.SEARCH_SEAT_GEEK;
  }

  static seatGeekClientID() {
    return this.SEAT_GEEK_CLIENT_ID;
  }

  static seatGeekClientSecret() {
    return this.SEAT_GEEK_CLIENT_SECRET;
  }

  static getTopArtists() {
    return this.GET_TOP_ARTISTS;
  }

  static getFollowing() {
    return this.GET_FOLLOWING;
  }

  static getArtistsFromPlaylist() {
    return this.GET_ARTISTS_FROM_PLAYLIST;
  }

  static playlistID() {
    return this.PLAYLIST_ID;
  }

  static calendarID() {
    return this.CALENDAR_ID;
  }

  static searchManuallyAdded() {
    return this.SEARCH_MANUALLY_ADDED;
  }

  static email() {
    return this.EMAIL;
  }

  static createCalendarEvents() {
    return this.CREATE_CALENDAR_EVENTS;
  }
  
  static debug() {
    return this.DEBUG;
  }
}

Config.initialize();

const testConfig = () => {
  console.info(`Search manually added: ${Config.searchManuallyAdded()}`);
  console.info(Config.radius());
}