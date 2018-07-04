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
    getById(id) {
        return this.users.filter((user) => user.id === +id)[0];
    }
    all(parentAgentId) {
        if (parentAgentId) {
            return this.users.filter(user => user.parentAgentId === +parentAgentId);
        } else {
            return this.users;
        }
    }
    getByTitle(title) {
        if (title) {
            return this.users.filter(v => v.title.toLowerCase().indexOf(title.toLowerCase()) > -1).slice(0, 10);
        } else {
            return [];
        }
    }
};

