class RA {
  constructor(artistsList, existingEvents) {
    this.listService = new ListService();
    this.artistsList = artistsList;
    this.existingEvents = existingEvents;
  }

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
    let page = 1;
    let running = 0;
    const url = `https://ra.co/graphql`;

    let results = new Array();
    try {
      // build the headers for the fetch request
      let options = this.returnRAOptions(page, area, queryRAEventListings);
      // Fetch from the API
      let response = UrlFetchApp.fetch(url, options);
      let firstPage = response.getContentText();
      let responseCode = response.getResponseCode();
      Log.Info(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);
      // If response is good
      if (responseCode == 200 || responseCode == 201) {
        // Log.Debug("results", JSON.parse(firstPage));
        let data = JSON.parse(firstPage);
        let newData = data.data.eventListings;
        let totalResults = newData.totalResults;
        results.push(...newData.data);
        // Return only one page if that's what's asked for
        if (!getAllPages) {
          return results;
        }
        Logger.log(
          "getRAData() - Total results according to API: " + totalResults
        );
        running = pageSize;
        for (let pg = 2; pg <= Math.ceil(totalResults / pageSize); pg++) {
          let pgSize = pageSize;
          page = pg;
          let options = this.returnRAOptions(page, area);
          if (totalResults - running < pageSize) pgSize = totalResults - pg;
          running += pgSize;
          let nextPage = UrlFetchApp.fetch(url, options).getContentText();
          let nextPageParsed = JSON.parse(nextPage).data.eventListings.data;
          results.push(...nextPageParsed);
        }
        Log.Debug("results", results);
        return results;
      } else {
        throw new Error(
          `response code ${responseCode} - ${RESPONSECODES[responseCode]}`
        );
      }
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
    let date = Utilities.formatDate(today, "PST", "yyyy/MM/dd");
    let addTime = new Date(today.setMonth(today.getMonth() + 8));
    let nextYear = Utilities.formatDate(addTime, "PST", "yyyy/MM/dd");
    let variables = {
      filters: {
        areas: { eq: area },
        // "id": 1731004,
        // "addressRegion":"San Francisco/Oakland",
        listingDate: { gte: date, lte: nextYear },
        // "event": {"title": "Playxland: Trans Pride Beach Party!" },
        //"artists": { "name": "Four Tet" },
        listingPosition: { eq: 1 },
      },
      pageSize: 18, //max the API will allow seems to be 18
      page: page,
    };

    let query = {
      query: theQuery,
      variables: variables,
    };
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      // "referer": "https://ra.co/events/us/bayarea",
    };
    let options = {
      muteHttpExceptions: true,
      headers: headers,
      payload: JSON.stringify(query),
      method: "POST",
    };
    return options;
  };

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Searches the results to return only events that match artists in your list
   */
  searchRA () {
    // Create array for new event matches
    let results = new Array();
    try {
      // Fetch all Resident Advisor events in the next 8 months in your region
      let listings = this.getRAData(Math.floor(Config.regionRA()));
      Logger.log("searchRA() - TOTAL events parsed: " + listings.length);
      // Run through each result to see if they match any artists in the Artist Sheet
      for (let i = 0; i < listings.length; i++) {
        let listing = listings[i]?.event;
        // Log.Debug("RA Listing", listing);

        if (listing) {
          let acts = [];
          // if there are artists listed, create an array with their names
          // (most of RA events don't seem to have artists listed here though)
          let artists = listing.artists ? listing.artists : [];
          if (artists.length > 0) {
            for (let index = 0; index < artists.length; index++) {
              acts.push(artists[index].name);
            }
          }
          const shouldAddEvent = acts.some((act) => this.artistsList.includes(act));
          if (shouldAddEvent) {
            const title = listing.title ? listing.title : "";
            console.warn(
              `Match for: ${acts.filter((element) =>
                this.artistsList.includes(element)
              )}, Event name: ${title}`
            );
            const venue = listing.venue.name ? listing.venue.name : "";
            // let images = listing?.images;
            const imageUrl = listing.images[0]?.filename
              ? listing.images[0].filename
              : "";
            const contentUrl = listing.contentUrl
              ? `https://ra.co${listing.contentUrl}`
              : "";
            const address = listing.venue.address ? listing.venue.address : "";

            let event = {
              date: Utilities.formatDate(
                new Date(listing.startTime),
                "PST",
                "yyyy/MM/dd HH:mm"
              ),
              eName: title,
              city: "",
              venue: venue,
              url: contentUrl,
              image: imageUrl,
              acts: acts.toString(),
              address: address,
            };

            results.push(event);
          }
        }
      }
      //Log.Info(JSON.stringify(results));
      if (results.length > 0) results = CommonLib.arrayRemoveDupes(results);
      return results;
    } catch (err) {
      Log.Error(`searchRA() error - ${err}`);
      return [];
    }
  };

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Main handler function for Resident Advisor API
   * Reaches out to RA API to get results,
   * @param {array} artistsArr the array of artists in the Artists List sheet
   */
  searchRAMain () {
    let newEvents = {};

    if (Config.searchRA()) {
      try {
        // Get list of artists from Artists Sheet
        if (!this.artistsList) this.artistsList = this.listService.getArtists();
        // Get existing list of events from events sheet
        // returns events that match your artists
        const results = this.searchRA();
        // run function that filters out results that are already on the events sheet
        newEvents = filterDupeEvents(results, this.existingEvents);
        let altEvents = filterAltEvents(results, this.existingEvents);

        Log.Debug("New RA Events", newEvents);

        return { newEvents: newEvents, altEvents: altEvents };
      } catch (err) {
        Log.Error(`searchRAMain () error - ${err}`);
        return [];
      }
    } else
      Log.Info(
        "searchRAMain() started but Music Spider is not configured to search Resident Advisor. Skipping."
      );
  };

}