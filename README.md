[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.2600530.svg)](https://doi.org/10.5281/zenodo.2600530)

## Flâneur

Flâneur is a Jekyll theme for maps and texts using Leaflet, and based on the earlier [Boulevardier](https://github.com/kirschbombe/boulevardier) framework.

View the theme live [here](http://dawnchildress.com/flaneur).

To use this theme, fork this repo to your GitHub account and follow the setup instructions below.

**Update:** Flâneur will soon have **Leaflet-IIIF** functionality to allow the use of IIIF-hosted images in place of map tiles, using pixel corrdinates instead of lat,lng. Thanks to Jack Reed ([mejackreed](https://github.com/mejackreed)) for getting this started with his Leaflet-IIIF library. You can view the in-progress version in the "flaneur-iiif" branch.

### Config file

**Site settings:** You will want to replace the settings here with the info about your new site.

**Styles:** You can change the site accent color and font here without editing the CSS. You will still need to replace the Google Font import URL in `head.html`.

**Map settings:** Import a map tileset from MapBox, OpenStreetMap, etc. and set the max/min zoom and center point. You also have the option to choose clustered or single map points. Options are `grouped` or `single`. The `directionsapi` is an optional field that requires the URL for a direction API. This has been tested with router.project-osrm.org and MapBox. It will work with any direciton API that follow the standards that these two APIs follow. 

**Menu:** There are two menu display options, `dropdown` (default) and `circle`.


### Posts
Create posts in the standard `YYYY-MM-DD-title.md` format required for Jekyll. The front matter for posts has several important liquid markup points:
* `lat:` & `lng:` add latitude and longitude to pin a post to a point on the map
* `categories:` ["category1", "category2"] - these populate the map layers widget and article index pages
* `headertitle:` the running title appears at the top of pages and posts. The default is to display the site title.
* `desc:` This is the text for the map marker popup
* `order:` This allows you to order the stops for things like a guided tour. It will add a number to the map marker. It will also add a previous/next button to the top of the post page. It will also create routes if there is a `directionsapi.`
* `leafleticon:` Allows you to set a specific icon for the post (this needs to be the URL for the icon). By default icons are choosen based upon the order in the `assets/leaflet/img` folder.

Images have special formatting using Liquid attributes. The Liquid tags are also needed for the Lightbox feature:
```md
![Image title](images/filename.jpg -or- imageurl)
   {:.image}
Image attribution / caption.
   {:.caption}
```

Bibliographies also have special formatting using Liquid attributes:
```md
{:.bibliography}
1. Entry 1
2. Entry 2
```
### Pages
Create pages that will show up in the sidebar. 

* **Menu items:** In order to have them show up in the menu add the `order` to the front matter with the correct order for the menu. This `order` field determines the order in the menu.

* **Menu titles:** If you do not want the title of the page to be the title in the menu add the `menutitle` into the page with the appropriate title.

* **Homepage:** By default the homepage is the permalink /home. If you want to change that add `type: home` to the front matter of the page you want to be the homepage;

* **Search:** Add `type: search` to any page and that will make the page the search page. In this example it is the `search.html` file.

* **Article Index:** To add an item into the sort fields create a new file in the `_article_index` folder. Add the following fields to the front-matter: `layout: article-index` and `status: `. The status field should the be post field you want to sort by.

### Index
Documentation on the current indexing feature coming soon...

### Leaflet
Documentation of Leaflet config coming soon...
