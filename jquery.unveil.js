/**
 * jQuery Unveil EX
 * 1.1.2
 * A lightweight and feature rich plugin to lazy load images.
 *
 * Licensed under the MIT license.
 * By Matthew Sigley
 * https://github.com/msigley/
 */

;(function($) {
	$.unveilGetIEVersion = function() {
		var ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
		if( /msie|trident/i.test(ua) ) {
			var match = ua.match(/(?:msie |rv:)(\d+(\.\d+)?)/i);
			return (match && match.length > 1 && match[1]) || '';
		}
		return '';
	};

	var IEVersion = '';

	if( bowser.msie )
		IEVersion = bowser.version;
	else
		IEVersion = $.unveilGetIEVersion();

	$.unveilCallIndex = 0;
	$.unveilCallStack = [];
	$.unveilEventTimers = [];
	$.unveilMutationObserver = false;
	$.unveilPrintText = false;
	$.unveilPrintEventsLeft = false;
	$.unveilPrintEventsCallPrintAfter = false;

	//Helper functions
	$.unveilIsImageLoaded = function(img) {
		if (!img.complete)
				return false;
		if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0)
				return false;
		return true;
	};

	$.unveilIsVisible = function( element ) {
		if( element.offsetParent === null )
			return false;
		if( IEVersion !== '' && IEVersion < 11 ) {
			var computedDisplay = '';
			if( typeof getComputedStyle != 'undefined' )
				computedDisplay = window.getComputedStyle(element).display;
			else if( typeof element.currentStyle != 'undefined' )
				computedDisplay = element.currentStyle['display'];
			if( 'none' == computedDisplay || 'fixed' == computedDisplay || 'absolute' == computedDisplay )
				return false;
		}
		return true;
	};

	$.unveilInDOM = function( element ) {
		return document.body.contains(element);
	};

	$.unveilHasEvent = function( element ) {
		var events = $._data(element, 'events');
		if( !events || !events.unveil )
			return false;
		return true;
	};

	$.unveilImagesInView = function() {
		$.unveilCallStack.forEach(function(unveil) {
			unveil();
		});
	};

	//API functions
	$.unveilAndPrint = function() {
		var images = $("img").not('.no-lazy-load img').filter(function(){ return $.unveilHasEvent(this); });
		$.unveilPrintEventsLeft = images.length;
		$.unveilPrintEventsCallPrintAfter = false;
		if( $.unveilPrintEventsLeft > 0 ) {
			$.unveilPrintEventsCallPrintAfter = true;
			images.trigger('unveil');
		} else {
			window.print();
		}
	}

	//jQuery collection functions
	$.fn.unveil = function(threshold, callback) {
		var $w = $(window),
			th = threshold || 0,
			images = this,
			imagesSelector = this.selector,
			loaded;
		
		//Setup MutationObserver to lazy load elements cloned with javascript
		if( !$.unveilMutationObserver && "MutationObserver" in window ) {
			var unveilAddedImages = function(mutations) {
				var mutation, i;
				for(i = 0; i < mutations.length; i++) {
					mutation = mutations[i];
					var x;
					for(x = 0; x < mutation.addedNodes.length; x++) {
						if (mutation.addedNodes[x].nodeType === 1) { 
							var addedNodesObj = $(mutation.addedNodes[x]);
							if( addedNodesObj.has('img') )
								addedNodesObj.find('img').trigger('unveil');
						}
					}
				}
			};
			$.unveilMutationObserver = new MutationObserver( function(mutations){
				setTimeout( unveilAddedImages, 0, mutations ); //Run observer handler when not busy
			});
			$.unveilMutationObserver.observe(document.body, {childList: true, subtree: true});
		}

		//Don't lazy load images with no placeholder when page is loaded from cache
		if( document.readyState != 'complete' ) {
			//Lazy load images without placeholders
			images.each(function() { 
				var thisElement = $(this)
					dataSource = this.getAttribute("data-src"),
					dataSourceSet = this.getAttribute("data-srcset");
				
				if (dataSource || dataSourceSet || $.unveilIsImageLoaded(this)) return;
				
				if (!$.unveilMutationObserver && !$.unveilIsVisible(this)) return;

				var source = this.getAttribute("src"),
					sourceSet = this.getAttribute("srcset");
				if (source) {
					this.setAttribute("data-src", source);
					this.setAttribute("src", "");
				}
				if (sourceSet) {
					this.setAttribute("data-srcset", sourceSet);
					this.setAttribute("srcset", "");
				}

				var clone = thisElement.get(0).cloneNode(true); //ensure we have a static Node reference
				if( !clone.width ) {
					thisElement.width(1);
					this.setAttribute("data-fake-width", true);
				}
				if( !clone.height ) {
					thisElement.height(1);
					this.setAttribute("data-fake-height", true);
				}
				if( 'inline' == thisElement.css('display') )
					thisElement.css('display', 'inline-block');
			});
		}

		if( !$.unveilPrintText ) {
			$.unveilPrintText = $('<h1 class="print-only">Images not loaded yet. Please close and reopen your print preview.</h1>');
			$.unveilPrintText.css('color', '#fff');
			$.unveilPrintText.hide().prependTo(document.body);
		}
		
		images.one("unveil", function() {
			if( this.unveilAttributeObserver ) {
				this.unveilAttributeObserver.disconnect();
				this.unveilAttributeObserver = null;
			}

			var thisElement = $(this),
				source = this.getAttribute("data-src"),
				sourceSet = this.getAttribute("data-srcset");
			if (source) {
				this.setAttribute("src", source);
				this.removeAttribute("data-src");
			}
			if (sourceSet) {
				this.setAttribute("srcset", sourceSet);
				this.removeAttribute("data-srcset");
			}
			if (this.getAttribute("data-fake-width")) {
				thisElement.width('auto');
				this.removeAttribute("data-fake-width");
			}
			if (this.getAttribute("data-fake-height")) {
				thisElement.height('auto');
				this.removeAttribute("data-fake-height");
			}

			if ( (source || sourceSet) && typeof callback === "function") callback.call(this);

			if( $.unveilPrintEventsLeft !== false ) {
				setTimeout( function() {
					$.unveilPrintEventsLeft--;
					if( $.unveilPrintEventsLeft < 1 ) {
						if( $.unveilPrintText )
							$.unveilPrintText.remove();
						if( $.unveilPrintEventsCallPrintAfter ) {
							$.unveilPrintEventsCallPrintAfter = false;
							window.print();
						}
					}
				}, 1000); //If it takes longer than a second to load an image, there are server issues to fix.
			}
		});

		//Setup MutationObservers to lazy load images shown to the user with javascript
		if( $.unveilMutationObserver ) {
			var unveilDisplayedImages = function(mutations) {
				var mutation, i;
				for(i = 0; i < mutations.length; i++) {
					mutation = mutations[i];
					console.log(mutation);
					if( $.unveilIsVisible(mutation.target) )
						$(mutation.target).trigger('unveil');
				}
			};
			images.each(function() {
				if( !this.unveilAttributeObserver ) {
					this.unveilAttributeObserver = $.unveilMutationObserver = new MutationObserver( unveilDisplayedImages );
					this.unveilAttributeObserver.observe(this, {attributes: true});
				}
			});
		}
		
		var index = $.unveilCallIndex;
		var unveil = function() {
			clearTimeout($.unveilEventTimers[index]);

			var inview = images.filter(function() {
				var $e = $(this);
				if (!$.unveilIsVisible(this)) return !$.unveilMutationObserver;
				
				//jQuery.offset() is significantly faster than el.getBoundingClientRect()
				//https://jsperf.com/getboundingclientrect-vs-jquery
				var windowTop = $w.scrollTop(),
				windowBottom = windowTop + $w.height(),
				elementTop = $e.offset().top,
				elementBottom = elementTop + $e.height();
				
				return elementBottom >= (windowTop - th) && elementTop <= (windowBottom + th);
			});
			var loaded = inview.trigger("unveil");
			images = images.not(loaded);
			images = images.filter(function(){ return $.unveilInDOM(this); }); //Clean up orphaned nodes
			images = images.filter(function(){ return $.unveilHasEvent(this); }); //Clean up images missing unveil event
			if( !images.length )
				$w.off(".unveil"+index);
		};
		
		var unveil_resize_scroll = function() {
			// Clear the timer as window resize or scroll fires,
			// so that it only calls unveil() when the
			// user has finished resizing or scrolling the window.
			clearTimeout($.unveilEventTimers[index]);

			// Start the timer countdown.
			$.unveilEventTimers[index] = setTimeout(unveil, 20);
			// -----------------------^^
			// Note: 20 milliseconds is lowest "safe"
			// duration for setTimeout and setInterval.
		}
		$.unveilCallStack.push( unveil );

		var unveil_print = function() {
			var images = $("img").not('.no-lazy-load img').filter(function(){ return $.unveilHasEvent(this); });

			if( !images.length ) {
				if( $.unveilPrintText )
					$.unveilPrintText.remove();
				return;
			}

			$.unveilPrintEventsLeft = images.length;
			
			if( $.unveilPrintText )
				$.unveilPrintText.show();
			
			images.trigger("unveil");
		}

		$w.on("scroll.unveil"+index+" resize.unveil"+index, unveil_resize_scroll);
		
		unveil();

		if( 'onbeforeprint' in window ) {
			var printEventListener = function() {
				window.removeEventListener('beforeprint', printEventListener);
				unveil_print();
			};

			window.addEventListener('beforeprint', printEventListener);
		} else if( window.matchMedia ) {
			var mediaQueryList = window.matchMedia('print');

			var mediaQueryListener = function(mql) {
				if(mql.matches) {
					mediaQueryList.removeListener(mediaQueryListener);
					unveil_print();
				}
			}
			mediaQueryList.addListener(mediaQueryListener);
		}
		
		$.unveilCallIndex++;

		return this;
	};
})(window.jQuery || window.Zepto);
