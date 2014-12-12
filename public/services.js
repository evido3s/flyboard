/** * Created by sly on 9/24/14. */'use strict';/************************** services modlue *****************************/var services = angular.module('services', [    'ngResource',    'ngRoute']);/************************** database services *****************************/services.service('DataSource', function($resource){    return $resource('/api/data_sources/:id', null, {        'update': {            method: 'PUT'        }    });});services.service('DataSourceBelongToFolder', function($resource){    return $resource('/api/folders/:id/data_sources');});services.service('Project', function($resource){    return $resource('/api/projects/:id', null, {        'update': {method: 'PUT'}    });});services.service('Widget', function($resource){    return $resource('/api/dashboards/:dashboardid/widgets/:id', null, {        'update': {method: 'PUT'}    });});services.service('Dashboard', function($resource){    return $resource('/api/dashboards/:id', null, {        'update': {method: 'PUT'}    });});services.service('RecordSave', function($resource){    return $resource('/api/projects/:uuid/data_sources/:key');});services.service('Record', function($resource){    return $resource('/api/data_sources/:id/records');});services.service('RecordDelete', function($resource){    return $resource('/api/records/:id');});services.service('Folder', function($resource) {    return $resource('/api/folders/:id', null, {        'update': {method: 'PUT'}    });});services.service('SubFolder', function($resource) {    return $resource('/api/folders/:parent_id/folders');});/************************** common services *****************************/services.service('Message', ['$modal',    function ($modal) {        return {            alert: function (message) {                message = message || '完成';                return $modal.open({                    backdrop: 'static',                    template: '<div class="modal-body">' + message + '</div>' +                        '<div class="modal-footer"><button class="btn btn-primary" ng-click="$close()">确定</button></div>'                });            }        };    }]);services.service('widgetUrl', function () {    return function (widget, dashboard) {        if (!widget) {            return 'stat';        }        var dataInfos = JSON.stringify(widget.config.dataInfos);        var projectId = dashboard.project_id;        var href = 'stat#/?projectId=' + projectId + '&dataInfos=' + dataInfos + '&period=0,7';        return href;    };});services.service('NavUrl', ['$location', '$routeParams', '$window',    function ($location, $routeParams, $window) {        return function (targetNav){            var href = null;            var projectId = null;            if($window.location.pathname === '/'){                projectId = $routeParams.project_id;            }            else if($window.location.pathname === '/admin' || $window.location.pathname === '/stat'){                projectId = $routeParams.projectId;            }            if(targetNav === 'index'){                href = projectId ? ('/#/projects/' + projectId) : ('/');            }            else if(targetNav === 'stat'){                href = projectId ? ('stat#/?projectId=' + projectId) : ('stat#/');            }            else if(targetNav === 'admin'){                href = projectId ? ('admin#/dataSource?projectId=' + projectId) : ('admin#/');            }            return href;        };    }]);