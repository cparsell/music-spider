/**
 * ----------------------------------------------------------------------------------------------------------------
 * Search Ticketmaster for every artist in Artists Sheets
 * Trigger - Main function for Ticketmaster search. Searches Ticketmaster for artists found in Spotify or added manually.
 * Any events returned that contain the artist's name are added to the sheet
 */
const searchTMLoop = async (artistsArr, existingEvents) => {
  //search each artist in TM
  let eventsArr = [];
  try {
    for (let i = 0; i < artistsArr.length; i++) {
      await ticketSearch(artistsArr[i], artistsArr).then((data) =>
        data.forEach((event) => eventsArr.push(event))
      );
      Utilities.sleep(180);
    }
    // get rid of any results that are already on the Events Sheet
    const newEvents = filterDupeEvents(eventsArr, existingEvents);
    const altEvents = filterAltEvents(eventsArr, existingEvents);
    Log.Debug("searchTMLoop() - filtered Events", newEvents);

    // Ticketmaster provides a bunch of different images of different sizes
    // This function will run through the newfound events and select the highest res image
    for (let i = 0; i < newEvents.length; i++) {
      const largestImage = findLargestImage(newEvents[i].image);
      console.info("searchTMLoops() largestImage:", largestImage);
      newEvents[i].image = largestImage;
    }
    for (let i = 0; i < altEvents.length; i++) {
      const largestImage = findLargestImage(altEvents[i].image);
      console.info("searchTMLoops() largestImage:", largestImage);
      altEvents[i].image = largestImage;
    }
    return { newEvents: newEvents, altEvents: altEvents };
  } catch (e) {
    Log.Error(`SearchTMLoop() error - ${e}`);
    return [];
  }
};

