module.exports = class User {
	constructor(user) {
		this.id = user.id;
		this.title = user.title;
		this.username = user.username;
		this.password = user.password;
		this.parentAgentId = user.parentAgentId;
		this.balance = user.balance || 0;
	}
};

