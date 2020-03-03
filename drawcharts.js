const WIDTH = 0.5 * window.innerWidth
const HEIGHT = (10/16) * WIDTH //aspect ratio 16 : 10


var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = WIDTH - margin.left - margin.right,
    height = HEIGHT - margin.top - margin.bottom;


//labels are shown depending upon the type of property
var labels = {
	"revenue" : " (million $)",
	"revenue_change" : " (%)",
	"profits" : " (million $)",
	"expenses" : " (million $)",
	"profit_change" : " (%)",
	"revenue" : " (million $)",
	"assets" : " (million $)",
	"market_value" : " (million $)",
}

//the main class which can create all the charts
class DrawCharts{
	constructor(){
		this.data = null
		this.props = null
		this.loadData()
	}
	//Renders all the properties our data into the column on the left 
	renderLi(text, i){

		let li = document.createElement("li");
		li.innerHTML = this.getDisplayText(text)
		document.getElementById("children-list").appendChild(li)

		//on cliking
		li.onclick = () => {
			var type_of_property = typeof this.data[0][text]
			if(type_of_property === "number"){
				this.drawHist(text)
			}
			else if(type_of_property === "string"){
				this.drawBar(text)
			}

			//change header
			document.getElementById('chart-type').innerHTML = this.getDisplayText(text)
		}
	}

	//called from saveData method
	createLi(){
		for(let i = 0; i < this.props.length; i++){
			if(this.props[i] != "title" && this.props[i] != "rank"){
				this.renderLi(this.props[i], i)
			}
		}


		//add active and remove for rest
		var lis = document.getElementsByTagName('li')
		var _this = this

		for(let i = 0; i < lis.length; i++){
			lis[i].addEventListener("click", ()=>{
				_this.myLiClick(this)
				lis[i].classList.add('active');
			})
		}
	}

	//ads the click functionality, so that clicking on then renders the charts.
	myLiClick(elem) {
	    var li = document.getElementsByTagName('li')
	    for (var i = 0; i < li.length; i++) {
	        li[i].classList.remove('active');
	    }
	}

	//splits the property string for display
	getDisplayText(s){
		return s.split('_').join(' ')
	}

	//loads data from csv and calls saveData
	loadData(){

		var _this = this
		d3.csv("fortune_1000.csv", function(err, data) {

			if(err){
				alert("some problem with the data!");
				return
			}
			//pre process data
			data.forEach(function(d) {
		        d.rank = +d.rank;
		        d.rank_change = +d.rank_change;
		        d.revenue = +d.revenue.split(',').join("")
		        d.revenue_change = +d.revenue_change.slice(0,-1)
		        d.profits = +d.profits.split(',').join("")
		        d.expenses = +d.expenses.split(',').join("")
		        d.profit_change = +d.profit_change.slice(0,-1)
		        d.assets = +d.assets.slice(1).split(',').join("")
		        d.market_value = +d.market_value.slice(1).split(',').join("")
		        d.employees = +d.employees.split(',').join("")
		        // d.market_value = +d.market_value.slice(1).split(',').join("")
		    });
			_this.saveData(data)
		});
	}

	//saves data and creates li's
	saveData(data){
		this.data = data
		this.props = Object.keys(data[0])
		this.createLi()
		d3CSVCallback()
		// addActiveLiStates
	}

