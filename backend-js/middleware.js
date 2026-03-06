const axios = require('axios')


module.exports = {
  validateToken: function(req, res, next){
    const header = req.headers.authorization.split(' ')[1]
    try{
      return axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${header}`).then(resp => {
        if(resp.status === 200) {
          console.log(resp.data);
          
          req.params.email = resp.data.email
          next()
        }
      }).catch(_ => {
        res.status(401).send('unauthenticated')
      })
    }catch(err){
      res.status(401).send('unauthenticated')
    }
  }  
}
