// Ticketmaster API
// reference: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#search-events-v2

class TM {
  constructor(artistsList, existingEvents) {
    this.listService = new ListService();
    this.artistsList = artistsList;
    this.existingEvents = existingEvents;
  }
  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Search Ticket API for every artist in Artists Sheets
   * Trigger - Main function for API search. Searches API for artists found in Spotify or added manually.
   * Any events returned that contain the artist's name are added to the sheet
   */
  async searchTMLoop() {
    if (!Array.isArray(this.artistsList) || this.artistsList.length === 0) {
      this.artistsList = this.listService.getArtists() || [];
    }

    let eventsArr = [];
    try {
      for (const artist of this.artistsList) {
        const data = await this.ticketSearch(artist);
          if (Array.isArray(data)) {
            eventsArr.push(...data);
          }
        Utilities.sleep(180);
      }
      // get rid of any results that are already on the Events Sheet
      const newEvents = filterDupeEvents(eventsArr, this.existingEvents || []);
      const altEvents = filterAltEvents(eventsArr, this.existingEvents || []);
      Log.Info("searchTMLoop() - filtered Events", newEvents);

      // Ticket API provides a bunch of different images of different sizes
      // This function will run through the newfound events and select the highest res image
      for (const event of newEvents) {
        event.image = findLargestImage(event.image);
      }
      for (const event of altEvents) {
        event.image = findLargestImage(event.image);
      }

      return { newEvents , altEvents };
    } catch (e) {
      Log.Error(`SearchTMLoop() error - ${e}`);
      return { newEvents: [], altEvents: [] };
    }
  };

  /**
   * Finds the URL of the largest image from a JSON response object.
   * @param {Array} images - Array of objects, each with "width", "height", and "url".
   * @returns {string} The URL of the largest image.
   */
  findLargestImage(images) {
    if (!images || images.length === 0) {
      return null;
    }

    // Initialize variables to store the largest image details.
    let largestImage = images[0];
    let maxArea = largestImage.width * largestImage.height;

    // Iterate over the array of images to find the one with the largest area.
    for (let i = 1; i < images.length; i++) {
      const img = images[i];
      if (!img?.width || !img?.height) continue;

      // Update the largest image if the current one has a larger area.
      const area = img.width * img.height;
      if (area > maxArea) {
        largest = img;
        maxArea = area;
      }
    }

    // Return the URL of the largest image.
    return largest.url || null;
  }

