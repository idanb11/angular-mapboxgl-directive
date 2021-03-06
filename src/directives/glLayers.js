angular.module('mapboxgl-directive').directive('glLayers', ['LayersManager', '$timeout', '$q', function (LayersManager, $timeout, $q) {
  function mapboxGlLayersDirectiveLink (scope, element, attrs, controller) {
    if (!controller) {
			throw new Error('Invalid angular-mapboxgl-directive controller');
		}

		var mapboxglScope = controller.getMapboxGlScope();
    var popupsManager = controller.getPopupManager();

    var layersManager = new LayersManager(popupsManager);

    function disableLayerEvents (map) {
      popupsManager.removeAllPopupsCreated(map);

      map.off('click');
      map.off('mousemove');
    }

    function enableLayerEvents (map) {
      map.on('click', function (event) {
        event.originalEvent.preventDefault();
        event.originalEvent.stopPropagation();

        var allLayers = layersManager.getCreatedLayers();

        var features = map.queryRenderedFeatures(event.point, { layers: allLayers });

        if (features.length > 0) {
          var feature = features[0];

          // Check popup
          var popupObject = layersManager.getPopupRelationByLayerId(feature.layer.id);

          if (angular.isDefined(popupObject) && popupObject !== null && angular.isDefined(popupObject.onClick)) {
            popupsManager.createPopupByObject(map, {
              coordinates: popupObject.onClick.coordinates || event.lngLat,
              options: popupObject.onClick.options,
              html: popupObject.onClick.message,
              getScope: popupObject.onClick.getScope,
              onClose: popupObject.onClick.onClose
            }, feature);
          }

          // Check events
          var layerEvents = layersManager.getEventRelationByLayerId(feature.layer.id);

          if (angular.isDefined(layerEvents) && layerEvents !== null && angular.isDefined(layerEvents.onClick) && angular.isFunction(layerEvents.onClick)) {
            layerEvents.onClick(map, feature, features);
          }
        }
      });

      map.on('mousemove', function (event) {
        var allLayers = layersManager.getCreatedLayers();

        var features = map.queryRenderedFeatures(event.point, { layers: allLayers });
        map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

        if (features.length > 0) {
          var feature = features[0];

          // GAL - It needs clarification
          // Check popup
          // var popupByLayer = popupsManager.getPopupByLayerId(feature.layer.id);
          //
          // if (popupByLayer) {
          //   if (!popupByLayer.isOpen()) {
          //     popupByLayer.addTo(map);
          //   }
          //
          //   popupByLayer.setLngLat(event.lngLat);
          // } else {
          //   var popupObject = layersManager.getPopupRelationByLayerId(feature.layer.id);
          //
          //   if (angular.isDefined(popupObject) && popupObject !== null && angular.isDefined(popupObject.onMouseover)) {
          //     popupsManager.createPopupByObject(map, {
          //       coordinates: popupObject.onMouseover.coordinates || event.lngLat,
          //       options: popupObject.onMouseover.options,
          //       html: popupObject.onMouseover.message,
          //       getScope: popupObject.onMouseover.getScope,
          //       onClose: popupObject.onMouseover.onClose
          //     }, feature);
          //   }
          // }

          // Check events
          var layerEvents = layersManager.getEventRelationByLayerId(feature.layer.id);

          if (angular.isDefined(layerEvents) && layerEvents !== null && angular.isDefined(layerEvents.onMouseover) && angular.isFunction(layerEvents.onMouseover)) {
            layerEvents.onMouseover(map, feature, features);
          }
        }
      });
    }

    function createOrUpdateLayer (map, layerObject) {
      if (layersManager.existLayerById(layerObject.id)) {
        layersManager.updateLayerByObject(map, layerObject);
      } else {
        layersManager.createLayerByObject(map, layerObject);
      }

      if (angular.isDefined(layerObject.animation) && angular.isDefined(layerObject.animation.enabled) && layerObject.animation.enabled) {
        var animate = function (timestamp) {
          setTimeout(function () {
            requestAnimationFrame(animate);

            layerObject.animation.animationFunction(map, layerObject.id, layerObject.animation.animationData, timestamp);
          }, layerObject.animation.timeoutMilliseconds || 1000);
        };

        animate(0);
      }
    }

    function checkLayersToBeRemoved (map, layers) {
      var defer = $q.defer();

      var layersIds = [];

      if (Object.prototype.toString.call(layers) === Object.prototype.toString.call([])) {
        layersIds = layers.map(function (eachLayer) {
          return eachLayer.id;
        });
      } else if (Object.prototype.toString.call(layers) === Object.prototype.toString.call({})) {
        layersIds.push(layers.id);
      } else {
        defer.reject(new Error('Invalid layers parameter'));
      }

      layersIds = layersIds.filter(function (eachLayerId) {
        return angular.isDefined(eachLayerId);
      });

      var layersToBeRemoved = layersManager.getCreatedLayers();

      layersIds.map(function (eachLayerId) {
        layersToBeRemoved = layersToBeRemoved.filter(function (eachLayerToBeRemoved) {
          return eachLayerToBeRemoved !== eachLayerId;
        });
      });

      layersToBeRemoved.map(function (eachLayerToBeRemoved) {
        layersManager.removeLayerById(map, eachLayerToBeRemoved);
      });

      defer.resolve();

      return defer.promise;
    }

    controller.getMap().then(function (map) {
      mapboxglScope.$watch('glLayers', function (layers) {
        if (angular.isDefined(layers)) {
          disableLayerEvents(map);

          checkLayersToBeRemoved(map, layers).then(function () {
            if (Object.prototype.toString.call(layers) === Object.prototype.toString.call([])) {
              layers.map(function (eachLayer) {
                createOrUpdateLayer(map, eachLayer);
              });
            } else if (Object.prototype.toString.call(layers) === Object.prototype.toString.call({})) {
              createOrUpdateLayer(map, layers);
            } else {
              throw new Error('Invalid layers parameter');
            }

            enableLayerEvents(map);
          }).catch(function (error) {
            throw error;
          });
        }
      }, true);
    });

    scope.$on('$destroy', function () {
      layersManager.removeAllCreatedLayers();
    });
  }

  var directive = {
    restrict: 'A',
		scope: false,
		replace: false,
		require: '?^mapboxgl',
		link: mapboxGlLayersDirectiveLink
  };

  return directive;
}]);
