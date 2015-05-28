/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-navigationhubviewservice', function (Y) {
    "use strict";
    /**
     * Provides the view service component for the navigation hub
     *
     * @module ez-navigationhubviewservice
     */
    Y.namespace('eZ');

    /**
     * Navigation hub view service.
     *
     * @namespace eZ
     * @class NavigationHubViewService
     * @constructor
     * @extends eZ.ViewService
     */
    Y.eZ.NavigationHubViewService = Y.Base.create('navigationHubViewService', Y.eZ.ViewService, [], {
        initializer: function () {
            this.on('*:logOut', this._logOut);
            this.after('*:navigateTo', this._navigateTo);

            /**
             * Stores the root struct with it's `location` and `content`
             *
             * @property _rootStruct
             * @type {Object}
             * @protected
             */
            this._rootStruct = null;

            /**
             * Stores the root media struct with it's `location` and `content`
             *
             * @property _rootMediaStruct
             * @type {Object}
             * @protected
             */
            this._rootMediaStruct = null;
        },

        /**
         * navigateTo event handler. it redirects the user to the given route.
         *
         * @method _navigateTo
         * @protected
         * @param {EventFacade} e
         */
        _navigateTo: function (e) {
            var route = e.route;

            this.get('app').navigateTo(route.name, route.params);
        },

        /**
         * logOut event handler, it logs out the user and redirect to the login
         * form.
         *
         * @method _logOut
         */
        _logOut: function () {
            var app = this.get('app');

            app.set('loading', true);
            app.logOut(function () {
                app.navigateTo('loginForm');
            });
        },

        _load: function (next) {
            var api = this.get('capi'),
                loadError = false,
                service = this;

            api.getContentService().loadRoot(function (error, response) {
                var rootLocationId,
                    rootMediaFolderId,
                    tasks = new Y.Parallel();

                if ( error ) {
                    service._error("Failed to contact the REST API");
                    return;
                }

                rootLocationId = response.document.Root.rootLocation._href;
                service._loadLocationAndContent(rootLocationId, tasks.add(function (error, result){
                    if ( error ) {
                        loadError = true;
                        return;
                    }
                    service._rootStruct = result;
                }));

                rootMediaFolderId = response.document.Root.rootMediaFolder._href;
                service._loadLocationAndContent(rootMediaFolderId, tasks.add(function (error, result){
                    if ( error ) {
                        loadError = true;
                        return;
                    }
                    service._rootMediaStruct = result;
                }));

                tasks.done(function () {
                    if ( loadError ) {
                        service._error("Failed to load content/location");
                        return;
                    }
                    next(service);
                });
            });
        },

        /**
         * Loads the given `locationId` and its content
         *
         * @protected
         * @method _loadLocationAndContent
         * @param {Integer} locationId
         * @param {Function} callback the function to call when the location and
         *        the content are loaded
         * @param {Boolean} callback.error the error, true if an error occurred
         * @param {Object} callback.result an object containing the
         *        Y.eZ.Location and the Y.eZ.Content instances under the `location` and
         *        the `content` keys.
         */
        _loadLocationAndContent: function (locationId, callback) {
            var loadOptions = {
                    api: this.get('capi')
                },
                location, content;

            location = new Y.eZ.Location({
                'id': locationId
            });
            location.load(loadOptions, function (error) {
                if ( error ) {
                    callback(error);
                    return;
                }

                content = new Y.eZ.Content({
                    'id': location.get('resources').Content
                });

                content.load(loadOptions, function (error) {
                    if ( error ) {
                        callback(error);
                        return;
                    }

                    callback(error, {
                        location: location,
                        content: content
                    });
                });
            });
        },

        /**
         * Returns a navigation item object. See the *NavigatinItems attribute.
         *
         * @private
         * @method _getItem
         * @param {Function} constructor
         * @param {Object} config
         * @return {Object}
         */
        _getItem: function(constructor, config) {
            return {
                Constructor: constructor,
                config: config
            };
        },

        /**
         * Returns a navigation item object describing a {{#crossLink
         * "eZ.NavigationItemView"}}eZ.NavigationItemView{{/crossLink}}
         *
         * @private
         * @method _getNavigationItem
         * @param {String} title
         * @param {String} identifier
         * @param {String} routeName
         * @param {Object} routeParams
         * @return {Object}
         */
        _getNavigationItem: function (title, identifier, routeName, routeParams) {
            return this._getItem(
                Y.eZ.NavigationItemView, {
                    title: title,
                    identifier: identifier,
                    route: {
                        name: routeName,
                        params: routeParams
                    }
                }
            );
        },

        /**
         * Returns the navigation item object describing a {{#crossLink
         * "eZ.NavigationItemSubtreeView"}}eZ.NavigationItemSubtreeView{{/crossLink}}.
         *
         * @method _getSubtreeItem
         * @private
         * @param {String} title
         * @param {String} identifier
         * @param {String} locationId
         * @return {Object}
         */
        _getSubtreeItem: function (title, identifier, locationId, languageCode) {
            return this._getItem(
                Y.eZ.NavigationItemSubtreeView, {
                    title: title,
                    identifier: identifier,
                    route: {
                        name: 'viewLocation',
                        params: {
                            id: locationId,
                            languageCode: languageCode
                        }
                    }
                }
            );
        },

        /**
         * Returns a navigation item object describing a {{#crossLink
         * "eZ.NavigationItemParameterView"}}eZ.NavigationItemParameterView{{/crossLink}}
         *
         * @private
         * @method _getParameterItem
         * @param {String} title
         * @param {String} identifier
         * @param {String} routeName
         * @param {Object} routeParams
         * @param {String} matchParameter
         * @return {Object}
         */
        _getParameterItem: function (title, identifier, routeName, routeParams, matchParameter) {
            return this._getItem(
                Y.eZ.NavigationItemParameterView, {
                    title: title,
                    identifier: identifier,
                    route: {
                        name: routeName,
                        params: routeParams,
                    },
                    matchParameter: matchParameter
                }
            );
        },

        /**
         * Returns the parameters for the navigation hub view
         *
         * @method getViewParameters
         * @return {Object}
         */
        _getViewParameters: function () {
            return {
                user: this.get('app').get('user'),
                platformNavigationItems: this.get('platformNavigationItems'),
                studioNavigationItems: this.get('studioNavigationItems'),
                studioplusNavigationItems: this.get('studioplusNavigationItems'),
                adminNavigationItems: this.get('adminNavigationItems'),
                matchedRoute: this._matchedRoute(),
            };
        },

        /**
         * A matched route object from the request. This object will be used by
         * the navigation hub view to check which navigation item view is
         * selected. A matched route object is a clone of the application active
         * route without the service, serviceInstance and callbacks entries and
         * with an additionnal `parameters` property holding the route
         * parameters and their values.
         *
         * @method _matchedRoute
         * @protected
         * @return {Object}
         */
        _matchedRoute: function () {
            var request = this.get('request'),
                route = request.route,
                matchedRoute = Y.merge(route);

            matchedRoute.parameters = request.params;
            delete matchedRoute.service;
            delete matchedRoute.serviceInstance;
            delete matchedRoute.callbacks;

            return matchedRoute;
        },

        /**
         * Adds a navigation item for the given zone.
         * Note: adding a navigation item will only work before the first
         * initialization of the navigation hub. As a result, in a navigation
         * hub view service plugin, this method should be called only in or from
         * the initializer method.
         *
         * @method addNavigationItem
         * @param {Object} item a navigation item, see the description of the
         * *NavigationItems attributes
         * @param {String} zone the identifier of the zone
         */
        addNavigationItem: function (item, zone) {
            this.get(zone + 'NavigationItems').push(item);
        },

        /**
         * Removes a navigation item for the given zone.
         * Note: removing a navigation item will only work before the first
         * initialization of the navigation hub. As a result, in a navigation
         * hub view service plugin, this method should be called only in or from
         * the initializer method.
         *
         * @method removeNavigationItem
         * @param {String} identifier the identifier of the navigation item to
         * remove
         * @param {String} zone the identifier of the zone
         */
        removeNavigationItem: function (identifier, zone) {
            var attr = zone + 'NavigationItems';

            this._set(attr, Y.Array.reject(this.get(attr), function (elt) {
                return elt.config.identifier === identifier;
            }));
        },
    }, {
        ATTRS: {

            /**
             * Stores the navigation item objects for the 'platform' zone. Each
             * object must contain a `Constructor` property referencing
             * the constructor function to use to build the navigation item
             * view and a `config` property will be used as a configuration
             * object for the navigation item view. This configuration must
             * contain a `title` and an `identifier` properties.
             *
             * @attribute platformNavigationItems
             * @type Array
             * @default array containing the object the 'Content structure' and
             * 'Media library' items
             * @readOnly
             */
            platformNavigationItems: {
                getter: function () {
                    return [
                        this._getSubtreeItem(
                            "Content structure",
                            "content-structure",
                            this._rootStruct.location.get('id'),
                            this._rootStruct.content.get('mainLanguageCode')
                        ),
                        this._getSubtreeItem(
                            "Media library",
                            "media-library",
                            this._rootMediaStruct.location.get('id'),
                            this._rootMediaStruct.content.get('mainLanguageCode')
                        ),
                    ];
                },
                readOnly: true,
            },

            /**
             * Stores the navigation item objects for the 'studioplus' zone. Each
             * object must contain a `Constructor` property referencing
             * the constructor function to use to build the navigation item
             * view and a `config` property will be used as a configuration
             * object for the navigation item view. This configuration must
             * contain a `title` and an `identifier` properties.
             *
             * @attribute studioplusNavigationItems
             * @type Array
             * @default empty array
             * @readOnly
             */
            studioplusNavigationItems: {
                getter: function () {
                    return [
                        this._getNavigationItem(
                            "eZ Studio Plus presentation", "studioplus-presentation",
                            "studioPlusPresentation", {}
                        ),
                    ];
                },
                readOnly: true,
            },

            /**
             * Stores the navigation item objects for the 'studio' zone. Each
             * object must contain a `Constructor` property referencing
             * the constructor function to use to build the navigation item
             * view and a `config` property will be used as a configuration
             * object for the navigation item view. This configuration must
             * contain a `title` and an `identifier` properties.
             *
             * @attribute studioNavigationItems
             * @type Array
             * @default empty array
             * @readOnly
             */
            studioNavigationItems: {
                getter: function () {
                    return [
                        this._getNavigationItem(
                            "eZ Studio presentation", "studio-presentation",
                            "studioPresentation", {}
                        ),
                    ];
                },
                readOnly: true,
            },

            /**
             * Stores the navigation item objects for the 'admin' zone. Each
             * object must contain a `Constructor` property referencing
             * the constructor function to use to build the navigation item
             * view and a `config` property will be used as a configuration
             * object for the navigation item view. This configuration must
             * contain a `title` and an `identifier` properties.
             *
             * @attribute platformNavigationItems
             * @type Array
             * @default array containing the items for the admin
             * @readOnly
             */
            adminNavigationItems: {
                getter: function () {
                    return [
                        this._getParameterItem(
                            "Administration dashboard", "admin-dashboard",
                            "adminGenericRoute", {uri: "pjax/dashboard"}, "uri"
                        ),
                        this._getParameterItem(
                            "System information", "admin-systeminfo",
                            "adminGenericRoute", {uri: "pjax/systeminfo"}, "uri"
                        ),
                        this._getNavigationItem(
                            "Sections", "admin-sections",
                            "adminSection", {uri: "pjax/section/list"}
                        ),
                        this._getNavigationItem(
                            "Content types", "admin-contenttypes",
                            "adminContentType", {uri: "contenttype"}
                        ),
                    ];
                },
                readOnly: true,
            },
        },
    });
});
