### Flâneur

Flâneur is a Jekyll theme for maps and texts using Leaflet, and based on the earlier [Boulevardier](https://github.com/kirschbombe/boulevardier) framework.

View the theme live [here](http://dawnchildress.com/flaneur).

To use this theme, fork this repo to your GitHub account and follow the setup instructions below.

#### Config file
coming soon...

#### Posts
Create posts in the standard `YYYY-MM-DD-title.md` format required for Jekyll. The front matter for posts has several important liquid markup points:
* `lat:` & `lng:` add latitude and longitude to pin a post to a point on the map
* `categories:` ["category1", "category2"] - these populate the map layers widget and article index pages
* `runningtitle:` the running title appears at the top of pages and posts. The default is to display the site title. To activate the post-specific running title, you will need to uncomment line 6 in the post.html layout and comment out line 8:
```html
<!-- <p class="post-header">{{page.runningtitle}}</p> -->
<!-- OR -->
<p class="post-header">{{ site.title }}</p>
```
* `desc:` This is the text for the map marker popup

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
#### Pages
coming soon...

#### Index
coming soon...

#### Leaflet
coming soon...
