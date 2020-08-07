const searchview = Vue.component('searchview', {
  template: `
  <div>
  <div id="input-outer">
    <input type="text" v-model="searchterm" v-on:change="searchIndex()"/>
    <div v-on:click="clearSearch();" v-if="searchterm" class="clear">
    </div>
  </div>
  <input type="submit" value="Submit" v-on:submit="searchIndex()">
  <div v-if="results">
    <ul v-for="result in results">
      <li>
        <router-link :to="result.hash">{{result.title}}
        </router-link>
      </li>
    </ul>
  </div>
  <div v-else-if="!results">
    No results found
  </div>

  </div>`,
  data: function() {
    return {
      searchterm: '',
      idx: '',
      results: [],
      searchitems: {}
    }
  },
  created() {   
    this.searchterm = this.$route.query['q'];
    for (var si=0; si<searchItems.length; si++){
      searchItems[si]['id'] = searchItems[si]['slug'];
      this.searchitems[searchItems[si]['slug']] = searchItems[si];
    }
  },
  mounted() {   
    this.buildIndex();
  },
  methods: {
    clearSearch: function() {
      this.searchterm = '';
      this.results=[];
      if (this.searchterm != this.$route.query['q']){
        this.$router.push({query:{q: this.searchterm}});
      }
    },
    searchIndex: function() {
      var results = this.idx.search(this.searchterm);
      if (this.searchterm != this.$route.query['q']){
        this.$router.push({query:{q: this.searchterm}});
      }
      if (results.length > 0){
        this.results = results.map(element => this.searchitems[element['ref']]);
      } else {
        this.results = false;
      }
    },
    buildIndex: function() {
      this.idx = lunr(function() {
        for (var fi=0; fi<searchFields.length; fi++){
          const field = searchFields[fi];
          this.field(field['field'], {'boost': field['boost']});
        }
      })
      for (var si=0; si<searchItems.length; si++){
        if (searchItems[si]['id']){
          this.idx.add(searchItems[si]);
        }
      }
      if (this.searchterm) {
        this.searchIndex();
      }
    }
  }
});

