function createUserToken(user, signature)
{
    //create token from the hash name and expire date
    //note this isn't the secure (Twitch) token but simply a convenience
    var token = {
        name: user.name,
        displayName: user.displayName,
        expire: Date.now(),
        signature: signature // twitch token
    };
    return token;
}

function validateUserToken(token)
{
    try{
        var url = "https://api.twitch.tv/kraken?oauth_token=" + token.signature;
        $.getJSON(url, function(data) {
            return (token.name == data.token.user_name);
        });
        return false;
    }
    catch(ex)
    {
        return false;
    }
}

module.exports = {
    createUserToken: createUserToken,
    validateUserToken: validateUserToken
};
