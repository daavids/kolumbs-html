jQuery(document).ready(function() {
	winScrollTop = jQuery(window).scrollTop();
	carousels();
	lightbox();
	brands();
	viewports();
	mapspacing();
	svg();
	rangeslider();

	jQuery('.ko-btn-menu').on('click', function(event) {
		jQuery('body, html').toggleClass('has-ko-mobile-menu-open');
		event.preventDefault();
	});

});

jQuery(window).scroll(function() {
	winScrollTop = jQuery(window).scrollTop();
	viewports();
});

jQuery(window).resize(function() {
	mapspacing();
});

var winScrollTop = 0;

jQuery.fn.isInViewport = function() {
	var elementTop = jQuery(this).offset().top;
	var elementBottom = elementTop + jQuery(this).outerHeight();
	var viewportTop = jQuery(window).scrollTop();
	var viewportBottom = viewportTop + jQuery(window).height();
	return elementBottom > viewportTop && elementTop < viewportBottom;
};

function carousels() {

	jQuery('.ko-carousel.is-destinations .owl-carousel').owlCarousel({
		center: false,
		loop: true,
		nav: true,
		rewind: false,
		autoplay: false,
		dots: false,
		mouseDrag: false,
		smartSpeed: 350,
		margin: 0,
		callbacks: false,
		items: 3,
		slideBy: 1,
		touchDrag: false,
		navText: [
			"<span></span>",
			"<span></span>"
		],
		responsive: {
			0: {
				slideBy: 1,
				items: 1
			},
			992: {
				slideBy: 1,
				items: 2
			},
			1200: {
				slideBy: 1,
				items: 3
			}
		}
	});

}

function lightbox() {

	var html = jQuery('html');

	jQuery('[data-modal-trigger]').on('click', function(e) {

		var box = jQuery('[data-modal='+ e.currentTarget.dataset.modalTrigger +']');

		html.toggleClass('ko-lightbox-is-open');

		if (box.hasClass('hidden')) {
			box.removeClass('hidden');
			setTimeout(function () {
				box.removeClass('visuallyhidden');
			}, 10);
		}
		else {
			box.addClass('visuallyhidden');
			setTimeout(function () {
				box.addClass('hidden');
			}, 650);
		}

		e.preventDefault();

	});

}

function brands() {
	
	jQuery('.footer-brands, .footer-banks, .ko-brands, .ko-payment').imagesLoaded( function() {

		jQuery('.footer-brands img, .footer-banks img, .ko-brands img, .ko-payment .col img').each(function() {

			var imageWidth = jQuery(this).width(),
			imageHalfWidth = Math.round(imageWidth / 2);
			jQuery(this).width(imageHalfWidth);

		});

	});

}

function viewports() {

	jQuery('.footer-brands, .ko-brands').each(function() {
		if (jQuery(this).isInViewport()) {
			jQuery(this).find('li').each(function(i) {
				var item = jQuery(this);
				setTimeout(function() {
					item.addClass('is-revealed');
				}, i*100);
			});
		}
	});

	jQuery('.footer-banks').each(function() {
		if (jQuery(this).isInViewport()) {
			jQuery(this).find('a').each(function(i) {
				var item = jQuery(this);
				setTimeout(function() {
					item.addClass('is-revealed');
				}, i*100);
			});
		}
	});

	jQuery('.ko-payment').each(function() {
		if (jQuery(this).isInViewport()) {
			jQuery(this).find('.col').each(function(i) {
				var item = jQuery(this);
				setTimeout(function() {
					item.addClass('is-revealed');
				}, i*100);
			});
		}
	});

}

function mapspacing() {

	var mapElement = document.querySelectorAll('.ko-contacts > .born-container');

	if(mapElement.length < 1) return;

	var mapContainer = jQuery('.ko-contacts .map');

	var rowMargin = mapElement[0].getBoundingClientRect();

	mapContainer.css('width', rowMargin.left + (rowMargin.width / 2));

}

function svg() {

	jQuery('.is-svg').each(function(){

		var $img = jQuery(this);
		var imgID = $img.attr('id');
		var imgClass = $img.attr('class');
		var imgURL = $img.attr('src');

		jQuery.get(imgURL, function(data) {
		// Get the SVG tag, ignore the rest
		var $svg = jQuery(data).find('svg');

			// Add replaced image's ID to the new SVG
			if(typeof imgID !== 'undefined') {
				$svg = $svg.attr('id', imgID);
			}

			// Add replaced image's classes to the new SVG
			if(typeof imgClass !== 'undefined') {
				$svg = $svg.attr('class', imgClass+' replaced-svg');
			}

			// Remove any invalid XML tags as per http://validator.w3.org
			$svg = $svg.removeAttr('xmlns:a');

			// Replace image with new SVG
			$img.replaceWith($svg);

		}, 'xml');

	});

}

