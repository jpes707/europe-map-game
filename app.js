#!/usr/bin/nodejs

const express = require('express');
const app = express();

app.use(express.static('public'));
app.use(express.static('files'));

const fs = require('fs');
const path = require('path');
const hbs = require('hbs');

var questions = [];

fs.readFile('files/questions.txt', 'utf8', (err, contents) => {
	parseMe = contents.split('\n');
	parseMe.forEach((item) => {
		items = item.split(':');
		parseAnswers = items[1].split(',');
		answers = [];
		parseAnswers.forEach((answer) => {
			answers.push(answer.trim());
		});
		questions.push([items[0], answers]);
	});
});

var cookiesToUser = {
    /*'default0': {
		name: 'Zeeeardy',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 9
	},
	'default1': {
		name: 'CupcakesAreAlive',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 16
	},
	'default2': {
		name: 'betacurdlefish',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 27
	},
	'default3': {
		name: 'HawkinsLab',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 39
	},
	'default4': {
		name: 'Ford_Fiesta',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 41
	},
	'default5': {
		name: 'joshuapickens0',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 57
	},
	'default6': {
		name: '__elysian',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 60
	},
	'default7': {
		name: 'UhhDizzy',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 72
	},
	'default8': {
		name: 'FrostyMagician',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 86
	},
	'default9': {
		name: 'unmotiivated',
		currentQuestionId: Math.floor(Math.random() * questions.length),
		score: 96
	}*/
};

let getCookie = (name, cookies) => {
	if (!cookies) {
		return null;
	}

	var cookieArr = cookies.split(";");
	for (var i = 0; i < cookieArr.length; i++) {
		var cookiePair = cookieArr[i].split("=");
		if (name == cookiePair[0].trim()) {
			return decodeURIComponent(cookiePair[1]);
		}
	}
	return null;
};

let verifyNoIncrement = (req, res, next) => {
	res.locals.guest = false;

	if (!getCookie('europe-map-game-auth', req.headers.cookie) || !(getCookie('europe-map-game-auth', req.headers.cookie) in cookiesToUser)) {
		res.redirect('https://europemapgame.sites.tjhsst.edu/');
		return;
	} else if (cookiesToUser[getCookie('europe-map-game-auth', req.headers.cookie)].guest) {
		if (cookiesToUser[getCookie('europe-map-game-auth', req.headers.cookie)].guestPageCount > 5) {
			res.render('forcelogin');
			return;
		} else {
			res.locals.guest = true;
		}
	}

	next();
};

let verify = (req, res, next) => {
	res.locals.guest = false;

	if (!getCookie('europe-map-game-auth', req.headers.cookie) || !(getCookie('europe-map-game-auth', req.headers.cookie) in cookiesToUser)) {
		res.redirect('https://europemapgame.sites.tjhsst.edu/');
		return;
	} else if (cookiesToUser[getCookie('europe-map-game-auth', req.headers.cookie)].guest) {
		if (cookiesToUser[getCookie('europe-map-game-auth', req.headers.cookie)].guestPageCount > 5) {
			res.render('forcelogin');
			return;
		} else {
			cookiesToUser[getCookie('europe-map-game-auth', req.headers.cookie)].guestPageCount++;
			res.locals.guest = true;
		}
	}

	next();
};

app.get('/', (req, res) => {
	if (getCookie('europe-map-game-auth', req.headers.cookie) && (getCookie('europe-map-game-auth', req.headers.cookie) in cookiesToUser) && !cookiesToUser[getCookie('europe-map-game-auth', req.headers.cookie)].guest) {
		res.render('europe');
	} else if (req.query.name) {
		user = {
			name: req.query.name,
			currentQuestionId: Math.floor(Math.random() * questions.length),
			score: 0
		};
		
		do {
            access_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        } while (access_token in cookiesToUser);

		cookiesToUser[access_token] = user;
		res.cookie('europe-map-game-auth', access_token);

		res.redirect('/');
	} else {
	    res.render('username');
	}
});

app.get('/logout', (req, res) => {
    res.clearCookie('europe-map-game-auth');
    res.redirect('/');
});

function getQuestion(id) {
	return questions[id][0];
}

function checkAnswer(id, answer) {
	return questions[id][1].includes(answer);
}

function getTopPlayers() {
	topPlayers = [];
	for (var cookie in cookiesToUser) {
		if (!cookiesToUser[cookie].guest) {
			topPlayers.push([cookiesToUser[cookie].score, cookiesToUser[cookie].name + ' (' + cookiesToUser[cookie].score + ' points)']);
		}
	}

	topPlayers.sort((first, second) => {
		return second[0] - first[0];
	});

	topNames = [];
	for (n = 0; n < Math.min(10, topPlayers.length); n++) {
		topNames.push(topPlayers[n][1]);
	}

	return topNames;
}

app.get('/map_worker', (req, res) => {
	const cookie = getCookie('europe-map-game-auth', req.headers.cookie);

	if (!cookie || !(cookie in cookiesToUser)) {
		res.send(['You are not authenticated. Please visit the main page to log in.', 0]);
	}

	if (req.query.choice) {
		if (checkAnswer(cookiesToUser[cookie].currentQuestionId, req.query.choice)) {
			cookiesToUser[cookie].currentQuestionId = Math.floor(Math.random() * questions.length);
			cookiesToUser[cookie].score++;
		} else {
			cookiesToUser[cookie].score--;
		}
	}
    
    console.log(cookiesToUser);
    res.send([getQuestion(cookiesToUser[cookie].currentQuestionId), cookiesToUser[cookie].score, getTopPlayers(), questions[cookiesToUser[cookie].currentQuestionId][1]]);
});

app.set('port', process.env.PORT || 8080);
app.set('view engine', 'hbs');
app.get('*', function (req, res) {
	res.status(404).send('Page not found.');
});

let listener = app.listen(app.get('port'), () => {
	console.log('Express server started on port: ' + listener.address().port);
});