	//main function to draw histograms
	drawHist(prop){

		//force remove if any revious exists
		d3.select("svg").remove();
		document.getElementById("slidecontainer").style.display = "block";

		var svg = d3.select("#chart")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var _this = this;

		var x_doma_min = d3.min(this.data, function(d) { return d[prop] })
		var x_doma_max = d3.max(this.data, function(d) { return d[prop] })
		var x = d3.scaleLinear()
			.domain([x_doma_min, x_doma_max])
			.range([0, width]);

		//append 
		svg.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x));

		// y scale linear
		// NOTE! DOMAIN is BINS - set later
		var y = d3.scaleLinear()
			.range([height, 0]);

		var yAxis = svg.append("g")


		//axis labels
		// // text label for the x axis
		var xlabel = this.getDisplayText(prop).concat(labels[prop] ? labels[prop] : '')
		svg.append("text")             
			.attr("transform",
			"translate(" + (width + 10 ) + " ," + 
			   (height + margin.top - 5) + ")")
			.style("text-anchor", "start")
			.text(xlabel)

		// text label for the y axis
		svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -15 - margin.left)
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("number of companies");

		// A function that builds the graph for a specific value of bin
		function updateHist(n_bins) {

			// set the parameters for the histogram
			var histogram = d3.histogram()
				.value(function(d) { return d[prop]; })
				.domain(x.domain())  // then the domain of the graphic
				.thresholds(x.ticks(n_bins)); // then the numbers of bins

			var bins = histogram(_this.data);

			var y_domn_max = d3.max(bins, function(d) { return d.length; })
			var y_domn_min = d3.min(bins, function(d) { return d.length; })
			// update domain
			y.domain([y_domn_min,y_domn_max]);   // d3.hist has to be called before the Y axis obviously
			yAxis
				.transition()
				.duration(1000)
				.call(d3.axisLeft(y));

			// create bars
			var bars = svg.selectAll("rect")
				.data(bins)

			//update/create/destroy bars - d3 merge takes care of it

			var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([-10, 0])
			.html(function(d,i) {
				return `<div class="tool-tip"><strong>count</strong><span>${d.length}</span></div>`;
			})
			
			svg.call(tip);

			bars
				.enter()
				.append("rect")
				.on("mouseover", function(d,i){
					tip.show(d,i)
					_this.handleMouseOver(d,i,this, "hist")
				})
	          	.on("mouseout", function(d,i){
	          		tip.hide(d,i)
	          		_this.handleMouseOut(d,i,this, "hist")
	          	})
				.merge(bars)
				.transition()
				.duration(1000)
				.attr("x", 1)
				.attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
				.attr("width", function(d) { 
					if(x(d.x1) - x(d.x0) - 6 < 0){
						return 0
					}
					return x(d.x1) - x(d.x0) - 6 ; 
				})
				.attr("height", function(d) { return height - y(d.length); })
				.style("fill", "#00a8ff")

			// If less bar in the new histogram, I delete the ones not in use anymore
			bars.exit().remove()
		}

		updateHist(12)

		// Listen to the button -> update if user change it
		d3.select("#n_bins").on("input", function() {
			updateHist(+this.value);
			// document.getElementById("n_bins_value").innerHTML = this.value;
		});
	}


	//main functionn to draw bar charts
	drawBar(prop){

		var _this = this
		d3.select("svg").remove();
		document.getElementById("slidecontainer").style.display = "none";

		var svg = d3.select("#chart")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		

		//gets a single colum of required property
		var my_column = this.data.map(d =>{
			return d[prop]
		})

		let data = []
		let added_set = new Set() 

		//creates an object for d3
		for(var i = 0; i < my_column.length; i++){
			var foundIndex = data.findIndex(x => x.prop == my_column[i]);

			if(foundIndex == -1){
				added_set.add(my_column[i])
				data.push({
					prop : my_column[i],
					value: 1,
					color: _this.getPastelColor()
				})

			} else{
				data[foundIndex]['value'] += 1 
			}
		}

		//bar charts are sorted
		data.sort(function(b, a) {
			return a.value - b.value;
		});

		// changes the data such that there are maximum of 12 values
		data = this.makeMax12(data)

		// y domain maximum
		var y_domn_max = data.reduce((x1, x2) => x1['value'] > x2['value'] ? x1 : x2)['value']

		var x = d3.scaleBand()
			.range([ 0, width ])
			.domain(data.map(function(d) { return d.prop; }))
			.padding(0.2);
			svg.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x))
			.selectAll("text")
			.attr("transform", "translate(-10,0)rotate(-45)")
			.style("text-anchor", "end");

		// Add Y axis
		var y = d3.scaleLinear()
			.domain([0, y_domn_max])
			.range([ height, 0]);
			svg.append("g")
			.call(d3.axisLeft(y));

		var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([-10, 0])
			.html(function(d) {
				return `<div class="tool-tip"><strong>value</strong><span>${d.value}</span></div>`;
			})
		svg.call(tip);

		// Bars
		svg.selectAll("mybar")
			.data(data)
			.enter()
			.append("rect")
			.on("mouseover", function(d,i){
				tip.show(d,i)
				_this.handleMouseOver(d,i,this, "bar")
			})
			.on("mouseout", function(d,i){
				tip.hide(d,i)
				_this.handleMouseOut(d,i,this, "bar")
			})
			.attr("x", function(d) { return x(d.prop); })
			.attr("y", function (d, i) {
				return height;
			})
			.attr("width", x.bandwidth())
			.style("fill", function(d) { return d.color; })
			.attr("height", 0)
				.transition()
				.duration(500)
				.delay(function (d, i) {
					return i * 10;
				})
			.attr("y", function(d) { return y(d.value); })
			.attr("height", function(d) { return height - y(d.value); })


		//axis labels
		// // text label for the x axis
		var xlabel = this.getDisplayText(prop).concat(labels[prop] ? labels[prop] : '')
		svg.append("text")             
			.attr("transform",
			"translate(" + (width + 10 ) + " ," + 
			   (height + margin.top - 5) + ")")
			.style("text-anchor", "start")
			.text(xlabel)

		// text label for the y axis
		svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -15 - margin.left)
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("number of companies");
	}

	getPastelColor(){ 

		// let color_pallett = ['#1abc9c', '#3498db', '#9b59b6', '#95a5a6', '#e67e22', '#e74c3c', '#2ecc71', '#f39c12'];
		// return color_pallett[Math.floor(Math.random() * color_pallett.length)]
		return "hsl(" + 360 * Math.random() + ',' +
				(35 + 70 * Math.random()) + '%,' + 
				(65 + 10 * Math.random()) + '%)'
	}

	//helps make max bars to 12
	makeMax12(data){

		var new_data = []

		//data gets changed inside this, which will be appened as others at last
		if(data.length > 12){
			for(var i = 0; i < 12; i++){
				new_data.push(data.shift())
			}

			var others = {
				prop: 'Others',
				value: 0,
				color: this.getPastelColor()
			}

			for(var i = 0; i < data.length; i++){
				others.value += data[i].value
			}

			new_data.push(others)
			return new_data
		}


		return data
	}

	handleMouseOver(d, i, that, chart_type) {  
		// Use D3 to select element, change color and size
		var xPos = +d3.select(that).attr("x")
		var wid = +d3.select(that).attr("width");
		var hei = +d3.select(that).attr("height");
		var yPos = +d3.select(that).attr("y");

		d3.select(that)
			.attr("x", xPos - 2)
			.attr("y", yPos - 4)
			.attr("width", wid + 4)
			.attr("height", hei + 4)
			// .style("fill", "#468a7a")

		if(chart_type == "hist"){
			d3.select(that)
			.style("fill", "#0076b3")
		}
	}

	handleMouseOut(d, i, that, chart_type) {
		// Use D3 to select element, change color and size
		var xPos = +d3.select(that).attr("x")
		var wid = +d3.select(that).attr("width");
		var hei = +d3.select(that).attr("height");
		var yPos = +d3.select(that).attr("y");

		d3.select(that)
			.attr("x", xPos + 2)
			.attr("y", yPos + 4)
			.attr("width",wid - 4)
			.attr("height", hei - 4)
			// .style("fill", "#69b3a2")

		if(chart_type == "hist"){
			d3.select(that)
			.style("fill", "#00a8ff")
		}
	}
}

let myChart = new DrawCharts()

function d3CSVCallback(){
	document.getElementById('chart-type').innerHTML = "Profits"
	myChart.drawHist("profits")
}