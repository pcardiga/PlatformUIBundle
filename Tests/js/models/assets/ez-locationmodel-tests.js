/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-locationmodel-tests', function (Y) {
    var modelTest, trashTest,
        /*Assert = Y.Assert,*/ Mock = Y.Mock;

    modelTest = new Y.Test.Case(Y.merge(Y.eZ.Test.ModelTests, {
        name: "eZ Location Model tests",

        init: function () {
            this.capiMock = new Y.Mock();
            this.capiGetService = 'getContentService';
            this.serviceMock = new Y.Mock();
            this.serviceLoad = 'loadLocation';
            this.rootProperty = "Location";
            this.parsedAttributeNumber = Y.eZ.Location.ATTRS_REST_MAP.length + 1; // links
            this.loadResponse = {
                "Location": {
                    "_media-type": "application/vnd.ez.api.Location+json",
                    "_href": "/api/ezp/v2/content/locations/1/2/61",
                    "id": 61,
                    "priority": -12,
                    "hidden": "false",
                    "invisible": "false",
                    "ParentLocation": {
                        "_media-type": "application/vnd.ez.api.Location+json",
                        "_href": "/api/ezp/v2/content/locations/1/2"
                    },
                    "pathString": "/1/2/61/",
                    "depth": 2,
                    "childCount": 3,
                    "remoteId": "a056661abf6a4c778ca3a642797ae5e3",
                    "Children": {
                        "_media-type": "application/vnd.ez.api.LocationList+json",
                        "_href": "/api/ezp/v2/content/locations/1/2/61/children"
                    },
                    "Content": {
                        "_media-type": "application/vnd.ez.api.Content+json",
                        "_href": "/api/ezp/v2/content/objects/59"
                    },
                    "sortField": "PATH",
                    "sortOrder": "ASC"
                }
            };
        },

        setUp: function () {
            this.model = new Y.eZ.Location();
        },

        tearDown: function () {
            this.model.destroy();
            delete this.model;
        }

    }));

    trashTest = new Y.Test.Case({
        name: "eZ Location Model trash tests",

        setUp: function () {
            this.model = new Y.eZ.Location();
        },

        tearDown: function () {
            this.model.destroy();
            delete this.model;
        },

        "Should load the root of the REST API": function () {
            var capiMock = new Mock(),
                contentServiceMock = new Mock(),
                callback;

            Mock.expect(capiMock, {
                method: 'getContentService',
                returns: contentServiceMock,
            });

            Mock.expect(contentServiceMock, {
                method: 'loadRoot',
                args: [Mock.Value.Function],
            });

            this.model.trash({api: capiMock}, callback);
        },
    });

    Y.Test.Runner.setName("eZ Location Model tests");
    Y.Test.Runner.add(modelTest);
    Y.Test.Runner.add(trashTest);

}, '', {requires: ['test', 'model-tests', 'ez-locationmodel', 'ez-restmodel']});