function rangeslider() {

	jQuery('.ko-header .search .close, .ko-header .search .ko-filters-icon').on('click', function(e) {

		jQuery('.ko-header .search').toggleClass('is-open');
		jQuery('.ko-header').toggleClass('has-advanced-filters-open');
		jQuery('.ko-dock').toggleClass('has-advanced-filters-open');

		e.preventDefault();

	});

	// ko-header price range
	
	jQuery('.ko-header .is-budget .range').slider({
		range: true,
		min: 0,
		max: 5000,
		values: [ 500, 2000 ],
		slide: function( event, ui ) {
			jQuery('.ko-header .is-budget .amount').val("" + ui.values[ 0 ] + " - " + ui.values[ 1 ] + " €");
		}
	});

	jQuery('.ko-header .is-budget .amount').val("" + jQuery('.ko-header .is-budget .range').slider('values', 0) + " - " + jQuery('.ko-header .is-budget .range').slider("values", 1 ) + " €");

	jQuery('.ko-filters .is-budget .range').slider({
		range: true,
		min: 0,
		max: 5000,
		values: [ 500, 2000 ],
		slide: function( event, ui ) {
			jQuery('.ko-filters .is-budget .amount').val("" + ui.values[ 0 ] + " - " + ui.values[ 1 ] + " €");
		}
	});

	jQuery('.ko-filters .is-budget .amount').val("" + jQuery('.ko-filters .is-budget .range').slider('values', 0) + " - " + jQuery('.ko-filters .is-budget .range').slider("values", 1 ) + " €");

	// ko-header duration range

	jQuery('.ko-header .is-duration .range').slider({
		range: true,
		min: 0,
		max: 10,
		values: [ 1, 5 ],
		slide: function( event, ui ) {
			jQuery('.ko-header .is-duration .amount').val("" + ui.values[ 0 ] + " - " + ui.values[ 1 ]);
		}
	});

	jQuery('.ko-header .is-duration .amount').val("" + jQuery('.ko-header .is-duration .range').slider('values', 0) + " - " + jQuery('.ko-header .is-duration .range').slider("values", 1 ));

	jQuery('.ko-filters .is-duration .range').slider({
		range: true,
		min: 0,
		max: 10,
		values: [ 1, 5 ],
		slide: function( event, ui ) {
			jQuery('.ko-filters .is-duration .amount').val("" + ui.values[ 0 ] + " - " + ui.values[ 1 ]);
		}
	});

	jQuery('.ko-filters .is-duration .amount').val("" + jQuery('.ko-filters .is-duration .range').slider('values', 0) + " - " + jQuery('.ko-filters .is-duration .range').slider("values", 1 ));

	// airport range

	jQuery('.ko-filters .is-airport .range').slider({
		range: true,
		min: 0,
		max: 5000,
		values: [ 400, 4000 ],
		slide: function( event, ui ) {
			jQuery('.ko-filters .is-airport .amount').val("" + ui.values[ 0 ] + " - " + ui.values[ 1 ] + " km");
		}
	});

	jQuery('.ko-filters .is-airport .amount').val("" + jQuery('.ko-filters .is-airport .range').slider('values', 0) + " - " + jQuery('.ko-filters .is-airport .range').slider("values", 1 ) + " km");

	// beach range

	jQuery('.ko-filters .is-beach .range').slider({
		range: true,
		min: 0,
		max: 3000,
		values: [ 400, 2000 ],
		slide: function( event, ui ) {
			jQuery('.ko-filters .is-beach .amount').val("" + ui.values[ 0 ] + " - " + ui.values[ 1 ] + " km");
		}
	});

	jQuery('.ko-filters .is-beach .amount').val("" + jQuery('.ko-filters .is-beach .range').slider('values', 0) + " - " + jQuery('.ko-filters .is-beach .range').slider("values", 1 ) + " km");
	
}

// jQuery('.ko-dock .menu li').mouseenter(function(){

// 	var firstDockMenuItem = document.querySelectorAll('.ko-dock .menu li.is-open');
// 	var itemPosition = firstDockMenuItem[0].getBoundingClientRect();

// 	jQuery('.ko-dock .menu .born-dropdown-content .born-container').css('padding-left', itemPosition.x);

// });

jQuery('.ko-header .search .data .is-date input').focus(function(){
	jQuery('.ko-header .search .data .is-date .calendar').addClass('is-visible');
});

// hide calendar dropdown when clicked elsewhere

jQuery(document).click(function() {
	jQuery('.ko-header .search .data .is-date .calendar').removeClass('is-visible')
});

jQuery('.ko-header .search .data').click(function(e) {
	e.stopPropagation();
	return false;
});


jQuery('.ko-payment .payment-summary .link').click(function(e) {
	e.preventDefault();
	if ($(window).width() < 767) {
		jQuery('html, body').animate({
			scrollTop: jQuery('.ko-payment').offset().top + jQuery('.ko-payment').outerHeight(true) - 20
		}, 650);
	}
	else {
		jQuery('html, body').animate({
			scrollTop: jQuery('.ko-payment').offset().top + jQuery('.ko-payment').outerHeight(true) - 40
		}, 650);
	}
});



// $('.scroll').click(function() {
//     $('body').animate({
//         scrollTop: eval($('#' + $(this).attr('target')).offset().top - 70)
//     }, 1000);
// });