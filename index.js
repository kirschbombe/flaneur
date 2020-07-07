const mapview = Vue.component('mapview', {
  template: `
  <div>
  <div class="sidebar">
      <div id="sidebar-content">
      <header class="defaultheader">
        <p class="post-header" v-if="sidebar.headertitle">{{sidebar.headertitle}}</p>
        <p class="post-header" v-else>{{siteTitle}}</p>
        <router-link v-if="sidebar.prev" class="prev" :to="sidebar.prev.hash">
          <i class="fa fa-chevron-circle-left"></i> {{sidebar.prev.title}}
        </router-link>
        <router-link v-if="sidebar.next" class="next" :to="sidebar.next.hash">
          {{sidebar.next.title}} <i class="fa fa-chevron-circle-right"></i>
        </router-link>
        <h1 class="title" v-if="sidebar.title">{{sidebar.title}}
        <span v-if="sidebar.markers">
          <a v-for="marker in sidebar.markers"
            v-on:click="goToMarker(marker)" class="legend" 
            v-if="marker" v-html="marker.iconURL">
          </a>
        </span>
        </h1>
        <p class="byline">
        <span v-if="sidebar.author" class="author">{{sidebar.author}}</span>
        <span v-if="sidebar.author && sidebar.date">, </span>
        <span v-if="sidebar.date" class="date">{{sidebar.date}}</span>
        </p>
      </header>
      <div v-html="sidebar.content"></div>
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
      current: {'position': '', 'accuracy': ''}
  	}
  },
  props: {
    sitedata: Object
  },
  watch: {
    markergrouping: function() {
      this.addMarkers();
      
    },
    "$route.path": function(){
      this.buildPage();
    },
    sidebar: async function(){
      await this.$nextTick();
      this.lightBox();
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
    updateHash: function(page){
      this.$router.push(page.hash);
      this.menuShown = !this.menuShown;
    },
    locate: function(){
      this.map.locate({setView: true, maxZoom: 16});
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
    buildPage: function() {
      var path = this.$route.path == '/' ? '/home/' : this.$route.path;
      path = path.replace(/^\/+|\/+$/g, '');
      var matchingpage = this.sitePages.filter(element => element['hash'].replace(/^\/+|\/+$/g, '') == path);
      if (matchingpage.length > 0){
        this.buildMapView(matchingpage[0])
      } else {
        var posts = this.mapMarkers.filter(element => element['post']['hash'].replace(/^\/+|\/+$/g, '') == path);
        if (posts.length > 0){
          var markers = posts.map(post => post['marker'])
          this.buildMapView(posts[0]['post'], markers)
        } else {
          this.buildMapView({'url': baseurl + this.$route.fullPath})
        }
      }
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
      let categories = this.postData.map(pd => pd.categories);
      for (var i=0; i<this.postData.length; i++){
        const post = JSON.parse(JSON.stringify(this.postData[i]));
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
        }).bindPopup(`<strong>${post.title}</strong><br>${post.desc }`, {offset:new L.Point(0,-30)});
        marker.iconURL = `<span class="referenceIcons" style="position:relative">${mbox.options.html}</span>`;
        marker.legendIcon = `<img class="my-div-image" src="${iconurl}"/>`
        var vue = this;
        marker.on('click', function(){
          vue.buildMapView(post, [this]);
        });
        post['next'] = orderlist[order+1];
        post['prev'] = orderlist[order-1];
        this.mapMarkers.push({'post': post, 'marker': marker, 
          'group': post.categories })
      }
    },
    buildMapView: function(post, marker=false) {
      if (this.$route.path != post.hash){
        this.$router.push(post.hash);
      }
      axios.get(post.url).then((response) => {
        const next = post.next ? post.next[0] : post.next;
        const prev = post.prev ? post.prev[0] : post.prev;
        this.sidebar = {'content': response.data, 'title': post.title, 
          'menutitle': post.menutitle, 'markers': marker, 'date': post.date, 
          'author': post.author, 'header': post.headertitle, 'next': next, 'prev': prev };
        document.getElementsByClassName('sidebar')[0].scrollTop = 0;
        if (marker && marker.length > 0) {
          this.goToMarker(marker[0])
        }
      });
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
  { path: '/', component: mapview },
]

const router = new VueRouter({
  routes // short for `routes: routes`
})
var app = new Vue({
  router,
  el: '#app'
})
