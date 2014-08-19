(function () {
    'use strict';
    /*global socket, RELATIVE_PATH, ajaxify, utils*/

    var allowedGroups = getAllowedGroups(),
        allGroups = getAllGroups(),
        regColor = /%\((#(?:[A-Fa-f0-9]{3}(?:[A-Fa-f0-9]{3})?)|(?:rgb\(\d{1,3},\d{1,3},\d{1,3}\))|(?:[a-z]){3,})\)\[(.+?)\]/g;

    //--- Event handlers ---
    $(document).ready(watchNotifications);
    $(window).on({'action:ajaxify.end': fetchTopics, 'action:widgets.loaded': fetchWidgets});
    socket.on('event:post_edited', watchEditedTopics);

    function watchNotifications() {
        var notifications = document.querySelector('.notifications');

        if (notifications) {
            notifications.addEventListener('click', fetchNotifications, false);
        }
    }

    function fetchTopics() {
        //Change Breadcrumb, document title.
        parseColor($('.breadcrumb .active span, title'), false);
        //Remove title on scrolled header.
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
        $.getJSON(RELATIVE_PATH + '/api/groups/', function (data) {
            allGroups = data.groups;
        });
    }

    function traverse(o) {
        var i;

        if (o && o.hasOwnProperty('title')) {
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
        var canColor;

        allGroups.some(function (group) {
            var isInGroup = group.members.some(function (member) {
                    //The username comparison (when no userid <directly> accessible) can gives
                    //unexpected result if 2 members have the same username (not possible yet).
                    return topic.uid === member.uid || topic.uname === member.username;
                });

            canColor = isInGroup && allowedGroups.indexOf(group.name) !== -1;

            return canColor;
        });

        //Change topic title on home, last topic widget, topic list, topic page.
        parseColor($('.post-preview a[href^="/topic/' + topic.tid + '/"], #recent_topics a[href^="/topic/' + topic.tid +
                    '/"], .category-item[data-tid="' + topic.tid + '"] .topic-title, #topic_title_' + topic.mainPid), canColor);
    }

    function parseColor(title, canColor) {
        if (title !== null) {
            title.each(function () {
                if (this.textContent.match(regColor)) {
                    this.innerHTML = this.innerHTML.replace(regColor, canColor ? '<font style="color:$1">$2</font>' : '$2');

                    if (this.href !== undefined) {
                        this.href = this.href.replace(/(\/topic\/\d+\/).*/, '$1' + utils.slugify(this.textContent.replace(regColor, '$2')));
                    }
                }
            });
        }
    }

    function fetchNotifications() {
        //Delay may vary and exceeds 20ms. We check repeatidly until notifications are loaded.
        var intervalId = setInterval(function () {
            if (!document.querySelector('#notif-list .fa-spin')) {
                clearInterval(intervalId);
                $('#notif-list .text').each(function () {
                    parseColor($(this), false);
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