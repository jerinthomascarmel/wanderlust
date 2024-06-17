
mapboxgl.accessToken = mapToken;
coordinates = coordinates;
const map = new mapboxgl.Map({
    container: 'map', // container ID
    center: coordinates, // starting position [lng, lat]
    zoom: 9 // starting zoom
});


const marker = new mapboxgl.Marker({ color: 'red' })
    .setPopup(new mapboxgl.Popup({ offset: 25 })
        .setHTML("<p>Exact location will be provided after booking</p>"))
    .setLngLat(coordinates)
    .addTo(map);

