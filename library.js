'use strict';

var db = module.parent.require('./database'),
	colorifyTopics = {},
	defaultGroup = ['Bucket'],
	allowedGroups = defaultGroup;

//Retieve database and get information or create
db.getObject('plugins:topic-color', function (err, data) {
	if (data) {
		allowedGroups = data.allowedGroups || data.defaultGroup;
	}
});

//Build admin render
function render(res, next, loc) {
	db.getObject('plugins:topic-color', function (err, data) {
		if (err) {
			return next(err);
		}
		if (!data) {
			data = { allowedGroups : defaultGroup };
		}
		res.render(loc, data);
	});
}

function renderAdmin(req, res, next) {
	render(res, next, 'admin/plugins/topic-color');
}

function renderFront(req, res, next) {
	render(res, next, '/plugins/topic-color');
}

//Create the save function
function save(req, res, next) {
	var data = { allowedGroups : req.body.allowedGroups };

	db.setObject('plugins:topic-color', data, function (err) {
		if (err) {
			return res.json(500, 'Error while saving settings');
		}

		res.json('Settings successfully saved');
	});

}

//Init plugin
colorifyTopics.init = function (router, middleware, controllers, callback) {
	router.get('/admin/plugins/topic-color', middleware.admin.buildHeader, renderAdmin);
	router.get('/api/admin/plugins/topic-color', renderAdmin);
	router.get('/api/plugins/topic-color', renderFront);
	router.post('/api/admin/plugins/topic-color/save', save);
	callback();
};

//Build admin menu item.
colorifyTopics.admin = {
	menu: function (custom_header, callback) {
		custom_header.plugins.push({
			'route': '/plugins/topic-color',
			'icon': 'fa-tint',
			'name': 'Colorify Topics'
		});
		callback(null, custom_header);
	}
};

module.exports = colorifyTopics;