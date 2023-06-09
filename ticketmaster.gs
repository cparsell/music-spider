/**
 * ----------------------------------------------------------------------------------------------------------------
 * refreshEvents
 * Trigger - Main function for Ticketmaster search. Searches Ticketmaster for artists found in Spotify or added manually. 
 * Any events returned that contain the artist's name are added to the sheet
 */
const refreshEvents = async () => 
{
  
  //get list of artists from sheet
  let artistsArr = artistsList();

  //Clean expired events
  removeExpiredEntries(EVENT_SHEET);

  // Clear any empty rows if something was manually deleted
  CommonLib.deleteEmptyRows(EVENT_SHEET);

  //search each artist
  let eventsArr = {};
  
  let i = 0;
  
  try 
  {
    for (let i=0;i<artistsArr.length;i++)
    {
      await ticketSearch(artistsArr[i][0]).then(data => 
      {
        for (const [index, [key]] of Object.entries(Object.entries(data))) 
        {
          let exists = CommonLib.searchColForValue(EVENT_SHEET, "URL", data[key].url);
          if (!exists) {
            eventsArr[key] = 
            {
              date: data[key].date,
              eName: data[key].eName,
              city: data[key].city,
              venue: data[key].venue, 
              url: data[key].url, 
              image: data[key].image,
              acts: data[key].acts.toString(),
              address: data[key].address,
            }
          }
        }
        Utilities.sleep(200);
      });
    }
  } catch (e) 
  { 
      Log.Error(e);
  }
  // Write new events to events sheet
  writeEventsToSheet(eventsArr);

  // Write Calendar Event for new events
  if (Config.CREATE_CALENDAR_EVENTS) createCalEvents(eventsArr);
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
  let eventsArr = {};

  try {
    // returns JSON response
    await tmSearch(keyword)
      .then(async(data) => {
        Log.Debug(`tmSearch data: ${data}`)
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
          for (i=0;i<item.images.length;i++)
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
          for (i=0;i<artistsArr.length;i++)
          {
            let artist = artistsArr[i][0];
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
              eventsArr[eventDate] = 
              { 
                "eName": item.name,
                "acts": attractions,
                "venue": venueName , 
                "city": venue.city.name, 
                "date": eventDate, 
                "url": url, 
                "image": item.images[image[0][0]].url,
                "address": `${venueAddress}, ${venue.city.name}, ${venue.state.name}`
              }
            }
          });
        });
        if (Object.keys(eventsArr)==0) 
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
  Logger.log(`Searching Ticketmaster for ${keyword}`);
  try {
    let response = await UrlFetchApp.fetch(TICKETMASTER_URL+params, options);
    let responseCode = response.getResponseCode();
    if (responseCode == 200 || responseCode == 201) 
    {
      let content = await response.getContentText();
      Log.Debug(content);  // uncomment this to write raw JSON response to 'Logger' sheet
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