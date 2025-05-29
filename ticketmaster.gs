// Ticketmaster API
// reference: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#search-events-v2

class TM {
  constructor(artistsList, existingEvents) {
    this.listService = new ListService();
    this.artistsList = artistsList || this.listService.getArtists();
    this.existingEvents = existingEvents || this.listService.getEvents();
    
  }
  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Search Ticket API for every artist in Artists Sheets
   * Trigger - Main function for API search. Searches API for artists found in Spotify or added manually.
   * Any events returned that contain the artist's name are added to the sheet
   */
  async searchTMLoop() {
    console.info(`TM Searching ${this.artistsList.length} artists`);
    const eventsArr = [];

    try {
      for (const artist of this.artistsList) {
        const data = await this.ticketSearch(artist);
        if (Array.isArray(data)) eventsArr.push(...data);
        Utilities.sleep(170); // Respect Ticketmaster's rate limit
      }

      const newEvents = filterDupeEvents(eventsArr, this.existingEvents);
      const altEvents = filterAltEvents(eventsArr, this.existingEvents);

      newEvents.forEach(event => {
        event.image = this.findLargestImage(event.image);
      });

      altEvents.forEach(event => {
        event.image = this.findLargestImage(event.image);
      });

      return { newEvents, altEvents };
    } catch (e) {
      Log.Error(`SearchTMLoop() error - ${e}`);
      return { newEvents: [], altEvents: [] };
    }
  }

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
    if (!keyword) {
      Log.Warn("ticketSearch() - No keyword provided");
      return [];
    }

    try {
      Log.Info(`Searching for ${keyword}`);
      const data = await this.fetchFromTicketAPI(keyword);

      if (!Array.isArray(data) || data.length === 0) {
        Log.Debug(`No results found for ${keyword}`);
        return [];
      }

      const eventsArr = [];
      for (const item of data) {
        const attractions = item?._embedded?.attractions?.map(a => a.name) || [];
        const matched = attractions.filter(name => this.artistsList.includes(name));
        if (matched.length === 0) continue;

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
          address: [venue.address?.line1, venue.city?.name, venue.state?.name].filter(Boolean).join(", ")
        });
      }

      return eventsArr;
    } catch (err) {
      Log.Error(`ticketSearch() failed for ${keyword}: ${err.message}`);
      return [];
    }
  }

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * fetchFromTicketAPI
   * Fetch data from API
   * @param {object} event {name, date, city, venue, url, image, acts}
   * @returns {object} results
   */
  async fetchFromTicketAPI(keyword) {
    if (!keyword || typeof keyword !== 'string') {
      Log.Error("fetchFromTicketAPI() - Invalid keyword");
      return [];
    }
    const pageSize = 20;
    const maxPages = 50;
    let results = [];
    const options = {
      method: "GET",
      contentType: "application/json",
    };

    // Log.Debug(`Searching Ticket API for ${keyword}`);
    try {
      const firstPageParams = this.returnTMParams(keyword, 0, pageSize);
      const firstResponse = UrlFetchApp.fetch(
        TM_URL + firstPageParams,
        options
      );
      const responseCode = firstResponse.getResponseCode();

      if (responseCode !== 200 && responseCode !== 201) {
        Log.Error(`fetchFromTicketAPI() - Response Code ${responseCode} - ${RESPONSECODES?.[responseCode] || 'Unknown error'}`);
        return [];
      }
      const parsed = await JSON.parse(firstResponse.getContentText());
      const totalPages = Math.min(parsed?.page?.totalPages || 0, maxPages);
      const events = parsed?._embedded?.events || [];

      // const resultPageSize = data?.page?.size;
      // Log.Debug(`fetchFromTicketAPI() - ${keyword} - ${totalResults} results across ${totalPages} pages`);

      results.push(...events);

      if (totalPages > 1) Logger.log(`fetchFromTicketAPI() - ${keyword} - ${totalPages} pages`);

      for (let page = 1; page < totalPages; page++) {
        console.info("Getting page " + page)
        Utilities.sleep(180); // API Rate Limit
      
        const params = this.returnTMParams(keyword, page, pageSize);
        try {
          const response = UrlFetchApp.fetch(TM_URL + params, options);
          const text = response.getContentText();
          const parsedPage = JSON.parse(text);
          const eventsPage = parsedPage?._embedded?.events;
          if (Array.isArray(eventsPage)) {
            results.push(...eventsPage);
          } else {
            Log.Warn(`Page ${page} returned no events for ${keyword}`);
          }
        
        } catch (pageErr) {
          Log.Warn(`Page ${page} returned no events for ${keyword}`);
        }
      }

      return results;
    } catch (err) {
      Log.Error(`fetchFromTicketAPI() - Fatal error fetching events for ${keyword}: ${err.message}`);
      return [];
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

  findLargestImage(images) {
    if (!Array.isArray(images) || images.length === 0) return null;

    return images.reduce((largest, img) => {
      const largestArea = (largest?.width || 0) * (largest?.height || 0);
      const currentArea = (img?.width || 0) * (img?.height || 0);
      return currentArea > largestArea ? img : largest;
    }, images[0])?.url || null;
  }
}

const test_ticket = async () => {
  try {
  const tm = new TM();
  const result = await tm.searchTMLoop();
  console.info(result);
  const filteredEventsArr = filterNewEvents(result, buildEventsArr());
  // Log.Debug("searchTMLoop() - filtered Events", filteredEventsArr);

  // select which image is highest resolution and use only this
  const imageFilteredEvents = filterTMimages(filteredEventsArr);
  Logger.log(imageFilteredEvents);
  } catch (err) {
    console.error(`test_ticket() error: ${err.message}`);
  }

};


/**
 * Compares the size of each image in an array of image URLs.
 * Returns just the headers to get the value in Content-Length for the image
 * @param {Array} images - Array of objects, each with "url".
 * @returns {string} The URL of the largest image.
 */
const findLargestImageBySize = async (imagesObj) => {
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
          // console.debug(`findLargestImageBySize() found largest url: ${url}`)
          largestImageUrl = url;
        }
      }
    } catch (error) {
      console.error(`findLargestImageBySize() Error fetching ${url}: ${error}`);
    }
  }
  console.log(`findLargestImageBySize() returning ${largestImageUrl}`);
  return largestImageUrl;
};

/**
 * Finds the URL of the largest image from a JSON response object.
 * @param {Array} images - Array of objects, each with "width", "height", and "url".
 * @returns {string} The URL of the largest image.
 */
function findLargestImage(images) {
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