'use strict';

angular.module('ngGPlaces', []);
angular.module('ngGPlaces').value('gPlaces', google.maps.places);
angular.module('ngGPlaces').value('gMaps', google.maps);

angular.module('ngGPlaces').
provider('ngGPlacesAPI', function () {

    var defaults = {
        radius: 500,
        sensor: false,
        latitude: null,
        longitude: null,
        types: ['food'],
        map: null,
        elem: null,
        nearbySearchKeys: ['name', 'reference', 'vicinity'],
        radarSearchKeys: ['geometry', 'place_id'],
        placeDetailsKeys: ['name', 'formatted_address', 'formatted_phone_number',
            'reference', 'website', 'geometry'
        ],
        nearbySearchErr: 'Unable to find nearby places',
        radarSearchErr: 'Unable to find places matching that keyword',
        placeDetailsErr: 'Unable to find place details',
        _nearbySearchApiFnCall: 'nearbySearch',
        _radarSearchApiFnCall: 'radarSearch',
        _placeDetailsApiFnCall: 'getDetails'
    };

    var parseNSJSON = function (response) {
        var pResp = [];
        var keys = defaults.nearbySearchKeys;
        response.map(function (result) {
            var obj = {};
            angular.forEach(keys, function (k) {
                obj[k] = result[k];
            });
            pResp.push(obj);
        });
        return pResp;
    };

    var parseRSJSON = function (response) {
        var pResp = [];
        var keys = defaults.radarSearchKeys;
        response.map(function (result) {
            var obj = {};
            angular.forEach(keys, function (k) {
                obj[k] = result[k];
            });
            pResp.push(obj);
        });
        return pResp;
    };

    var parsePDJSON = function (response) {
        var pResp = {};
        var keys = defaults.placeDetailsKeys;
        angular.forEach(keys, function (k) {
            pResp[k] = response[k];
        });
        return pResp;
    };

    this.$get = function ($q, gMaps, gPlaces, $window) {

        function commonAPI(args) {
            var req = angular.copy(defaults, {});
            angular.extend(req, args);
            var deferred = $q.defer();
            var elem, service;

            function callback(results, status) {
                if (status == gPlaces.PlacesServiceStatus.OK) {
                  return deferred.resolve(req._parser(results));
                } else {
                  deferred.reject(req._errorMsg);
                }
            }
            if (req._genLocation) {
                req.location = createLatLng(req);
            }
            if (req.map) {
                elem = req.map;
            } else if (req.elem) {
                elem = req.elem;
            } else {
                elem = $window.document.createElement('div');
            }
            service = new gPlaces.PlacesService(elem);
            service[req._apiFnCall](req, callback);
            return deferred.promise;
        }

        return {
            getDefaults: function () {
                return defaults;
            },
            nearbySearch: function (args) {
                args._genLocation = true;
                args._errorMsg = defaults.nearbySearchErr;
                args._parser = parseNSJSON;
                args._apiFnCall = defaults._nearbySearchApiFnCall;
                return commonAPI(args);
            },
            radarSearch: function (args) {
                args._errorMsg = defaults.radarSearchErr;
                args._parser = parseRSJSON;
                args._apiFnCall = defaults._radarSearchApiFnCall;
                return commonAPI(args);
            },
            placeDetails: function (args) {
                args._errorMsg = defaults.placeDetailsErr;
                args._parser = parsePDJSON;
                args._apiFnCall = defaults._placeDetailsApiFnCall;
                return commonAPI(args);
            },
            createLatLng: function (req) {
              return new gMaps.LatLng(req.latitude, req.longitude);
            }
        };
    };

    this.$get.$inject = ['$q', 'gMaps', 'gPlaces', '$window'];

    this.setDefaults = function (args) {
        angular.extend(defaults, args);
    };

});
