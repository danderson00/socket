function onMapLoaded() {
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const initialLocation = { lat: coords.latitude, lng: coords.longitude }
    const map = new google.maps.Map(document.getElementById("map"), { center: initialLocation, zoom: 15 })
    const markers = {}

    const host = await window.xsocket({ url: `ws://${window.location.hostname}:8081/` }) // use wss:// for hosted
      .useFeature('reestablishSessions')
      .connect()

    const locationStream = await host.locationStream()
    locationStream.subscribe(updateMarker)
    updateLocation(initialLocation)

    function updateLocation(location) {
      host.registerLocation(location)
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude: lat, longitude: lng } }) => updateLocation({ lat, lng })
      )
    }

    function updateMarker({ lat, lng, address }) {
      const marker = markers[address] = markers[address] || new google.maps.Marker({ title: address, map })
      marker.setPosition({ lat, lng })
    }
  })
}