const User = require('../models').user;

module.exports = {
	// Create a new author using model.create()
	create_user(session) {
	// console.log(session.dialogData.fullName);
		User.create({
			name: session.dialogData.fullName,
			email: session.dialogData.email,
			birth_date: session.dialogData.birthDate,
			state: session.dialogData.state,
			city: session.dialogData.city,
			cellphoneNumber: session.dialogData.cellphoneNumber,
			occupation: session.dialogData.occupation,
		});
		// console.log(tx);
	},

	// Edit an existing author details using model.update()
	update(req, res) {
		User.update(req.body, {
			where: {
				id: req.params.id,
			},
		})
			.then((updatedRecords) => {
				res.status(200).json(updatedRecords);
			})
			.catch((error) => {
				res.status(500).json(error);
			});
	},

};
