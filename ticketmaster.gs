/**
 * ----------------------------------------------------------------------------------------------------------------
 * refreshEvents
 * Trigger - Main function for Ticketmaster search. Searches Ticketmaster for artists found in Spotify or added manually. 
 * Any events returned that contain the artist's name are added to the sheet
 */
const refreshEvents = async () => 
{
  // get list of artists from sheets
  let artistsArr = artistsList();
  let existingEvents = buildEventsArr();
  //Clean expired events
  removeExpiredEntries(EVENT_SHEET);

  // Clear any empty rows if something was manually deleted
  CommonLib.deleteEmptyRows(EVENT_SHEET);
  // start loop that searches Ticketmaster for every artist in Artists Sheets
  let eventsArr = await searchTMLoop(artistsArr, existingEvents);
  Log.Info("New TM events", eventsArr);
  // Write new events to events sheet
  writeEventsToSheet(eventsArr);
  // Write Calendar Event for new events
  if (Config.CREATE_CALENDAR_EVENTS) createCalEvents(eventsArr);
  // If searchRA set to TRUE in config.gs then search Resident Advisor too
  if (Config.SEARCH_RA) {
    let eventsRA = await searchRAMain(artistsArr);
    Log.Info("New TM events", eventsRA);
    writeEventsToSheet(eventsRA);
    // Write Calendar Event for new events
    if (Config.CREATE_CALENDAR_EVENTS) createCalEvents(eventsRA);
  } 
}
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
    let filteredEventsArr = filterNewEvents(eventsArr,existingEvents, "eName", "venue", "date", "url");
    Log.Debug("searchTMLoop() - filtered Events", filteredEventsArr);
    return filteredEventsArr;
  } catch (e) 
  { 
    Log.Error(`SearchTMLoop() error - ${e}`);
    return []
  }
  
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
    Logger.log("No keyword provided");
    return;
  }
  let artist = ARTIST_SHEET.getRange(2,1);
  let eventsArr = new Array;

  try {
    // returns JSON response
    await tmSearch(keyword)
      .then(async(data) => {
        // Log.Debug(`ticketSearch() - data received`, data)
        if (data.page.totalElements == 0) 
        {
          Log.Debug(`No results for`, keyword);
          return false;
        }
        data?._embedded?.events?.forEach((item) =>
        {
          let url = item.url;
          let image = [[0,0]];
          // Loop through image URLs in JSON response. Find the one with the largest filesize
          for (let i=0;i<item.images.length;i++)
          {
            // let img = new Images();
            let img = UrlFetchApp.fetch(item.images[i].url).getBlob();
            let imgBytes = img.getBytes().length;
            
            if (imgBytes>image[0][1]) {
              image[0][0]=i
              image[0][1]=imgBytes
            }
          }
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
                "image": item.images[image[0][0]].url,
                "address": `${venueAddress}, ${venue.city.name}, ${venue.state.name}`
              });
            }
          });
        });
        if (eventsArr.length==0) 
        {
          Logger.log(`No events found for ${keyword}`);
          return;
        }
        // Logger.log(eventsArr);
        Log.Debug(`eventsArr: ${eventsArr}`);
    });
    return await eventsArr;
  } catch (err) {
    Log.Error(`ticketSearch failed - ${err}`);
  }
}

// /**
//  * ----------------------------------------------------------------------------------------------------------------
//  * writeEvent
//  * Write an event
//  * @param {object} event {name, date, city, venue, url, image, acts} 
//  */
// const writeEvent = ({name, date, city, venue, url, image, acts}) => 
// {
//   // let newData = new Array;
//   // newData[0] = [eventName, eventVenue, eventCity,eventDate];

//   let lastRow = EVENT_SHEET.getLastRow();
//   // EVENT_SHEET.getRange(lastRow+1,1,1,4).setValues(newData);
//   SetByHeader(EVENT_SHEET, "Event Name", lastRow+1, name);
//   SetByHeader(EVENT_SHEET, "City", lastRow+1, city);
//   SetByHeader(EVENT_SHEET, "Venue", lastRow+1, venue);
//   SetByHeader(EVENT_SHEET, "Date", lastRow+1, date);
//   SetByHeader(EVENT_SHEET, "URL", lastRow+1, url);
//   SetByHeader(EVENT_SHEET, "Image", lastRow+1, image);
//   SetByHeader(EVENT_SHEET, "Acts", lastRow+1, acts.toString());
// }

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
  let options = {
    "method": "GET",
    "async": true,
    "contentType": "application/json",
  };
  let params = `?apikey=${Config.KEY_TM}`;
  // params += `&postalCode=`;  
  // params += `&city=Los+Angeles`;
  params += `&latlong=${Config.LAT_LONG}` 
  params += `&radius=${Config.RADIUS}`; // radius only seems to work with latlong
  params += `&unit=${Config.UNIT}`;
  params += `&keyword=${encodeURIComponent(keyword)}`;
  Log.Debug(`Searching Ticketmaster for ${keyword}`);
  try {
    let response = await UrlFetchApp.fetch(TICKETMASTER_URL+params, options);
    let responseCode = response.getResponseCode();
    if (responseCode == 200 || responseCode == 201) 
    {
      let content = await response.getContentText();
      Log.Debug("tmSearch() - response", content);  // uncomment this to write raw JSON response to 'Logger' sheet
      let parsed = JSON.parse(content);
      return parsed;
    } else {
      Log.Error('Failed to search Ticketmaster');
      return false;
    }
  } catch (err) {
    Log.Error(`Failed to search Ticketmaster ${err}`);
    return {};
  }
}