// Initialize variables
let cameraStream = null;
let currentCamera = 'environment';
let map;
let currentLocation = null;
let photoData = [];

// DOM Elements
const cameraView = document.getElementById('camera-view');
const photoCanvas = document.getElementById('photo-canvas');
const photoResult = document.getElementById('photo-result');
const captureBtn = document.getElementById('capture-btn');
const uploadBtn = document.getElementById('upload-btn');
const toggleCameraBtn = document.getElementById('toggle-camera');
const saveBtn = document.getElementById('save-btn');
const overlayText = document.getElementById('overlay-text');

// Initialize the application
async function initApp() {
    await initCamera();
    initMap();
    startLocationTracking();
    
    // Set up event listeners
    captureBtn.addEventListener('click', capturePhoto);
    uploadBtn.addEventListener('click', uploadPhoto);
    toggleCameraBtn.addEventListener('click', toggleCamera);
    saveBtn.addEventListener('click', savePhoto);
}

// Initialize camera
async function initCamera() {
    try {
        const constraints = {
            video: {
                facingMode: currentCamera,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraView.srcObject = cameraStream;
    } catch (err) {
        console.error("Camera error: ", err);
        alert("Could not access the camera. Please check permissions.");
    }
}

// Initialize map
function initMap() {
    map = L.map('map-container').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Start tracking location
function startLocationTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            position => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date(position.timestamp)
                };
                
                updateLocationOverlay();
                updateMap();
            },
            error => {
                console.error("Geolocation error: ", error);
                overlayText.textContent = "Location: Not available";
            },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
    } else {
        overlayText.textContent = "Geolocation is not supported by this browser.";
    }
}

// Update location text overlay
function updateLocationOverlay() {
    if (currentLocation) {
        overlayText.innerHTML = `
            Lat: ${currentLocation.lat.toFixed(6)}<br>
            Lng: ${currentLocation.lng.toFixed(6)}<br>
            Accuracy: ${currentLocation.accuracy.toFixed(0)} meters<br>
            ${currentLocation.timestamp.toLocaleTimeString()}
        `;
    }
}

// Update map position
function updateMap() {
    if (currentLocation && map) {
        map.setView([currentLocation.lat, currentLocation.lng], 15);
        
        // Clear previous markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        
        // Add new marker
        L.marker([currentLocation.lat, currentLocation.lng]).addTo(map)
            .bindPopup("Photo Location");
    }
}

// Capture photo from camera
function capturePhoto() {
    if (!cameraStream) return;
    
    const context = photoCanvas.getContext('2d');
    photoCanvas.width = cameraView.videoWidth;
    photoCanvas.height = cameraView.videoHeight;
    
    // Draw camera view to canvas
    context.drawImage(cameraView, 0, 0, photoCanvas.width, photoCanvas.height);
    
    // Display the captured photo
    photoResult.src = photoCanvas.toDataURL('image/jpeg');
    photoResult.style.display = 'block';
    cameraView.style.display = 'none';
    
    // Store photo data
    photoData.push({
        imageData: photoCanvas.toDataURL('image/jpeg'),
        location: currentLocation,
        timestamp: new Date()
    });
}

// Upload existing photo
function uploadPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = event => {
                photoResult.src = event.target.result;
                photoResult.style.display = 'block';
                cameraView.style.display = 'none';
                
                // Store photo data
                photoData.push({
                    imageData: event.target.result,
                    location: currentLocation,
                    timestamp: new Date()
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Toggle between front and back camera
async function toggleCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    await initCamera();
    
    if (photoResult.style.display === 'block') {
        photoResult.style.display = 'none';
        cameraView.style.display = 'block';
    }
}

// Save photo with geotag
function savePhoto() {
    if (photoData.length === 0) return;
    
    const latestPhoto = photoData[photoData.length - 1];
    const link = document.createElement('a');
    link.download = `geo_photo_${new Date().getTime()}.jpg`;
    link.href = latestPhoto.imageData;
    link.click();
    
    alert('Photo saved with geotag information!');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);