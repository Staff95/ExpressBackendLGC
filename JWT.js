const { sign, verify} = require('jsonwebtoken');

const createTokens = (user) => {
    const accessToken = sign({
        user : user.username,
        id : user._id,
        admin : user.admin
    },
    "SECRET KEY"
    )
    return accessToken;
};

const validateToken = (req, res, next) => {
    const accessToken = req.cookies["access-token"];
    console.log(accessToken);
    if (!accessToken)
        return res.status(400).json({error: "User not autenticated!"});
    try {
        const validToken = verify(accessToken,"SECRET KEY");
        if (validToken){
            req.authenticated = true;
            return next();
        }
    }
    catch(err) {
        return res.status(400).json({error : err});
    }
};

module.exports = {createTokens, validateToken};