window._Swaarm = {

    _generateUUID: function () {
        var self = {};
        var lut = [];
        for (var i = 0; i < 256; i++) {
            lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
        }
        self.generate = function () {
            var d0 = Math.random() * 0xffffffff | 0;
            var d1 = Math.random() * 0xffffffff | 0;
            var d2 = Math.random() * 0xffffffff | 0;
            var d3 = Math.random() * 0xffffffff | 0;
            return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
                lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
                lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
                lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
        }
        return self.generate();
    },

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

    initialize: function (trackingUrl, webToken, defaultOfferId, defaultPubId) {
        if (trackingUrl == null || !trackingUrl.startsWith("http")) {
            throw new Error("Invalid tracking url received: " + trackingUrl)
        }
        if (trackingUrl.slice(-1) !== '/') {
            trackingUrl = trackingUrl + '/';
        }
        this.trackingUrl = trackingUrl
        this.webToken = webToken;
        this.defaultOfferId = defaultOfferId;
        this.defaultPubId = defaultPubId;
        this.configured = true;
    },

    enableDebug: function () {
        this.DEBUG = true;
    },

    _collectUtmData: function () {
        var params = this.getQueryParams(window.location.search);
        var parts = []
        if (params.utm_campaign) {
            parts.push("campaign=" + params.utm_campaign)
        }
        if (params.utm_adset) {
            parts.push("adset=" + params.utm_adset)
        }
        if (params.utm_ad) {
            parts.push("ad=" + params.utm_ad)
        }
        if (params.utm_source) {
            parts.push("site=" + params.utm_source)
        }
        if (params.utm_term) {
            parts.push("term=" + params.utm_term)
        }
        if (params.swcid) {
            parts.push("campaign_id=" + params.swcid)
        }
        if (params.swasid) {
            parts.push("adset_id=" + params.swasid)
        }
        if (params.swaid) {
            parts.push("ad_id=" + params.swasid)
        }
        if (params.swc) {
            parts.push("campaign_id=" + params.swc)
        }
        if (params.swas) {
            parts.push("adset_id=" + params.swas)
        }
        if (params.swa) {
            parts.push("ad_id=" + params.swa)
        }
        if (params.gclid) {
            parts.push("pub_click_id=" + params.gclid)
        }
        if (params.fbclid) {
            parts.push("pub_click_id=" + params.fbclid)
        }
        if (params.ttclid) {
            parts.push("pub_click_id=" + params.ttclid)
        }
        return parts.join("&")
    },

    _landOrganic: function () {
        var url = this.trackingUrl + "click?no_redirect=true&web_token=" + this.webToken + "&" + this._collectUtmData();
        this.log("Organic user.")
        var self = this;
        this.sendRequest(url, function (data) {
            self._saveClickId(data.id)
        }, true);
    },

    _saveClickId: function (click_id) {
        this.log("Saving clkid " + click_id + ".");
        window.localStorage.setItem(this.SWAARM_CLICK_ID_NAME, click_id);
    },

    land: function () {
        this.validateInit();
        var params = this.getQueryParams(window.location.search);
        if (params.clkid == null) {
            this.log("No clkid found.")
            if (this.webToken == null) {
                this._sanLand()
            } else {
                this._landOrganic();
            }
            return;
        } else {
            this._saveClickId(params.clkid)
        }
    },

    _sanLand: function () {
        this.validateInit()
        var params = this.getQueryParams(window.location.search);
        if (params.gclid == null && params.fbclid == null) {
            this.log("No google or facebook click ids found")
        }
        var self = this;
        this.sendRequest(
            this.trackingUrl + "click?no_redirect=true&offer_id=" + this.defaultOfferId + "&pub_id=" + this.defaultPubId,
            function (data) {
                self._saveClickId(data.id);
            }, true);
    },

    click: function (extras, callback) {
        this.validateInit();
        this._baseClickImpression("click", extras, callback)
    },

    impression: function (extras, callback) {
        this.validateInit();
        this._baseClickImpression("impression", extras, callback)
    },

    _baseClickImpression: function (eventType, extras, callback) {
        this.validateInit();
        var params = this.getQueryParams(window.location.search);
        for (var attr in extras) {
            params[attr] = extras[attr];
        }

        var queryParts = []
        for (var param in params) {
            queryParts.push(param + "=" + params[param]);
        }
        var queryString = queryParts.join("&");
        this.sendRequest(this.trackingUrl + eventType + queryString, callback, false);
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

    getClickId: function () {
        var clickId = window.localStorage.getItem(this.SWAARM_CLICK_ID_NAME);
        return clickId;
    },

    _getUserId: function () {
        return window.localStorage.getItem(this.SWAARM_CLICK_ID_NAME);
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
     *  - webToken string, optional parameter used for web apps to identify the app
     *  - defaultOfferId string, optional, this offer will be assigned to the clicks when no click id is present
     *  - defaultPubId string, optional, same as offer but for pubs
     *  - debug boolean, to indicate if we should log debugging information
     */
    initialize: function (settings) {
        window._Swaarm.initialize(settings.trackingUrl, settings.webToken, settings.defaultOfferId, settings.defaultPubId);
        if (settings.debug) {
            window._Swaarm.enableDebug();
        }
    },

    /**
     * Replaces all the links defined by the given selector with the advertiser tracking url for the offer
     * found in the URL params
     * @param selector any selector in the format of document.querySelectorAll
     * @param prelandingOffer optional an offer to which a prelanding click should be sent
     * @param prelandingPub the pub for the prelanding offer
     */
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
     * Registers a click with the given properties
     * @param params a map where the key is the parameter name (e.g. offer_id, pub_id) and the value is the parameter
     * value (e.g. 10, 20)
     * @param callback a function to execute after the click is registered
     */
    click: function (params, callback) {
        window._Swaarm.click(params, callback);
    },

    /**
     * Registers an impressions with the given properties
     * @param params a map where the key is the parameter name (e.g. offer_id, pub_id) and the value is the parameter
     * value (e.g. 10, 20)
     * @param callback a function to execute after the impression is registered
     */
    impression: function (params, callback) {
        window._Swaarm.click(params, callback);
    },

    /**
     * Returns a unique string identifier for the current user that can be used to refer to it when communicating
     * with Swaarm
     * @returns String
     */
    identifier: function () {
        return window._Swaarm._getUserId();
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
    },

    /**
     * Fires an open event that marks that the user is active. You should always fire it when your user creates a new session,
     * e.g. logs in the app
     */
    open: function () {
        this.event("__open")
    }
}
