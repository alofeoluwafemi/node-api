const handlers = require('./handlers');

var router = {
    notFound: handlers.notFound,
    users: handlers.users,
    tokens: handlers.tokens,
}

module.exports = router;