const findLargestImage = (imagesObj) => {
  console.info(imagesObj);
  if (imagesObj.length < 1) {
    console.error(
      `findLargestImage(imageUrls: ${imageUrls}) - imageUrls is empty`
    );
    return "";
  }
  let largestSize = 0;
  let largestImageUrl = null;

  for (const image of imagesObj) {
    try {
      const url = image.url;
      const response = UrlFetchApp.fetch(url, { method: "HEAD" }); // Use HEAD request to get headers only

      const contentLength = response.getAllHeaders().get("Content-Length");
      console.info(`Content length: ${contentLength}`);

      if (contentLength && parseInt(contentLength, 10) > largestSize) {
        largestSize = parseInt(contentLength, 10);
        // console.debug(`findLargestImage() found largest url: ${url}`)
        largestImageUrl = url;
      }
    } catch (error) {
      console.error(`findLargestImage() Error fetching ${url}: ${error}`);
    }
  }

  return largestImageUrl;
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Process Images in Ticketmaster API response
 * Response usually includes multiple images. This function limits it to just the largest one.
 * @param {object} eventsArr [{eName, date, city, venue, url, image, acts}, ...]
 * @returns {object} eventsArr returns the events array with the image limited to the largest one
 */
const filterTMimages = (eventsArr) => {
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
        let img = UrlFetchApp.fetch(item.image[i].url).getBlob();
        let imgBytes = img.getBytes().length;

        if (imgBytes > image[0][1]) {
          image[0][0] = i;
          image[0][1] = imgBytes;
        }
      }
      const result = item.image[image[0][0]].url;
      Log.Debug("Ticketmaster, Image URL", result);
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
 * Search Ticketmaster. Runs tmSearch function and parses response data.
 * @param {string} keyword
 * @returns {object} eventsArr
 */
const ticketSearch = async (keyword, artistsArr) => {
  // keyword = "The Books" // for debugging
  if (keyword == undefined) {
    Logger.log("ticketSearch() - No keyword provided");
    return;
  }
  if (!Array.isArray(artistsArr) || artistsArr.length == 0) {
    Logger.log("ticketSearch() - Artists Array undefined or empty");
    return;
  }
  // let artist = ARTIST_SHEET.getRange(2,1);
  let eventsArr = [];

  try {
    // returns JSON response
    await fetchFromTicketmaster(keyword, artistsArr).then(async (data) => {
      Log.Debug(`ticketSearch() - ${data.length} results parsed`);
      // Log.Debug(`ticketSearch() - data received`, data)
      if (data.length == 0) {
        Log.Debug(`ticketSearch() - No results for`, keyword);
        return false;
      }

      data.forEach((item) => {
        let attractions = [];
        item?._embedded?.attractions?.forEach((attraction) => {
          attractions.push(attraction.name);
        });

        let shouldAddEvent = attractions.some((attraction) => {
          return artistsArr.includes(attraction);
        });

        if (shouldAddEvent) {
          console.info(
            `Match for: ${attractions.filter((element) =>
              artistsArr.includes(element)
            )},   Event name: ${item.name}`
          );
          let url = item.url ? item.url : "";
          let image = item.images ? item.images : "";
          let venueName,
            venueAddress,
            venueCity,
            venueState,
            date,
            dateFormatted;
          item?._embedded?.venues?.forEach((venue) => {
            venueName = venue.name ? venue.name : "";
            venueAddress = venue.address.line1 ? venue.address.line1 : "";
            venueCity = venue.city.name ? venue.city.name : "";
            venueState = venue.state.name ? venue.state.name : "";
            try {
              if (item.dates.start.dateTime) {
                date = new Date(item.dates.start.dateTime);
              }
              // some list timeTBA = true, or noSpecificTime = true. if so, use localDate value
              if (item.dates.start.timeTBA || item.dates.start.noSpecificTime) {
                date = new Date(item.dates.start.localDate);
              }

              dateFormatted = Utilities.formatDate(
                date,
                "PST",
                "yyyy/MM/dd HH:mm"
              );
            } catch (error) {
              Logger.log(
                `ticketSearch() Error formatting date: ${error.message}`
              );
            }
          });
          eventsArr.push({
            eName: item.name,
            acts: attractions.join(),
            venue: venueName,
            city: venueCity,
            date: dateFormatted,
            url: url,
            image: image,
            address: `${venueAddress}, ${venueCity}, ${venueState}`,
          });
        }
      });
      if (eventsArr.length == 0) {
        Log.Debug(`ticketSearch() - No events found for ${keyword}`);
        return;
      }
      Log.Debug(`ticketSearch() - eventsArr: ${eventsArr}`);
    });
    Log.Debug(`ticketSearch() - ${eventsArr.length} events found`);
    return await eventsArr;
  } catch (err) {
    Log.Error(`ticketSearch failed - ${err}`);
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * fetchFromTicketmaster
 * Fetch data from Ticketmaster API
 * @param {object} event {name, date, city, venue, url, image, acts}
 * @returns {object} results
 */
const fetchFromTicketmaster = async (keyword) => {
  // Ticketmaster API
  // reference: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#search-events-v2
  let page = 0;
  const pageSize = 20;
  let results = new Array();
  const options = {
    method: "GET",
    async: true,
    contentType: "application/json",
  };
  let params = returnTMParams(keyword, page, pageSize);

  Log.Debug(`Searching Ticketmaster for ${keyword}`);
  try {
    const response = await UrlFetchApp.fetch(
      TICKETMASTER_URL + params,
      options
    );
    const responseCode = response.getResponseCode();
    if (responseCode == 200 || responseCode == 201) {
      const content = await response.getContentText();
      // Log.Info(content);
      const data = JSON.parse(content);
      // Log.Info("tmSearch() - response", data);  // uncomment this to write raw JSON response to 'Logger' sheet

      const totalResults = data?.page?.totalElements;
      const totalPages = data?.page?.totalPages;
      const resultPageSize = data?.page?.size;
      Log.Debug(
        `tmSearch () - results: ${totalResults}, according to response`
      );
      Log.Debug(`tmSearch () - pages: ${totalPages}, according to response`);
      Log.Debug(
        `tmSearch () - page size: ${resultPageSize}, according to response`
      );

      if (totalResults == 0) {
        Log.Debug(`tmSearch() - No Ticketmaster Results`);
        return [];
      }
      // const newData =  await data?.events;
      const resultsParsed = data?._embedded?.events;

      results.push(...resultsParsed);
      // const pages = Math.ceil(totalResults / pageSize);

      running = pageSize;

      for (let pg = 1; pg < totalPages; pg++) {
        Utilities.sleep(180);
        Logger.log("getting page " + pg);
        // let pgSize = pageSize;
        page = pg;
        params = returnTMParams(keyword, page, pageSize);
        nextPage = await UrlFetchApp.fetch(
          TICKETMASTER_URL + params,
          options
        ).getContentText();
        const nextPageParsed = await JSON.parse(nextPage)._embedded?.events;
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
 * Return parameters for Ticketmaster API fetch URL
 * @param {string} keyword name of artist being searched
 * @page {integer} page the page number we want in return - starts with 0
 * @param {integer} pageSize number of results returned in each response
 * @returns {string} params encoded parameters for Ticketmaster API query
 */
const returnTMParams = (keyword, page, pageSize) => {
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

const test_ticket = async () => {
  const result = await ticketSearch("Hania Rani");
  Logger.log(result);
  const filteredEventsArr = filterNewEvents(result, buildEventsArr());
  // Log.Debug("searchTMLoop() - filtered Events", filteredEventsArr);

  // select which image is highest resolution and use only this
  const imageFilteredEvents = filterTMimages(filteredEventsArr);
  Logger.log(imageFilteredEvents);
  return imageFilteredEvents;
};
