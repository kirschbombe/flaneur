$(document).ready(function(){
  console.log(map);
});
function reloadhtml(){
  	url = window.location.href;
  	if (url.includes("article")) {
  		article_url = url.replace("/#", "");
  		$.get(article_url, function(data){
        	$("#sidebar-content").html(data);
        });
  	} else {
  	about_url = url + "/about"
  	$.get(about_url, function(data){
  	console.log(data);
  	$("#sidebar-content").html(data);
  	 });
  	}
};
function myFunction(popup){
  //popup.openPopup();
  alert(popup);
};
