(function () {
    'use strict';
	/*global socket, RELATIVE_PATH, ajaxify, utils*/
    //TODO: known issue: /home preview post of a non-valid-user on a valid-topic

    var allowedGroups = getAllowedGroups(),
        allGroups = getAllGroups(),
        regColor = /%\((#(?:[A-Fa-f0-9]{3}(?:[A-Fa-f0-9]{3})?)|(?:rgb\(\d{1,3},\d{1,3},\d{1,3}\))|(?:[a-z]){3,})\)\[(.+?)\]/g;

    //--- Event handlers ---
    $(document).ready(watchNotifications);
    $(window).on('action:ajaxify.end', fetchTopics);
    $(window).on('action:widgets.loaded', fetchWidgets);
    socket.on('event:post_edited', watchEditedTopics);

    function watchNotifications() {
        var notifications = document.querySelector('.notifications');

        if (notifications) {
            notifications.addEventListener('click', fetchNotifications, false);
        }
    }

    function fetchTopics() {
        //Change Breadcrumb
        parseColor(document.querySelector('ol.breadcrumb li.active span'), false);
        //Change document title
        parseColor(document.querySelector('title'), false);

        //Change header information
        //TODO: fix this.
        // parseColor(document.querySelector('.header-topic-title.hidden-xs span'), false);
        document.querySelector('.header-topic-title.hidden-xs').innerHTML = '';

        $.getJSON(RELATIVE_PATH + '/api/' + ajaxify.currentPage, traverse);
    }

    function watchEditedTopics() {
        setTimeout(fetchTopics, 270);
    }

    //--- Helper functions ---
    function getAllowedGroups() {
        $.getJSON(RELATIVE_PATH + '/api/plugins/topic-color', function (data) {
            allowedGroups = JSON.parse(data.allowedGroups);
        });
    }

    function getAllGroups() {
        $.getJSON(RELATIVE_PATH + '/api/groups/', function (groupsData) {
            allGroups = groupsData.groups;
        });
    }

    function traverse(o) {
        var i;

        if (o && o.hasOwnProperty('tid')) {
            return filterTopic(o);
        }

        for (i in o) {
            if (typeof (o[i]) === "object") {
                traverse(o[i]);
            }
        }
    }

    //--- Main colorify ---
    function filterTopic(topic) {
        allGroups.some(function (group) {
            var isInGroup = group.members.some(function (member) {
                    //The username comparison (when no userid <directly> accessible) can gives
                    //unexpected result if 2 members have the same username (not possible yet).
                    return topic.uid === member.uid || topic.uname === member.username;
                }),
                canColor = isInGroup && allowedGroups.indexOf(group.name) !== -1;

            return colorifyTopic(topic, canColor) && canColor;
        });
    }

    function colorifyTopic(topic, canColor) {
        //change topic title on home
        parseColor(document.querySelector('.post-preview a[href^="/topic/' + topic.tid + '/"]'), canColor);
        //change topic title on widget last topic
        parseColor(document.querySelector('#recent_topics li a[href^="/topic/' + topic.tid + '/"]'), canColor);
        //Change topic title on topic list
        parseColor(document.querySelector('.category-item[data-tid="' + topic.tid + '"] .topic-title'), canColor);
        //Change topic title on topic
        parseColor(document.querySelector('#topic_title_' + topic.mainPid), canColor);
    }

    function parseColor(title, canColor) {
        if (title !== null) {
            if (title.textContent.match(regColor)) {
                title.innerHTML = title.innerHTML.replace(regColor, canColor ? '<font style="color:$1">$2</font>' : '$2');

                if (title.href !== undefined) {
                    title.href = title.href.replace(/(\/topic\/\d*\/).*/, '$1' + utils.slugify(title.textContent.replace(regColor, '$2')));
                }
            }
        }
    }

    function fetchNotifications() {
        //Delay may vary and exceeds 20ms. We check repeatidly until notifications are loaded.
        var intervalId = setInterval(function () {
            if (!document.querySelector('#notif-list .fa-spin')) {
                clearInterval(intervalId);
                $('#notif-list .text').each(function () {
                    parseColor(this, false);
                });
            }
        }, 20);
    }

    function fetchWidgets() {
        setTimeout(function () {
            $('#recent_topics li').each(function () {
                var topic = {};
                topic.uname = this.querySelector('img').dataset.originalTitle;
                topic.tid = this.querySelector('p a').pathname.substring(7, this.querySelector('p a').pathname.indexOf('/', 7));

                filterTopic(topic);
            });
        }, 200);
    }
}());