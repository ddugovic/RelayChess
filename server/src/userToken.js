var data = require('./data');

function validateUserToken(id)
{
    console.log(id);
    if (id) {
        if (data.sessionCollection.findOne({_id: id}))
            return true;
    }
    return false;
}

module.exports = {
    validateUserToken: validateUserToken
}
