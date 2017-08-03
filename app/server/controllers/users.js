User = require('../models').user;

module.exports = {
    //Create a new author using model.create()
    create(req) {
    User.create(req.body)
    },

    //Edit an existing author details using model.update()
    update(req, res) {
    User.update(req.body, {
        where: {
            id: req.params.id
        }
    })
    .then(function (updatedRecords) {
        res.status(200).json(updatedRecords);
    })
    .catch(function (error){
        res.status(500).json(error);
    });
  },

};