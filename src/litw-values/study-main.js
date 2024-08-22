/*************************************************************
 * study.js
 *
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2024 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at info@labinthewild.org
 *************************************************************/

// load webpack modules
window.$ = window.jQuery = require("jquery");
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("bootstrap");
require("jquery-ui-bundle");
require("alpaca");
require("handlebars");
var _ = require('lodash');
import * as d3_csv from "d3-fetch";
var LITW_STUDY_CONTENT= require("./src/data");
var introTemplate = require("./pages/introduction.html");
var irbTemplate = require("./pages/irb.html");
var demographicsTemplate = require("./pages/demographics.html");
var valuesTemplate = require("./pages/values.html");
var conversationTemplate = require("./pages/ai_conversation.html");
var impressionsTemplate = require("./pages/postStudyQuest.html");
var loadingTemplate = require("./pages/loading.html");
var progressTemplate = require("./pages/progress.html");
var commentsTemplate = require("./pages/comments.html");
var resultsTemplate = require("./pages/resultsValuesMap.html");
var resultsFooter = require("./pages/results-footer.html");
require("../js/litw/jspsych-display-slide");

module.exports = (function(exports) {

	window.litwWithTouch = false;
	//TODO: Global variables for data across slides... bad design! :(
	var timeline = [],
	params = {
		study_id: '57ef9f1a-82a3-4ebf-9d47-10c12c7da10a',
		currentProgress: 0,
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif", "./img/icon1.jpg"],
		participant_values: {},
		values_data: null,
		convo_data: null,
		impressions_data: null,
		convo_length_max: 8,
		convo_length_min: 4,
		convo_snippets: [],
		ai_impressions_before_task: false,
		slides: {
			INTRO: {
				name: "study_introduction",
				type: "display-slide",
				template: introTemplate,
				display_element: $("#introduction"),
				display_next_button: false
			},
			IRB: {
				name: "informed_consent",
				type: "display-slide",
				template: irbTemplate,
				display_element: $("#irb"),
				display_next_button: false
			},
			DEMOGRAPHICS: {
				name: "demographics",
				type: "display-slide",
				template: demographicsTemplate,
				display_element: $("#demographics"),
				display_next_button: false,
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.submitDemographics(dem_data);
				}
			},
			VALUES_Q: {
				name: "values_questionnaire",
				type: "display-slide",
				template: valuesTemplate,
				display_element: $("#values"),
				display_next_button: false,
				finish: function(){
					let values_data = {
						values: params.values_data
					};
					LITW.data.submitStudyData(values_data);
				}
			},
			AI_CONVO: {
				name: "ai_conversation",
				type: "display-slide",
				template: conversationTemplate,
				display_next_button: false,
				display_element: $("#ai_convo"),
				finish: function(){
					let convo_data= params.convo_data;
					LITW.data.submitStudyData(convo_data);
				}
			},
			AI_IMPRESSIONS: {
				name: "ai_impressions",
				type: "display-slide",
				template: impressionsTemplate,
				display_next_button: false,
				display_element: $("#impressions"),
				finish: function(){
					let impressions_data= {
						ai_impressions: params.impressions_data
					}
					LITW.data.submitStudyData(impressions_data);
				}
			},
			COMMENTS: {
				name: "comments",
				type: "display-slide",
				display_element: $("#comments"),
				template: commentsTemplate,
				display_next_button: true,
				finish: function(){
					let comments = $('#commentsForm').alpaca().getValue();
					if (Object.keys(comments).length > 0) {
						LITW.data.submitComments({
							comments: comments
						});
					}
				}
			},
			RESULTS: {
				type: "call-function",
				func: function(){
					showResultsValueMap();
				}
			}
		}
	};


	function configureStudy() {
		generateAIConversation();
		// ******* BEGIN STUDY PROGRESSION ******** //
		timeline.push(params.slides.INTRO);
		// timeline.push(params.slides.IRB);
		// timeline.push(params.slides.DEMOGRAPHICS);
		timeline.push(params.slides.VALUES_Q);
		timeline.push(params.slides.AI_CONVO);
		timeline.push(params.slides.AI_IMPRESSIONS);
		// timeline.push(params.slides.COMMENTS);
		timeline.push(params.slides.RESULTS);
		// ******* END STUDY PROGRESSION ******** //
	}

	function generateAIConversation() {
		_.shuffle(params.convo_data.convo_data);
		for (let counter = 0; counter < params.convo_length_max; counter++ ){
			let convo = params.convo_data.splice(0,2);
			params.convo_snippets.push({
				q1_id: convo[0].QID,
				q1:convo[0].snippetq,
				a1:convo[0].snippeta,
				q2_id: convo[1].QID,
				q2:convo[1].snippetq,
				a2:convo[1].snippeta
			});
		}
	}

	function startStudy() {
		LITW.utils.showSlide("trials");
		jsPsych.init({
			timeline: timeline,
			//on_finish: showResults,
			display_element: $("#trials")
		});
	}

	function showResultsValueMap() {
		if(!params.values_data){
			//TEST DATA
			params.values_data = {q1:"1",q2:"2",q3:"3",q4:"4",q5:"3",q6:"2",q7:"1",q8:["uns","obd"],q9:"1",q10:"2",q11:"3"};
		}

		let resultsData = {
			results: JSON.stringify(params.values_data)
		}
		if('PID' in params.URL) {
			resultsData.code = LITW.data.getParticipantId();
		}
		$("#results").html(resultsTemplate(resultsData));
		addResultsFooter();
		$("#results").i18n();
		LITW.utils.showSlide("results");
	}

	function addResultsFooter(){
		$("#results-footer").html(resultsFooter(
			{
				share_url: window.location.href,
				share_title: $.i18n('litw-irb-header'),
				share_text: $.i18n('litw-template-title'),
				more_litw_studies: params.study_recommendation
			}
		));
	}
	function readSummaryData() {
		$.getJSON( "summary.json", function( data ) {
			//TODO: 'data' contains the produced summary form DB data 
			//      in case the study was loaded using 'index.php'
			//SAMPLE: The example code gets the cities of study partcipants.
			console.log(data);
		});
	}

	function initStudy() {
		// generate unique participant id and geolocate participant
		LITW.data.initialize();
		// save URL params
		params.URL = LITW.utils.getParamsURL();
		if( Object.keys(params.URL).length > 0 ) {
			LITW.data.submitData(params.URL,'litw:paramsURL');
		}
		// populate study recommendation
		LITW.engage.getStudiesRecommendation(2, (studies_list) => {
			params.study_recommendation = studies_list;
		});
	}

	function startExperiment(){
		// determine and set the study language
		$.i18n().locale = LITW.locale.getLocale();
		var languages = {
			'en': './src/i18n/en.json?v=1.0',
		};
		// ONLY ENGLISH IS AVAILABLE!!!
		let toLoad = {};
		toLoad['en'] = languages['en'];
		$.i18n().load(toLoad).done(
			function() {
				$('head').i18n();
				$('body').i18n();

				LITW.utils.showSlide("img-loading");
				//start the study when resources are preloaded
				jsPsych.pluginAPI.preloadImages(params.preLoad,
					function() {
						//TODO: This is a strange place to put this file loading!
						d3_csv.csv("src/i18n/conversations-en.csv").then(function(data) {
							params.convo_data = data;
							initStudy();
							configureStudy();
							startStudy();
						});
					},
					// update loading indicator
					function (numLoaded) {
						$("#img-loading").html(loadingTemplate({
							msg: $.i18n("litw-template-loading"),
							numLoaded: numLoaded,
							total: params.preLoad.length
						}));
					}
				);
			});
	}

	$(document).ready(function() {
		startExperiment();
	});

	exports.study = {};
	exports.study.params = params

})( window.LITW = window.LITW || {} );


