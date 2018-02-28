Unveil-EX
=========

A very lightweight plugin to lazy load images for jQuery or Zepto.js. 

NOTE: I have not extensively tested Zepto.js support, but it should work as intended. Please report any issues with Zepto.js.


Example Usage
-------------

```
<html>
	<head>
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
		<script src="jquery.unveil.js"></script>
		<script>
			jQuery(document).ready(function($) {
			//Lazy Loading Init
			var thresholdBelowWindowBottom = 400; //Defaults to 0
			$("img").unveil(thresholdBelowWindowBottom);

			//Print button events
			$('.print_link').on('click', $.unveilAndPrint );
			});
		</script>
	</head>
	<body>
		<h1>Unveil-EX Example</h1>
		<h2>Image setup for lazy loading</h2>
		<img src="placeloader.png" data-src="test_image.png"/>
		<h2>Image will be setup for lazy loading if the browser hasn't loaded it yet.</h2>
		<img src="test_image.png" />
		<a class="print_link">Print This Window</a>
	</body>
</html>
```

Features
--------

* Stand alone JS file. No additional CSS file required.
* Support for lazy loaded images using data-src and data-srcset.
* By opportunity image lazy loading for images with a valid src and no data-src or a valid srcset and no data-srcset. This only occurs when an image hasn't been loaded yet and the page isn't loaded from cache.
* Supports lazyloading of hidden images properly. This eliminates the multiple imgs with the same src on the same page issue commonly caused by hidden viewport specific content.
* Properly support multiple calls to $.fn.unveil().
* Added MutationObserver to show images in content cloned with javascript. This eliminates 99% of compatibility issues with other scripts.
* High performance by eliminating use of element.getBoundingClientRect() with jQuery.offset(): https://jsperf.com/getboundingclientrect-vs-jquery
* Print event handling to show lazy loaded images on print.
* Browser support for all major browsers including IE 10+. IntersectionObservers are not used to maintain browser support.
