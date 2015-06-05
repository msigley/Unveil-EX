/**
 * jQuery Unveil
 * A very lightweight jQuery plugin to lazy load images
 * http://luis-almeida.github.com/unveil
 *
 * Licensed under the MIT license.
 * Copyright 2013 Luís Almeida
 * https://github.com/luis-almeida
 */

;(function($) {

$.fn.unveil = function(threshold, callback) {
	
	var $w = $(window),
		th = threshold || 0,
		retina = window.devicePixelRatio > 1,
		attrib = retina? "data-src-retina" : "data-src",
		images = this,
		loaded;
		
	if( document.readyState == 'complete' ) //Do nothing for pages loaded from cache
		return this;
	
	function isImageLoaded(img) {
	    if (!img.complete)
	        return false;
	    if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0)
	        return false;
	    return true;
	}
	
	images.each(function() { //Lazy load images without placeholders
		var thisElement = $(this),
			thisHidden = thisElement.is(":hidden"),
			dataSource = this.getAttribute(attrib);
			dataSource = dataSource || this.getAttribute("data-src");
		
		if (dataSource || thisHidden || isImageLoaded(this)) return;
		
		var source = this.getAttribute("src");
		this.setAttribute("data-src", source);
		this.setAttribute("src", "");
		if( !thisElement.width() ) {
			thisElement.width(1);
			this.setAttribute("data-fake-width", true);
		}
		if( !thisElement.height() ) {
			thisElement.height(1);
			this.setAttribute("data-fake-height", true);
		}
		if( 'inline' == thisElement.css('display') )
			thisElement.css('display', 'inline-block');
	});
	
	images.one("unveil", function() {
		var thisElement = $(this),
			source = this.getAttribute(attrib);
			source = source || this.getAttribute("data-src");
		if (source) {
			this.setAttribute("src", source);
			if (typeof callback === "function") callback.call(this);
		}
		if (this.getAttribute("data-fake-width")) {
			thisElement.width('auto');
			this.setAttribute("data-fake-width", false);
		}
		if (this.getAttribute("data-fake-height")) {
			thisElement.height('auto');
			this.setAttribute("data-fake-height", false);
		}
	});
	
	function unveil() {
		var inview = images.filter(function() {
			var $e = $(this);
			if ($e.is(":hidden")) return;
			
			var wt = $w.scrollTop(),
			wb = wt + $w.height(),
			et = $e.offset().top,
			eb = et + $e.height();
			
			return eb >= wt - th && et <= wb + th;
		});
		loaded = inview.trigger("unveil");
		images = images.not(loaded);
	}
	
	$w.on("scroll.unveil resize.unveil lookup.unveil", unveil);
	
	unveil();
	
	return this;

};

})(window.jQuery || window.Zepto);
