const addressLookup = async (address) => {
  // https://maps.googleapis.com/maps/api/place/details/json
  // &fields=address_components
  // &key=YOUR_API_KEY
  const url = 'https://maps.googleapis.com/maps/api/place/details/json';


  let results = new Array;
  try { 
    // build the headers for the fetch request
    let options = returnRAOptions(page, area, queryRAEventListings);
    // Fetch from the API
    let response = await UrlFetchApp.fetch(url, options);
    let firstPage = await response.getContentText();
    let responseCode = await response.getResponseCode();
    Log.Info(`Response Code ${responseCode} - ${RESPONSECODES[responseCode]}`);
    // If response is good 
    if (responseCode == 200 || responseCode == 201) 
    {
      // Log.Debug("results", JSON.parse(firstPage));
      let data = await JSON.parse(firstPage);
      let newData = await data.data.eventListings
      let totalResults = newData.totalResults;
      results.push(...newData.data);
    }
  } catch (err) {
    Log.Error(`getRAData() - Failed to get data from ${url} - ${err}`);
    return [];
  }
  return results;
}
