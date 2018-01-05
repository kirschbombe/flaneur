$(document).ready(function(){
  console.log(map);
});
function reloadhtml(){
  	url = window.location.href;
  	if (url.includes("article/")) {
  		article_url = url.replace("/#", "");
      url = url.split("#");
      item_id = url[1];
      marker = items[item_id];
      var articleicon = "<img class='article-marker' src='" + marker.iconURL  + "' onclick='myFunction()'>";
  		$.get(article_url, function(data){
          var index = data.indexOf("</h1>");
          data = data.slice(0, index) + articleicon + data.slice(index,);
          $("#sidebar-content").html(data);
        });
    marker.openPopup();
  	} else if (url.includes("#") == true) {
  	page_url = url.replace("/#", "");
  	$.get(page_url, function(data){
  	$("#sidebar-content").html(data);
  	 });
  	} else {
    home_url = window.location.origin + window.location.pathname + "home/"
    $.get(home_url, function(data){
  	$("#sidebar-content").html(data);
  	 });
    }
};

function onClick(url){
    if (url.includes("article/")) {
      item_id = url;
      article_url = window.location.origin + window.location.pathname + item_id;
      marker = items[item_id];
      var articleicon = "<img class='article-marker' src='" + marker.iconURL  + "' onclick='myFunction()'>";
      $.get(article_url, function(data){
          var index = data.indexOf("</h1>");
          data = data.slice(0, index) + articleicon + data.slice(index,);
          $("#sidebar-content").html(data);
        });
    marker.openPopup();
    } else {
    	page_url = window.location.origin + window.location.pathname + url
    	$.get(page_url, function(data){
    		$("#sidebar-content").html(data);
    	});
    }
    $( ".sidebar" ).scrollTop(0)
}


function mapClick(){
  url = window.location.href;
  url = url.split("#");
  item_id = url[1];
  marker = items[item_id];
  marker.togglePopup();
};
