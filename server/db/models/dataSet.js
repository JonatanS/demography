var mongoose = require('mongoose');
var Promise = require('bluebird');

var Dashboard = mongoose.model('Dashboard');
var Widget = mongoose.model('Widget');

var schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileType: {
        type: String,
        default: "application/json"
    },
    title: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    originalDataset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DataSet',
    }
});

schema.pre('save', function(next) {
    this.lastUpdated = Date.now();
    next();
});

// BOBBY NOTE: Figure out how to get this pre remove hook to work
schema.pre('remove', function(next) {
    //remove all of it's dashboards
    Dashboard.remove({
            dataset: this._id
        })
        .then(function() {
            next();
        });
});

schema.post('save', (doc, next) => {

    if (!doc.templateDashboard) return next();

    let templateDashboard;

    return Dashboard.findById(doc.templateDashboard)
    .then((template) => {
        if (!template) throw new Error('No matching template found!');

        templateDashboard = template.toObject();

        templateDashboard.title = doc.title;
        templateDashboard.shortDescription = doc.shortDescription;
        templateDashboard.isPublic = doc.isPublic;
        templateDashboard.dataset = doc._id;

        delete templateDashboard._id;

        const dashboardProm = Dashboard.create(templateDashboard);
        const templateWidgetsProm = template.getWidgets();

        return Promise.all([dashboardProm, templateWidgetsProm]);
    })
    .then((resolvedArr) => {
        const dashboard = resolvedArr[0];
        const templateWidgets = resolvedArr[1];

        return Promise.map(templateWidgets, (templateWidget) => {
            templateWidget = templateWidget.toObject();
            templateWidget.dashboard = dashboard._id;
            delete templateWidget.lastUpdated;
            delete templateWidget._id;

            return Widget.create(templateWidget);
        });
    })
    .then( (widgets) => {
        next()
    }, next)
})

mongoose.model('DataSet', schema);
