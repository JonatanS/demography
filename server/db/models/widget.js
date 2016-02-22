'use strict';

var mongoose = require('mongoose');

var widgetTypes = ['text', 'graph', 'other'];

var schema = new mongoose.Schema({
    dashboard: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Dashboard',
        required: true
    },
    title: {
        type: String
    },
    type: {
    	type: String,
        required: true,
        enum: widgetTypes
    },
    col: {
        type: Number
        //required: true
    },
    row: {
        type: Number
        //required: true
    },
    sizeX: {
        type: Number,
        required: true
    },
    sizeY: {
        type: Number,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    //chartObjects entail all settings for the specific widget, such as spreadsheet or chart
    //including it's type ('pie', 'bar' etc), colors, axis labels etc
    chartObject: {
        type: Object,
        default: {}
    }
});


schema.pre('save', function (next) {

    this.lastUpdated = Date.now();
    next();

});

mongoose.model('Widget', schema);
