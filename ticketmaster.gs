
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Search Ticketmaster for every artist in Artists Sheets 
 * Trigger - Main function for Ticketmaster search. Searches Ticketmaster for artists found in Spotify or added manually. 
 * Any events returned that contain the artist's name are added to the sheet
 */
const searchTMLoop = async (artistsArr, existingEvents) => {
//search each artist in TM
  let eventsArr = new Array;
  try {
    for (let i=0;i<artistsArr.length;i++) {
      await ticketSearch(artistsArr[i]).then(data => 
      {
        for (let i=0; i<data.length;i++) {
          eventsArr.push({
            date: data[i].date,
            eName: data[i].eName,
            city: data[i].city,
            venue: data[i].venue, 
            url: data[i].url, 
            image: data[i].image,
            acts: data[i].acts.toString(),
            address: data[i].address,
          });
        }
      })
      Utilities.sleep(180);
    }
    // get rid of any results that are already on the Events Sheet
    let filteredEventsArr = filterNewEvents(eventsArr,existingEvents);
    Log.Debug("searchTMLoop() - filtered Events", filteredEventsArr);

    // Ticketmaster provides a bunch of different images of different sizes
    // This function will run through the newfound events and select the highest res image
    let imageFilteredEvents = filterTMimages(filteredEventsArr);
    return imageFilteredEvents;
  } catch (e) 
  { 
    Log.Error(`SearchTMLoop() error - ${e}`);
    return []
  }
  
}

