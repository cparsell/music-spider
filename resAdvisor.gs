/**
 * ----------------------------------------------------------------------------------------------------------------
 * Send fetch requests to Resident Advisor - multiple if getting all pages
 * Returns each event combined in one array
 * @param {string} area which page of results to fetch 
 * @param {boolean} getAllPages if false will only return 1 page (18 results max)
 * @returns {array} results [{eventdata}, {eventdata}...]
 */
const getRAData = async (area=218, getAllPages = true) => {
  const pageSize = 18; // 18 is teh max number of results RA will send in one page
  let page = 1;
  let running = 0;
  const url = `https://ra.co/graphql`;
  
  let results = new Array;
  try { 
    let options = returnRAOptions(page, area, queryRAEventListings);
    let response = await UrlFetchApp.fetch(url, options);
    let firstPage = await response.getContentText();
    let responseCode = await response.getResponseCode();
    Log.Info(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);
    if (responseCode == 200 || responseCode == 201) 
    {
      // Log.Debug("results", JSON.parse(firstPage));
      let data = await JSON.parse(firstPage);
      let newData = await data.data.eventListings
      let totalResults = newData.totalResults;

      results.push(...newData.data);
      // Return only one page if that's what's asked for
      if (!getAllPages)
      {
        return results;
      }
      Logger.log("getRAData() - Total results according to API: " + totalResults);
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
      Log.Debug("results", results);
      return results;
    } else {
      throw new Error(`response code ${responseCode} - ${RESPONSECODES[responseCode]}`);
    }
  } catch (err) {
    Log.Error(`getRAData() - Failed to get data from ${url} - ${err}`);
    return [];
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Returns the headers and variables formatted for the API fetch request
 * @param {string} page which page of results to fetch 
 * @param {string} area which locality to search in (see list in resAdv_enums) 
 * @param {string} theQuery optional, defaults to queryRAEventListings if not provided
 * @returns {object} options {filters:{...}, pageSize, page}
 */
const returnRAOptions = (page, area, theQuery=queryRAEventListings) => {
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
    "query": theQuery, 
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
  // try {
    // Fetch all Resident Advisor events in the next 8 months in your region
    let listings = await getRAData(Math.floor(Config.REGION_RA));
    Logger.log("searchRA() - TOTAL events parsed: " + listings.length);
    // Run through each result to see if they match any artists in the Artist Sheet
    for (let i=0; i<listings.length;i++){
      let listing = listings[i]?.event;
      Log.Debug(listing);
      if (listing) {
        let title = listing?.title;
        let acts = [];
        let venue = listing?.venue?.name
        let images = listing?.images;
        let imageUrl = "";
        // Logger.log(title);
        // Logger.log(images.length);
        imageUrl = listing?.images[0]?.filename;
        // listing?.images?.forEach(item => {
        //   if (item.type == "FLYERFRONT") imageUrl = item.filename;
        //   if (item.type == "FLYERFRONT" && title == "Portola Festival 2023") {
        //     imageUrl = item.filename;
        //     Logger.log(imageUrl);
        //   }
        // })
          // imageUrl = images[0].filename;
          // for (let k=0;k<images?.length;k++)
          // {
          //   if (images[k]?.type == "FLYERFRONT") {
          //     imageUrl = images[k]?.filename;
          //     Logger.log(title);
          //     Logger.log(imageUrl);
              
          //   }
          // }
        // } 
        // Logger.log(imageUrl);
        // if there are artists listed, create an array with their names 
        // (most of RA events don't seem to have artists listed here though)
        let artists = listing?.artists;
        if (artists.length > 0) {
          for (let index=0; index<artists.length;index++){
            acts.push(artists[index].name);
          }
        }

        // Logger.log(acts);
        // For each artist in the Artist Sheet, check the result for 
        for (let j=0; j<artistList.length;j++) {
          // check artist against list of acts in this result
          acts.forEach(function(res) {
            if(res.toUpperCase() == artistList[j].toString().toUpperCase()) {
              Log.Debug(`searchRA() - Found a match for artist: ${artistList[j]} in list of acts`);
              let event = {
                date: Utilities.formatDate(new Date(listing.startTime), "PST", "yyyy/MM/dd HH:mm"),
                eName: title,
                city: "",
                venue: venue,
                url: 'https://ra.co' + listing.contentUrl,
                images: imageUrl,
                acts: acts.toString(),
                address: listing.venue.address
              }
              results.push(event);
            } 
          });
          // check artist against title of this result
          if ((title.toString().toUpperCase().indexOf(artistList[j].toString().toUpperCase()) > -1) || (artistList[j].toString().toUpperCase().indexOf(title.toString().toUpperCase()) > -1) ) {
            Log.Debug(`searchRA() - Found a match for artist ${artistList[j]} in title: ${title}`);
            let event = {
              date: Utilities.formatDate(new Date(listing.startTime), "PST", "yyyy/MM/dd HH:mm"),
              eName: title,
              city: "",
              venue: venue,
              url: 'https://ra.co' + listing.contentUrl,
              image: imageUrl,
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
  // } catch (err) {
  //   Log.Error(`searchRA() error - ${err}`);
  //   return [];
  // }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Main handler function for Resident Advisor API
 * Reaches out to RA API to get results, 
 * @param {array} artistsArr the array of artists in the Artists List sheet
 */
const searchRAMain = async (artistsArr) => {
  let newEvents = {};

  // try {
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
        // make sure the date on the sheet and the date in this result are formatted the same, for comparison
        let thisEventDate = Utilities.formatDate(new Date(thisEvent.date), "PST", "yyyy/MM/dd HH:mm");
        let resultDate = Utilities.formatDate(new Date(results[j].date), "PST", "yyyy/MM/dd HH:mm");
        // if the names are the same, the venues are the same, AND the dates are the same then it's considered the same event - and ignores it
        if ((results[j].eName.indexOf(thisEvent.eName) > -1 || thisEvent.eName.indexOf(results[j].eName)) && results[j].venue == thisEvent.venue && thisEventDate == resultDate) {
          Logger.log(`searchRAMain() - ${results[j].eName} is already in the list - ignoring`);
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
  // } catch (err) {
  //   Log.Error(`searchRAMain () error - ${err}`);
  //   return [];
  // }

  Log.Debug(JSON.stringify(newEvents));
  writeEventsToSheet(newEvents);
  return newEvents;
}