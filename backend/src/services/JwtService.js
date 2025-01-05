const jwt = require('jsonwebtoken');

const generalAccessToken = async (payload) => {
    console.log('payload', payload);
    
    const access_token = jwt.sign(
        { payload },
        'access_token', 
        { expiresIn: '1h' }
    );

    return access_token; 
};

const generalRefreshToken = async (payload) => {
    // console.log('payload', payload);
    
    // const refresh_token = jwt.sign(
    //     { payload },
    //     'refresh_token', 
    //     { expiresIn: '7d' }
    // );

    // return refresh_token; 
};

module.exports = {
    generalAccessToken,
    generalRefreshToken
};
