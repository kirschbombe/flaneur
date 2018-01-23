$(document).ready(function(){
  console.log(map);
});
function reloadhtml(){
  	url = window.location.href;
  	if (url.includes("article/")) {
  	  article_url = url.replace("/#", "");
      item_id = url.split("#")[1];
      articlerender(article_url, item_id);
  	} else if (url.includes("#") == true) {
		page_url = url.replace("/#", "");
		pagerender(page_url);
  	} else {
    	home_url = window.location.origin + window.location.pathname + "home/"
    	pagerender(home_url);
    }
};

function articlerender(articleurl, item_id){
    marker = items[item_id];
    if (marker.length > 1 ) {
    var articleicon = ''
    for (i = 0; i < marker.length; i++) { 
    articleicon += "<img class='article-marker' src='" + marker[i].iconURL + "' onclick='mapClick(" + i +")'>";
    setMapView(marker[i]);
	}
    } else {
    var articleicon = "<img class='article-marker' src='" + marker[0].iconURL  + "' onclick='mapClick(0)'>";
    setMapView(marker[0]);
    }
  	$.get(article_url, function(data){
    	var index = data.indexOf("</h1>");
        data = data.slice(0, index) + articleicon + data.slice(index);
        $("#sidebar-content").html(data);
    });
   $( ".sidebar" ).scrollTop(0); //tell sidebar scroll to go to the top
}

function pagerender(page_url){
	$.get(page_url, function(data){
		$("#sidebar-content").html(data);
	  });
	map.closePopup();
	$( ".sidebar" ).scrollTop(0); //tell sidebar scroll to go to the top
}

function onClick(url){
    if (url.includes("article/")) {
      item_id = url;
      article_url = window.location.origin + window.location.pathname + item_id;
      articlerender(article_url, item_id);
    } else {
    	page_url = window.location.origin + window.location.pathname + url
    	pagerender(page_url);
    }
}

function setMapView(marker){
	try { 
		markers.zoomToShowLayer(marker, function () {
      marker.openPopup();
		});
	} catch(err) {
    marker.openPopup();
	}
}

function mapClick(i){
  url = window.location.href;
  url = url.split("#");
  item_id = url[1];
  marker = items[item_id];
  setMapView(marker[i]);
};

function new_map(site_grouping){
  markergrouping = localStorage['selectedtem'];
  if (markergrouping == undefined) {
  markergrouping = site_grouping;
  } 
  map.remove();

  $('#choose').val(markergrouping);
  map = L.map('map' , {scrollWheelZoom: false}).setView([0, 0], 1);
  items = makeMap(markergrouping, map);
}
