class RA {
  constructor(artistsList, existingEvents) {
    this.listService = new ListService();
    this.artistsList = artistsList || this.listService.getArtists();
    this.existingEvents = existingEvents || this.listService.getEvents();
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Main handler function for Resident Advisor API
   * Reaches out to RA API to get results,
   * @param {array} artistsArr the array of artists in the Artists List sheet
   */
  searchRAMain () {
    if (!Config.searchRA()) {
      Log.Info("searchRAMain() skipped: Config.searchRA() is false");
      return { newEvents: [], altEvents: [] };
    }

    try {
      const results = this.searchRA();
      // run function that filters out results that are already on the events sheet
      const newEvents = filterDupeEvents(results, this.existingEvents); // remove duplicate events
      const altEvents = filterAltEvents(results, this.existingEvents); // find same event from different ticket vendor

      Log.Debug("New RA Events", newEvents);

      return { newEvents, altEvents };
    } catch (err) {
      Log.Error(`searchRAMain () error - ${err}`);
      return { newEvents: [], altEvents: [] };;
    }
  };
  
  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Searches the results to return only events that match artists in your list
   */
  searchRA () {
    let results = [];
    try {
      
      // Return ALL Resident Advisor events in your area
      let listings = this.getRAData(Math.floor(Config.regionRA()));
      Logger.log("searchRA() - TOTAL events parsed: " + listings.length);

      // Run through each result to see if they match any artists in the Artist Sheet
       for (const item of listings) {
        let listing = item?.event;
        if (!listing) continue;

        const acts = (listing.artists || []).map(a => a.name);
        if (!acts.some(name => this.artistsList.includes(name))) continue;

        const event = {
          date: Utilities.formatDate(new Date(listing.startTime), "PST", "yyyy/MM/dd HH:mm"),
          eName: listing.title || "",
          city: "",
          venue: listing.venue?.name || "",
          url: listing.contentUrl ? `https://ra.co${listing.contentUrl}` : "",
          image: listing.images?.[0]?.filename || "",
          acts: acts.join(", "),
          address: listing.venue?.address || ""
        };

        results.push(event);
      }
 
      return CommonLib.arrayRemoveDupes(results);
    } catch (err) {
      Log.Error(`searchRA() error - ${err}`);
      return [];
    }
  };

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Send fetch requests to Resident Advisor - multiple if getting all pages
   * Returns each event combined in one array
   * @param {string} area which page of results to fetch
   * @param {boolean} getAllPages if false will only return 1 page (18 results max)
   * @returns {array} results [{eventdata}, {eventdata}...]
   */
  getRAData (area = 218, getAllPages = true) {
    const pageSize = 18; // 18 is teh max number of results RA will send in one page
    let results = [];

    try {
      let page = 1;
      let totalPages = 1;

      do {
        // build the headers for the fetch request
        // Fetches all Resident Advisor events in the next 8 months in your region
        let options = this.returnRAOptions(page, area, queryRAEventListings);
        let response = UrlFetchApp.fetch(RA_URL, options);
        let responseCode = response.getResponseCode();
        
        if (![200, 201].includes(responseCode)) {
          throw new Error(`Response code ${responseCode} - ${RESPONSECODES[responseCode]}`);
        }

        let json = JSON.parse(response.getContentText());
        let data = json.data.eventListings;
        results.push(...data.data);

        if (getAllPages && page === 1) {
          totalPages = Math.ceil(data.totalResults / pageSize);
          Logger.log(`getRAData() - Total results: ${data.totalResults}`);
        }
        page++
      } while (getAllPages && page <= totalPages);
      
      Log.Debug("results", results);
      return results;
    } catch (err) {
      Log.Error(`getRAData() - Failed to get data from ${url} - ${err}`);
      return [];
    }
  };

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Returns the headers and variables formatted for the API fetch request
   * @param {string} page which page of results to fetch
   * @param {string} area which locality to search in (see list in resAdv_enums)
   * @param {string} theQuery optional, defaults to queryRAEventListings if not provided
   * @returns {object} options {filters:{...}, pageSize, page}
   */
  returnRAOptions (page, area, theQuery = queryRAEventListings) {
    let today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + 8);
    let variables = {
      filters: {
        areas: { eq: area },
        listingDate: { 
          gte: Utilities.formatDate(today, "PST", "yyyy/MM/dd"),
          lte: Utilities.formatDate(futureDate, "PST", "yyyy/MM/dd")
         },
        listingPosition: { eq: 1 },
        // "id": 1731004,
        // "addressRegion":"San Francisco/Oakland",
        // "event": {"title": "Playxland: Trans Pride Beach Party!" },
        //"artists": { "name": "Four Tet" },
      },
      pageSize: 18, // max seems to be 18
      page: page,
    };

    return {
      muteHttpExceptions: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        //"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        // "referer": "https://ra.co/events/us/bayarea",
      },
      payload: JSON.stringify({ query: theQuery, variables }),
      method: "POST"
    };
  };
}

const testRA = () => {
  ra = new RA()
  res = ra.searchRAMain();
  console.log(res);
}