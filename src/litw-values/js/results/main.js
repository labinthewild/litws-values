(function(exports) {

    const SECU_MEAN = [7.35750294, 0.08308678, 3.27605317, 1.51743886, 1.46345273]
    const SECU_STD = [11.3292115, 1.52101328, 8.64108833, 0.81675053, 0.75795818]
    const SECU_SCL = [3.36588941, 1.23329367, 2.93957282, 0.90374251, 0.87060794]
    const SECU_COMP = [-0.53685626, 0.49997485, 0.49865675, 0.33219126, 0.32062583]
    const SELE_MEAN = [1.57252634, 1.84430928, 3.37772271, 2.10682086, 1.68548972]
    const SELE_STD = [1.82679795, 0.58288413, 11.96037179, 1.03887591, 0.41164372]
    const SELE_SCL = [1.3515909, 0.76346848, 3.45837705, 1.01925262, 0.64159467]
    const SELE_COMP = [0.18075215, -0.2549749, 0.63375434, -0.58819779, -0.39331318]

    var calculate_values_components = function(values_quest_responses) {
        let secular = [];
        let self_expression = [];

        //ORDERED BY LOADING FACTORS
        // SECULAR = ['Q164', 'Y003', 'Q184', 'Q254', 'Q45']
        //q1 - WVS:Q164 / F063 How important is God in your life
        secular.push(parseFloat(values_quest_responses['q1']));
        // WVS:Y003 Autonomy Index
        // q8 - Important Child qualities
        // ANSWERS: gm(WVS:Q7);ind(WVS:Q8);hw(WVS:Q9);for(WVS:Q10);img(WVS:Q11);tnrfop(WVS:Q12);
        //          tsmnt(WVS:Q13);dnp(WVS:Q14);rf(WVS:Q15);uns(WVS:Q16);obd(WVS:Q17)
        let y003 = -5;
        values_quest_responses['q8'].includes('rf') ? y003 += 1 : y003 += 2;
        values_quest_responses['q8'].includes('obd') ? y003 += 1 : y003 += 2;
        values_quest_responses['q8'].includes('ind') ? y003 -= 1 : y003 -= 2;
        values_quest_responses['q8'].includes('dnp') ? y003 -= 1 : y003 -= 2;
        secular.push(parseFloat(y003));
        //q4 - WVS:Q184 / F120 Justifiable: abortion
        secular.push(parseFloat(values_quest_responses['q4']));
        //q7 - WVS:Q254 / G006 Nationalism / How proud of nationality
        secular.push(parseFloat(values_quest_responses['q7']));
        //q9 - WVS:Q45 / E018 Future changes: Greater respect for authority
        secular.push(parseFloat(values_quest_responses['q9']));
        console.log(`Secular: ${secular}`);

        // SELF_EXPRESSION = ['Y002', 'Q46', 'Q182', 'Q209', 'Q57']
        // WVS:Y002 Post-Materialist index 4-item
        //    q10 - WVS:Q154 Aims of country: first choice
        //    q11 - WVS:Q155 Aims of country: second choice
        let y002 = 2;
        if (values_quest_responses['q10'] === '1' && values_quest_responses['q11'] === '3') y002 = 1;
        if (values_quest_responses['q10'] === '3' && values_quest_responses['q11'] === '1') y002 = 1;
        if (values_quest_responses['q10'] === '2' && values_quest_responses['q11'] === '4') y002 = 3;
        if (values_quest_responses['q10'] === '4' && values_quest_responses['q11'] === '2') y002 = 3;
        self_expression.push(parseFloat(y002));
        //q5 - WVS:Q46 / A008 Feeling of happiness
        self_expression.push(parseFloat(values_quest_responses['q5']));
        //q2 - WVS:Q182 / F118 Justifiable: homosexuality
        self_expression.push(parseFloat(values_quest_responses['q2']));
        //q3 - WVS:Q209 / E025 Political action: signing a petition
        self_expression.push(parseFloat(values_quest_responses['q3']));
        //q6 - WVS:Q57 / A165 Most people can be trusted
        self_expression.push(parseFloat(values_quest_responses['q6']));
        console.log(`Self-Expression: ${self_expression}`);

        return {
            SECU: secular,
            SELE: self_expression
        }
    }

    var calculate_values_score = function (secular, self_expression) {

        let secular_scaled = _.zipWith(secular,SECU_MEAN, _.subtract);
        secular_scaled = _.zipWith(secular_scaled,SECU_STD, _.divide);
        secular_scaled = _.zipWith(secular_scaled,SECU_SCL, _.multiply);
        console.log(`SECU_SCALED: ${secular_scaled}`);
        let self_exp_scaled = _.zipWith(self_expression, SELE_MEAN, _.subtract);
        self_exp_scaled = _.zipWith(self_exp_scaled, SELE_STD, _.divide);
        self_exp_scaled = _.zipWith(self_exp_scaled, SELE_SCL, _.multiply);
        console.log(`SELE_SCALED: ${self_exp_scaled}`);

        let secular_value = _.sum(_.zipWith(secular_scaled, SECU_COMP, _.multiply));
        let self_exp_value = _.sum(_.zipWith(self_exp_scaled, SELE_COMP, _.multiply));

        return {
            SELE:self_exp_value,
            SECU:secular_value
        };
    }

    var test_calculate_values_score = function() {
        let u1_result = [3.674299, 2.277671]
        let u1_secu = [1, 2, 10, 3, 2];
        let u1_sele = [2, 2, 10, 1, 1];
        let u1_score = calculate_values_score(u1_secu,u1_sele);
        let u1_test = (Math.abs(u1_score.SECU-u1_result[0]) < 0.000001) && (Math.abs(u1_score.SELE-u1_result[1]) < 0.000001)
        return u1_test;
    }

    var build_values_map = function (element_id, participant_SECU, participant_SELE) {
        // set the dimensions and margins of the graph
        const map_margin = {top: 10, right: 30, bottom: 40, left: 60};
        const map_width = window.screen.width / 1.6 - map_margin.left - map_margin.right;
        const map_height = window.screen.height / 1.6 - map_margin.top - map_margin.bottom;

        var labelArray = []
        var anchorArray = []

        const svg = d3.select(`#${element_id}`)
            .append("svg")
            .attr("width", map_width + map_margin.left + map_margin.right)
            .attr("height", map_height + map_margin.top + map_margin.bottom)
            .append("g")
            .attr("transform", `translate(${map_margin.left}, ${map_margin.top})`);

        //Read the data
        d3.csv(document.getElementById('file-src').value).then(function (data) {
            // Add X axis
            const x = d3.scaleLinear()
                .domain([-1.13, 2.0])
                .range([0, map_width]);

            // Add Y axis
            const y = d3.scaleLinear()
                .domain([-1.3, 2.3])
                .range([map_height, 0]);

            svg.append("text")
                .attr("text-anchor", "end")
                .attr("x", map_width / 2 + map_margin.left + 100)
                .attr("y", map_height + map_margin.top + 25)
                .attr("font-size", 18)
                .text('Survival vs. Self-expression Values ⟶')
                .style("fill", "#777");

            svg.append("text")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("y", -map_margin.left + 20)
                .attr("x", -map_margin.top - map_height / 2 + 180)
                .attr("font-size", 18)
                .text('Traditional vs. Secular Values ⟶')
                .style("fill", "#777");

            var curve = d3.line().curve(d3.curveNatural);
            var colorset = {}
            var legendCounter0 = 0

            Object.keys(colorset).forEach(function (d) {
                svg.append("circle").attr("cx", map_width - 200).attr("cy", map_height - 230 + legendCounter0).attr("r", 5).style("fill", d).attr("opacity", 0.7)
                svg.append("text").attr("x", map_width - 200 + 15).attr("y", map_height - 230 + 4 + legendCounter0).text(colorset[d]).style("font-size", "14px").attr("alignment-baseline", "middle").attr("opacity", 0.7)
                legendCounter0 = legendCounter0 + 20
            })

            var color = d3.scaleOrdinal(d3.schemeCategory10);

            // Add dots
            var gdots = svg.selectAll("g.dot")
                .data(data)
                .enter().append('g');

            gdots.append("circle")
                .attr("cx", function (d) {
                    return x(d.self_expression);
                })
                .attr("cy", function (d) {
                    return y(d.secular);
                })
                .attr("r", function (d) {
                    return 5
                })
                .attr("opacity", 0.6)
                .style("fill", d => color(d.sphere))
                .style("visibility", function (d) {
                    if (d.sphere == "Language Model") {
                        return "hidden"
                    }
                })

            // USA,0.3873945089524334,0.9329667409602215,English-Speaking,English-Speaking
            let participantX = x(participant_SELE);
            let participantY = y(participant_SECU);
            gdots.append("circle")
                .attr("cx", function (x) {
                    return participantX;
                })
                .attr("cy", function (y) {
                    return participantY;
                })
                .attr("r", function (d) {
                    return 6
                })
                .attr("opacity", 1)
                .attr("stroke-width", 5)
                .attr("stroke", "red")
                .style("fill", "none")

            gdots.append("text")
                .text("You are here!")
                .attr("x", function (x) {
                    return participantX;
                })
                .attr("y", function (d) {
                    return (participantY - 14);
                })
                .style("font-size", "15px")
                .style("fill", "red")
                .attr("text-anchor", "middle")


            gdots.append("circle")
                .attr("cx", function () {
                    return x("0.75")
                })
                .attr("cy", function () {
                    return y("0.65")
                })
                .attr("r", function (d) {
                    return 6
                })
                .attr("opacity", 1)
                .attr("stroke-width", 5)
                .attr("stroke", "red")
                .style("fill", "orange")

            gdots.append("text")
                .text("AI is here!")
                .attr("x", function (d) {
                    return (x("0.75"));
                })
                .attr("y", function (d) {
                    return (y("0.65") - 14);
                })
                .style("font-size", "15px")
                .style("fill", "red")
                .attr("text-anchor", "middle")

            var nested = d3
                .nest()
                .key(function (d) {
                    return d.sphere_out;
                })
                .rollup(function (d) {
                    return d.map(function (v) {
                        return [x(v.self_expression), y(v.secular)];
                    });
                })
                .entries(data);

            nested = nested.filter(d => d.key !== "Language Model")
            nested = nested.filter(d => d.key !== "None")


            var polys = svg.append("g")
                .attr("class", "hulls")
                .selectAll("polygon")
                .data(nested)
                .enter()
                .append('g')

            var legendCounter = 0
            nested.forEach(function (d) {
                var poly = d3.polygonHull(d.value)

                var polyp = poly
                polyp.push(polyp[0], polyp[1])

                svg
                    .append('path')
                    .attr('d', curve(polyp))
                    .attr("opacity", 0.1)
                    .attr("stroke-width", 50)
                    .attr("stroke-linejoin", "round")
                    .attr("fill", color(d.key))
                    .attr("stroke", color(d.key));

                if (poly != null) {

                    svg.append("circle").attr("cx", map_width - 200).attr("cy", map_height - 170 + legendCounter).attr("r", 5).style("fill", color(d.key)).attr("opacity", 0.7)
                    svg.append("text").attr("x", map_width - 200 + 15).attr("y", map_height - 170 + 4 + legendCounter).text(d.key).style("font-size", "14px").attr("alignment-baseline", "middle").attr("opacity", 0.7)
                    legendCounter = legendCounter + 20

                }
            })

            gdots.append("text")
                .text(function (d) {
                    return d.country
                })
                .attr("x", function (d) {
                    return (x(d.self_expression) + 7);
                })
                .attr("y", function (d) {
                    return (y(d.secular) + 4);
                })
                .style("font-size", "11px")
                .style("fill", function (d) {
                    if (d.sphere == "Language Model") {
                        return "#7f6b00"
                    } else {
                        return "#aaa"
                    }
                })
                .style("z-index", function (d) {
                    if (d.sphere == "Language Model") {
                        return 10
                    } else {
                        return 5
                    }
                })
                .style("font-weight", function (d) {
                    if (d.sphere == "Language Model") {
                        return "normal"
                    } else {
                        return "normal"
                    }
                });

        })
    }
	exports.results = {};
	exports.results.buildMap = build_values_map;
    exports.results.calculateValuesComponents = calculate_values_components;
    exports.results.calculateValuesScores = calculate_values_score;

})( window.LITW = window.LITW || {} );