  /**
   * Compares the size of each image in an array of image URLs.
   * Returns just the headers to get the value in Content-Length for the image
   * @param {Array} images - Array of objects, each with "url".
   * @returns {string} The URL of the largest image.
   */
  async findLargestImageBySize (imagesObj) {
    console.info("findLargestImage() starting")
    console.info(imagesObj)
    if (imagesObj.length < 1) {
      console.error(
        `findLargestImage(imageUrls: ${imageUrls}) - imageUrls is empty`
      );
      return "";
    }
    let largestSize = 0;
    let largestImageUrl = null;

    for (let image of imagesObj) {
      try {
        const url = image.url ? image.url : "";
        if (url != "") {
          const response = await UrlFetchApp.fetch(url, { method: "HEAD" }); // Use HEAD request to get headers only

          const contentLength = response.getAllHeaders().get("Content-Length");
          console.info(`Content length: ${contentLength}`);

          if (contentLength && parseInt(contentLength, 10) > largestSize) {
            largestSize = parseInt(contentLength, 10);
            // console.debug(`findLargestImage() found largest url: ${url}`)
            largestImageUrl = url;
          }
        }
      } catch (error) {
        console.error(`findLargestImage() Error fetching ${url}: ${error}`);
      }
    }
    console.log(`findLargestImage() returning ${largestImageUrl}`);
    return largestImageUrl;
  };

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Process Images in API response
   * Response usually includes multiple images. This function limits it to just the largest one.
   * @param {object} eventsArr [{eName, date, city, venue, url, image, acts}, ...]
   * @returns {object} eventsArr returns the events array with the image limited to the largest one
   */
  async filterTMimages(eventsArr) {
    if (!Array.isArray(eventsArr) || eventsArr.length == 0) {
      console.warn("Array eventsArr is empty or not an array");
      return [];
    }
    try {
      // loop through all the new events
      for (let i = 0; i < eventsArr.length; i++) {
        let item = eventsArr[i];
        let image = [[0, 0]];

        // Loop through image URLs in JSON response. Find the one with the largest filesize
        for (let i = 0; i < item.image.length; i++) {
          // let img = new Images();
          let img = await UrlFetchApp.fetch(item.image[i].url).getBlob();
          let imgBytes = img.getBytes().length;

          if (imgBytes > image[0][1]) {
            image[0][0] = i;
            image[0][1] = imgBytes;
          }
        }
        const result = item.image[image[0][0]].url;
        Log.Debug("Ticket API, Image URL", result);
        // replace array.image with just the largest image
        eventsArr[i].image = result;
      }
      return eventsArr;
    } catch (error) {
      console.error(`filterTMimages() ${error}`);
    }
  };

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * ticketSearch
   * Search Ticket API. Runs tmSearch function and parses response data.
   * @param {string} keyword
   * @returns {object} eventsArr
   */
  async ticketSearch(keyword) {
    // keyword = "The Books" // for debugging
    if (!keyword) {
    Log.Warn("ticketSearch() - No keyword provided");
    return [];
  }

    let eventsArr = [];

    try {
      Log.Info(`Searching for ${keyword}`);
      const data = await this.fetchFromTicketAPI(keyword);

      Log.Debug(`ticketSearch() - ${data.length} results parsed`);
      if (!Array.isArray(data) || data.length === 0) {
        Log.Debug(`No results found for ${keyword}`);
        return [];
      }

      for (const item of data) {
        const attractions = item?._embedded?.attractions?.map(a => a.name) || [];
        const matched = attractions.filter(name => this.artistsList.includes(name));
        if (matched.length === 0) continue;
        console.info(
          `Match for: ${attractions.filter((element) =>
            this.artistsList.includes(element)
          )},   Event name: ${item.name}`
        );
        const venue = item?._embedded?.venues?.[0] || {};
        const dateObj = item?.dates?.start;
        const date = dateObj?.dateTime || dateObj?.localDate || null;
        const formattedDate = date ? Utilities.formatDate(new Date(date), "PST", "yyyy/MM/dd HH:mm") : "";

        eventsArr.push({
          eName: item.name || "",
          acts: attractions.join(", "),
          venue: venue.name || "",
          city: venue.city?.name || "",
          date: formattedDate,
          url: item.url || "",
          image: item.images || [],
          address: [venue.address?.line1, venue.city?.name, venue.state?.name].filter(Boolean).join(", "),
        });
      }
      Log.Debug(`ticketSearch() - eventsArr: ${eventsArr}`);
      Log.Debug(`ticketSearch() - ${eventsArr.length} events found`);
      return eventsArr;
    } catch (err) {
      Log.Error(`ticketSearch failed - ${err}`);
    }
  };

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * fetchFromTicketAPI
   * Fetch data from API
   * @param {object} event {name, date, city, venue, url, image, acts}
   * @returns {object} results
   */
  async fetchFromTicketAPI(keyword) {
    let page = 0;
    const pageSize = 20;
    let results = new Array();
    const options = {
      method: "GET",
      async: true,
      contentType: "application/json",
    };
    let params = this.returnTMParams(keyword, page, pageSize);

    Log.Debug(`Searching Ticket API for ${keyword}`);
    try {
      const response = UrlFetchApp.fetch(
        TM_URL + params,
        options
      );
      const responseCode = response.getResponseCode();
      if (responseCode == 200 || responseCode == 201) {
        const content = response.getContentText();
        const data = JSON.parse(content);
        const totalResults = data?.page?.totalElements;
        const totalPages = Math.min(data?.page?.totalPages, 50);
        const resultPageSize = data?.page?.size;
        Log.Debug(
          `tmSearch () - results: ${totalResults}, according to response`
        );
        Log.Debug(`tmSearch () - pages: ${totalPages}, according to response`);
        Log.Debug(
          `tmSearch () - page size: ${resultPageSize}, according to response`
        );

        if (totalResults == 0) {
          Log.Debug(`tmSearch() - No Ticket Results`);
          return [];
        }
        const resultsParsed = data?._embedded?.events;

        results.push(...resultsParsed);
        // const pages = Math.ceil(totalResults / pageSize);

        for (let pg = 1; pg < totalPages; pg++) {
          Utilities.sleep(180);
          Logger.log("getting page " + pg);
          page = pg;
          params = this.returnTMParams(keyword, page, pageSize);
          const nextPage = await UrlFetchApp.fetch(
            TM_URL + params,
            options
          ).getContentText();
          const nextPageParsed = JSON.parse(nextPage)._embedded?.events;
          results.push(...nextPageParsed);
        }
        // Log.Info("tmSearch() results", results);
        return results;
      } else {
        Log.Error(
          `tmSearch() error - Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`
        );
        return false;
      }
    } catch (err) {
      Log.Error(`tmSearch() error: ${err}`);
      return {};
    }
  };

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Return parameters for Ticket API fetch URL
   * @param {string} keyword name of artist being searched
   * @page {integer} page the page number we want in return - starts with 0
   * @param {integer} pageSize number of results returned in each response
   * @returns {string} params encoded parameters for Ticket API query
   */
  returnTMParams(keyword, page, pageSize) {
    let params = `?apikey=${Config.keyTM()}`;
    // params += `&postalCode=`;
    // params += `&city=Los+Angeles`;   // seems to negate the radius settings - latlong setting seems to work better
    params += `&latlong=${Config.latLong()}`;
    params += `&radius=${Config.radius()}`; // radius only seems to work with latlong
    params += `&unit=${Config.unit()}`;
    params += `&page=${page}`;
    params += `&size=${pageSize}`;
    params += `&keyword=${encodeURIComponent(keyword)}`;
    return params;
  };
}

const test_ticket = () => {
  const tm = new TM();
  const result = tm.searchTMLoop();
  Logger.log(result);
  const filteredEventsArr = filterNewEvents(result, buildEventsArr());
  // Log.Debug("searchTMLoop() - filtered Events", filteredEventsArr);

  // select which image is highest resolution and use only this
  const imageFilteredEvents = filterTMimages(filteredEventsArr);
  Logger.log(imageFilteredEvents);
  return imageFilteredEvents;
};

