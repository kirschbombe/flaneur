---
permalink: /events/
layout: page
menutitle: Timeline
title: Timeline of Featured Events
order: 4
---
{% assign years = '' | split: "" %}
{% assign groupedposts = site.posts | group_by_exp: "item", "item.timelinedate | date: '%Y' | slice: 0, 3" | sort: "name" %}

{% for postgroup in groupedposts %}
<h2><b>{{postgroup.name}}0's</b></h2>
	{% assign groupedbyyear = postgroup.items | sort: "date" | group_by: "date" %}
	{% for groupedyear in groupedbyyear %}
		{% assign sortedposts = groupedyear.items | sort_natural: "title" %}
		{% for post in sortedposts %}
{{post.timelinedate | date: "%b %d, %Y" }} - <a href="#{{post.url}}">{{post.title }}</a>
		{% endfor %}
	{% endfor %}
{% endfor %}
