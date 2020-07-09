const searchview = Vue.component('searchview', {
  template: `
  <div>
  <input v-model="searchterm" v-on:change="searchIndex()"/>
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
    //this.buildIndex();
  },
  mounted() {   
    this.buildIndex();
  },
  methods: {
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
      <button v-if="sidebar.next" v-on:click="showRoute = !showRoute">
        <span v-if="showRoute">Hide</span><span v-else>Show</span> Directions to {{sidebar.next.title}}
      </button>
      <button v-on:click="locate()" v-if="sidebar.markers">
        Get directions from current location
      </button>
      <span v-if="routeInfo && showRoute">
        <div>~{{routeInfo.distance}} Miles, {{routeInfo.minutes}} minutes to {{sidebar.next.title}}</div>
        <div v-html="routeInfo.directions"></div>
      </span>
      <span v-else-if="showRoute">Directions are loading</span>
      <header class="defaultheader">
        <p class="post-header" v-if="sidebar.headertitle">{{sidebar.headertitle}}</p>
        <p class="post-header" v-else>{{siteTitle}}</p>
        <div>
          <router-link v-if="sidebar.prev" class="prev" :to="sidebar.prev.hash">
            <i class="fa fa-chevron-circle-left"></i> {{sidebar.prev.title}}
          </router-link>
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
        </h1>
      </header>
      <span v-html="sidebar.content"></span>
      <div id="scriptholder"></div>
      <searchview v-if="searchview"></searchview>
      </div>
  </div>
  <div id="map"></div>
  <div v-bind:class="menuType">
    <button v-bind:class="menuType" v-if="!menuShown" class="menu-button" v-on:click="menuShown = !menuShown;">
        <i class="fa fa-bars"></i>
      </button>
    <div v-bind:class="menuType + '-content'" class="sub-menu" >
      <span v-if="menuShown">
      <a v-on:click="menuShown = !menuShown">
        <i v-if="menuShown" class="fa fa-times close-btn"></i>
      </a>
      <a v-for="page in menuItems" v-on:click="updateHash(page)" class="menu-link">
        <span v-if="page.menutitle" v-html="page.menutitle"></span>
        <span v-else v-html="page.title"></span>
      </a>
      </span>
    </div>  
</div>
  <select id="choose" class="dropdown" v-model="markergrouping">
    <option value="grouped">Clustered</option>
    <option value="single">Not clustered</option>
  </select>

  </div>`,
  data: function() {
  	return {
      map: '',
      markergrouping: 'grouped',
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
      searchview: false
  	}
  },
  props: {
    sitedata: Object
  },
  components: {
    'searchview': searchview
  },
  watch: {
    markergrouping: function() {
      this.addMarkers();   
    },
    "$route.path": function(){
      this.buildPage();
    },
    "sidebar.content": async function(){
      await this.$nextTick();
      this.lightBox();
    },
    mapMarkers: function() {
      this.getDirections();
    },
    "sidebar.index": function() {
      this.getDirections();
    }
  },
  created() {   
  },
  mounted() {   
    this.cleanPostData();
    var hasTitles = this.sitePages.filter(element => element['order'])
    this.menuItems = _.sortBy(hasTitles,"order");
    this.createMap();
    this.buildPage();
    this.map.on('locationfound', this.onLocationFound);
    this.map.on('locationerror', this.onLocationError);
  },
  methods: {
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
    getDirections: function(maps=false) {
      var maps = maps ? maps : this.mapMarkers[this.sidebar.index];
      if (maps && maps['geojson'] && this.apiUrl){
        this.mapMarkers.map(element => element['geojson'] ? this.updateGeoJson(element['geojson'], 'red') : '')
        const routeData = maps['routeData'];
        this.updateGeoJson(maps['geojson'], 'blue');
        maps['geojson'].bringToFront();

        var sum = routeData.routes.reduce(function(a, b){
          return a + b['distance'];
        }, 0);
        var directions = ''
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
              directions += ` ${instruction} | ${(item.distance*0.000621371192).toFixed(2)} miles | ${(item.duration/60).toFixed(2)} minutes<br>`
           }
          }
        }
        const data = {'distance': (sum*0.000621371192).toFixed(2), 
        'minutes': ((sum/1.4)/60).toFixed(0), 'directions': directions}
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
    onLocationFound: function(e) {
      if (this.current.position) {
        this.map.removeLayer(this.current.position);
        this.map.removeLayer(this.current.accuracy);
      }

      var radius = e.accuracy / 2;

      this.current.position = L.marker(e.latlng).addTo(this.map)
      .bindPopup("You are within " + radius + " meters from this point").openPopup();
      var post = e.latlng;
      post['next'] = [this.sidebar['markers'][0]._latlng];
      this.getRouteData(post, true);
      this.current.accuracy = L.circle(e.latlng, radius).addTo(this.map);
    },
    onLocationError: function(e) {
      alert(e.message);
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
        axios.get(url).then((response) => {
          if (post['index']){
            this.$set(this.mapMarkers[post['index']], 'routeData', response.data);
          }
          var geojson = this.mapRoute(response.data, post);
          if(directions) {
            this.getDirections({'geojson': geojson, 'routeData': response.data})
          }
        })
      }
    },
    mapRoute: function(data, post) {
      var latlngs = data.routes.slice(-1).map(element => element['geometry']);
      var geojson = L.geoJSON(latlngs).addTo(this.map);
      this.updateGeoJson(geojson, 'red');
      if (post['index']){
        this.$set(this.mapMarkers[post['index']], 'geojson', geojson);
      } else {
        return geojson;
      }
    },
    buildPage: function() {
      var path = this.$route.path == '/' ? '/home/' : this.$route.path;
      path = this.cleanHash(path);
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
      this.map.setView(setView);
      this.map.fitBounds(this.markers.getBounds());
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
        if (existinglayer.iconURL || existinglayer['_layers']){
          existinglayer.remove();
        }
      });
      this.layerControl = L.control.layers(null, null, { collapsed: true, position: 'topleft' });  
      this.markers = this.getMarkers();        
      for (var key in groupedMarkers){
        var markers = groupedMarkers[key].map(element => element['marker']);
        var image = markers[0].legendIcon;
        if (this.markergrouping == 'grouped') {
          var group = L.featureGroup.subGroup(this.markers, markers);
          this.map.addLayer(this.markers);
          var name = `${image} ${key}`;
          overLayers.push({"name":key, "layer":group})
          this.layerControl.addOverlay(group, name);
          this.layerControl.addTo(this.map);
          group.addTo(this.map)
        } else if (this.markergrouping == 'single') {
         overLayers.push({"name":key, icon: image, active: true, "layer":L.layerGroup(markers)})
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
          html: `<img class="my-div-image" src="${iconurl}"/>
                <span class="ordernumber">${order}</span>`,
          className: 'my-div-icon',
          iconSize : [30, 50],
          popupAnchor : [-1, 5],
        });
        
        var marker = L.marker([post.lat, post.lng], {
          icon: mbox,
        }).bindPopup(`<strong>${post.title}</strong><br>${post.desc}`, {offset:new L.Point(0,-30)});
        marker.iconURL = `<span class="referenceIcons" style="position:relative">${mbox.options.html}</span>`;
        marker.legendIcon = `<img class="my-div-image" src="${iconurl}"/>`
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
      const next = post.next ? post.next[0] : post.next;
      const prev = post.prev ? post.prev[0] : post.prev;
      const sidebar = {'title': post.title, 
        'menutitle': post.menutitle, 'markers': marker, 'date': post.date, 
        'author': post.author, 'header': post.headertitle, 'next': next, 'prev': prev,
        'index': post.index };
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
