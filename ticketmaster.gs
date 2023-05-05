const refreshEvents = async () => {
  const writer = new WriteLogger();
  //Clear events list
  let startRow = 2;
  let numCols = eventSheet.getLastColumn();
  let numRows = eventSheet.getLastRow() - startRow + 1; // The number of row to clear
  if (numRows == 0) numRows = 1;
  let range = eventSheet.getRange(startRow, 1, numRows,numCols);
  range.clear();

  // clearColumn(eventSheet,1, 2,lastRow);
  // clearColumn(eventSheet,1, 2,lastRow);
  // clearColumn(eventSheet,1, 2,lastRow);
  // clearColumn(eventSheet,1, 2,lastRow);
  
  //get list of artists from sheet
  //search each artist
  let artistRows = artistSheet.getLastRow()-1;
  if (artistRows==0) artistRows=1;
  let artistsArr = artistSheet.getRange(2,1,artistRows,1).getValues();
  for (i=0;i<artistsArr.length; i++){
    // Logger.log(artistsArr[i][0]);
    ticketSearch(artistsArr[i][0], writer);
  }

}

const sendEmail = () => {
  var eventsArr = buildEventsArr();
  // Logger.log(eventsArr);
  var message = new CreateMessage({events: eventsArr});
  new Emailer({
    message: message,
    email: config.email
  });
}

const buildEventsArr = () => 
{
  let lastRow = eventSheet.getLastRow();
  var events = {};
  var ordered = {};
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
    Logger.warn("No events found- unable to build array of Events");
  }

  return ordered;
}

const ticketSearch = async (keyword, writer) => 
{
  // keyword = "Pixies"
  // const writer = new WriteLogger();
  let artist = artistSheet.getRange(2,1);
  let data = await tmSearch(keyword, writer);

  if (data) {
    var pdata = JSON.parse(data);
    var parsedData = pdata._embedded.events;
    // writer.Info(data);
    let eventsArr = {};
    parsedData.forEach((item) =>
    {
      // const { name, _embedded } = item;
      let url = item.url;
      var image = "";

      item._embedded.venues.forEach((venue) =>
      { 
        let venueName = venue.name; 
        // Logger.log(`venue: ${venueName}`);
        eventsArr[item.name] = { 
          "venue": venueName , 
          "city": venue.city.name, 
          "date": item.dates.start.dateTime, 
          "url": url, 
          "image": item.images[0].url
        }
      });
    });

    for (const key of Object.keys(eventsArr)) { 
      // Logger.log(key + ": "); 
      // Logger.log(eventsArr[key]); 
      if (key.match(keyword)) {
        writeEvent(key,eventsArr[key].date,eventsArr[key].city,eventsArr[key].venue, eventsArr[key].url, eventsArr[key].image);
      } 
    };
    if (Object.keys(eventsArr)==0) writer.Info(`No events found for ${keyword}`);
    
    // lastRow = eventSheet.getLastRow();
    // Logger.log("Events Array");
    // Logger.log(eventsArr);

    // Logger.log(`Events Array length: ${eventsArr.length}`);
    // writer.Info("Events Array");
    // writer.Info(eventsArr);
    // writer.Info(`Events Array length: ${eventsArr.length}`);
    // writeArrayToColumn(eventsArr, sheet, 1);
  }
}

const writeEvent = (eventName, eventDate, eventCity, eventVenue, eventUrl, eventImg) => 
{
  let newData = new Array;
  newData[0] = [eventName, eventVenue, eventCity,eventDate];

  let lastRow = eventSheet.getLastRow();
  // eventSheet.getRange(lastRow+1,1,1,4).setValues(newData);
  SetByHeader(eventSheet, "Event Name", lastRow+1, eventName);
  SetByHeader(eventSheet, "City", lastRow+1, eventCity);
  SetByHeader(eventSheet, "Venue", lastRow+1, eventVenue);
  SetByHeader(eventSheet, "Date", lastRow+1, eventDate);
  SetByHeader(eventSheet, "URL", lastRow+1, eventUrl);
  SetByHeader(eventSheet, "Image", lastRow+1, eventImg);
  
}
const tmSearch = async (keyword, writer) => 
{
  var options = {
      "method": "GET",
      "async": true,
      "contentType": "application/json",
      // "muteHttpExceptions": true,
      // "headers": headers
  };
  var params = `?apikey=${ticketmasterConfig.key}`;
  // params += `&size=1`;
  // params += `&postalCode=94720`;  
  // params += `&city=Berkeley`;
  params += `&latlong=${ticketmasterConfig.latlong}` 
  params += `&radius=40`; // radius only seems to work with latlong
  params += `&unit=miles`;
  params += `&keyword=${encodeURIComponent(keyword)}`;
  Logger.log(`Searching Ticketmaster for ${keyword}`);
  writer.Info(`Searching Ticketmaster for ${keyword}`);
  var firstPage = UrlFetchApp.fetch(ticketmasterUrl+params, options).getContentText();

  return firstPage;
}


// const collateEvent = (path, objects) => {
//   var outArray = [];
//   // var chunks = path.split('.');
//   // Iterate over each object
//   // for (const resp of objects)
//   // {
//     // var obj = JSON.parse(objects);
//         obj = objects[path];
//     outArray = outArray.concat(obj);
//   // }
// }