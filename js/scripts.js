/*--- USEFUL FUNCTIONS ---*/
	/* Checks the value type (class):
	**/
	function checkClass(value){
		return Object.prototype.toString.apply(value).slice(8, -1).toLowerCase();
	}

	/* The number of days in the month:
	 * {param} Date date - must contain at least a year and a month.
	**/
	function daysInMonth(date){
		if(checkClass(date) !== 'date'){
			throw new Error('Argument must be in a Date format!');
		}

		var thisMonth = date.getMonth(),
			thisYear = date.getFullYear();

		return new Date(thisYear, thisMonth + 1, 0).getDate();
	}

	/* The list of the DOM-element classes as an array:
	 * {param} DOM DOMElement - DOM-element.
	**/
	function classToArray(DOMElement){
		if(!DOMElement){
			throw new Error('DOM-element does not exist');
		}

		return DOMElement.className.split(' ');
	}

	/* Add a new class/classes to the DOM element:
	 * {param} DOM DOMElement - DOM-element.
	 * {param} string classes - class or classes through whitespace.
	**/
	function addClass(DOMElement, classes){
		var elClasses = DOMElement.className;

		elClasses = classToArray(DOMElement);
		classes = classes.split(' ');

		for(var i = 0; i < classes.length; i++){
			for(var j = 0; j < elClasses.length && classes[i] !== elClasses[j]; j++){
				if(elClasses[i] === ''){
					elClasses.splice(i, 1);
				}
				elClasses.push(classes[i]);
			}
		}

		DOMElement.className = elClasses.join(' ');
	}

	/* Remove class/classes from the element:
	 * {param} DOM DOMElement - DOM-element.
	 * {param} string classes - class or classes through whitespace.
	**/
	function removeClass(DOMElement, classes){
		var elClasses = DOMElement.className;

		elClasses = classToArray(DOMElement);
		classes = classes.split(' ');

		for(var i = 0; i < classes.length; i++){
			for(var j = 0; j < elClasses.length; j++){
				if(classes[i] === elClasses[j]){
					elClasses.splice(j, 1);
				}
			}
		}

		DOMElement.className = (elClasses.length > 1) ? elClasses.join(' ')
								: ( (elClasses[0]) || '');
	}


/*--- COMPONENT "VIEW" ---:
 * {param} Date date - the date from which to render the calendar
**/
function DCView(date){
	if(date !== undefined && checkClass(date) !== 'date'){
		throw new Error('Argument must be in a Date format!');
	}

	// The date which initializes the calendar (readonly!)
	this._date = date || new Date();

	// The date for the current rendered YYYY-MM view (changes while clicking on the "Prev/Next" buttons):
	this._currentDate = this._date;

	// The active date and it's class name
	this._activeDate;
	this._activeDateClass = 'calendar_cell_active';

	this._monthsEn = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	// Table rows (weeks)
	this._tRows = Array.prototype.slice.apply(document.getElementById('t_1').rows, [1, 7]);

	// Highlighted cell
	this._highLightedCell;
}

/* Draw the whole view of the calendar:
 * {param} date - required date, must contain at least a year and a month.
**/
DCView.prototype.renderCalendar = function(date){
	if(date === undefined){
		date = this._currentDate;
	}
	if(date !== undefined && checkClass(date) !== 'date'){
		throw new Error('Argument must be in a Date format!');
	}

	var thisYear = date.getFullYear(),
		thisMonth = date.getMonth(),
		thisMonthDays = daysInMonth(date),
		previousMonthDays = daysInMonth(new Date(thisYear, thisMonth - 1)),
		thisMonthStartWeekDay = new Date(thisYear, thisMonth, 1).getDay() - 1;

	if(thisMonthStartWeekDay < 0){
		thisMonthStartWeekDay = 6;
	}

	var visibleRows = Math.ceil( (thisMonthDays + thisMonthStartWeekDay) / 7),
		startNum = previousMonthDays - thisMonthStartWeekDay + 1,
		thisCell;

	// Renew the current date
	this._currentDate = date;

	// Show the year and the month text in the heading
	document.getElementById('calendar_hd').innerHTML = thisYear + ' ' + this._monthsEn[thisMonth];

	// Show hidden rows (required for the rendering without the page reload):
	this._tRows.forEach(function(item, i){
		if(item.style.display == 'none'){
			item.style.display = '';
		}
	});

	// Hide unnecessary rows (if number of days is little enough)
	for(var row = visibleRows; row < this._tRows.length; row++){
		this._tRows[row].style.display = 'none';
	}

	// Fill in cells with date numbers
	for(var w = 0; w < visibleRows; w++){
		for(var d = 0; d < 7; d++){
			thisCell = this._tRows[w].cells[d];

			if(thisCell.className){
				thisCell.className = '';
			}
			if( (w === 0 && startNum > previousMonthDays)
			|| (w === visibleRows - 1 && startNum > thisMonthDays) ){
				startNum = 1;
			}
			if( (w === 0 && startNum <= previousMonthDays && startNum > 7)
			|| (w === visibleRows - 1 && startNum >= 1 && startNum < 7) ){
				thisCell.className = 'calendar_previous';
			}

			thisCell.innerHTML = startNum++;
		}
	}

	// Highlight the initial date
	if( thisYear == this._date.getFullYear() && thisMonth == this._date.getMonth() ){
		this.highlightDate(this._date, 'calendar_cell_initial');
	}
	// Highlight the active date
	if( checkClass(this._activeDate) === 'date'
		&& thisYear == this._activeDate.getFullYear()
		&& thisMonth == this._activeDate.getMonth()
		){
		this.highlightDate(this._activeDate, this._activeDateClass);
	}
}

