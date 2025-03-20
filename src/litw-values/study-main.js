/*************************************************************
 * Main code, responsible for configuring the study steps.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2025 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at info@labinthewild.org
 *************************************************************/

window.LITW = window.LITW || {}
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

import * as litw_engine from "../js/litw/litw.engine.0.1.0";
LITW.engine = litw_engine;
import * as study_results from "./js/results/main.mjs";
LITW.results = study_results;

//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "../templates/progress.html";
Handlebars.registerPartial('prog', Handlebars.compile(progressHTML));
import introHTML from "./pages/introduction.html";
import irb_LITW_HTML from "../templates/irb2-litw.html";
import demographicsHTML from "./pages/demographics.html";
import loadingHTML from "../templates/loading.html";
import resultsHTML from "./pages/resultsValuesMap.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";
import valuesHTML from "./pages/values.html";
import attitudesTowardsAiHTML from "./pages/ai_impressions.html";
import convoHTML from "./pages/ai_conversation.html";
import impressionHTML from "./pages/postStudyQuest.html";

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
let attitudesTowardsAiTemplate = Handlebars.compile(attitudesTowardsAiHTML);
let impressionsTemplate = Handlebars.compile(impressionHTML);

module.exports = (function(exports) {
	const study_times= {
			SHORT: 5,
			MEDIUM: 10,
			LONG: 15,
		};
	let timeline = [];
	let config = {
		study_id: '57ef9f1a-82a3-4ebf-9d47-10c12c7da10a',
		languages: {
			'default': 'en',
			'en': './i18n/en.json?v=1.0',
		},
		currentProgress: 0,
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		participant_values: {},
		values_data: null,
		convo_data: null,
		attitudes_towards_AI_items:null,
		impressions_data: null,
		convo_length_max: 8,
		convo_length_min: 4,
		convo_snippets: [],
		ai_impressions_before_task: false,
		slides: {
			INTRO: {
				name: "introduction",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: introTemplate,
				display_element_id: "introduction",
				display_next_button: false
			},
			IRB: {
				name: "informed_consent",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: irbLITWTemplate,
				template_data: {
					time: study_times.MEDIUM
				},
				display_element_id: "irb",
				display_next_button: false
			},
			DEMOGRAPHICS: {
				name: "demographics",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: demographicsTemplate,
				template_data: {
					local_data_id: 'LITW_DEMOGRAPHICS'
				},
				display_element_id: "demographics",
				display_next_button: false,
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.addToLocal(this.template_data.local_data_id, dem_data);
					LITW.data.submitDemographics(dem_data);
				}
			},
			VALUES_Q: {
				name: "values_questionnaire",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: valuesTemplate,
				template_data: {
					progress : {
						value: 0
					}
				},
				display_element_id: "values",
				display_next_button: false,
				finish: function(){
					let values_data = {
						values: config.values_data
					};
					LITW.data.submitStudyData(values_data);
				}
			},
			AI_CONVO: {
				name: "ai_conversation",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: conversationTemplate,
				template_data: {
					progress : {
						value: 0
					}
				},
				display_next_button: false,
				display_element_id: "ai_convo",
				finish: function(){
					let convo_data= config.convo_data;
					LITW.data.submitStudyData(convo_data);
				}
			},
			AI_IMPRESSIONS: {
				name: "ai_impressions",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: impressionsTemplate,
				template_data: {
					progress : {
						value: 0
					}
				},
				display_next_button: false,
				display_element_id: "impressions",
				finish: function(){
					let impressions_data= {
						ai_impressions: config.impressions_data
					}
					LITW.data.submitStudyData(impressions_data);
				}
			},
			Attitudes_towards_AI: {
				name: "attitudes_towards_AI",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: attitudesTowardsAiTemplate,
				// template_data: {
				// 	progress : {
				// 		value: 0
				// 	}
					
				// },
				display_next_button: false,
				display_element_id: "attitudes_towards_AI",
				finish: function(){
					  let survey_data = $('#survey_template_km').alpaca().getValue();
					  LITW.data.submitStudyData(survey_data);
				  }
        },

			COMMENTS: {
				name: "comments",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "comments",
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
				name: "results",
				display_next_button: false,
				type: LITW.engine.SLIDE_TYPE.CALL_FUNCTION,
				call_fn: function(){
					showResultsValueMap();
				}
			}
		}
	};


	function configureTimeline() {
		generateAIConversation();
		timeline.push(config.slides.INTRO);
		timeline.push(config.slides.IRB);
		timeline.push(config.slides.DEMOGRAPHICS);
		timeline.push(config.slides.Attitudes_towards_AI);
		config.slides.VALUES_Q.template_data.progress.value = 30;
		timeline.push(config.slides.VALUES_Q);
		config.slides.AI_CONVO.template_data.progress.value = 80;
		timeline.push(config.slides.AI_CONVO);
		config.slides.AI_IMPRESSIONS.template_data.progress.value = 100;
		timeline.push(config.slides.AI_IMPRESSIONS);
		timeline.push(config.slides.COMMENTS);
		timeline.push(config.slides.RESULTS);
    return timeline;
	}

	function generateAIConversation() {

		// shuffle question array 
		config.convo_data = _.shuffle(config.convo_data);

		for (let counter = 0; counter < config.convo_length_max; counter++ ){
			let convo = config.convo_data.splice(0,2);
			config.convo_snippets.push({
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
		if(!config.values_data){
  		//TEST DATA
			config.values_data = {q1:"2",q2:"10",q3:"1",q4:"9",q5:"2",q6:"2",q7:"2",q8:[ 'img', 'tnrfop', 'dnp', 'uns' ],q9:"3",q10:"2",q11:"3"};
		}
  
    let secu_sele = LITW.results.calculate_values_components(config.values_data);

		let resultsData = {
			results: LITW.results.calculate_values_score(secu_sele.SECU, secu_sele.SELE)
		}
		if('PID' in LITW.data.getURLparams) {
  		resultsData.code = LITW.data.getParticipantId();
		}

		let recom_studies = [];
		LITW.engage.getStudiesRecommendation(
      config.study_id, (studies) => {recom_studies = studies}
    );
    
    let results_div = $("#results");
		results_div.html(
      resultsTemplate(resultsData)
    );
		
    addResultsFooter();
		results_div.i18n();
		LITW.utils.showSlide("results");
	}

	function addResultsFooter(){
		$("#results-footer").html(
      resultsFooterTemplate({
				share_url: window.location.href,
				share_title: $.i18n('litw-irb-header'),
				share_text: $.i18n('litw-template-title'),
				more_litw_studies: config.study_recommendation
			})
    );
	}

	function bootstrap() {
    d3_csv.csv("i18n/conversations-en.csv").then( (data) => {
  		config.convo_data = data;
		  let good_config = LITW.engine.configure_study(
        config.preLoad, config.languages,
			  configureTimeline(), config.study_id
      );
		  if (good_config){
  			LITW.engine.start_study();
  		} else {
	  		console.error("Study configuration error!");
		  	//TODO fail nicely, maybe a page with useful info to send to the tech team?
		  }
    });
	}
	
  $(document).ready(function() {
		bootstrap();
	});

	exports.study = {};
	exports.study.params = config

})( window.LITW = window.LITW || {} );


