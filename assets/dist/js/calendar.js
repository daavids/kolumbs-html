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
		 * Validated enabled dates.
		 * @protected
		 */
		this._enabled = [];

		/**
		 * Selected dates.
		 * @protected
		 */
		this._selected = [];

		/**
		 * Initial selected dates as multidimensional object.
		 * @protected
		 */
		this._selected_initial = {};

		/**
		 * Currently suppressed events to prevent them from being retriggered.
		 * @protected
		 */
		this._suppress = {};

		this.initialize();

		// console.log(this.options);
	}

	Calendar.Defaults = {
		month_count: 1,
		multi_select: true,
		range_select: false,
		enabled: [],
		selected: [],
		extras: {},
		months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
		days_short: ["M", "T", "W", "T", "F", "S", "Su"],
		move_step: 1,
		alt_field: ""
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

	Calendar.prototype.alterInput  = function() {
		if(this.options.alt_field) {
			$(this.options.alt_field).val(this._selected .join(','));
		}
	};

	Calendar.prototype.addDate = function(date, obj_name) {
		if( isNaN(date.getTime()) ) return;

		var year = date.getFullYear(),
			month = date.getMonth(),
			day = date.getDate();

		if( !(year in this[obj_name]) ) {
			this[obj_name][year] = {};
		}

		if( !(month in this[obj_name][year]) ) {
			this[obj_name][year][month] = [];
		}

		if( !(day in this[obj_name][year][month]) ) {
			this[obj_name][year][month].push(day);
		}
	};

	Calendar.prototype.addHumanDate = function(date, arr_name) {
		if( isNaN(date.getTime()) ) return;

		this[arr_name].push(date.getFullYear() + '-' + this.pad(date.getMonth() + 1) + '-' + this.pad(date.getDate()))
	};


	Calendar.prototype.getMonthData = function(target_year, target_month) {
		var has_enabled = this._enabled.length,
			has_selected = this._selected.length,
			has_extras = ! $.isEmptyObject(this.options.extras);

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
		data.start_weekday = data.start_date_obj.getDay();
		data.end_date_obj = new Date(data.year, data.month_human, 0);
		data.end_weekday = data.end_date_obj.getDay();
		data.days_in_month = data.end_date_obj.getDate();
		data.days_before = (data.start_weekday+6) % 7;
		data.days_after = 7 - data.end_weekday;

		var date_value = null,
			enabled = false,
			extra = false,
			selected = false;

		for(var day = 1; day < data.days_in_month + 1; day++) {
			date_value = data.year + '-' + this.pad(data.month_human) + '-' + this.pad(day);

			enabled = has_enabled && $.inArray(date_value, this._enabled) > -1;
			selected = false;

			if( enabled ) {
				selected = has_selected && $.inArray(date_value, this._selected) > -1;
			}

			extra = ( has_extras && this.options.extras.hasOwnProperty(date_value) ) ? this.options.extras[date_value] : false;

			data.month_data.push(
				{
					day: day,
					enabled: enabled,
					extra: extra,
					selected: selected,
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
			if(month.month_data[i].selected) css_classes.push('day-selected');

			if(month.month_data[i].extra) {
				css_classes.push('has-extra');
				extra = '<span class="day-extra">' + month.month_data[i].extra + '</span>';
			} else {
				extra = '';
			}

			classes_str = css_classes.length ? ' ' + css_classes.join(' ') : '';

			month_html += '<div class="born-cal-day'+classes_str+'" data-date="'+ month.month_data[i].date +'"><span class="day">' + month.month_data[i].day + '</span>' + extra + '</div>';
		}

		if( month.days_after && month.days_after < 7 ) {
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
		} else if( !$.isEmptyObject(this._selected_initial) ) { // set start month using earliest selected year month
			this._current_year = Math.min.apply( Math, Object.keys(this._selected_initial) );
			this._current_month = Math.min.apply( Math, Object.keys(this._selected_initial[this._current_year]) );
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
		this.$month_names.eq(0).html( this.options.months[this._current_month] );
		// set first month days
		this.$months.eq(0).html( this.getMonth( this.getMonthData(this._current_year, this._current_month) ) );
		// assigned enabled dates for event listener
		this.$enabled_days = this.$months.eq(0).find('.day-enabled');

		if(this.options.month_count > 1) {
			for(var m = 1; m < this.options.month_count; m++) {
				var next_date = new Date(this._current_year, this._current_month, 15);
				next_date.setMonth(next_date.getMonth() + m);

				this.$month_names.eq(m).html( this.options.months[next_date.getMonth()] );
				this.$months.eq(m).html( this.getMonth( this.getMonthData(next_date.getFullYear(), next_date.getMonth()) ) );

				this.$enabled_days = this.$enabled_days.add(this.$months.eq(m).find('.day-enabled'));
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


	Calendar.prototype.initialize = function() {

		// set enabled dates
		if( typeof this.options.enabled == 'object' && this.options.enabled.length ) {
			for (var i in this.options.enabled) {
				this.addHumanDate(new Date(this.options.enabled[i]), '_enabled');
			}
		}

		// set selected dates
		if( this._enabled.length && typeof this.options.selected == 'object' && this.options.selected.length) {
			var selected_date = null;
			for (var j in this.options.selected) {
				if($.inArray(this.options.selected[j], this._enabled) > -1) {
					selected_date = new Date(this.options.selected[j]);
					this.addHumanDate(selected_date, '_selected');
					this.addDate(selected_date, '_selected_initial');
				}
			}
		}

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
			var selected_key = $.inArray(date, this._selected);

			if(selected_key > -1) {
				this._selected.splice( selected_key, 1 );
				target.removeClass('day-selected');
			} else {
				if( this.options.multi_select ) {
					this._selected.push(date);
					target.addClass('day-selected');
				} else {
					this._selected = [date];
					this.$enabled_days.removeClass('day-selected');
					target.addClass('day-selected');
				}
			}

			this.alterInput();

			this.trigger('changed');
		} else {
			return;
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
				item: {current_year: this._current_year, current_month: this._current_month, selected: this._selected}
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


	$.fn.bornCalendar = function(option) {
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

	$.fn.bornCalendar.Constructor = Calendar;
})(window.jQuery, window, document);