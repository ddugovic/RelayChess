function validateUserToken(token)
{
    try{
        //var url = "https://api.twitch.tv/kraken?oauth_token=" + token.signature;
        //$.getJSON(url, function(data) {
        //    return (token.name == data.token.user_name);
        //});
        return false;
    }
    catch(ex)
    {
        return false;
    }
}

module.exports = {
    validateUserToken: validateUserToken
}