const filterTMimages = (eventsArr) => {
  if (eventsArr.length == 0) return [];
  // loop through all the new events
  for (let i=0; i<eventsArr.length;i++) {
    let item = eventsArr[i];
    let image = [[0,0]];

    // Loop through image URLs in JSON response. Find the one with the largest filesize
    for (let i=0;i<item.image.length;i++)
    {
      // let img = new Images();
      let img = UrlFetchApp.fetch(item.image[i].url).getBlob();
      let imgBytes = img.getBytes().length;
      
      if (imgBytes>image[0][1]) {
        image[0][0]=i
        image[0][1]=imgBytes
      }
    }
    Logger.log(item.image[image[0][0]].url);
    eventsArr[i].image = item.image[image[0][0]].url;
  }
  return eventsArr;
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * writeEventsToSheet
 * Write an array of events to sheet
 * @param {array} eventsArr [{name, date, city, venue, url, image, acts}]
 */
const writeEventsToSheet = async (eventsArr) => 
{
  for (const [index, [key]] of Object.entries(Object.entries(eventsArr))) {
    CommonLib.setRowData(EVENT_SHEET, HEADERNAMES, eventsArr[key]);
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * ticketSearch
 * Search Ticketmaster. Runs tmSearch function and parses response data.
 * @param {string} keyword 
 */
const ticketSearch = async (keyword) => 
{
  // keyword = "The Books" // for debugging, I uncomment this, specify something that returns a result, and run the function from Apps Script to see the Execution Log
  if (keyword == undefined) {
    Logger.log("ticketSearch() - No keyword provided");
    return;
  }
  // let artist = ARTIST_SHEET.getRange(2,1);
  let eventsArr = new Array;

  try {
    // returns JSON response
    await tmSearch(keyword)
      .then(async(data) => {
        Log.Debug(`ticketSearch() - ${data.length} results parsed`);
        // Log.Debug(`ticketSearch() - data received`, data)
        if (data.length == 0) 
        {
          Log.Debug(`ticketSearch() - No results for`, keyword);
          return false;
        }
        // data?._embedded?.events?.forEach((item) =>
        data.forEach((item) =>
        {
          let url = item.url;
          let image = item.images;
          let attractions = new Array;
          item?._embedded?.attractions?.forEach((attraction) => 
          {
            attractions.push(attraction.name);
          });
          // if other artists in my list are in this event, move them to front of list
          let artistsArr = artistsList();
          for (let j=0;j<artistsArr.length;j++)
          {
            let artist = artistsArr[j];
            if (attractions.includes(artist) && artist != keyword) {
              attractions = attractions.sort(function(x,y){ return x == artist ? -1 : y == artist ? 1 : 0; });
            }
          }
          // then move keyword to front of list of acts
          attractions = attractions.sort(function(x,y){ return x == keyword ? -1 : y == keyword ? 1 : 0; });
          item?._embedded?.venues?.forEach((venue) =>
          { 
            let venueName = venue.name; 
            let venueAddress = venue.address.line1;
            let date;
            if (item.dates.start.dateTime) {
              date = new Date(item.dates.start.dateTime);
            }
            // some list timeTBA = true, or noSpecificTime = true. if so, use localDate value
            if (item.dates.start.timeTBA || item.dates.start.noSpecificTime) 
            {
              date = new Date(item.dates.start.localDate);
            }
            // Logger.log(`venue: ${venueName}`);
            if (attractions.includes(keyword) || item.name.toUpperCase() == keyword.toUpperCase()) 
            {
              let eventDate = Utilities.formatDate(date, "PST", "yyyy/MM/dd HH:mm");
              Logger.log(`Found event: ${item.name}`);
              eventsArr.push( 
              { 
                "eName": item.name,
                "acts": attractions,
                "venue": venueName , 
                "city": venue.city.name, 
                "date": eventDate, 
                "url": url, 
                "image": image,
                "address": `${venueAddress}, ${venue.city.name}, ${venue.state.name}`
              });
            }
          });
        });
        if (eventsArr.length==0) 
        {
          Log.Debug(`ticketSearch() - No events found for ${keyword}`);
          return;
        }
        // Logger.log(eventsArr);
        Log.Debug(`ticketSearch() - eventsArr: ${eventsArr}`);
    });
    Log.Debug(`ticketSearch() - ${eventsArr.length} events found`);
    return await eventsArr;
  } catch (err) {
    Log.Error(`ticketSearch failed - ${err}`);
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * tmSearch
 * Fetch data from Ticketmaster API
 * @param {object} event {name, date, city, venue, url, image, acts} 
 */
const tmSearch = async (keyword) => 
{
  // Ticketmaster API
  // reference: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#search-events-v2
  let page = 0;
  const pageSize = 20;
  let results = new Array;
  let options = {
    "method": "GET",
    "async": true,
    "contentType": "application/json",
  };
  let params = returnTMParams(keyword, page, pageSize);
  
  Log.Debug(`Searching Ticketmaster for ${keyword}`);
  try {
    let response = await UrlFetchApp.fetch(TICKETMASTER_URL+params, options);
    let responseCode = response.getResponseCode();
    if (responseCode == 200 || responseCode == 201) 
    {
      let content = await response.getContentText();
      let data = JSON.parse(content);
      // Log.Info("tmSearch() - response", data);  // uncomment this to write raw JSON response to 'Logger' sheet
      

      let totalResults = data?.page?.totalElements;
      let totalPages = data?.page?.totalPages;
      let resultPageSize = data?.page?.size;
      Log.Debug(`tmSearch () - results: ${totalResults}, according to response`);
      Log.Debug(`tmSearch () - pages: ${totalPages}, according to response`);
      Log.Debug(`tmSearch () - page size: ${resultPageSize}, according to response`);
      
      if (totalResults == 0) 
      {
        Log.Debug(`tmSearch() - No Ticketmaster Results`);
        return [];
      }
      // const newData =  await data?.events;
      let resultsParsed = data?._embedded?.events;

      results.push(...resultsParsed);
      // const pages = Math.ceil(totalResults / pageSize);
  
      running = pageSize;
      

      for (let pg=1;pg<totalPages;pg++) {
        Utilities.sleep(180);
        Logger.log('getting page ' + pg);
        // let pgSize = pageSize;
        page = pg;
        params = returnTMParams(keyword, page, pageSize);
        nextPage = await UrlFetchApp.fetch(TICKETMASTER_URL+params, options).getContentText();
        let nextPageParsed = await JSON.parse(nextPage)._embedded?.events;
        results.push(...nextPageParsed);

      }
      // Log.Info("tmSearch() results", results);
      return results;

    } else {
      Log.Error(`tmSearch() error - Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);
      return false;
    }
  } catch (err) {
    Log.Error(`tmSearch() error: ${err}`);
    return {};
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return parameters for Ticketmaster API fetch URL
 * @param {string} keyword name of artist being searched
 * @page {integer} page the page number we want in return - starts with 0
 * @param {integer} pageSize number of results returned in each response
 */
const returnTMParams = (keyword, page, pageSize) => {
  let params = `?apikey=${Config.KEY_TM}`;
  // params += `&postalCode=`;  
  // params += `&city=Los+Angeles`;   // seems to negate the radius settings - latlong setting seems to work better
  params += `&latlong=${Config.LAT_LONG}` 
  params += `&radius=${Config.RADIUS}`; // radius only seems to work with latlong
  params += `&unit=${Config.UNIT}`;
  params += `&page=${page}`;
  params += `&size=${pageSize}`;
  params += `&keyword=${encodeURIComponent(keyword)}`;
  return params;
}


const test_ticket = async () => {
  let result = await ticketSearch("Hania Rani");
  Logger.log(result);
  let filteredEventsArr = filterNewEvents(result,buildEventsArr());
    // Log.Debug("searchTMLoop() - filtered Events", filteredEventsArr);

    // select which image is highest resolution and use only this
    let imageFilteredEvents = filterTMimages(filteredEventsArr);
    Logger.log(imageFilteredEvents);
    return imageFilteredEvents;
}