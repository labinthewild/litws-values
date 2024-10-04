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

window.$ = require("jquery");
window.jQuery = window.$;
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("jquery-ui-bundle");
let Handlebars = require("handlebars");
window.$.alpaca = require("alpaca");
window.bootstrap = require("bootstrap");
window._ = require("lodash");
import * as d3_csv from "d3-fetch";

// var LITW_STUDY_CONTENT= require("./src/data");
//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "../templates/progress.html";
Handlebars.registerPartial('prog', Handlebars.compile(progressHTML));
import introHTML from "./pages/introduction.html";
import irb_LITW_HTML from "../templates/irb2-litw.html";
import demographicsHTML from "../templates/demographics.html";
import loadingHTML from "../templates/loading.html";
import resultsHTML from "./pages/resultsValuesMap.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";
import valuesHTML from "./pages/values.html";
import convoHTML from "./pages/ai_conversation.html";
import impressionHTML from "./pages/postStudyQuest.html";

require("../js/litw/jspsych-display-slide");
//CONVERT HTML INTO TEMPLATES
let introTemplate = Handlebars.compile(introHTML);
let irbLITWTemplate = Handlebars.compile(irb_LITW_HTML);
let demographicsTemplate = Handlebars.compile(demographicsHTML);
let loadingTemplate = Handlebars.compile(loadingHTML);
let resultsTemplate = Handlebars.compile(resultsHTML);
let resultsFooterTemplate = Handlebars.compile(resultsFooterHTML);
let commentsTemplate = Handlebars.compile(commentsHTML);
let valuesTemplate = Handlebars.compile(valuesHTML);
let conversationTemplate = Handlebars.compile(convoHTML);
let impressionsTemplate = Handlebars.compile(impressionHTML);

module.exports = (function(exports) {
	const study_times= {
			SHORT: 5,
			MEDIUM: 10,
			LONG: 15,
		};
	let timeline = [];
	let params = {
		study_id: '57ef9f1a-82a3-4ebf-9d47-10c12c7da10a',
		currentProgress: 0,
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
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
				template: irbLITWTemplate,
				template_data: {
					time: study_times.MEDIUM
				},
				display_element: $("#irb"),
				display_next_button: false
			},
			DEMOGRAPHICS: {
				name: "demographics",
				type: "display-slide",
				template: demographicsTemplate,
				template_data: {
					local_data_id: 'LITW_DEMOGRAPHICS'
				},
				display_element: $("#demographics"),
				display_next_button: false,
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.addToLocal(this.template_data.local_data_id, dem_data);
					LITW.data.submitDemographics(dem_data);
				}
			},
			VALUES_Q: {
				name: "values_questionnaire",
				type: "display-slide",
				template: valuesTemplate,
				template_data: {
					progress : {
						value: 0
					}
				},
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
				template_data: {
					progress : {
						value: 0
					}
				},
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
				template_data: {
					progress : {
						value: 0
					}
				},
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
		timeline.push(params.slides.INTRO);
		timeline.push(params.slides.IRB);
		timeline.push(params.slides.DEMOGRAPHICS);
		params.slides.VALUES_Q.template_data.progress.value = 30;
		timeline.push(params.slides.VALUES_Q);
		params.slides.AI_CONVO.template_data.progress.value = 80;
		timeline.push(params.slides.AI_CONVO);
		params.slides.AI_IMPRESSIONS.template_data.progress.value = 100;
		timeline.push(params.slides.AI_IMPRESSIONS);
		timeline.push(params.slides.COMMENTS);
		timeline.push(params.slides.RESULTS);
	}

	function generateAIConversation() {
		_.shuffle(params.convo_data);
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
		$("#results-footer").html(resultsFooterTemplate(
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

	function startStudy() {
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
		// initiate pages timeline
		jsPsych.init({
		  timeline: timeline
		});
	}

	function startExperiment(){
		//TODO These methods should be something like act1().then.act2().then...
		//... it is close enough to that... maybe the translation need to be encapsulated next.
		// get initial data from database (maybe needed for the results page!?)
		//readSummaryData();

		// determine and set the study language
		$.i18n().locale = LITW.locale.getLocale();
		var languages = {
			'en': './i18n/en.json?v=1.0',
			'pt': './i18n/pt-br.json?v=1.0',
		};
		//TODO needs to be a little smarter than this when serving specific language versions, like pt-BR!
		var language = LITW.locale.getLocale().substring(0,2);
		var toLoad = {};
		if(language in languages) {
			toLoad[language] = languages[language];
		} else {
			toLoad['en'] = languages['en'];
		}
		$.i18n().load(toLoad).done(
			function() {
				$('head').i18n();
				$('body').i18n();

				LITW.utils.showSlide("img-loading");
				//start the study when resources are preloaded
				jsPsych.pluginAPI.preloadImages(params.preLoad,
					function () {
						//TODO: This is a strange place to put this file loading!
						d3_csv.csv("i18n/conversations-en.csv").then(function(data) {
							params.convo_data = data;
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


