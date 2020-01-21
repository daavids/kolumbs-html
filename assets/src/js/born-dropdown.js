var bornResizeEvent,
	dropdownAnimTime = 150;

(function (jQuery) {
	'use strict';
	jQuery(document).ready(function () {		//when DOM is ready
		// console.time('_born.init');
		_born.init();
		// console.timeEnd('_born.init');
		// console.log(window.innerWidth, window.innerHeight);
	});
	jQuery(window).load(function () {
		_born.windowLoad();
	});
	jQuery(window).resize(function (e) {
		clearTimeout(bornResizeEvent);
		bornResizeEvent = setTimeout(_born.resizeEvent, 200);

		// console.log(window.innerWidth, window.innerHeight);
	});
	jQuery(window).scroll(function () {
		_born.scrollEvent();
	});
})(jQuery);

var _born = {
	init: function () {
		// Desktop
		if( _born.brPoints.isAbove('phone') ) {
			// do something
		}

		// when breakpoints are processed
		if( _born.brPoints.init() ) {
			// do something
		}

		_born.dropdown.init();
	},
	windowLoad: function () {

	},
	resizeEvent: function () {
		// process breakpoints
		var device_changed = _born.brPoints.resize();
		_born.dropdown.resize(device_changed);
	},
	scrollEvent: function() {
		var offset_top = window.scrollY;
		// _born.menu.initAffix(offset_top);
	},
	brPoints: new function(){
		this.xs = 480;
		this.sm = 768;
		this.md = 992;
		this.lg = 1200;
		this.xl = 1600;
		this.range = {
			phone: {
				min: 0,
				max: this.sm,
				large: 0,
				small: 1,
				col: {
					1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1, 11:1, 12:1
				}
			},
			tablet: {
				min: this.sm,
				max: this.md,
				large: -1,
				small: 1,
				col: {
					1:1, 2:2, 3:3, 4:3, 5:3, 6:3, 7:3, 8:3, 9:3, 10:3, 11:3, 12:3
				}
			},
			desktop: {
				min: this.md,
				max: 10000
			}
		};
		this.col_reset = this.range.phone.max; // used to detect when equal height columns should be returned to initial state
		this.previous_device = null;
		this.current_device = null;
		var self = this;
		this.getStart = function(device) {
			if(self.range[device] != null) {
				return self.range[device].min;
			}
			return 0;
		};
		this.getEnd = function(device) {
			if(self.range[device] != null) {
				return self.range[device].max;
			}
			return 10000;
		};
		// this.getDims = function(handle) {
		// 	return self[handle];
		// },
		this.between = function(vw, min, max) {
			return vw >= min && vw < max;
		};
		this.greater = function(vw, x) {
			return vw >= x;
		};
		this.less = function(vw, x) {
			return vw < x;
		};
		this.isDevice = function(device) {
			var min = self.getStart(device);
			var max = self.getEnd(device);
			return self.between(window.innerWidth, min, max);
		};
		this.isAbove = function(device) {
			var max = self.getEnd(device);
			return self.greater(window.innerWidth, max);
		};
		this.isBelow = function() {
			var min = self.getStart(device);
			return self.less(window.innerWidth, min);
		};
		this.init = function() {
			// loop through each device range to detect current
			jQuery.each(self.range, function(device, values) {
				if( self.between(window.innerWidth, values.min, values.max) ) {
					self.prev_device = self.current_device = device;
					return false; // break loop when device detected
				}
			});

			return self.current_device;
		};
		this.resize = function() {
			var resized_device;
			
			// loop through each device range to detect current
			jQuery.each(self.range, function(device, values) {
				if( self.between(window.innerWidth, values.min, values.max) ) {
					resized_device = device;
					return false; // break loop when device detected
				}
			});

			if(self.current_device === resized_device) {
				return false;
			} else {
				self.previous_device = self.current_device;
				self.current_device = resized_device;
				return true;
			}
		};
		this.getDeviceColumn = function(col_count, device, adjust) {
			// device is valid, columns are defined
			if( self.range[device] != null && self.range[device].col[col_count] != null ) {
				// adjustment necessary - increase or decrese column count
				if(adjust != null && self.range[device][adjust] != null)
					return self.range[device].col[col_count] + self.range[device][adjust];
				else
					return self.range[device].col[col_count];
			} // current device has defined columns
			else if( self.range[self.current_device].col != null )
				return self.range[self.current_device].col[col_count];
			// no device has been detected, no columns has been defined for current device
			else
				return col_count;
		};
	},
	dropdown: new function(){
		this.wrapper_cl = '.container'; // used to detect dropdown overflow
		this.trigger_cl = '.born-dropdown';
		this.dropdown_cl = '.born-dropdown-content';
		this.event_namespace = 'born-dropdown'; // used to bind and unbind document click listener
		this.trigger_button_cl = 'born-trigger-dropdown';
		this.hover_cl = '.is-hoverable';
		this.click_cl = '.is-clickable';
		this.open_cl = 'is-open';
		this.visible_cl = 'is-visible';
		this.overflow_cl = 'is-outside';
		this.trigger = jQuery(this.trigger_cl);
		this.dropdown = jQuery(this.dropdown_cl);
		this.hoverable = this.trigger.not(this.click_cl);
		this.clickable = this.trigger.not(this.hover_cl);
		this.anim_time = dropdownAnimTime + 20;
		this.dropdown_open = false;
		this.dropdown_open_el = null;
		this.hover_timer = null;
		this.current_click = null;
		this.is_desktop = null;
		var self = this;
		// Hoverable dropdown mouse enter handling
		this.handleMouseEnter = function() {
			var current = jQuery(this);

			clearTimeout(self.hover_timer);
			
			current.addClass(self.open_cl);

			setTimeout( function() {
				current.addClass(self.visible_cl);
			}, 10);
		};
		// Hoverable dropdown mouse leave handling
		this.handleMouseLeave = function() {
			var current = jQuery(this);

			current.removeClass(self.visible_cl);

			self.hover_timer = setTimeout(function(){
				current.removeClass(self.open_cl);
			}, self.anim_time);
		};
		this.openClickableDropdown = function() {
			self.current_click.addClass(self.open_cl);
					
			setTimeout( function() {
				self.current_click.addClass(self.visible_cl);
				self.dropdown_open = true;
				self.dropdown_open_el = self.current_click;
			}, 10);
		};
		this.closeClickableDropdown = function() {
			self.trigger.filter('.'+self.open_cl).removeClass(self.visible_cl);

			setTimeout(function(){
				self.trigger.filter('.'+self.open_cl+':not(.'+self.visible_cl+')').removeClass(self.open_cl);
			}, self.anim_time);
		};
		this.handleClickIn = function(event) {
			self.current_click = jQuery(this);
			// event.preventDefault();

			if( !self.dropdown_open ) { // nothing open
				self.openClickableDropdown();
			} else if( !self.current_click.closest(self.trigger_cl).hasClass(self.open_cl) ) { // other dropdown is open
				self.dropdown_open = false;
				self.dropdown_open_el = null;
				self.closeClickableDropdown();
				self.openClickableDropdown();
			}
		};
		this.handleClickOut = function(event) {
			if( self.dropdown_open
				&& 	(
						jQuery(event.target).parents('.'+self.open_cl).length === 0 
						|| jQuery(event.target).hasClass(self.trigger_button_cl)
						|| jQuery(event.target).parents('.'+self.trigger_button_cl).length > 0
					)
			) {
				self.dropdown_open = false;
				self.dropdown_open_el = null;
				// event.preventDefault();
				self.closeClickableDropdown();
			}
		};
		this.handleDesktopClickHover = function() {
			if(self.hoverable.length > 0) {
				self.hoverable.on('mouseenter.'+self.event_namespace, self.handleMouseEnter);
				self.hoverable.on('mouseleave.'+self.event_namespace, self.handleMouseLeave);
			}

			if(self.clickable.length > 0) {
				self.clickable.on('click.'+self.event_namespace, self.handleClickIn);
				jQuery(document).on('click.'+self.event_namespace, self.handleClickOut);
			}
		};
		this.handleTouchClick = function() {
			if(self.trigger.length > 0) {
				self.trigger.on('click', self.handleClickIn);
				jQuery(document).on('click.'+self.event_namespace, self.handleClickOut);
			}
		};
		// apply overflow class if container's right border is crossed
		this.setAlignment = function() {
			self.dropdown.css({'visibility': 'hidden', 'display': 'block'});
	
			self.dropdown.each( function(){
				var ddown = jQuery(this),
					wrapper = ddown.closest(self.wrapper_cl);
	
				if(wrapper.length > 0) {
					dd_right = window.innerWidth - ( ddown.offset().left + ddown.outerWidth() );
					wrapper_right = window.innerWidth - ( wrapper.offset().left + wrapper.outerWidth() );
					if(dd_right < wrapper_right) {
						ddown.parent(self.trigger_cl).addClass(self.overflow_cl);
					}
				}
			});
	
			self.dropdown.removeAttr('style');
		};
		this.init = function(){
			self.is_desktop = _born.brPoints.isAbove('tablet');
			
			// desktop hadling
			if( self.is_desktop ) {
				self.handleDesktopClickHover();
			} else { // touch hadling
				self.handleTouchClick();
			}

			self.setAlignment();
		};
		this.resize = function(device_changed) {

			if(device_changed) {
				var is_desktop = _born.brPoints.isAbove('tablet');
			
				// switched to touch device or opposite
				if (self.is_desktop != is_desktop) {
					self.is_desktop = is_desktop;

					if(self.is_desktop) {
						// unbind previous events
						self.trigger.off('click.'+self.event_namespace, self.handleClickIn);
						jQuery(document).off('click.'+self.event_namespace, self.handleClickOut);

						self.handleDesktopClickHover();
					} else {
						// unbind previous events
						self.hoverable.off('mouseenter.'+self.event_namespace, self.handleMouseEnter);
						self.hoverable.off('mouseleave.'+self.event_namespace, self.handleMouseLeave);
						self.clickable.off('click.'+self.event_namespace, self.handleClickIn);
						jQuery(document).off('click.'+self.event_namespace, self.handleClickOut);
						
						self.handleTouchClick();
					}

				}
			}

			self.setAlignment();
		};
	}

};