/* global Module */

/* Magic Mirror
 * Module: MMM-trafficmate
 *
 * By Mark Fodor https://github.com/markfodor
 * MIT Licensed.
 */
Module.register("MMM-trafficmate", {
	defaults: {
		defaultText: config.defaultText || 'Route duration: ',
        travelMode: config.travelMode || 'DRIVING',
        origin: config.origin,
        destination: config.destination,
        apiKey: config.apiKey,
        updateInterval: 6000,
        retryDelay: 5000
    },

	start: function () {
		var self = this;
		this.reponse = null;

		//Flag for check if module is loaded
		this.loaded = false;

		//TODO apiKey check
		var googleScript = document.createElement("script");
		googleScript.src = "https://maps.googleapis.com/maps/api/js?key=" + self.config.apiKey;
		document.getElementsByTagName("body")[0].appendChild(googleScript);

		// Schedule update timer.
		setInterval(function () {
			self.getData();
			self.updateDom();
		}, this.config.updateInterval);
	},

	getData: function () {
		var self = this;

		if (google) {
			var directionsService = new google.maps.DirectionsService;
			directionsService.route({
				destination: self.config.destination,
				origin: self.config.origin,
				travelMode: self.config.travelMode
			}, function (response, status) {
				if (status === "OK") {
					self.response = response;
				} else {
					Log.error("Directions request failed due to " + status);
				}
			});
		} else {
			Log.error("Cloud not load google service.");
		}
	},

	/* scheduleUpdate()
     * Schedule next update.
     *
     * argument delay number - Milliseconds before next update.
     *  If empty, this.config.updateInterval is used.
     */
	scheduleUpdate: function (delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad;
		var self = this;
		setTimeout(function () {
			self.getData();
		}, nextLoad);
	},

	getDom: function () {
		var duration = this.response ? this.response.routes[0].legs[0].duration.text : "Loading...";

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");
		wrapper.innerHTML = this.config.defaultText + duration;

		// Data from helper
		if (this.dataNotification) {
			var wrapperDataNotification = document.createElement("div");
			// translations  + datanotification
			wrapperDataNotification.innerHTML = this.translate("UPDATE") + ": " + this.dataNotification.date;

			wrapper.appendChild(wrapperDataNotification);
		}
		return wrapper;
	},

	getScripts: function () {
		return [];
	},

	// Load translations files
	getTranslations: function () {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	processData: function (data) {
		var self = this;
		if (this.loaded === false) {
			self.updateDom(self.config.animationSpeed);
		}
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("MMM-trafficmate-NOTIFICATION", data);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if (notification === "MMM-trafficmate-NOTIFICATION") {
			// set dataNotification
			this.dataNotification = payload;
			this.updateDom();
		}
	},
});
