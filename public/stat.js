/*** Created by sly on 14-6-27.*/'use strict';var periodTypes = [    {        text: '今日',        value: '0,1'    },    {        text: '昨日',        value: '1,2'    },    {        text: '7天',        value: '0,7'    },    {        text: '30天',        value: '0,30'    },    {        text: '90天',        value: '0,90'    },    {        text: '180天',        value: '0,180'    },    {        text: '360天',        value: '0,360'    }];//draw chartfunction draw(config, callback) {    var multiRecords = [];              //record list    $('.stat-chart').each(function () {        Highcharts.setOptions({            global: {                useUTC: false            }        });        var $container = $(this).find('.content');        config.dataInfos = config.dataInfos || [];        //request data        function requestData() {            if (config.dataInfos.length === 1) {                return [$.get(                    '/api/data_sources/' + config.dataInfos[0].id                ).then(function (dataSource) {                    return $.get(                        '/api/data_sources/' + dataSource.id + '/records?period=' + (config.period || undefined) + '&limit=' + config.limit || 0                    ).then(function (resp) {                        //filter                        var formatedRespList = aggregationAndFilter(resp, config.dataInfos[0], 'filter');                        //data:  record list                        multiRecords = formatedRespList.map(function (formatedResp) {                            return {                                label: dataSource.name + additionalLabel(config.dataInfos[0], formatedResp),                                records: angular.copy(formatedResp)                            };                        });                        return formatedRespList.map(function (formatedResp, index) {                            var lineOpt = {};                            lineOpt.name = dataSource.name + additionalLabel(config.dataInfos[0], formatedResp);                            index = index >= defaultColors.length ? (index % defaultColors.length) : index;                            lineOpt.color = defaultColors[index];                            lineOpt.data = [];                            formatedRespList = formatedRespList || [];                            formatedResp.reverse().forEach(function (record) {                                lineOpt.data.push({                                    x: getTimeFromRecord(record),                                    y: record.value                                });                            });                            return lineOpt;                        });                    });                })];            }            else {                return config.dataInfos.map(function (dataInfo, index) {                    return $.get(                        '/api/data_sources/' + dataInfo.id                    ).then(function (dataSource) {                        return $.get(                            '/api/data_sources/' + dataSource.id + '/records?period=' + (config.period || undefined) + '&limit=' + config.limit || 0                        ).then(function (resp) {                            //aggregation                            var formatedResp = aggregationAndFilter(resp, dataInfo, 'aggregation');                            multiRecords.push({                                label: dataSource.name + additionalLabel(dataInfo, formatedResp),                                records: angular.copy(formatedResp)                            });                            var lineOpt = {};                            lineOpt.name = dataSource.name + additionalLabel(dataInfo, formatedResp);                            index = index >= defaultColors.length ? (index % defaultColors.length) : index;                            lineOpt.color = defaultColors[index];                            lineOpt.data = [];                            formatedResp = formatedResp || [];                            formatedResp.reverse().forEach(function (record) {                                lineOpt.data.push({                                    x: getTimeFromRecord(record),                                    y: record.value                                });                            });                            return lineOpt;                        });                    });                });            }        }        var promises = requestData();        $.when.apply(this, promises).done(function () {            var dataSeries = [];            if(config.dataInfos.length === 1){                dataSeries = Array.prototype.slice.apply(arguments)[0];            }            else{                dataSeries = Array.prototype.slice.apply(arguments);            }            //init records list    --- sort multiRecords && init $scope.multiRecords            function initMultiRecords() {                var sortedMultiRecords = sortMultiRecords(                    (function () {                        return multiRecords.map(function (result) {                            return result.records;                        });                    }()), {                        formatDate: formatDate,                        invalidValue: '--'                    }                );                multiRecords.forEach(function (result, idx) {                    result.records = sortedMultiRecords[idx];                });                callback(multiRecords, config);            }            if (multiRecords.length > 0) {                initMultiRecords();                //init chart                $container.highcharts({                    chart: {                        type: 'spline',                        animation: Highcharts.svg, // don't animate in old IE                        marginRight: 10,                        events: {                            load: function () {                            }                        }                    },                    title: {                        text: ''                    },                    xAxis: {                        type: 'datetime',                        tickPixelInterval: 150,                        lineColor: 'rgb(102, 108, 103)'                    },                    yAxis: {                        title: null,                        gridLineColor: 'rgb(102, 108, 103)',                        plotLines: [                            {                                value: 0,                                width: 1,                                color: '#808080'                            }                        ]                    },                    tooltip: {                        crosshairs: true,                        shared: true                    },                    legend: {                        layout: 'horizontal',                        align: 'center',                        verticalAlign: 'bottom',                        borderWidth: 0,                        itemDistance: 30,                        itemStyle: {                            color: 'black'                        }                    },                    exporting: {                        enabled: false                    },                    series: dataSeries,                    plotOptions: {                        spline: {                            colors: defaultColors,                            dataLabels: {                                enabled: true,                                color: 'darkblack',                                formatter: function () {                                    if (this.point.x === this.series.data[this.series.data.length - 1].x) {                                        return this.y;                                    } else {                                        return null;                                    }                                }                            }                        },                        series: {                            turboThreshold: config.limit                        }                    }                });            }        });    });}/************************** App modlue *****************************/var statApp = angular.module('statApp', [    'ngRoute',    'services',    'directives']);statApp.config(['$routeProvider',function ($routeProvider) {    $routeProvider        .when('/', {            templateUrl: '/public/src/stat.html',            controllers: 'StatCtrl'        });}]);statApp.controller('NavCtrl', ['$scope', '$routeParams', '$location', 'Project', 'NavUrl',    function ($scope, $routeParams, $location, Project, NavUrl) {        $scope.NavUrl = NavUrl;        Project.query().$promise.then(function (projects) {            $scope.projects = projects;            $scope.project = $location.search().projectId ?                Project.get({                    id: $location.search().projectId                })                : projects[0];        });        $scope.selectProject = function (project) {            if(project.id === $scope.project.id) {                return ;            }            $scope.project = project;            var newUrl = 'projectId=' + project.id;            $location.search(newUrl);        };    }]);statApp.controller('StatNavCtrl', ['$scope', '$routeParams', '$location', 'DataSource', 'Project', '$route', 'Message',    function($scope, $routeParams, $location, DataSource, Project, $route, Message){        $scope.selectedDataSources = [];        $scope.dataSources = DataSource.query();        $scope.periodTypes = periodTypes;        $scope.$on('$routeChangeSuccess', function () {            if($routeParams.projectId) {                $scope.project = Project.get({                    id: $routeParams.projectId                });            }            else{                $scope.project = Project.query().$promise.then(function (projects) {                    projects = projects || [];                    if(projects.length){                        $location.search('projectId', projects[0].id);                    }                    return projects[0] ? projects[0] : {};                });            }            $scope.selectedPeriod = $routeParams.period ?                (function(){                    var selectedPeriod = null;                    periodTypes.some(function(p){                        if(p.value === $routeParams.period){                            selectedPeriod = p.value;                            return true;                        }                    });                    return selectedPeriod;                })()                : null;            DataSource.query({                project_id: $routeParams.projectId            }).$promise.then(function (dataSources) {                $scope.dataSources = dataSources;                $scope.dataSourceMap = angular.copy(dataSources).reduce(function (memo, curr) {                    memo[curr.id] = curr;                    return memo;                }, {});                $scope.dataInfos = $route.current.params.dataInfos ? JSON.parse($route.current.params.dataInfos) : [];            });        });        $scope.isSelectedDataSource = function(dataSource){            return $scope.selectedDataSources.some(function(ds){                if(dataSource.id === ds.id){                    return true;                }            });        };        $scope.addContrastDataSource = function () {            $scope.dataInfos = $scope.dataInfos || [];            $scope.dataInfos.push({                id: null,                dimensions: []            });        };        $scope.delContrastDataSource = function (dataInfo) {            var idx = $scope.dataInfos.indexOf(dataInfo);            if (idx === -1) {                return;            }            $scope.dataInfos.splice(idx, 1);        };        $scope.submitChange = function () {            $scope.dataInfos = $scope.dataInfos.filter(function(dataInfo){                return dataInfo.id !== null;            });            var alarmDataSources = $scope.dataInfos.map(function (dataInfo) {                if(!dataInfo.dimensions && dataInfo.dimensions.length === 0) {                    return ;                }                var flag = dataInfo.dimensions.some(function (dimension) {                    if(!dimension.value || ($scope.dataInfos.length > 1 && dimension.value === 'ignore')){                        return true;                    }                });                return flag ? $scope.dataSourceMap[dataInfo.id].name : null;            }).filter(function(dataSourceName){                return dataSourceName !== null;            });            if(alarmDataSources.length){                Message.alert('"' + '<b>' + alarmDataSources.join(',') + '</b>' + '"' + '没有设置维度值！');                return ;            }            $location.search('dataInfos', JSON.stringify($scope.dataInfos));        };        $scope.resetDataSource = function(dataSource, oldDataSource){            if($scope.isSelectedDataSource(dataSource)){                return ;            }            var idx = $scope.selectedDataSources.indexOf(oldDataSource);            if(idx === -1){                return ;            }            $scope.selectedDataSources[idx] = dataSource;        };        $scope.setPeriod = function(period){            $scope.selectedPeriod = period.value;            $location.search('period', period);        };    }]);statApp.controller('StatCtrl', ['$scope', '$routeParams', '$location', 'DataSource', 'Record',    function ($scope, $routeParams, $location, DataSource, Record) {        if(!$routeParams.dataInfos){            return ;        }        if(!$routeParams.period){            $location.search('period', '0,7');        }        $scope.isDataAlready = false;        $scope.widget = {};        $scope.widget.config = {            name: '',            reloadInterval: 600000,            period: $routeParams.period        };        DataSource.query().$promise.then(function (dataSources) {            $scope.dataSources = dataSources;            $scope.dataSourceMap = angular.copy(dataSources).reduce(function (memo, curr) {                memo[curr.id] = curr;                return memo;            }, {});            $scope.widget.config.dataInfos = JSON.parse($routeParams.dataInfos);            //draw spline            draw($scope.widget.config, function (multiRecords, config) {                $scope.multiRecords = multiRecords;                $scope.isDataAlready = true;                $scope.$apply();                //set max number of points displayed in chart                config.limit = (multiRecords && multiRecords.length > 0 && multiRecords[0].records) ?                    multiRecords[0].records.length: null;            });        });    }]);statApp.controller('folderMenuNodeCtrl', ['$scope', 'SubFolder', 'DataSource',    function ($scope, SubFolder, DataSource) {        $scope.treeWrapper = {            folders: [],            dataSources: []        };        $scope.treeWrapper.folders = $scope.folder.id > 0 ? SubFolder.query({            parent_id: $scope.folder.id,            project_id: $scope.projectId        }) : [];        $scope.treeWrapper.dataSources = $scope.folder.id > 0 ? DataSource.query({            folder_id: $scope.folder.id,            project_id: $scope.projectId        }) : [];    }]);