angular.module('mapboxgl-directive').directive('mapboxglCompare', ['mapboxglMapsData', function (mapboxglMapsData) {
  function mapboxGlCompareDirectiveLink (scope, element, attrs) {
    if (!mapboxgl) {
      throw new Error('Mapbox GL does not included');
    }

    if (!mapboxgl.accessToken) {
      if (angular.isDefined(attrs.accessToken) && attrs.accessToken.length > 0) {
        mapboxgl.accessToken = attrs.accessToken;
      } else {
        throw new Error('Mapbox access token does not defined');
      }
    }

    if (!mapboxgl.Compare) {
      throw new Error('mapboxgl.Compare plugin does not included');
    }

    if (!mapboxgl.supported()) {
      throw new Error('Your browser does not support Mapbox GL');
    }

    if (angular.isDefined(scope.compareSettings) && Object.prototype.toString.call(scope.compareSettings) !== Object.prototype.toString.call({})) {
      throw new Error('Invalid mapboxgl.Compare parameters');
    }

    element.ready(function () {
      var children = element.children();

      if (children.length !== 2) {
        throw new Error('Only two maps can be compared');
      }

      var map1 = angular.element(children[0]);
      map1.addClass('compare-map');

      var map2 = angular.element(children[1]);
      map2.addClass('compare-map');

      var mapboxgl1 = mapboxglMapsData.getMapById(children[0].id);
      var mapboxgl2 = mapboxglMapsData.getMapById(children[1].id);

      new mapboxgl.Compare(mapboxgl1, mapboxgl2, scope.compareSettings);
    });
  }

  var directive = {
    restrict: 'EA',
    replace: true,
    scope: {
      compareSettings: '='
    },
    transclude: true,
    template: '<div class="angular-mapboxgl-compare" ng-transclude></div>',
    link: mapboxGlCompareDirectiveLink
  };

  return directive;
}]);