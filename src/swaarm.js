window._Swaarm = {
    getQueryParams: function (qs) {
        qs = qs.split('+').join(' ');

        var params = {},
            tokens,
            re = /[?&]?([^=]+)=([^&]*)/g;

        while (tokens = re.exec(qs)) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        }

        return params;
    },

    setCookie: function (name, value, hours) {
        var expires = "";
        if (hours) {
            var date = new Date();
            date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    },

    getCookie: function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    SWAARM_CLICK_ID_NAME: "swaarm_clkid",
    DEBUG: false,

    log: function (message) {
        if (!this.DEBUG) {
            return;
        }
        console.log("[SWWARM#SDK] " + message);
    },

    emitEvent: function (clkid, options) {
        var url = this.trackingUrl + "postback?click_id=" + clkid;
        if (options == null) {
            options = {}
        }
        for (var prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop) && options[prop] != null) {
                url += "&" + prop + "=" + options[prop];
            }
        }


        this.sendRequest(url);
    },

    sendRequest: function (url, callback, parseData) {
        this.log("Requesting " + url)
        var oReq = new XMLHttpRequest();
        var self = this;
        oReq.addEventListener("load", function () {
            self.log("Request to " + url + " sent successfully.")
        });
        oReq.onreadystatechange = function (event) {
            if (oReq.readyState === 4 && oReq.status === 200) {
                var data = oReq.responseText;
                if (parseData === true) {
                    data = JSON.parse(oReq.responseText)
                }
                if (callback != null) {
                    callback(data);
                }
            }
        }
        oReq.open("GET", url);
        oReq.send();
    },

    validateInit: function () {
        if (!this.configured) {
            throw new Error("You need to configure the Swaarm by calling Swaarm.initialize before using it.")
        }
    },

    initialize: function (trackingUrl) {
        if (trackingUrl == null || !trackingUrl.startsWith("http")) {
            throw new Error("Invalid tracking url received: " + trackingUrl)
        }
        if (trackingUrl.slice(-1) !== '/') {
            trackingUrl = trackingUrl + '/';
        }
        this.trackingUrl = trackingUrl
        this.configured = true;
    },

    enableDebug: function () {
        this.DEBUG = true;
    },

    land: function () {
        this.validateInit();
        var params = this.getQueryParams(window.location.search);
        if (params.clkid == null) {
            this.log("No clkid found.")
            return;
        }
        this.log("Saving clkid " + params.clkid + ".");
        window.localStorage.setItem(this.SWAARM_CLICK_ID_NAME, params.clkid);
        this.setCookie(this.SWAARM_CLICK_ID_NAME, params.clkid, 168);
    },

    click: function () {
        this.validateInit();
        var queryString = window.location.search;
        this.sendRequest(this.trackingUrl + "click" + queryString);
    },

    adDetails: function (offerId, publisherId, callback) {
        this.validateInit();
        var queryString = window.location.search;
        if (offerId != null && publisherId != null) {
            queryString = "offer_id=" + offerId + "&pub_id" + publisherId;
        }
        this.sendRequest(this.trackingUrl + "ad" + queryString, callback, true);
    },

    replaceMarkedLinks: function (selector, prelandingOffer, prelandingPub) {
        var realSelector = selector == null ? "a" : selector;
        var self = this;
        this.adDetails(null, null, function (data) {
            var advTrackingUrl = data['advertiserTrackingUrl'];
            var clickUrl = data['clickTrackingUrl'] + "&no_redirect=true";
            var impressionUrl = data['impressionTrackingUrl'] + "&no_redirect=true";
            if (prelandingOffer == null) {
                self.sendRequest(impressionUrl)
            } else {
                self.sendRequest(self.trackingUrl + 'click?offer_id=' + prelandingOffer + '&pub_id=' + prelandingPub + "&no_redirect=true")
            }
            var elementsMatched = document.querySelectorAll(realSelector);
            elementsMatched.forEach((e) => {
                e.href = advTrackingUrl;
                e.addEventListener('click', function () {
                    self.sendRequest(clickUrl, function () {
                        document.location.href = advTrackingUrl;
                    });
                })
            })

        })
    },

    impression: function () {
        this.validateInit();
        var queryString = window.location.search;
        this.sendRequest(this.trackingUrl + "impression" + queryString);
    },
    fetch: function () {
        this.validateInit();
        var queryString = window.location.search;
        this.sendRequest(this.trackingUrl + "impression" + queryString);
    },
    getClickId: function () {
        var clickId = window.localStorage.getItem(this.SWAARM_CLICK_ID_NAME);
        if (clickId == null) {
            clickId = this.getCookie(this.SWAARM_CLICK_ID_NAME);
        }
        return clickId;
    },

    attribute: function () {
        this.event(null);
    },

    event: function (options) {
        this.validateInit();
        var clickId = this.getClickId();
        if (clickId == null) {
            this.log("No clickid found. Organic attribution.");
            return;
        }
        this.emitEvent(clickId, options);
    }
}

window.Swaarm = {
    /**
     * Initializes the Swaarm SDK
     * @param settings a JS object that has the following properties:
     *  - trackingUrl string, the base domain URL for your Swaarm account, e.g. https://track.mycompany.swaarm-clients.com
     *  - debug boolean, to indicate if we should log debugging information
     */
    initialize: function (settings) {
        window._Swaarm.initialize(settings.trackingUrl);
        if (settings.debug) {
            window._Swaarm.enableDebug();
        }
    },

    replaceMarkedLinks: function (selector, prelandingOffer, prelandingPub) {
        window._Swaarm.replaceMarkedLinks(selector, prelandingOffer, prelandingPub);
    },

    /**
     * Registers this user as a potential converting user. This method should be called on every landing page.
     */
    land: function () {
        window._Swaarm.land();
    },

    /**
     * Returns a unique string identifier for the current user that can be used to refer to it when communicating
     * with Swaarm
     * @returns String
     */
    identifier: function () {
        return window._Swaarm.getClickId();
    },

    /**
     * Signals that the current user has converted. This method should ve called when the user performed
     * the base event for the user journey (e.g. created and account, joined trial, etc)
     */
    attribute: function () {
        window._Swaarm.attribute();
    },

    /**
     * Fires an event for the current user
     * @param {String} eventName the event name
     * @param {Object} options: additional options that can be passed to further describe the events:
     *  - saleAmount Number the amount earned for this event in the major denomination (e.g. dollars not cents)
     *  - saleAmountCurrency String the fiat currency in which the amount is paid
     *  - originalSaleAmount Number the amount earned for this event in the original currency (e.g. crypto currencies,
     *  in-game currencies etc)
     *  - originalSaleCurrency String the currency in which the transaction orginally took place
     */
    event: function (eventName, options) {
        options = options == null ? {} : options
        window._Swaarm.event({
            "event_id": eventName,
            "sale_amount": options.saleAmount,
            "sale_amount_currency": options.saleAmountCurrency,
            "original_sale_amount": options.originalSaleAmount,
            "original_sale_amount_currency": options.originalSaleAmountCurrency

        });
    }
}
