/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-locationviewlocationstabview', function (Y) {
    "use strict";
    /**
     * Provides the Location View Locations Tab view class.
     *
     * @module ez-locationviewlocationstabview
     */
    Y.namespace('eZ');

    /**
     * The Location View Locations Tab View class.
     *
     * @namespace eZ
     * @class LocationViewLocationsTabView
     * @constructor
     * @extends eZ.LocationViewTabView
     */
    Y.eZ.LocationViewLocationsTabView = Y.Base.create('locationViewLocationsTabView', Y.eZ.LocationViewTabView, [Y.eZ.AsynchronousView], {
        initializer: function () {
            this._fireMethod = this._fireLoadLocations;
            this._watchAttribute = 'locations';
        },

        render: function () {
            var container = this.get('container'),
                locations = [];

            Y.Array.each(this.get('locations'), function (loc) {
                locations.push(loc.toJSON());
            });

            container.setHTML(this.template({
                "locations": locations,
                "loadingError": this.get('loadingError')
            }));

            return this;
        },

        /**
         * Fire the `loadLocations` event
         *
         * @method _fireLoadLocations
         * @protected
         */
        _fireLoadLocations: function () {
            /**
             * Fired when the locations tab view needs content's locations
             *
             * @event loadLocations
             * @param {eZ.Content} content the content for which locations will be loaded
             */
            this.fire('loadLocations', {
                content: this.get('content')
            });
        },
    }, {
        ATTRS: {
            /**
             * The title of the tab
             *
             * @attribute title
             * @type {String}
             * @default "Locations"
             * @readOnly
             */
            title: {
                value: "Locations",
                readOnly: true,
            },

            /**
             * The identifier of the tab
             *
             * @attribute identifier
             * @type {String}
             * @default "locations"
             * @readOnly
             */
            identifier: {
                value: "locations",
                readOnly: true,
            },

            /**
             * The content being displayed
             *
             * @attribute content
             * @type {eZ.Content}
             * @writeOnce
             */
            content: {
                writeOnce: 'initOnly',
            },

            /**
             * List of locations of the content
             *
             * @attribute locations
             * @type {Array}
             */
            locations: {},

            /**
             * The config
             *
             * @attribute config
             * @type mixed
             * @writeOnce
             */
            config: {
                writeOnce: "initOnly",
            },
        }
    });
});