/* Change the months to previous or next + render the calendar view:
 * {param} boolean next - whether next or previous.
**/
DCView.prototype.changeMonth = function(next){
	var year = this._currentDate.getFullYear(),
		month = this._currentDate.getMonth(),
		newMonth = next ? month + 1 : month - 1;

	this.renderCalendar(new Date(year, newMonth));
}

/* Find the table cell for the day of the given date (in the current view only):
 * {param} date date - required date.
**/
DCView.prototype.findDayCell = function(date){
	if(checkClass(date) !== 'date'){
		throw new Error('Argument must be in a Date format!');
	}
	var year = date.getFullYear(),
		month = date.getMonth(),
		monthDay = date.getDate(),		// 1 - 31
		dayCell = date.getDay() - 1;
		if(dayCell < 0){
			dayCell = 6;				// 0 - 6
		}

	// The year and month of the given date must be the same as of the current date
	if(year !== this._currentDate.getFullYear() || month !== this._currentDate.getMonth() ){
		return null;
	}
	var dayWeek = Math.ceil( (monthDay + ( 6 - dayCell) ) / 7) - 1;
	return this._tRows[dayWeek].cells[dayCell];
}

/* Highlights the cell with given date (in the current view only):
 * {param} date date - required date;
 * {param} string className - the name of the class for the hightlighted date cell;
 * {param} optional boolean isActive - whether the date is marked as active.
**/
DCView.prototype.highlightDate = function(date, className){
	if(checkClass(date) !== 'date'){
		throw new Error('Argument must be in a Date format!');
	}
	var cell = this.findDayCell(date);

	if(this._highLightedCell){
		removeClass(this._highLightedCell, className);
	}
	this._highLightedCell = cell;
	addClass(this._highLightedCell, className);

	// If the date is active, remember it and its CSS class
	if(arguments[2] === true){
		this._activeDate = date;
		this._activeDateClass = className;
	}
}


/*--- COMPONENT "CONTROLLER" ---*/
function DCCalendar(date){
	date = date || new Date();
	var view = new DCView(date);

	this.init = function(){
		view.renderCalendar();

		// Return to the previous month
		document.getElementById('calendar_slide').onclick = function(){
			view.changeMonth(false);
			return false;
		}
		// Move to the next month
		document.getElementById('calendar_slide_2').onclick = function(){
			view.changeMonth(true);
			return false;
		}

		// Form
		document.getElementById('f_1').onsubmit = function(){
			var d = document.getElementById('f_1_date').value,
				className = document.getElementById('f_1_class').value || 'calendar_cell_active',
				pos = d.search(/\b\d\d\d\d-\d\d-\d\d\b/),
				clPos = className.search(/\d/);

			if(pos === -1){
				alert('Please, give the date as "YYYY-MM-DD"');
				return false;
			}
			if(clPos === 0){
				alert('Please, begin the class name from a letter, not a number');
				return false;
			}
			date = new Date(d.slice(pos, pos + 10));

			// Render the view for the active date
			view.renderCalendar(date);

			// Highlight and save the active date;
			view.highlightDate(date, className, true);

			return false;
		}
	}
};


// Start only if the whole document is loaded
window.onload = function(){
	// The current date on default
	var calendar = new DCCalendar();

	calendar.init();
}