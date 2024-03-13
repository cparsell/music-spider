// https://github.com/SethuSenthil/Concert-Ticket-Finder/blob/main/backend/server.js
// API documentation: https://platform.seatgeek.com/

const test_seatGeek = async () => {
  const sdf = await seatGeekTrigger();
  // Log.Info("new events", sdf);
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Get SeatGeek Data
 * Reaches out to SeatGeek API and returns results object
 * @params {array} artistList array of artist names
 * @returns {object} results
 */
const getSeatGeekData = async () => {
  // keyword = "Four Tet";
  const pageSize = 25;
  let results = new Array();
  let page = 1;
  try {
    if (!Config.SEAT_GEEK_CLIENT_ID)
      throw new Error("No Seat Geek Client ID found in Config.gs file");
    if (!Config.SEAT_GEEK_CLIENT_SECRET)
      throw new Error("No Seat Geek Client Secret found in Config.gs file");
    if (!Config.LAT_LONG)
      throw new Error("No Latitude/Longitude found in Config.gs file");
    const AUTH_STRING = `client_id=${Config.SEAT_GEEK_CLIENT_ID}&client_secret=${Config.SEAT_GEEK_CLIENT_SECRET}&`;
    // const AUTH_STRINGNO = `client_id=${Config.SEAT_GEEK_CLIENT_ID}&client_secret=${Config.SEAT_GEEK_CLIENT_SECRET}`;
    // const body = {
    //   // 'postal_code': zipCode,
    //   // 'performers.slug': 'new-york-mets'
    //   'page': 1,
    //   'per_page': 1,
    // }
    let headers = {
      "Access-Control-Allow-Origin": "*",
    };

    let options = {
      // 'method': 'GET',
      // "async": true,
      contentType: "application/json",
      headers: headers,
      // 'payload': JSON.stringify(body),
      muteHttpExceptions: true,
    };
    let unit = "mi";
    if (Config.UNIT == "kilometers") unit = "km";
    // latitude and longitude as saved

    const latlong = Config.LAT_LONG.split(",");
    const lat = latlong[0]; // lat=${encodeURIComponent(lat)}&long=${encodeURIComponent(long)}
    const long = latlong[1]; //geoip=${Config.MY_IP_ADDRESS}
    // let url = `${SEAT_GEEK_EVENTS}?${AUTH_STRING}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(long)}&range=${Config.RADIUS}${unit}&q=${keyword}&per_page=${pageSize}&page=${page}`;
    let url = `${SEAT_GEEK_EVENTS}?${AUTH_STRING}&lat=${lat}&lon=${long}&range=${Config.RADIUS}${unit}&per_page=${pageSize}&page=${page}`;

    const response = await UrlFetchApp.fetch(url, options);
    const firstPage = await response.getContentText();
    const responseCode = await response.getResponseCode();

    Log.Info(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);

    // If response is good
    if (responseCode == 200 || responseCode == 201) {
      // Log.Debug("results", JSON.parse(firstPage));
      let data = await JSON.parse(firstPage);
      // Log.Info("getSeatGeekData() response", data);
      let totalResults = data?.meta?.total;
      Logger.log(`${totalResults} results according to response`);
      if (totalResults == 0) {
        Log.Debug(`getSeatGeekData() - No results for`, keyword);
        return [];
      }
      const newData = await data?.events;
      results.push(...newData);
      const pages = Math.ceil(totalResults / pageSize);

      running = pageSize;
      for (let pg = 2; pg <= pages; pg++) {
        // Logger.log('getting page ' + pg);
        let pgSize = pageSize;
        page = pg;
        // let options = returnRAOptions(page, area);
        if (totalResults - running < pageSize) pgSize = totalResults - pg;
        running += pgSize;

        // url = `${SEAT_GEEK_EVENTS}?${AUTH_STRING}geoip=${Config.MY_IP_ADDRESS}&range=${Config.RADIUS}${unit}&q=${keyword}&per_page=${pageSize}&page=${page}`;

        // url = `${SEAT_GEEK_EVENTS}?${AUTH_STRING}geoip=${Config.MY_IP_ADDRESS}&range=${Config.RADIUS}${unit}&per_page=${pageSize}&page=${page}`;
        url = `${SEAT_GEEK_EVENTS}?${AUTH_STRING}&lat=${lat}&lon=${long}&range=${Config.RADIUS}${unit}&per_page=${pageSize}&page=${page}`;

        nextPage = await UrlFetchApp.fetch(url, options).getContentText();
        let nextPageParsed = await JSON.parse(nextPage).events;
        // Logger.log(nextPageParsed);
        let newEvents = nextPageParsed?.data?.events;
        // Log.Info("nextPageParsed", nextPageParsed);
        results.push(...nextPageParsed);
      }
      // Log.Info("getSeatGeekData() results", results);
      return results;
    }
    return [];
  } catch (err) {
    Log.Error(`getSeatGeekData() error = ${err}`);
    return [];
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Search SeatGeek for a keyword
 * @params {array} artistList array of artist names
 * @returns {object} results
 */
const searchSeatGeek = async (artistList) => {
  // keyword = "Four Tet"; // for testing
  if (!artistList) artistList = artistsList();
  // Get existing list of events from events sheet

  let results = new Array();

  try {
    // search for artist name, returns an array of event objects
    await getSeatGeekData()
      // process results to find matches
      .then(async (data) => {
        // let results = await getSeatGeekData(keyword);
        // Log.Info("searchSeatGeek() results", data);
        // Log.Info('# of results', data.length);
        Logger.log(`${data.length} results parsed`);
        if (data.length == 0) {
          Log.Debug(`No results for`, keyword);
          return [];
        }
        for (let i = 0; i < data.length; i++) {
          let event = data[i];
          // Log.Info("event result", event);
          let eName = event?.title;
          // Logger.log("datetime_utc " + event.datetime_utc);
          // Logger.log("datetime_local " + event.datetime_local);
          let date = Utilities.formatDate(
            new Date(event.datetime_local),
            "PST",
            "yyyy/MM/dd HH:mm"
          );
          // Logger.log(date);
          let url = event?.url;
          // let image = event.images.huge;
          let venue = event?.venue?.name_v2;
          let city = event?.venue?.city;
          let address = event?.venue?.address;
          let acts = new Array();
          for (let index = 0; index < event?.performers?.length; index++) {
            acts.push(event.performers[index].name);
          }

          let newEvent = {
            date: date,
            eName: eName,
            city: city,
            venue: venue,
            url: url,
            image: "",
            acts: acts.toString(),
            address: address,
          };
          // Compare list of acts in this result against your list of Artists
          // If
          for (let j = 0; j < artistList.length; j++) {
            // check artist against list of acts in this result
            for (let index = 0; index < acts.length; index++) {
              let res = acts[index];

              if (
                res.toUpperCase() === artistList[j].toString().toUpperCase()
              ) {
                Log.Info(
                  `searchSeatGeek() - Found a match for artist: ${artistList[j]} in list of acts - event name: ${eName}`
                );
                let img = event.performers[index].image;
                let biggerImg = img.split("huge").join("1500x2000");
                newEvent.image = biggerImg;
                results.push(newEvent);
                break;
              }
            }
            // check artist against title of this result
            // if ((title.toString().indexOf(artistList[j].toString()) > -1) || (artistList[j].toString().indexOf(title.toString()) > -1) ) {
            //   Log.Info(`searchSeatGeek() - Found a match for artist ${artistList[j]} in title: ${title}`);
            //   results.push(newEvent);
            // }
          }
        }
      });
  } catch (err) {
    Log.Error(`SearchSeatGeek() error - ${err}`);
    return [];
  }
  return results;
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Main loop for searching SeatGeek for all artists in the Artists sheets
 * Should be run by seatGeekTrigger
 * @params {array} artistsArr array of artist names
 * @params {array} existingEvents array of event objects [{eName: "sdf", date: '12/23/2023 9:00"...}]
 */
const searchSeatGeekLoop = async (artistsArr, existingEvents) => {
  try {
    if (!artistsArr) throw new Error("Missing artistsArr argument");
    if (!existingEvents) throw new Error("Missing existingEvents argument");

    let eventsArr = new Array();
    // try {
    for (let i = 0; i < artistsArr.length; i++) {
      await searchSeatGeek(artistsArr[i], artistsArr).then((data) => {
        for (let i = 0; i < data.length; i++) {
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
      });
      Utilities.sleep(100);
    }

    return eventsArr;
  } catch (e) {
    Log.Error(`searchSeatGeekLoop() error: ${e}`);
    return [];
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Search SeatGeek for a keyword
 * Can be started by a trigger in Gooogle Apps Script
 * By default it is run by the main RefreshEvents function in Code.gs
 *
 * @params {array} artistList array of artist names
 * @returns {object} results
 */
const seatGeekTrigger = async (artistsArr) => {
  let trigger = new Array();
  if (Config.SEARCH_SEAT_GEEK) {
    if (!artistsArr) {
      artistsArr = artistsList();
      trigger.push(true);
    }
    let existingEvents = buildEventsArr();
    // Return list of events in vicinity
    let results = await searchSeatGeek(artistsArr);

    // get rid of any results that are already on the Events Sheet
    let newEvents = filterDupeEvents(results, existingEvents);
    let altEvents = filterAltEvents(results, existingEvents);

    Log.Debug("seatGeekTrigger() - New SeatGeek events", newEvents);

    // If this triggered on its ow (not in RefreshEvents), write events to Sheet and calendar
    if (trigger.length > 0) {
      writeEventsToSheet(results);

      // Write Calendar Event for new events
      if (Config.CREATE_CALENDAR_EVENTS) createCalEvents(results);
    }

    return { newEvents: newEvents, altEvents: altEvents };
  }
  Log.Info(
    "seatGeekTrigger() started but Music Spider is not configured to search SeatGeek. Skipping."
  );
};
