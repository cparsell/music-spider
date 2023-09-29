/**
 * ----------------------------------------------------------------------------------------------------------------
 * Send fetch requests to Resident Advisor - multiple if getting all pages
 * @param {string} area which page of results to fetch 
 * @param {boolean} getAllPages if false will only return 1 page (18 results max)
 */
const getRAData = async (area=218, getAllPages = true) => {
  const pageSize = 18; // 18 is teh max number of results RA will send in one page
  let page = 1;
  let running = 0;
  const url = `https://ra.co/graphql`;
  
  let results = new Array;
  try { 
    let options = returnRAOptions(page, area);
    let response = await UrlFetchApp.fetch(url, options);
    let firstPage = await response.getContentText();
    let responseCode = await response.getResponseCode();
    Log.Info(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);
    if (responseCode == 200 || responseCode == 201) 
    {
      // Log.Debug("results", firstPage);
      let data = JSON.parse(firstPage).data.eventListings;
      let totalResults = data.totalResults;
      //Logger.log(CommonLib.prettifyJson(firstPage));

      results.push(...data.data);
      // Bail out if we only wanted the first page
      if (!getAllPages)
      {
        
        return results;
      }
      Logger.log("Total results: " + totalResults);
      running = pageSize;
      for (let pg=2;pg<=Math.ceil(totalResults/pageSize);pg++) {
        let pgSize = pageSize;
        page = pg;
        let options = returnRAOptions(page, area);
        if (totalResults - running < pageSize) pgSize = totalResults - pg;
        running += pageSize;
        nextPage = await UrlFetchApp.fetch(url, options).getContentText();
        let nextPageParsed = JSON.parse(nextPage).data.eventListings.data;
        results.push(...nextPageParsed);
      }
      return results;
    } else {
      Log.Error(`Failed to get data from ${url} - `);
      return [];
    }
  } catch (err) {
    Log.Error(`Failed to get data from ${url} - ${err}`);
    return [];
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns the headers and variables formatted for the API fetch request
 * @param {string} page which page of results to fetch 
 * @param {string} area which locality to search in (see list in resAdv_enums) 
 */
const returnRAOptions = (page, area) => {
  let variables = {
    "filters":{
      "areas":{"eq": area},
      // "id": 1731004,
      // "addressRegion":"San Francisco/Oakland",
      "listingDate":{"gte":Utilities.formatDate(new Date(), "PST", "yyyy/MM/dd"),"lte":"2024-04-25"},
      // "event": {"title": "Playxland: Trans Pride Beach Party!" },
      //"artists": { "name": "Four Tet" },
      "listingPosition":{"eq":1}
    },
    "pageSize": 18, //max the API will allow seems to be 18
    "page": page,
  }

  let query = {
    "query": queryRAEventListings,
    "variables": variables
  }
  const headers = {
    'Content-Type': "application/json", 
    'Accept': "application/json",
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    // "referer": "https://ra.co/events/us/bayarea",
  }
  let options = {
    "muteHttpExceptions": true,
    "headers": headers,
    "payload": JSON.stringify(query),
    "method": "POST",
  };
  return options;
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Searches the results to return only events that match artists in your list
 * @param {array} artistList 
 */
const searchRA = async (artistList) => {
  let results = new Array;
  try {
    let listings = await getRAData();
    Logger.log("searchRA() - TOTAL events returned: " + listings.length);
    for (let i=0; i<listings.length;i++){
      let listing = listings[i].event;
      Logger.log(listing);
      if (listing) {
        let title = listing?.title;
        let acts = [];
        let venue = listing?.venue?.name
        if (listing.artists.name) {
          for (let index=0; index<listings.length;artist++){
            acts.push(listing.artists[index].name);
          }
        }
        for (let j=0; j<artistList.length;j++) {
          acts.forEach(function(res) {
            if(res.toUpperCase() == artistList[j].toUpperCase()) {
              Logger.log(`Found a match in the listed acts for ${artistList[j]}`);
              let event = {
                date: Utilities.formatDate(new Date(listing.startTime), "PST", "yyyy/MM/dd HH:mm"),
                eName: title,
                city: "",
                venue: venue,
                url: 'https://ra.co' + listing.contentUrl,
                image: listing.images.filename,
                acts: acts.toString(),
                address: listing.venue.address
              }
              results.push(event);
            } 
          });
          if (title.toUpperCase().indexOf(artistList[j].toString().toUpperCase()) > -1) {
            Log.Debug(`${title} match for ${artistList[j]}`);
            let event = {
              date: Utilities.formatDate(new Date(listing.startTime), "PST", "yyyy/MM/dd HH:mm"),
              eName: title,
              city: "",
              venue: venue,
              url: 'https://ra.co' + listing.contentUrl,
              image: listing.images.filename,
              acts: acts.toString(),
              address: listing.venue.address
            }
            results.push(event);
          }
        }
      }
    }
    
    if (results.length > 0) results = CommonLib.arrayRemoveDupes(results);
    return results;
  } catch (err) {
    Log.Error(`searchRA() error - ${err}`);
    return [];
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Main handler function for Resident Advisor API
 * Reaches out to RA API to get results, 
 * @param {array} artistsArr the array of artists in the Artists List sheet
 */
const searchRAMain = async (artistsArr) => {
  let newEvents = {};

  try {
    if (!artistsArr) artistsArr = artistsList();
    const eventsArr = buildEventsArr();
    // returns events that match your artists
    const results = await searchRA(artistsArr); 
    let exists = false;
    // Check if the events already are on your events list
    for (let j=0; j<results.length;j++) {
      // if same URL exist in the event sheet don't add this result to the list
      let urlExists = CommonLib.searchColForValue(EVENT_SHEET, "URL", results[j].url);
      if (urlExists) continue;
      
      // Check event sheet to see if it was already found previously (if name, venue, and date all match)
      for (const [index, [key]] of Object.entries(Object.entries(eventsArr))) {
        let thisEvent = eventsArr[key];
        let thisEventDate = Utilities.formatDate(new Date(thisEvent.date), "PST", "yyyy/MM/dd HH:mm");
        let resultDate = Utilities.formatDate(new Date(results[j].date), "PST", "yyyy/MM/dd HH:mm");
        // if (results[j].venue != thisEvent.venue && results[j].eName != thisEvent.eName) Logger.log("Same venue and name")
        if ((results[j].eName.indexOf(thisEvent.eName) > -1 || thisEvent.eName.indexOf(results[j].eName)) && results[j].venue == thisEvent.venue && thisEventDate == resultDate) {
          Logger.log(results[j].eName+" is already in the list - ignoring");
          exists = true;
        } 
      }
      if (exists === false) {
        Log.Debug(`searchRAMain() - Found new RA event: ${results[j].eName}`);
        newEvents[results[j].date] = {
          date: results[j].date,
          eName: results[j].eName,
          city: results[j].city,
          venue: results[j].venue,
          url: results[j].url,
          image: results[j].image,
          acts: results[j].acts,
          address: results[j].address,
        } 
      }
      exists = false;
    }
  } catch (err) {
    Log.Error(`searchRAMain () error - ${err}`);
    return [];
  }

  Logger.log(JSON.stringify(newEvents));
  return newEvents;
}