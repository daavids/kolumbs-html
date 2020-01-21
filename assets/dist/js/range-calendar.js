;(function($, window, document, undefined) {
	function Calendar(element, options) {
		/**
		 * Current settings for the calendar.
		 * @public
		 */
		this.settings = null;

		/**
		 * Current options set by the caller including defaults.
		 * @public
		 */
		this.options = $.extend({}, Calendar.Defaults, options);

		/**
		 * Plugin element.
		 * @public
		 */
		this.$element = $(element);

		/**
		 * Currently displayed year.
		 * @protected
		 */
		this._current_year = null;

		/**
		 * Currently displayed month.
		 * @protected
		 */
		this._current_month = null;

		/**
		 * First enabled day timestamp.
		 * @protected
		 */
		this._first_time = null;

		/**
		 * First enabled day object
		 * @protected
		 */
		this._first_time_obj = null;

		/**
		 * Range start and end dates.
		 * @protected
		 */
		this._range_start_time = null;
		this._range_end_time = null;

		/**
		 * Range start and end date objects.
		 * @protected
		 */
		this._range_start_obj = null;
		this._range_end_obj = null;

		/**
		 * Currently suppressed events to prevent them from being retriggered.
		 * @protected
		 */
		this._suppress = {};

		this.initialize();
	}

	Calendar.Defaults = {
		month_count: 1,
		first_day: null, // '2019-05-03'
		range_start: null, // '2019-05-10'
		range_end: null, // '2019-05-25'
		extras: {}, // {'2019-04-01': '129 €'}
		months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
		days_short: ["M", "T", "W", "T", "F", "S", "Su"],
		move_step: 1,
		alt_start_field: null,
		alt_end_field: null
	};

	/**
	 * Enumeration for types.
	 * @public
	 * @readonly
	 * @enum {String}
	 */
	Calendar.Type = {
		Event: 'event',
		State: 'state'
	};

	Calendar.prototype.pad  = function(number) {
		var s = String(number);
		while (s.length < 2) {s = "0" + s;}
		return s;
	};

	Calendar.prototype.getHumanDate = function(date_obj) {
		return date_obj.getFullYear() + '-' + this.pad(date_obj.getMonth() + 1) + '-' + this.pad(date_obj.getDate());
	};

	Calendar.prototype.alterInput  = function() {
		if(this.options.alt_start_field && this.options.alt_end_field) {
			if(this._range_start_time && this._range_end_time) {
				var start = this._range_start_obj,
					end = this._range_end_obj;
				$(this.options.alt_start_field).val(this.getHumanDate(start));
				$(this.options.alt_end_field).val(this.getHumanDate(end));
			} else {
				$(this.options.alt_start_field).val('');
				$(this.options.alt_end_field).val('');
			}
		}
	};

	Calendar.prototype.updateDays = function() {
		var data = null,
			current_date = null,
			css_classes = [],
			range_start = false,
			range_end = false;

		for(var m in this.$months_days) {
			current_date = new Date(this._current_year, this._current_month, 15);
			current_date.setMonth(current_date.getMonth() + parseInt(m));

			data = this.getMonthData(current_date.getFullYear(), current_date.getMonth());

			this.$months_days[m].removeClass('in-range range-start range-end');

			this.$months_days[m].each(function( d ) {
				css_classes = [];

				if(data.month_data[d].in_range) css_classes.push('in-range');
				if(data.month_data[d].range_start) css_classes.push('range-start');
				if(data.month_data[d].range_end) css_classes.push('range-end');

				if(css_classes.length) $(this).addClass( css_classes.join(' ') )
			});
		}
	};

	Calendar.prototype.getMonthData = function(target_year, target_month) {
		var data = {
			year: target_year,
			month: target_month,
			month_human: null,
			start_date_obj: null,
			end_date_obj: null,
			start_weekday: null,
			end_weekday: null,
			days_in_month: null,
			days_before: null,
			days_after: null,
			month_data: []
		};

		data.month_human = data.month+1;

		data.start_date_obj = new Date(data.year, data.month, 1);
		data.start_time = data.start_date_obj.getTime();
		data.start_weekday = data.start_date_obj.getDay();
		data.end_date_obj = new Date(data.year, data.month_human, 0);
		data.end_time = data.end_date_obj.getTime();
		data.end_weekday = data.end_date_obj.getDay();
		data.days_in_month = data.end_date_obj.getDate();
		data.days_before = (data.start_weekday+6) % 7;
		data.days_after = (7 - data.end_weekday) < 7 ? (7 - data.end_weekday) : 0;

		var has_enabled = this._first_time <= data.end_time,
			has_extras = ! $.isEmptyObject(this.options.extras);

		var enabled_from_day = -1;
		if( has_enabled ) {
			if (data.month == this._first_time_obj.getMonth()) enabled_from_day = this._first_time_obj.getDate();
			else enabled_from_day = 1;
		}

		var date_value = null,
			date_time = null,
			enabled = false,
			extra = false,
			range_start = null,
			range_end = null,
			in_range = false;

		for(var day = 1; day < data.days_in_month + 1; day++) {
			date_value = data.year + '-' + this.pad(data.month_human) + '-' + this.pad(day);
			date_time = new Date(date_value).getTime();
			enabled = has_enabled && enabled_from_day <= day;
			range_start = this._range_start_time == date_time;
			range_end = this._range_end_time == date_time;
		 	in_range = this._range_start_time <= date_time && date_time <= this._range_end_time;

			extra = ( has_extras && this.options.extras.hasOwnProperty(date_value) ) ? this.options.extras[date_value] : false;

			data.month_data.push(
				{
					day: day,
					enabled: enabled,
					extra: extra,
					range_start: range_start,
					range_end: range_end,
					in_range: in_range,
					date: date_value
				}
			);
		}

		return data;
	};


	Calendar.prototype.getMonth = function(month) {
		var month_html = '';

		if( month.days_before ) {
			for(var b = 0; b < month.days_before; b++) {
				month_html += '<div class="born-cal-day empty"></div>';
			}
		}

		var css_classes = [],
			classes_str = '',
			extra = '';
		for(var i in month.month_data) {
			css_classes = [];
			if(month.month_data[i].enabled) css_classes.push('day-enabled');
			if(month.month_data[i].in_range) css_classes.push('in-range');
			if(month.month_data[i].range_start) css_classes.push('range-start');
			if(month.month_data[i].range_end) css_classes.push('range-end');

			if(month.month_data[i].extra) {
				css_classes.push('has-extra');
				extra = '<span class="day-extra">' + month.month_data[i].extra + '</span>';
			} else {
				extra = '';
			}

			classes_str = css_classes.length ? ' ' + css_classes.join(' ') : '';

			month_html += '<div class="born-cal-day'+classes_str+'" data-date="'+ month.month_data[i].date +'"><span class="day">' + month.month_data[i].day + '</span>' + extra + '</div>';
		}

		if( month.days_after ) {
			for(var a = 0; a < month.days_after; a++) {
				month_html += '<div class="born-cal-day empty"></div>';
			}
		}

		return month_html;
	};

	Calendar.prototype.setCalendar = function(move) {
		var _move = move || false;

		if( _move ) { // move back or forward
			var current_date = new Date(this._current_year, this._current_month, 15);
			current_date.setMonth(current_date.getMonth() + _move)

			this._current_year = current_date.getFullYear();
			this._current_month = current_date.getMonth();
		} else if( this._first_time_obj ) { // set start month using earliest selected year month
			this._current_year = this._first_time_obj.getFullYear();
			this._current_month = this._first_time_obj.getMonth();
		} else { // set start month using current time
			var current_date = new Date();
			this._current_year = current_date.getFullYear();
			this._current_month = current_date.getMonth();
		}

		if( this.$enabled_days != null && this.$enabled_days.length ) {
			this.$enabled_days.off('click.born.core', $.proxy(this.select, this));
			this.$enabled_days = null;
		}

		// set first month name
		this.$month_names.eq(0).html( this.options.months[this._current_month] + ', ' + this._current_year);
		// set first month days
		this.$months.eq(0).html( this.getMonth( this.getMonthData(this._current_year, this._current_month) ) );
		// assigned month dates for to class updates
		this.$months_days = [ this.$months.eq(0).find('.born-cal-day').not('.empty') ];
		// assigned enabled dates for event listener
		this.$enabled_days = this.$months_days[0].filter('.day-enabled');


		if(this.options.month_count > 1) {
			for(var m = 1; m < this.options.month_count; m++) {
				var next_date = new Date(this._current_year, this._current_month, 15);
				next_date.setMonth(next_date.getMonth() + m);

				this.$month_names.eq(m).html( this.options.months[next_date.getMonth()]  + ', ' + next_date.getFullYear() );
				this.$months.eq(m).html( this.getMonth( this.getMonthData(next_date.getFullYear(), next_date.getMonth()) ) );

				var $next_month_days = this.$months.eq(m).find('.born-cal-day').not('.empty');
				this.$months_days.push($next_month_days);
				this.$enabled_days = this.$enabled_days.add($next_month_days.filter('.day-enabled'));
			}
		}

		if( this.$enabled_days != null && this.$enabled_days.length ) {
			this.$enabled_days.on('click.born.core', $.proxy(this.select, this));
		}
	};

	/**
	 * Create calendar root elements
	 */
	Calendar.prototype.initializeElements = function() {
		var weeks_html = '<div class="born-cal-weeks">';
		for (var i in this.options.days_short) {
			weeks_html += '<div class="born-cal-week">' + this.options.days_short[i] + '</div>';
		}
		weeks_html += '</div>';

		var months_html = '<div class="born-cal-months">';
		for(var m = 0; m < this.options.month_count; m++) {
			months_html += '<div class="born-cal-month-wrap"><div class="born-cal-month-name"></div>' + weeks_html + '<div class="born-cal-month"></div></div>';
		}
		months_html += '</div>';

		this.$months_wrap = $(months_html);
		this.$months = this.$months_wrap.find('.born-cal-month');
		this.$month_names = this.$months_wrap.find('.born-cal-month-name');

		this.$element.append(this.$months_wrap);
	};

	Calendar.prototype.setRange = function(start_date, end_date) {
		var start_valid = false,
			end_valid = false,
			start_date_time = null,
			end_date_time = null,
			start_date_obj = null,
			end_date_obj = null;

		if(start_date) {
			start_date_obj = new Date(start_date);
			start_date_time = start_date_obj.getTime();

			if( !isNaN(start_date_time) && this._first_time <= start_date_time ) start_valid = true;
		}

		if(end_date) {
			end_date_obj = new Date(end_date);
			end_date_time = end_date_obj.getTime();

			if( !isNaN(end_date_time) && this._first_time <= end_date_time ) end_valid = true;
		}

		if(start_valid && end_valid) {
			if(start_date_time < end_date_time) {
				this._range_start_time = start_date_time;
				this._range_start_obj = start_date_obj;
				this._range_end_time = end_date_time;
				this._range_end_obj = end_date_obj;
			} else {
				this._range_start_time = end_date_time;
				this._range_start_obj = end_date_obj;
				this._range_end_time = start_date_time;
				this._range_end_obj = start_date_obj;
			}
		} else if(start_valid) {
			this._range_start_time = start_date_time;
			this._range_start_obj = start_date_obj;
			this._range_end_time = this._range_end_obj = null;

		} else if(end_valid) {
			this._range_start_time = end_date_time;
			this._range_start_obj = end_date_obj;
			this._range_end_time = this._range_end_obj = null;
		} else {
			this._range_start_time = this._range_start_obj = this._range_end_time = this._range_end_obj = null;
		}
	};

	Calendar.prototype.initialize = function() {

		if(this.options.first_day) {
			var first_date_obj = new Date(this.options.first_day);
			var first_date_time = first_date_obj.getTime();
			if( !isNaN(first_date_time) ) {
				this._first_time_obj = first_date_obj;
				this._first_time = first_date_obj.getTime();
			}
		}

		if( this._first_time == null ) {
			var first_date_obj = new Date();
			// refine hours, minutes, seconds
			first_date_obj = new Date(this.getHumanDate(first_date_obj));
			this._first_time_obj = first_date_obj;
			this._first_time = first_date_obj.getTime();
		}

		this.setRange(this.options.range_start, this.options.range_end);

		this.alterInput();
		this.initializeElements();
		this.setCalendar();
		this.trigger('initialized');
	};


	/**
	 * Attaches to an internal event.
	 * @protected
	 * @param {HTMLElement} element - The event source.
	 * @param {String} event - The event name.
	 * @param {Function} listener - The event handler to attach.
	 * @param {Boolean} capture - Wether the event should be handled at the capturing phase or not.
	 */
	Calendar.prototype.on = function(element, event, listener, capture) {
		if (element.addEventListener) {
			element.addEventListener(event, listener, capture);
		} else if (element.attachEvent) {
			element.attachEvent('on' + event, listener);
		}
	};

	/**
	 * Detaches from an internal event.
	 * @protected
	 * @param {HTMLElement} element - The event source.
	 * @param {String} event - The event name.
	 * @param {Function} listener - The attached event handler to detach.
	 * @param {Boolean} capture - Wether the attached event handler was registered as a capturing listener or not.
	 */
	Calendar.prototype.off = function(element, event, listener, capture) {
		if (element.removeEventListener) {
			element.removeEventListener(event, listener, capture);
		} else if (element.detachEvent) {
			element.detachEvent('on' + event, listener);
		}
	};

	Calendar.prototype.prev = function() {
		this.setCalendar(-Math.abs(this.options.move_step));
	};

	Calendar.prototype.next = function() {
		this.setCalendar(Math.abs(this.options.move_step));
	};

	Calendar.prototype.select = function(event) {
		var target = $(event.currentTarget),
			date = target.data('date');

		if( date != null ) {
			// set start time or replace existing range
			if( (!this._range_start_time && !this._range_end_time) || (this._range_start_time && this._range_end_time) ) this.setRange(date, null);
			// set end time
			else this.setRange(this._range_start_obj, date);

			this.alterInput();
			this.updateDays();

			if( this._range_start_time && this._range_end_time ) this.trigger('range');
		}
	};

	/**
	 * Triggers a public event.
	 * @protected
	 * @param {String} name - The event name.
	 * @param {*} [data=null] - The event data.
	 * @param {String} [namespace=calendar] - The event namespace.
	 * @returns {Event} - The event arguments.
	 */
	Calendar.prototype.trigger = function(name, data, namespace) {

		var status = {
				item: {current_year: this._current_year, current_month: this._current_month, range_start: this._range_start_obj, range_end: this._range_end_obj}
			},
			handler = $.camelCase(
				$.grep(['on', name, namespace], function (v) {
					return v
				})
					.join('-').toLowerCase()
			),
			event = $.Event(
				[name, 'born', namespace || 'calendar'].join('.').toLowerCase(),
				$.extend({relatedTarget: this}, status, data)
			);

		if (!this._suppress[name]) {
			$.each(this._plugins, function(name, plugin) {
				if (plugin.onTrigger) {
					plugin.onTrigger(event);
				}
			});

			this.register(name);
			this.$element.trigger(event);

			if (this.settings && typeof this.settings[handler] === 'function') {
				this.settings[handler].call(this, event);
			}
		}

		return event;
	};

	/**
	 * Registers an event.
	 * @public
	 * @param name
	 */
	Calendar.prototype.register = function(name) {
		if (!$.event.special[name]) {
			$.event.special[name] = {};
		}

		if (!$.event.special[name].born) {
			var _default = $.event.special[name]._default;

			$.event.special[name]._default = function(e) {
				if (_default && _default.apply && (!e.namespace || e.namespace.indexOf('born') === -1)) {
					return _default.apply(this, arguments);
				}
				return e.namespace && e.namespace.indexOf('born') > -1;
			};

			$.event.special[name].born = true;
		}
	};

	/**
	 * Suppresses events.
	 * @protected
	 * @param {Array.<String>} events - The events to suppress.
	 */
	Calendar.prototype.suppress = function(events) {
		$.each(events, $.proxy(function(index, event) {
			this._suppress[event] = true;
		}, this));
	};

	/**
	 * Releases suppressed events.
	 * @protected
	 * @param {Array.<String>} events - The events to release.
	 */
	Calendar.prototype.release = function(events) {
		$.each(events, $.proxy(function(index, event) {
			delete this._suppress[event];
		}, this));
	};


	$.fn.bornRangeCalendar = function(option) {
		var args = Array.prototype.slice.call(arguments, 1);

		return this.each(function() {
			var $this = $(this),
				data = $this.data('born.calendar');

			if (!data) {
				data = new Calendar(this, typeof option == 'object' && option);
				$this.data('born.calendar', data);

				$.each([
					'next', 'prev'
				], function(i, event) {
					data.register(name);
					data.$element.on(event + '.born.calendar.core', $.proxy(function(e) {
						if (e.namespace && e.relatedTarget !== this) {
							this.suppress([ event ]);
							data[event].apply(this, [].slice.call(arguments, 1));
							this.release([ event ]);
						}
					}, data));
				});
			}

			if (typeof option == 'string' && option.charAt(0) !== '_') {
				data[option].apply(data, args);
			}
		});
	};

	$.fn.bornRangeCalendar.Constructor = Calendar;
})(window.jQuery, window, document);