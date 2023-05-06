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
  let artistsArr = artistsList();
  //search each artist
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
  // keyword = "Madlib"
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
      var image = [[0,0]];
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
      var attractions = new Array;
      item._embedded.attractions.forEach((attraction) => {
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
      item._embedded.venues.forEach((venue) =>{ 
        let venueName = venue.name; 
        let date;
        if (item.dates.start.dateTime) {
          date = item.dates.start.dateTime;
        }
        // some list timeTBA = true, or noSpecificTime = true. if so, use localDate value
        if (item.dates.start.timeTBA || item.dates.start.noSpecificTime) {
          date = item.dates.start.localDate;
        }
        // Logger.log(`venue: ${venueName}`);
        eventsArr[date] = { 
          "name": item.name,
          "acts": attractions,
          "venue": venueName , 
          "city": venue.city.name, 
          "date": date, 
          "url": url, 
          "image": item.images[image[0][0]].url
        }
      });
    });
    if (Object.keys(eventsArr)==0) Logger.log(`No events found for ${keyword}`);
    for (const key of Object.keys(eventsArr)) { 
      // eventsArr[key].name.match(keyword) || 
      if (eventsArr[key].acts.includes(keyword)) {
        let doesItExist = matchValByHeader(eventSheet, "URL", eventsArr[key].url);
        if (!doesItExist) {
          writeEvent({ 
            date: eventsArr[key].date,
            name: eventsArr[key].name,
            city: eventsArr[key].city,
            venue: eventsArr[key].venue, 
            url: eventsArr[key].url, 
            image: eventsArr[key].image,
            acts: eventsArr[key].acts,
          });
        }
      } 
    };

  }
}

const matchValByHeader = (sheet, columnName, val) => {
  if(typeof sheet != `object`) return false;
  try {
    let data = sheet.getDataRange().getValues();
    let lastRow = sheet.getLastRow();
    let col = data[0].indexOf(columnName);
    let range = sheet.getRange(2,col+1,lastRow,1).getValues();
    if (col != -1) {
      var isSearchStringInRange = range.some( function(row){
        return row[0] === val
      });
      return isSearchStringInRange;
    }
    else {
      console.error(`Matching data by header fucking failed...`);
      return false;
    }
  } catch (err) {
    console.error(`${err} : matchValByHeader failed - Sheet: ${sheet} Col Name specified: ${columnName} value: ${val}`);
    return false;
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
  var options = {
      "method": "GET",
      "async": true,
      "contentType": "application/json",
  };
  var params = `?apikey=${config.keyTM}`;
  // params += `&postalCode=`;  
  // params += `&city=Los+Angeles`;
  params += `&latlong=${config.latlong}` 
  params += `&radius=${config.radius}`; // radius only seems to work with latlong
  params += `&unit=${config.unit}`;
  params += `&keyword=${encodeURIComponent(keyword)}`;
  Logger.log(`Searching Ticketmaster for ${keyword}`);
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