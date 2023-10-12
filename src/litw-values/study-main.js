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
var introTemplate = require("./pages/introduction.html");
var irbTemplate = require("./pages/irb.html");
var demographicsTemplate = require("./pages/demographics.html");
var valuesTemplate = require("./pages/values.html");
var conversationTemplate = require("./pages/ai_conversation.html");
var impressionsTemplate = require("./pages/postStudyQuest.html");
var taskTemplate = require("./pages/task_spacial.html");
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
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif",
		"./img/mrt_stim_transparent.png","./img/mrt_stimuli.jpg"],
		participant_values: {},
		values_data: null,
		convo_data: null,
		impressions_data: null,
		convo_length_max: 10,
		convo_length_min: 2,
		convo_snippets: [],
		ai_impressions_before_task: false,
		task_length: 5,
		task_answers: {},
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
			TASK: {
				name: "task",
				type: "display-slide",
				template: taskTemplate,
				display_next_button: false,
				display_element: $("#task"),
				finish: function(){
					let task_data= {
						task_answers: params.task_answers
					}
					LITW.data.submitStudyData(task_data);
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
					showResults();
				}
			}
		}
	};


	function configureStudy() {
		generateAIConversation();
		params.ai_impressions_before_task = Math.random()>0.5;
		LITW.data.submitStudyConfig({
			ai_impressions_before_task: params.ai_impressions_before_task,
		});

		// ******* BEGIN STUDY PROGRESSION ******** //
		// timeline.push(params.slides.INTRO);
		// timeline.push(params.slides.IRB);
		// timeline.push(params.slides.DEMOGRAPHICS);
		timeline.push(params.slides.VALUES_Q);
		timeline.push(params.slides.AI_CONVO);

		// //TODO: REMOVE - TASK added alone here for testing!
		// timeline.push(params.slides.TASK);

		if(params.ai_impressions_before_task) {
			timeline.push(params.slides.AI_IMPRESSIONS);
			timeline.push(params.slides.TASK);
		} else {
			timeline.push(params.slides.TASK);
			timeline.push(params.slides.AI_IMPRESSIONS);
		}
		timeline.push(params.slides.COMMENTS);
		timeline.push(params.slides.RESULTS);
		// ******* END STUDY PROGRESSION ******** //
	}

	function generateAIConversation() {
		for (let counter = 0; counter < params.convo_length_max; counter++ ){
			let num1 = Math.floor(Math.random() * params.convo_data.length);
			let num2 = num1;
			while(num1 == num2){
				num2 = Math.floor(Math.random() * params.convo_data.length);
			}
			let convo1 = params.convo_data[num1];
			let convo2 = params.convo_data[num2];
			params.convo_snippets.push({
				q1_id: convo1.QID,
				q1:convo1.snippetq,
				a1:convo1.snippeta,
				q2_id: convo2.QID,
				q2:convo2.snippetq,
				a2:convo2.snippeta
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

	function showResults() {
		if(Object.keys(params.task_answers).length==0){
			//TEST DATA
			params.task_answers = JSON.parse('{' +
				'"T0_A1":{"answer":[1,2],"correct":true,"time":4204},"T0_AI":{"answer":[1,2],"correct":true,"time":4204},"T0_A2":{"answer":[1,2],"correct":true,"time":4679},' +
				'"T2_A1":{"answer":[1,2],"correct":false,"time":13019},"T2_AI":{"answer":[1,4],"correct":true,"time":13019},"T2_A2":{"answer":[1,4],"correct":true,"time":38018},' +
				'"T10_A1":{"answer":[1,2],"correct":false,"time":17242},"T10_AI":{"answer":[2,4],"correct":false,"time":17242},"T10_A2":{"answer":[1,4],"correct":true,"time":9198},' +
				'"T14_A1":{"answer":[1,2],"correct":false,"time":14307},"T14_AI":{"answer":[1,4],"correct":true,"time":14308},"T14_A2":{"answer":[1,4],"correct":true,"time":9472},' +
				'"T1_A1":{"answer":[1,2],"correct":false,"time":25247},"T1_AI":{"answer":[1,2],"correct":false,"time":25247},"T1_A2":{"answer":[1,2],"correct":false,"time":13361},' +
				'"T15_A1":{"answer":[1,2],"correct":false,"time":21005},"T15_AI":{"answer":[2,4],"correct":true,"time":21005},"T15_A2":{"answer":[2,4],"correct":true,"time":14367}' +
			'}');
		}

		let user_responses = Object.keys(params.task_answers).filter(function(elem){return elem.includes('A1')});
		let results_data = {
			correct_a1: 0,
			correct_ai: 0,
			agreed: 0,
			ai_helped: 0,
			ai_wronged: 0
		}
		for(let r of user_responses) {
			let a1 = params.task_answers[r];
			let a2 = params.task_answers[r.replace('A1','A2')];
			let ai = params.task_answers[r.replace('A1','AI')];
			if(a1.correct) results_data.correct_a1++;
			if(ai.correct) results_data.correct_ai++;
			if(a2.correct == ai.correct) results_data.agreed++;
			if(a1.correct && !ai.correct && !a2.correct) results_data.ai_wronged++;
			if(!a1.correct && ai.correct && a2.correct) results_data.ai_helped++;
		}
		let r_data = {
			results: results_data
		}
		if('PID' in params.URL) {
			r_data.code = LITW.data.getParticipantId();
		}
		$("#results").html(resultsTemplate(r_data));
		addResultsFooter();
		$("#results").i18n();
		LITW.utils.showSlide("results");
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
		//readSummaryData();

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


