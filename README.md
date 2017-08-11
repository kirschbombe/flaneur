### Flâneur

(In development) Flâneur is a Jekyll theme based on the Boulevardier framework. 

Jekyll-maps

**Point-based map engine generated via static Jekyll posts.**

Create posts in the standard `YYYY-MM-DD-your_stuff.markdown` format required for Jekyll, and these posts are consumed by a jekyll layout, `map.html` and presented on a Leaflet map. The single posts have two important liquid markup points: `lat:` & `lng:`, which are the location nodes used in the `map.html` consumption.

View this *exact* repository in action [here](http://mapsam.com/jekyll-maps).

**Some things to note**

* **Post content**: The *description* is marked as `desc:` in the front-matter. Currently if you try to use the `{{ post.content }}` within the javascript of the `_layouts/map.html` file, you'll notice a line break that prevents the map from completely rendering. The current solution is to not use the content space of your point (at least within the javascript portion) and instead use the description attribute.
* The map markers and tiles are set up to respond to *retina-ready* devices.
