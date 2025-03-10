/*************************************************************
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2024 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at tech@labinthewild.org
 *************************************************************/

// load webpack modules
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

import * as litw_engine from "../js/litw/litw.engine.0.1.0";
LITW.engine = litw_engine;

//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "../templates/progress.html";
Handlebars.registerPartial('prog', Handlebars.compile(progressHTML));
import introHTML from "../templates/introduction.html";
import irbHTML from "../templates/irb.html";
import irb_LITW_HTML from "../templates/irb2-litw.html";
import questHTML from "../templates/questionnaire.html";
import demographicsHTML from "../templates/demographics.html";
import loadingHTML from "../templates/loading.html";
import resultsHTML from "../templates/results.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";

//CONVERT HTML INTO TEMPLATES
let introTemplate = Handlebars.compile(introHTML);
let irbTemplate = Handlebars.compile(irbHTML);
let irbLITWTemplate = Handlebars.compile(irb_LITW_HTML);
let questTemplate = Handlebars.compile(questHTML);
let demographicsTemplate = Handlebars.compile(demographicsHTML);
let loadingTemplate = Handlebars.compile(loadingHTML);
let resultsTemplate = Handlebars.compile(resultsHTML);
let resultsFooterTemplate = Handlebars.compile(resultsFooterHTML);
let commentsTemplate = Handlebars.compile(commentsHTML);

//TODO: document "params.study_id" when updating the docs/7-ManageData!!!
module.exports = (function(exports) {
	const study_times= {
			SHORT: 5,
			MEDIUM: 10,
			LONG: 15,
		};
	let timeline = [];
	let config = {
		languages: {
			'default': 'en',
			'en': './i18n/en.json?v=1.0',
			'pt': './i18n/pt-br.json?v=1.0',
		},
		study_id: "TO_BE_ADDED_IF_USING_LITW_INFRA",
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		slides: {
			INTRODUCTION: {
				name: "introduction",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "intro",
				template: introTemplate,
				display_next_button: false,
			},
			INFORMED_CONSENT: {
				name: "informed_consent",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "irb",
				template: irbTemplate,
				display_next_button: false,
			},
			INFORMED_CONSENT_LITW: {
				name: "informed_consent",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "irb",
				template: irbLITWTemplate,
				template_data: {
					time: study_times.SHORT,
				},
				display_next_button: false,
			},
			QUESTIONNAIRE_1: {
				name: "quest1",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "quest1",
				template: questTemplate,
				display_next_button: false,
			},
			QUESTIONNAIRE_2: {
				name: "quest2",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "quest2",
				template: questTemplate,
				display_next_button: false,
			},
			DEMOGRAPHICS: {
				name: "demographics",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "demographics",
				display_next_button: false,
				template: demographicsTemplate,
				template_data: {
					local_data_id: 'LITW_DEMOGRAPHICS'
				},
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.addToLocal(this.template_data.local_data_id, dem_data);
					LITW.data.submitDemographics(dem_data);
				}
			},
			COMMENTS: {
				name: "comments",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				display_element_id: "comments",
				display_next_button: true,
				template: commentsTemplate,
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
					calculateResults();
				}
			}
		}
	};

	function configureTimeline() {
		timeline.push(config.slides.INTRODUCTION);
		timeline.push(config.slides.INFORMED_CONSENT_LITW);
		timeline.push(config.slides.DEMOGRAPHICS);

		// MUST BE a function because we don't have $.i18() available at configuration time! SHOULD WE?
		config.slides.QUESTIONNAIRE_1.template_data = () => {
			return getQuest1Data('quest1', 50)
		};
		timeline.push(config.slides.QUESTIONNAIRE_1);
		config.slides.QUESTIONNAIRE_2.template_data = () => {
			return getQuest2Data('quest2', './img/cat-computer.png', 100);
		}
		timeline.push(config.slides.QUESTIONNAIRE_2);
		timeline.push(config.slides.COMMENTS);
		timeline.push(config.slides.RESULTS);
		return timeline;
	}

	function getQuest1Data(quest_id, completion) {
		return {
			title: $.i18n(`litw-study-${quest_id}-title`),
			progress: {
				value: completion
			},
			quest_id: quest_id,
			done_button: $.i18n(`litw-study-${quest_id}-save`),
			questions: [1, 2].map((x)=> {
				return {
					id: x,
					text: $.i18n(`litw-study-${quest_id}-q${x}`)
				}
			}),
			responses: [1, 2, 3, 4, 5].map((x)=> {
				return {
					id: x,
					text: $.i18n(`litw-study-quest-a${x}`)
				}
			})
		}
	}

	function getQuest2Data(quest_id, img_url, completion) {
		return {
			title: $.i18n(`litw-study-${quest_id}-title`),
			img_prompt: {
				url: img_url,
				text_before: $.i18n(`litw-study-${quest_id}-prompt`),
			},
			progress: {
				value: completion
			},
			quest_id: quest_id,
			done_button: $.i18n(`litw-study-${quest_id}-save`),
			questions: [1, 2].map((q)=> {
				return {
					id: q,
					text: $.i18n(`litw-study-${quest_id}-q${q}`),
				}
				//ALERT: You can also add responses for each question.
			}),
			responses: [1, 2, 3, 4, 5].map((x)=> {
				return {
					id: x,
					text: $.i18n(`litw-study-quest-a${x}`)
				}
			})
		}
	}

	function calculateResults() {
		//TODO: Nothing to calculate
		let results_data = {}
		showResults(results_data, true)
	}

	//TODO Should be better supported by the ENGINE to setup HTML and show "SLIDE"
	function showResults(results = {}, showFooter = false) {
		let results_div = $("#results");
		let recom_studies = [];
		LITW.engage.getStudiesRecommendation(config.study_id, (studies) => {recom_studies = studies});

		if('PID' in LITW.data.getURLparams) {
			//REASON: Default behavior for returning a unique PID when collecting data from other platforms
			results.code = LITW.data.getParticipantId();
		}

		results_div.html(
			resultsTemplate({
				data: results
			}));
		if(showFooter) {
			$("#results-footer").html(resultsFooterTemplate(
				{
					share_url: window.location.href,
					share_title: $.i18n('litw-irb-header'),
					share_text: $.i18n('litw-template-title'),
					more_litw_studies: recom_studies
				}
			));
		}
		results_div.i18n();
		//TODO Likely move to engine!
		LITW.utils.showSlide("results");
	}

	//TODO Move to LITW.DATA library
	function readSummaryData() {
		$.getJSON( "summary.json", function( data ) {
			//TODO: 'data' contains the produced summary form DB data
			//      in case the study was loaded using 'index.php'
			//SAMPLE: The example code gets the cities of study particpants.
			console.log(data);
		});
	}


	function bootstrap() {
		let good_config = LITW.engine.configure_study(config.preLoad, config.languages,
			configureTimeline(), config.study_id);
		if (good_config){
			LITW.engine.start_study();
		} else {
			console.error("Study configuration error!");
			//TODO fail nicely, maybe a page with useful info to send to the tech team?
		}
	}



	// when the page is loaded, start the study!
	$(document).ready(function() {
		bootstrap();
	});
	exports.study = {};
	exports.study.params = config

})( window.LITW = window.LITW || {} );


