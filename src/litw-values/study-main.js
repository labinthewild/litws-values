/*************************************************************
 * study.js
 *
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2023 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at info@labinthewild.org
 *************************************************************/

// load webpack modules
window.$ = window.jquery = require("jquery");
require("jquery-ui-bundle");
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("bootstrap");
require("alpaca");
import * as d3_csv from "d3-fetch";
var LITW_STUDY_CONTENT= require("./src/data");
var irbTemplate = require("./pages/irb.html");
var demographicsTemplate = require("./pages/demographics.html");
var valuesTemplate = require("./pages/values.html");
var conversationTemplate = require("./pages/ai_conversation.html");
var impressionsTemplate = require("./pages/postStudyQuest.html");
var loadingTemplate = require("./pages/loading.html");
var progressTemplate = require("./pages/progress.html");
var commentsTemplate = require("./pages/comments.html");
var resultsTemplate = require("./pages/results.html");
var resultsFooter = require("./pages/results-footer.html");
require("../js/litw/jspsych-display-info");
require("../js/litw/jspsych-display-slide");

module.exports = (function(exports) {

	window.litwWithTouch = false;
	//TODO: Global variables for data across slides... bad design! :(
	var timeline = [],
	params = {
		currentProgress: 0,
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		participant_values: {},
		values_data: null,
		convo_data: null,
		impressions_data: null,
		convo_length_max: 10,
		convo_length_min: 2,
		convo_snippets: []
	};


	function configureStudy() {
	// 	// ******* BEGIN STUDY PROGRESSION ******** //
		timeline.push({
            name: "informed_consent",
            type: "display-slide",
            template: irbTemplate,
            display_element: $("#irb"),
            display_next_button: false,
            finish: function(){
            	let irb_data = {
					time_elapsed: getSlideTime()
				}
            	LITW.data.submitConsent(irb_data);
            }
        });
	//
	// 	//DEMOGRAPHICS
	// 	timeline.push({
    //         name: "demographics",
	//         type: "display-slide",
    //         template: demographicsTemplate,
    //         display_element: $("#demographics"),
    //         finish: function(){
    //         	var dem_data = $('#demographicsForm').alpaca().getValue();
	// 			dem_data['time_elapsed'] = getSlideTime();
    //         	LITW.data.submitDemographics(dem_data);
    //         }
    //     });
	//
	//
	// 	// VALUES QUESTIONNAIRE
	// 	timeline.push({
    //         name: "values",
    //         type: "display-slide",
    //         template: valuesTemplate,
    //         display_element: $("#values"),
    //         finish: function(){
    //         	var values_data = {
	// 				values: params.values_data,
	// 				time_elapsed: getSlideTime()
	// 			}
    //         	LITW.data.submitStudyData(values_data);
    //         }
    //     });
	//
	//
	// 	// AI CONVERSATION
	// 	for (let counter = 0; counter < params.convo_length_max; counter++ ){
	// 		let num1 = Math.floor(Math.random() * params.convo_data.length);
	// 		let num2 = num1;
	// 		while(num1 == num2){
	// 			num2 = Math.floor(Math.random() * params.convo_data.length);
	// 		}
	// 		let convo1 = params.convo_data[num1];
	// 		let convo2 = params.convo_data[num2];
	// 		params.convo_snippets.push({
	// 			q1_id: convo1.QID,
	// 			q1:convo1.snippetq,
	// 			a1:convo1.snippeta,
	// 			q2_id: convo2.QID,
	// 			q2:convo2.snippetq,
	// 			a2:convo2.snippeta
	// 		});
	// 	}
	// 	timeline.push({
    //         name: "ai_conversation",
    //         type: "display-slide",
	// 		   display_next_button: false,
    //         template: conversationTemplate,
    //         display_element: $("#ai_convo"),
    //         finish: function(){
	// 			var convo_data = {
	// 				convo: params.convo_data,
	// 				time_elapsed: getSlideTime()
	// 			}
    //         	LITW.data.submitStudyData(convo_data);
    //         }
    //     });


	// 	// IMPRESSIONS QUESTIONNAIRE
		timeline.push({
            name: "ai_impressions",
            type: "display-slide",
            template: impressionsTemplate,
			display_next_button: false,
            display_element: $("#impressions"),
            finish: function(){
            	let impressions_data = {
					impressions: params.impressions_data,
					time_elapsed: getSlideTime()
				}
            	LITW.data.submitStudyData(impressions_data);
            }
        });
	//
	// 	//COMMENTS
	// 	timeline.push({
	// 		type: "display-slide",
	// 		template: commentsTemplate,
	// 		display_next_button: true,
	// 		display_element: $("#comments"),
	// 		name: "comments",
	// 		finish: function(){
	// 			var comments = $('#commentsForm').alpaca().getValue();
	// 			if (Object.keys(comments).length > 0) {
	// 				comments['time_elapsed'] = getSlideTime();
	// 				LITW.data.submitComments(comments);
	// 			}
	// 		}
	// 	});


		//RESULTS
		timeline.push({
			type: "call-function",
			func: function(){
				showResults();
			}
		});
		// ******* END STUDY PROGRESSION ******** //
	}

    function getSlideTime() {
		var data_size = jsPsych.data.getData().length;
		if( data_size > 0 ) {
			return jsPsych.totalTime() - jsPsych.data.getLastTrialData().time_elapsed;
		} else {
			return jsPsych.totalTime();
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

	function showResults() {
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
		$("#results-footer").html(resultsFooter(
			{
				share_url: "https://labinthewild.org",
				share_title: $.i18n('litw-irb-header'),
				share_text: $.i18n('litw-template-title'),
				more_litw_studies: [{
					study_url: "https://labinthewild.org/studies/peripheral-vision/",
					study_logo: "http://labinthewild.org/images/virtual-chinrest.jpg",
					study_slogan: $.i18n('litw-more-study1-slogan'),
					study_description: $.i18n('litw-more-study1-description'),
				},
				{
					study_url: "https://labinthewild.org/studies/formality-security/",
					study_logo: "http://labinthewild.org/images/formality-logo.jpg",
					study_slogan: $.i18n('litw-more-study2-slogan'),
					study_description: $.i18n('litw-more-study2-description'),
				}]
			}
		));
		$("#results").i18n();
		LITW.utils.showSlide("results");
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
	}

	// when the page is loaded, start the study!
	$(document).ready(function() {
		//TODO This methods should be something like act1().then.act2().then...
		//... it is close enough to that... maybe the translation need to be encapsulated next.
		// get initial data from database (maybe needed for the results page!?)
		readSummaryData();

		// detect touch devices
		window.litwWithTouch = ("ontouchstart" in window);

		// determine and set the study language
		$.i18n().locale = 'en'; //LITW.locale.getLocale();
		$.i18n().load({
			'en': 'src/i18n/en.json',
		}).done( function(){
			$('head').i18n();
			$('body').i18n();

			LITW.utils.showSlide("img-loading");
			//start the study when resources are preloaded
			jsPsych.pluginAPI.preloadImages( params.preLoad,
				function() {
					//TODO: This is a strange place to put this file loading!
					d3_csv.csv("src/i18n/conversations-en.csv").then(function(data) {
						params.convo_data = data;
						initStudy();
						configureStudy();
						//showIRB(startStudy);
						startStudy();
					});
				},

				// update loading indicator
				function(numLoaded) {
					$("#img-loading").html(loadingTemplate({
						msg: $.i18n("litw-template-loading"),
						numLoaded: numLoaded,
						total: params.preLoad.length
					}));
				}
			);
		});
	});
	exports.study = {};
	exports.study.params = params

})( window.LITW = window.LITW || {} );


