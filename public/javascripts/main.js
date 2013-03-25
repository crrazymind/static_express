"use strict"
jQuery(function(){
	var options = {
		secondsToShow : 350,
		data : {x:[], y:[]}
	};
	var chart = new CurrencyChart(options);
	chart.start(document.getElementById('chart-element'), 1000);

	$.ajax({
		url: "/getData"
	}).done(function(data) {
		options.data = data;
		chart.refresh(options);
	});
	setInterval(function(){
		$.ajax({
			url: "/getData"
		}).done(function(data) {
			options.data = data;
			chart.refresh(options);
		});
	},1000);

	var sel = $(".period-choose");
	sel.on('change', function(){
		options.secondsToShow = $(this).val();
		chart.refresh(options);
	});
});