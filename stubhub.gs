const STUBHUB_BASE_URL = 'https://api.stubhub.com';
const STUBHUB_EVENTS = STUBHUB_BASE_URL + '/catalog/events/v2/';
const STUBHUB_SEARCH_EVENTS = STUBHUB_BASE_URL + "/search/catalog/events/v2";
const STUBHUB_LOGIN = STUBHUB_BASE_URL + "/login";
const STUBHUB_SEARCH_INVENTORY = STUBHUB_BASE_URL + "/search/inventory/v1";
// https://github.com/jmickela/python-stubhub/blob/master/stubhub/client.py
// https://developer.stubhub.com/
// https://developer.viagogo.net/docs/overview/introduction

// StubHub seems to be only partially public
// There is no obvious way to create a client ID / client secret
// Apparently they might have disabled this in 2022 according to the internet?
// Maybe email api.support@stubhub.com
const getStubHubData = async () => {
  const accessToken = await retrieveAuth();

  app_token = 'blahblah';
  consumer_key = 'blahblah';
  consumer_secret = 'blahblah';

  let headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + configs.app_token,
    'Accept': 'application/json',
    'Accept-Encoding': 'application/json'
  }
}



const refreshAuthStubHub = async () => {
  // get new access token
  const CLIENT_ID_STUBHUB = "";
  const CLIENT_SECRET_STUBHUB = ""; // URL e
  
  let auth = Utilities.base64Encode(`${CLIENT_ID_STUBHUB}:${CLIENT_SECRET_STUBHUB}`);

  let url = 'https://account.stubhub.com/oauth2/token';
  // 

  let payload = {
    "grant_type": "client_credentials",
    "scope": "read:events",
    // "code": code,
    // "redirect_uri": ScriptApp.getService().getUrl(),
    "client_id": CLIENT_ID_STUBHUB,  // URL encode these
    "client_secret": CLIENT_SECRET_STUBHUB,
  };

  let options = {
    'method': 'post',
    'Authorization': 'Basic ' + auth,
    'Content-Type': 'application/x-www-form-urlencoded',
    'payload': payload
  };

  let response = UrlFetchApp.fetch(url, options);
}