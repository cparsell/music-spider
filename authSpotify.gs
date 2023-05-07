const baseAuthUrl = "https://accounts.spotify.com";
const authUrl = baseAuthUrl + "/authorize";
const refreshUrl = baseAuthUrl + "/api/token";

const scope = "user-library-read playlist-read-private playlist-read-collaborative user-top-read user-follow-read";

const doGet = (e) => 
{
    if (e.parameter.error)
    {
        var template = HtmlService.createTemplateFromFile("auth_error");
        template.errorText = e.parameter.error;

        return template.evaluate();
    }
    else if (!e.parameter.code)
    {
        return HtmlService.createTemplateFromFile("auth_steps").evaluate();
    }

    // Retrieve refreshable auth with auth code
    // Then store it for later
    var authInfo = getFreshAuth(e.parameter.code);
    storeAuth(authInfo);

    return HtmlService.createTemplateFromFile("auth_success").evaluate();
}

const generateAuthUrl = () =>
{
    // Generate URL for requesting authorization
    // Using Authorization Code Flow
    var url = ScriptApp.getService().getUrl();
    var params = "?response_type=code&client_id=" + config.clientIdSpotify
        + "&scope=" + scope + "&redirect_uri=" + url;

    return authUrl + encodeURI(params);
}

const getFreshAuth = (code) =>
{
    // Retrieve refreshable auth info
    // const writer = new WriteLogger();
    // Request refresh token
    var payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": ScriptApp.getService().getUrl(),
        "client_id": config.clientIdSpotify,
        "client_secret": config.clientSecretSpotify,
    };

    var options = {
        'method': 'post',
        'Content-Type': 'application/json',
        'payload': payload
    };

    var response = UrlFetchApp.fetch(refreshUrl, options);

    // Grab the values we're looking for and return them
    var newTokens = JSON.parse(response.getContentText());
    var authInfo = new Object();

    authInfo.accessToken = newTokens.access_token;
    authInfo.refreshToken = newTokens.refresh_token;
    Logger.log(`Token: ${authInfo.accessToken}`);
    // writer.Info(`Token: ${authInfo.accessToken}`);
    var now = Date.now() / 1000;
    authInfo.expiry = now + newTokens.expires_in;
    return authInfo;
}

const refreshAuth = (refreshToken) => 
{
    // Refresh auth info with refresh token

    // Request refreshed tokens
    var payload = {
        "grant_type": "refresh_token",
        "refresh_token": refreshToken,
        "client_id": config.clientIdSpotify,
        "client_secret": config.clientSecretSpotify,
    };

    var options = {
        'method': 'post',
        'Content-Type': 'application/json',
        'payload': payload
    };

    var response = UrlFetchApp.fetch(refreshUrl, options);

    // Grab the values we're looking for and return them
    var newTokens = JSON.parse(response.getContentText());
    var authInfo = new Object();

    authInfo.accessToken = newTokens.access_token;
    if (newTokens.refresh_token)
    {
        authInfo.refreshToken = newTokens.refresh_token;
    }
    var now = Date.now() / 1000;
    authInfo.expiry = now + newTokens.expires_in;
    return authInfo;
}

const storeAuth = (authInfo) =>
{
    // Retrieve refreshable auth info from user properties store
    var userProperties = PropertiesService.getUserProperties();

    // Save the new auth info back to the user properties store
    userProperties.setProperties(authInfo);
}

const retrieveAuth = async () => 
{
    // Retrieve refreshable auth info from user properties store
    var userProperties = PropertiesService.getUserProperties();
    var authInfo = userProperties.getProperties();

    // Check if auth info is there
    if (!authInfo.hasOwnProperty("refreshToken") ||
        !authInfo.hasOwnProperty("accessToken"))
    {
        // First-time auth missing.
        // Needs to be manually authorised.
        throw "No access/refresh token. You need to deploy & run first-time authentication.";
    }

    // Check if the auth token has expired yet
    var now = Date.now() / 1000;
    if (now > authInfo.expiry)
    {
        // Refresh the auth info
        Logger.log("Access token expired. Refreshing authentication...");
        // writer.Info("Access token expired. Refreshing authentication...");
        authInfo = refreshAuth(authInfo.refreshToken);

        // Save the new auth info back to the user properties store
        userProperties.setProperties(authInfo);
    }

    // Return just what we need for retrieving data
    return authInfo.accessToken;
}