const mapview = Vue.component('mapview', {
  template: `
  <div>
  <div class="sidebar">
    <div id="sidebar-content">
      <header class="defaultheader">
        <p class="post-header" v-if="sidebar.headertitle">{{sidebar.headertitle}}</p>
        <p class="post-header" v-else>{{siteTitle}}</p>
        <div class="nextprev">
          <router-link v-if="sidebar.prev" class="prev" :to="sidebar.prev.hash">
            <i class="fa fa-chevron-circle-left"></i> {{sidebar.prev.title}}
          </router-link>
          <a v-if="!sidebar.prev"></a>
          <router-link v-if="sidebar.next" class="next" :to="sidebar.next.hash">
            {{sidebar.next.title}} <i class="fa fa-chevron-circle-right"></i>
          </router-link>
        </div>
        <h1 class="title" v-if="sidebar.title">{{sidebar.title}}
        <span v-if="sidebar.markers">
          <a v-for="marker in sidebar.markers"
            v-on:click="goToMarker(marker)" class="legend" 
            v-if="marker" v-html="marker.iconURL">
          </a>
        </span>
        <button aria-label="toggle directions" v-if="apiUrl && sidebar.markers" class="showRouteButton" v-on:click="showRoute = !showRoute">
          <i v-if="!showRoute" class="fas fa-directions"></i>
          <i v-else class="fa fa-window-close"></i>
        </button>
        </h1>
      </header>
      <span v-if="showRoute">
        <button v-on:click="getCurrentLocDirections(true)" class="dirButton" v-if="sidebar.markers && apiUrl">
          <i class="fas fa-directions"></i> Current location to {{sidebar.title}}
        </button>
        <button v-on:click="getCurrentLocDirections()" class="dirButton" v-if="sidebar.next && sidebar.markers && apiUrl">
          <i class="fas fa-directions"></i> Current location to {{sidebar.next.title}}
        </button>
        <button class="dirButton" v-if="sidebar.next && sidebar.markers && apiUrl" v-on:click="getDirections()">
          <i class="fas fa-directions"></i> {{sidebar.title}} to {{sidebar.next.title}}
        </button>
        <div v-if="routeInfo" class="routeInfo">
          <h3>{{routeInfo.title}}</h3>
          <div v-if="routeInfo.distance">
            ~{{routeInfo.distance}} Miles, {{routeInfo.minutes}} minutes to {{sidebar.next.title}}
          </div>
          <ol>
            <li v-for="direction in routeInfo.directions">
              <a v-on:click="goToGeoJson(direction.geometry)">
                <span v-html="direction.direction"></span>
              </a>
            </li>
          </ol>
        </div>
      </span>
      <span v-html="sidebar.content"></span>
      <div id="scriptholder"></div>
      <searchview v-if="searchview"></searchview>
    </div>
  </div>
  <div id="map"></div>
  <div v-bind:class="menuType">
    <transition v-bind:name="menuType">
      <button aria-label="open menu" v-bind:class="menuType" v-if="!menuShown" class="menu-button" v-on:click="menuShown = !menuShown;">
        <i class="fa fa-bars"></i>
      </button>
      <div v-if="menuShown" v-bind:class="menuType + '-content'" class="sub-menu" >
      <a aria-label="close menu" v-on:click="menuShown = !menuShown" key="close">
        <i v-if="menuShown" class="fa fa-times close-btn"></i>
      </a>
      <a v-for="page in menuItems" :key="page.hash" v-on:click="updateHash(page)" class="menu-link">
        <span v-if="page.menutitle" v-html="page.menutitle"></span>
        <span v-else v-html="page.title"></span>
      </a>
      </div>
    </transition>  
  </div>
  <div id="choose">
    <select class="dropdown" aria-label="groupedsingledropdown" v-model="markergrouping">
      <option aria-label="grouped" value="grouped">Clustered</option>
      <option aria-label="single" value="single">Not clustered</option>
    </select>
    <button aria-label="get current location button" class="locationButton" v-on:click="locate()" v-if="sidebar.markers && apiUrl">
      <i class="fa fa-location-arrow"></i>
    </button>
  </div>
  </div>`,
  data: function() {
  	return {
      map: '',
      markergrouping: mapView.mapData['marker-grouping'],
      overLayers: [],
      markers: '',
      mapMarkers: [],
      layerControl: '',
      sidebar: '',
      sitePages: [],
      menuItems: [],
      postData: [],
      menuType: menuType,
      menuShown: false,
      siteTitle: siteTitle,
      current: {'position': '', 'accuracy': ''},
      routeInfo: false,
      showRoute: false,
      apiUrl: mapView.mapData.directionapi,
      searchview: false,
      removeMarkers: [],
      getdir: false,
      geoCurrent: '',
      homePage: '/home'
  	}
  },
  components: {
    'searchview': searchview
  },
  watch: {
    markergrouping: function() {
      this.addMarkers();   
    },
    geoCurrent: function(newVal, oldVal){
      if (oldVal){
        oldVal.remove();
        this.map.removeLayer(this.current.position);
      	this.map.removeLayer(this.current.accuracy);
      }
    },
    "$route.path": function(){
      this.buildPage();
    },
    "sidebar.content": async function(){
      await this.$nextTick();
      this.lightBox();
    },
    mapMarkers: function() {
       var geoJSON = this.mapMarkers[this.sidebar.index] ? this.mapMarkers[this.sidebar.index]['geojson'] : '';
       this.updateRoutes(geoJSON);
    },
    "sidebar.index": function() {
       this.routeInfo = false;
       this.geoCurrent = '';
       var geoJSON = this.mapMarkers[this.sidebar.index] ? this.mapMarkers[this.sidebar.index]['geojson'] : '';
       this.updateRoutes(geoJSON);
    },
    "current.position": function() {
      if (this.getdir){
        this.routeInfo = {'title': 'Directions loading....'};
        var post = this.current.position._latlng;
        post['title'] = 'Current location';
        if (this.currentlocation){
          post['next'] = [this.sidebar['markers'][0]._latlng];
          post['next'][0]['title'] = this.sidebar.title;
        } else {
          post['next'] = [{'lat': this.sidebar.next.lat, 
            'lng': this.sidebar.next.lng, 'title': this.sidebar.next.title}]
        }
        this.getRouteData(post, true);
        this.getdir = false;
      }
    }
  },
  mounted() {   
    this.cleanPostData();
    var hasTitles = this.sitePages.filter(element => element['order'])
    this.menuItems = _.sortBy(hasTitles,"order");
    const home = this.sitePages.filter(element => element['type'] == 'home')
    home.length > 0 ? this.homePage = home[0]['hash'] : '';
    this.createMap();
    this.buildPage();
    this.map.on('locationfound', this.onLocationFound);
    this.map.on('locationerror', this.onLocationError);
  },
  methods: {
    goToGeoJson: function(geometry) {
      const firstitem = geometry.coordinates[0];
      this.map.panTo([firstitem[1], firstitem[0]])
    },
    cleanPostData: function() {
      for (var it=0; it<mapView.postdata.length; it++){
        const post = mapView.postdata[it];
        if (post.categories && post.categories.length > 0){
          for (var ca=0; ca<post.categories.length; ca++){ 
            const copy = JSON.parse(JSON.stringify(post));
            copy['categories'] = post.categories[ca]; 
            this.postData.push(copy);
          }
        } else if (post.lat && post.lng) {
          this.postData.push(JSON.parse(JSON.stringify(post)));
        } else {
          this.sitePages.push(JSON.parse(JSON.stringify(post)))
        }
      }
    },
    getDirections: function(inputmaps=false) {
      var maps = inputmaps ? inputmaps : this.mapMarkers[this.sidebar.index];
      this.geoCurrent = inputmaps ? inputmaps['geojson'] : ''; 
      if (maps && maps['geojson'] && this.apiUrl){
        const routeData = maps['routeData'];
        this.updateRoutes(maps['geojson']);
        var sum = routeData.routes.reduce(function(a, b){
          return a + b['distance'];
        }, 0);
        var directions = []
        for (var rd=0; rd<routeData.routes.length; rd++){
          for(var lg=0; lg<routeData.routes[rd]['legs'].length; lg++){
           for (var st=0; st<routeData.routes[rd]['legs'][lg]['steps'].length; st++){
              const item = routeData.routes[rd]['legs'][lg]['steps'][st];
              var instruction = '';
              if (item.maneuver.instruction) {
                instruction = item.maneuver.instruction;
              } else {
                instruction = `${item.maneuver.type} ${item.maneuver.modifier ? item.maneuver.modifier : ''} ${item.name ? 'on ' + item.name: ''}`
              }
              var direction = `${instruction} | ${(item.distance*0.000621371192).toFixed(2)} miles | ${(item.duration/60).toFixed(2)} minutes<br>`
              directions.push({'direction': direction, 'geometry': item.geometry})
           }
          }
        }
        this.goToGeoJson(directions[0].geometry);
        const data = {'distance': (sum*0.000621371192).toFixed(2), 
        'minutes': ((sum/1.4)/60).toFixed(0), 'directions': directions,
        'title': `${maps['post']['title']} to ${maps['post']['next'][0]['title']}`}
        this.routeInfo = data;
      }
    },
    updateHash: function(page){
      this.$router.push(page.hash);
      this.menuShown = !this.menuShown;
    },
    locate: function(){
      this.map.locate({setView: true});
    },
    getCurrentLocDirections: function(currentlocation=false) {
      this.getdir = true;
      this.currentlocation = currentlocation;
      this.locate();
    },
    onLocationFound: function(e) {
      if (this.current.position) {
        this.map.removeLayer(this.current.position);
        this.map.removeLayer(this.current.accuracy);
      }

      var radius = e.accuracy / 2;

      this.current.position = L.marker(e.latlng).addTo(this.map)
      .bindPopup("You are within " + radius + " meters from this point").openPopup();
      this.current.accuracy = L.circle(e.latlng, radius).addTo(this.map);
    },
    onLocationError: function(e) {
      alert(e.message);
    },
    updateRoutes: function(geoJSON){
		this.mapMarkers.map(element => element['geojson'] ? this.updateGeoJson(element['geojson'], 'red') : '');
		if (geoJSON){
		   this.updateGeoJson(geoJSON, 'blue');
		   geoJSON.bringToFront();
		}
    },
    updateGeoJson: function(geojson, color) {
      geojson.setStyle({
          weight: 2,
          opacity: 1,
          color: color,
          fillOpacity: 0.7
        })
    },
    getRouteData: function(post, directions=false) {
      if (post['next'] && this.apiUrl){
        var url = `${this.apiUrl}${post['lng']},${post['lat']};${post['next'][0]['lng']},${post['next'][0]['lat']}?overview=full&geometries=geojson&steps=true`;
        var vue = this;
        axios.get(url).then((response) => {
          if (Number.isInteger(post['index'])){
            this.$set(this.mapMarkers[post['index']], 'routeData', response.data);
          }
          var geojson = this.mapRoute(response.data, post);
          if(directions) {
            this.getDirections({'geojson': geojson, 
              'post': post,
              'routeData': response.data})
          }
        }).catch(function(err){
          vue.routeInfo.title = err.response.data.message;
        });
      }
    },
    mapRoute: function(data, post) {
      var latlngs = data.routes.slice(-1).map(element => element['geometry']);
      var geojson = L.geoJSON(latlngs).addTo(this.map);
      this.updateGeoJson(geojson, 'red');
      if (Number.isInteger(post['index'])){
        this.$set(this.mapMarkers[post['index']], 'geojson', geojson);
      } else {
        return geojson;
      }
    },
    buildPage: function() {
      var path = this.$route.path == '/' ? this.homePage : this.$route.path;
      path = this.cleanHash(path);
      this.showRoute = false;
      this.searchview = false;
      var matchingpage = this.sitePages.filter(element => this.cleanHash(element['hash']) == path);
      if (matchingpage.length > 0){
        this.searchview = matchingpage[0].type == 'search' ? true : false;
        this.buildMapView(matchingpage[0])
      } else {
        var posts = this.mapMarkers.filter(element => this.cleanHash(element['post']['hash']) == path);
        if (posts.length > 0){
          var markers = posts.map(post => post['marker'])
          this.buildMapView(posts[0]['post'], markers)
        } else {
          this.buildMapView({'url': baseurl + this.$route.fullPath})
        }
      }
    },
    cleanHash: function(hash) {
      return hash.replace(/^\/+|\/+$/g, '');
    },
    createMap: function() {
      this.map = L.map('map' , {scrollWheelZoom: false}).setView([0, 0], 1);
      L.tileLayer(mapView.mapData['map-tileset'], {
        "attribution" : mapView.mapData['map-credits'],
        "minZoom" : mapView.mapData['minZoom'],
        "maxZoom" : mapView.mapData['maxZoom'],
        "errorTileUrl" : "img/error-tile-image.png",
        "subdomains" : ["a", "b", "c", "d"],
        "detectRetina" : true,
      }).addTo(this.map);
      this.createMarkers();
      this.addMarkers();
      var setview = mapView.mapData.setView.split(',');
      setview = setview.map(element => parseFloat(element.replace(/[^0-9.-]/g,'')));
      this.map.setView([setview[0], setview[1]], setview[2]);
    },
    lightBox: function() {
      var images = document.getElementsByClassName("image");
      var caption = document.getElementsByClassName("caption");
      for (var i = 0; i < images.length; i++) {
          var image = images[i].querySelector('img');
          var link = image.src;
          images[i].innerHTML = "<a href='" + link + "' data-lightbox=' ' data-title='" + caption[i].innerHTML  + "'>" + image.outerHTML + "</a>";
      }

      lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true
       })
    },
    addMarkers: function() {
      var groupedMarkers = _.groupBy(this.mapMarkers, function(b) { return b.group});
      var overLayers = [];
      if (this.layerControl) {
        this.layerControl.remove(this.map);
      }
      this.map.eachLayer((existinglayer) => {
        if (this.removeMarkers.indexOf(existinglayer['_leaflet_id']) > -1){
          existinglayer.remove();
        }
      });
      this.removeMarkers = [];
      this.layerControl = L.control.layers(null, null, { collapsed: true, position: 'topleft' });  
      this.markers = this.getMarkers();        
      for (var key in groupedMarkers){
        var markers = groupedMarkers[key].map(element => element['marker']);
        var image = [...new Set(markers.map(element=>element.legendIcon))]
        image = `<div style="width: ${100/image.length}%">${image.join("")}</div>`;
        if (this.markergrouping == 'grouped') {
          var group = L.featureGroup.subGroup(this.markers, markers);
          this.removeMarkers.push(group['_leaflet_id']);
          this.map.addLayer(this.markers);
          var name = `${image} ${key}`;
          overLayers.push({"name":key, "layer":group})
          this.layerControl.addOverlay(group, name);
          this.layerControl.addTo(this.map);
          group.addTo(this.map)
        } else if (this.markergrouping == 'single') {
          overLayers.push({"name":key, icon: image, active: true, "layer": L.layerGroup(markers)})
          this.removeMarkers = this.removeMarkers.concat(markers.map(element => element['_leaflet_id']))
       }
        
      }
      if (this.markergrouping == 'single') {
        this.layerControl = new L.Control.PanelLayers(null, overLayers, {
          compact: true,
          collapsed: true,
          position: 'topleft'
        });
        this.map.addControl(this.layerControl);
      } else {
        this.layerControl.addTo(this.map);
      }
    },
    createMarkers: function() {
      this.mapMarkers = [];
      let orderlist = _.groupBy(this.postData, function(b) { return b.order});
      let categories = [...new Set(this.postData.map(pd => pd.categories))];
      for (var i=0; i<this.postData.length; i++){
        const post = JSON.parse(JSON.stringify(this.postData[i], this.replaceNull));
        var icon = post.leafleticon;
        const iconindex = categories.indexOf(post.categories);
        var counter = iconindex >= icons.length ? 0 : iconindex;
        var iconurl = icon ? icon : baseurl + icons[iconindex];
        var order = post.order ? parseInt(post.order) : '';
        var mbox = new L.DivIcon({
          html: `<img alt="${post.title} icon" class="my-div-image ${post.categories}" src="${iconurl}"/>
                <span class="ordernumber">${order}</span>`,
          className: 'my-div-icon',
          iconSize : [30, 50],
          popupAnchor : [-1, 5],
        });
        
        var marker = L.marker([post.lat, post.lng], {
          icon: mbox,
        }).bindPopup(`<strong>${post.title}</strong><br>${post.desc}`, {offset:new L.Point(0,-30)});
        marker.iconURL = `<span class="referenceIcons" style="position:relative">${mbox.options.html}</span>`;
        marker.legendIcon = `<img class="my-div-image" alt="${post.categories} icon" src="${iconurl}"/>`
        var vue = this;
        marker.on('click', function(){
          vue.buildMapView(post, [this]);
        });
        post['next'] = orderlist[order+1];
        post['prev'] = orderlist[order-1]; 
        post['index'] = i;
        this.getRouteData(post);
        this.mapMarkers.push({'post': post, 'marker': marker, 'group': post.categories }) 
      }
    },
    replaceNull: function(i, val) {
      if ( val === null ) { 
        return ""; // change null to empty string
      } else {
        return val; // return unchanged
      }
    },
    buildMapView: function(post, marker=false) {
      if (this.$route.path != post.hash){
        this.$router.push(post.hash);
      }
      const sidebar = JSON.parse(JSON.stringify(post));
      sidebar['markers'] = marker;
      sidebar['next'] = post.next ? post.next[0] : post.next;
      sidebar['prev'] = post.prev ? post.prev[0] : post.prev;
      if (post.html){
        var unescapedHTML = document.createElement('div')
        unescapedHTML.innerHTML = unescape(post.html);
        sidebar['content']= unescapedHTML.textContent;
        this.javaScriptInserts(unescapedHTML);
        this.sidebar = sidebar;
      } else {
        axios.get(post.url).then((response) => {
          var unescapedHTML = document.createElement('div')
          unescapedHTML.innerHTML = response.data;
          this.javaScriptInserts(unescapedHTML);
          sidebar['content']= response.data;
          this.sidebar = sidebar;
        })
      }
      document.getElementsByClassName('sidebar')[0].scrollTop = 0;
      if (marker && marker.length > 0) {
        this.goToMarker(marker[0])
      }
    },
    javaScriptInserts: function(returnedHTML) {
      var scripts = returnedHTML.getElementsByTagName('script');
      for (var sc=0; sc<scripts.length; sc++){
        let scriptEl = document.createElement('script');
        for (var at=0; at<scripts[sc].attributes.length; at++){
          const attribute = scripts[sc].attributes[at];
          scriptEl.setAttribute(attribute.name, attribute.value)
        }
        scriptEl.innerHTML = scripts[sc].innerHTML;
        document.getElementById('scriptholder').appendChild(scriptEl);
      }
    },
    goToMarker: function(marker) {
      try {
        this.markers.zoomToShowLayer(marker, function () {
          marker.openPopup();
        });
      } catch(err) {
        var latLngs = [ marker.getLatLng() ];
        var markerBounds = L.latLngBounds(latLngs);
        this.map.fitBounds(markerBounds);
        marker.openPopup();
      }
    },
    getMarkers: function() {
      if (this.markergrouping == 'grouped') { 
        return new L.markerClusterGroup({showCoverageOnHover: false});
      } else if (this.markergrouping == 'single') {
        return new L.featureGroup();
      }
    }
  },
})


const routes = [
  { path: '**', component: mapview }
]

const router = new VueRouter({
  routes // short for `routes: routes`
})
var app = new Vue({
  router,
  el: '#app'
})
