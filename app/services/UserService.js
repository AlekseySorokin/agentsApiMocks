module.exports = class UserService {
	constructor(mock) {
        if(!mock) {
            this.users = [];
        } else {
            this.users = require(`./../mocks/${mock}`);
        }
    }

    add(user) {
        this.users.push(user);
    }
    getByUsername(username) {
        return this.users.filter((user) => user.username === username)[0];
    }
    all() {
        return this.users;
    }
};

