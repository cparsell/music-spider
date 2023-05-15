const refreshEvents = async () => {
  const writer = new WriteLogger();
  
  //get list of artists from sheet
  let artistsArr = artistsList();

  //Clean expired events
  removeExpiredEntries(eventSheet);

  // Clear any empty rows if something was manually deleted
  deleteEmptyRows(eventSheet);

  //search each artist
  let eventsArr = {};
  
  let i = 0;
  
  try {
    // Logger.log(`arrray length ${artistsArr.length}`);
    // for (i=0;i<artistsArr.length; i++){
    while (i<artistsArr.length){
      await ticketSearch(artistsArr[i][0], writer).then(data => {
        i++;
        // Logger.log(data);
        for (const [index, [key]] of Object.entries(Object.entries(data))) {
          let exists = searchColForValue(eventSheet, "URL", data[key].url);
          if (!exists) {
            eventsArr[key] = {
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
  }catch (e) { 
      Logger.log(e);
      writer.Error(e);
  }
  // Write new events to events sheet
  writeEventsToSheet(eventsArr);

  // Write Calendar Event for new events
  if (config.createCalendarEvents) createCalEvents(eventsArr);
}

const writeEventsToSheet = async (eventsArr) => {
  for (const [index, [key]] of Object.entries(Object.entries(eventsArr))) {
    SetRowData(eventSheet, eventsArr[key]);
  }
}

const buildEventsArr = () => 
{
  let lastRow = eventSheet.getLastRow();
  let events = {};
  let ordered = {};
  if (lastRow>1) {
    for (i=1; i<lastRow;i++)
    {
      let rowData = GetRowData(eventSheet, i+1);
      let { date } = rowData;
      // let formattedDate = Utilities.formatDate(newDate, `PST`,`MM-dd-yyyy hh:mm a`);
      events[date] = rowData;
    }
      // Sort by key, which is the date
    ordered = Object.keys(events).sort().reduce(
      (obj, key) => { 
        obj[key] = events[key]; 
        return obj;
      }, 
      {}
    );
  } else {
    console.warn("No events found- unable to build array of Events");
  }

  return ordered;
}

const ticketSearch = async (keyword, writer) => 
{
  // keyword = "Clark" // for debugging, I uncomment this, specify something that returns a result, and run the function from Apps Script to see the Execution Log
  // writer = new WriteLogger();  // and uncomment this
  if (keyword == undefined) {
    Logger.log("No keyword provided");
    return;
  }
  let artist = artistSheet.getRange(2,1);
  let eventsArr = {};

  try {
    // returns JSON response
    await tmSearch(keyword, writer)
      .then(async(data) => {
        debugLog(`tmSearch data`, data)
        if (data.page.totalElements == 0) {
          Logger.log(`No results for ${keyword}`)
          return false;
        }
        
        
        data?._embedded?.events?.forEach((item) =>
        {
          let url = item.url;
          let image = [[0,0]];
          // Loop through image URLs in JSON response. Find the one with the largest filesize
          for (i=0;i<item.images.length;i++){
              // let img = new Images();
              let img = UrlFetchApp.fetch(item.images[i].url).getBlob();
              let imgBytes = img.getBytes().length;
              
              if (imgBytes>image[0][1]) {
                image[0][0]=i
                image[0][1]=imgBytes
              }
          }
          let attractions = new Array;
          item?._embedded?.attractions?.forEach((attraction) => {
            attractions.push(attraction.name);
          });
          // if other artists in my list are in this event, move them to front of list
          let artistsArr = artistsList();
          for (i=0;i<artistsArr.length;i++){
            let artist = artistsArr[i][0];
            if (attractions.includes(artist) && artist != keyword) {
              attractions = attractions.sort(function(x,y){ return x == artist ? -1 : y == artist ? 1 : 0; });
            }
          }
          // then move keyword to front of list of acts
          attractions = attractions.sort(function(x,y){ return x == keyword ? -1 : y == keyword ? 1 : 0; });
          item?._embedded?.venues?.forEach((venue) =>{ 
            let venueName = venue.name; 
            let venueAddress = venue.address.line1;
            let date;
            if (item.dates.start.dateTime) {
              date = item.dates.start.dateTime;
            }
            // some list timeTBA = true, or noSpecificTime = true. if so, use localDate value
            if (item.dates.start.timeTBA || item.dates.start.noSpecificTime) {
              date = item.dates.start.localDate;
            }
            // Logger.log(`venue: ${venueName}`);
            if (attractions.includes(keyword) || item.name.toUpperCase() == keyword.toUpperCase()) {
              eventsArr[date] = { 
                "eName": item.name,
                "acts": attractions,
                "venue": venueName , 
                "city": venue.city.name, 
                "date": date, 
                "url": url, 
                "image": item.images[image[0][0]].url,
                "address": `${venueAddress}, ${venue.city.name}, ${venue.state.name}`
              }
            }
          });
        });
        if (Object.keys(eventsArr)==0) {
          Logger.log(`No events found for ${keyword}`);
          return;
        }
        // Logger.log(eventsArr);
        debugLog(`eventsArr`,eventsArr);
    });
    return await eventsArr;
  } catch (err) {
    writer.Error(`ticketSearch failed - ${err}`);
  }
}


const writeEvent = ({name, date, city, venue, url, image, acts}) => 
{
  // let newData = new Array;
  // newData[0] = [eventName, eventVenue, eventCity,eventDate];

  let lastRow = eventSheet.getLastRow();
  // eventSheet.getRange(lastRow+1,1,1,4).setValues(newData);
  SetByHeader(eventSheet, "Event Name", lastRow+1, name);
  SetByHeader(eventSheet, "City", lastRow+1, city);
  SetByHeader(eventSheet, "Venue", lastRow+1, venue);
  SetByHeader(eventSheet, "Date", lastRow+1, date);
  SetByHeader(eventSheet, "URL", lastRow+1, url);
  SetByHeader(eventSheet, "Image", lastRow+1, image);
  SetByHeader(eventSheet, "Acts", lastRow+1, acts.toString());
}
const tmSearch = async (keyword, writer) => 
{
  let options = {
      "method": "GET",
      "async": true,
      "contentType": "application/json",
  };
  let params = `?apikey=${config.keyTM}`;
  // params += `&postalCode=`;  
  // params += `&city=Los+Angeles`;
  params += `&latlong=${config.latlong}` 
  params += `&radius=${config.radius}`; // radius only seems to work with latlong
  params += `&unit=${config.unit}`;
  params += `&keyword=${encodeURIComponent(keyword)}`;
  Logger.log(`Searching Ticketmaster for ${keyword}`);
  try {
    let response = await UrlFetchApp.fetch(ticketmasterUrl+params, options);
    let responseCode = response.getResponseCode();
    if (responseCode == 200 || responseCode == 201) {
      let content = await response.getContentText();
      writer.Info(content);  // uncomment this to write raw JSON response to 'Logger' sheet
      let parsed = JSON.parse(content);
      return parsed;
    } else {
      writer.Error('Failed to search Ticketmaster');
      return false;
    }
  } catch (err) {
    writer.Error(`Failed to search Ticketmaster ${err}`);
    return {};
  }
}