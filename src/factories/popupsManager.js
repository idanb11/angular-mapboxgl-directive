angular.module('mapboxgl-directive').factory('PopupsManager', ['Utils', 'mapboxglConstants', '$rootScope', '$compile', function (Utils, mapboxglConstants, $rootScope, $compile) {
  /*
		/\$\{(.+?)\}/g --> Lorem ${ipsum} lorem ${ipsum} --> ['${ipsum}', '${ipsum}']
		/[^\$\{](.+)[^\}]/g --> ${ipsum} --> ipsum
	*/
	var _regexFindDollar = new RegExp(/\$\{(.+?)\}/g);
	var _regexGetValueBetweenDollarClaudator = new RegExp(/[^\$\{](.+)[^\}]/g);

  function PopupsManager () {
    this.popupsCreated = [];
  }

  PopupsManager.prototype.getAllPopupsCreated = function () {
    return this.popupsCreated;
  };

  PopupsManager.prototype.getPopupByLayerId = function (layerId) {
    if (angular.isDefined(layerId) && layerId !== null) {
			var popupsFiltered = this.popupsCreated.filter(function (each) {
				return each.layerId === layerId;
			});

			if (popupsFiltered.length > 0) {
				return popupsFiltered[0].popupInstance;
			} else {
				return false;
			}
		} else {
			if (this.popupsCreated.length > 0) {
				return this.popupsCreated.map(function (each) {
					return each.popupInstance;
				});
			} else {
				return false;
			}
		}
  };

  PopupsManager.prototype.removeAllPopupsCreated = function () {
    this.popupsCreated.map(function (eachPopup) {
			eachPopup.popupInstance.remove();
		});

		this.popupsCreated = [];
  };

  PopupsManager.prototype.removePopupByLayerId = function (map, layerId) {
    var popupsByLayer = this.popupsCreated.filter(function (eachPopup) {
			return eachPopup.layerId === layerId;
		});

		popupsByLayer.map(function (eachPopup) {
			eachPopup.popupInstance.remove();
		});

		this.popupsCreated = this.popupsCreated.filter(function (eachPopup) {
			return eachPopup.layerId !== layerId;
		});
  };

  PopupsManager.prototype.createPopupByObject = function (map, object, feature) {
    var self = this;

    Utils.checkObjects([
      {
        name: 'Map',
        object: map
      }, {
        name: 'Object',
        object: object,
        attributes: ['coordinates', 'html']
      }
    ]);

    var popupOptions = object.options || {};

		var popupCoordinates = object.coordinates === 'center' ? feature.geometry.coordinates : object.coordinates;

		var popup = new mapboxgl.Popup(popupOptions).setLngLat(popupCoordinates);

		if (angular.isDefined(object.onClose) && object.onClose !== null && angular.isFunction(object.onClose)) {
			popup.on('close', function (event) {
				object.onClose(event, event.target);
			});
		}

		// If HTML Element
		if (object.html instanceof HTMLElement) {
			popup.setDOMContent(object.html);
		} else {
			var templateScope = angular.isDefined(object.getScope) && angular.isFunction(object.getScope) ? object.getScope() : $rootScope;
			var htmlCopy = angular.copy(object.html);

			if (_regexFindDollar.test(object.html)) {
				var allMatches = object.html.match(_regexFindDollar);

				if (allMatches.length > 0) {
					allMatches.forEach(function (eachMatch) {
						var tempMatch = eachMatch.match(_regexGetValueBetweenDollarClaudator);

						if (tempMatch.length > 0) {
							var regexValue = tempMatch[0];

							if (feature.properties.hasOwnProperty(regexValue)) {
								htmlCopy = htmlCopy.replace(eachMatch, feature.properties[regexValue]);
							} else {
								throw new Error('Property "' + regexValue + '" isn\'t exist in source "' + feature.layer.source + '"');
							}
						}
					});
				}
			}

			try {
				var templateHtmlElement = $compile(htmlCopy)(templateScope)[0];

				popup.setDOMContent(templateHtmlElement);
			} catch (error) {
				popup.setHTML(htmlCopy);
			}
		}

		popup.addTo(map);

		self.popupsCreated.push({
			popupInstance: popup,
			isOnClick: object.isOnClick ? object.isOnClick : false,
			isOnMouseover: object.isOnMouseover ? object.isOnMouseover : false,
			layerId: feature.layer.id
		});

    return popup;
  };

  return PopupsManager;
}]);