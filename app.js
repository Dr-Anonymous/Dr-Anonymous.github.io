// Initialize variables
let cameraStream = null;
let currentCamera = 'environment';
let map;
let currentLocation = null;
let photoData = [];
let addressInfo = "Location not available";

// DOM Elements
const cameraView = document.getElementById('camera-view');
const photoCanvas = document.getElementById('photo-canvas');
const photoResult = document.getElementById('photo-result');
const captureBtn = document.getElementById('capture-btn');
const uploadBtn = document.getElementById('upload-btn');
const toggleCameraBtn = document.getElementById('toggle-camera');
const saveBtn = document.getElementById('save-btn');
const overlayContainer = document.getElementById('overlay-container');

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
            async position => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date(position.timestamp)
                };
                
                // Try to get address information
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}`);
                    const data = await response.json();
                    if (data.address) {
                        addressInfo = formatAddress(data);
                    }
                } catch (e) {
                    console.error("Geocoding error:", e);
                }
                
                updateLocationOverlay();
                updateMap();
            },
            error => {
                console.error("Geolocation error: ", error);
                overlayContainer.textContent = "Location: Not available";
            },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
    } else {
        overlayContainer.textContent = "Geolocation is not supported by this browser.";
    }
}

// Format address from Nominatim response
function formatAddress(data) {
    const addr = data.address;
    let parts = [];
    
    if (addr.road) parts.push(addr.road);
    if (addr.suburb) parts.push(addr.suburb);
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);
    
    return parts.join(", ");
}

// Update location text overlay
function updateLocationOverlay() {
    if (currentLocation) {
        const dateStr = currentLocation.timestamp.toLocaleString();
        overlayContainer.innerHTML = `
            <div style="font-weight:bold; margin-bottom:5px;">${addressInfo}</div>
            <div>Lat ${currentLocation.lat.toFixed(6)}° Long ${currentLocation.lng.toFixed(6)}°</div>
            <div>${dateStr}</div>
            <div>Accuracy: ${currentLocation.accuracy.toFixed(0)} meters</div>
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
    
    // Add overlay to the canvas
    addOverlayToCanvas(context);
    
    // Display the captured photo
    photoResult.src = photoCanvas.toDataURL('image/jpeg');
    photoResult.style.display = 'block';
    cameraView.style.display = 'none';
    
    // Store photo data
    photoData.push({
        imageData: photoCanvas.toDataURL('image/jpeg'),
        location: currentLocation,
        address: addressInfo,
        timestamp: new Date()
    });
}

// Add overlay information to the canvas
function addOverlayToCanvas(ctx) {
    if (!currentLocation) return;
    
    const canvas = ctx.canvas;
    const dateStr = new Date().toLocaleString();
    
    // Draw semi-transparent background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    const textHeight = 100;
    ctx.fillRect(0, canvas.height - textHeight, canvas.width, textHeight);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textBaseline = 'top';
    
    const lines = [
        addressInfo,
        `Lat ${currentLocation.lat.toFixed(6)}° Long ${currentLocation.lng.toFixed(6)}°`,
        dateStr,
        `Accuracy: ${currentLocation.accuracy.toFixed(0)} meters`
    ];
    
    let y = canvas.height - textHeight + 10;
    const lineHeight = 20;
    
    lines.forEach(line => {
        ctx.fillText(line, 10, y);
        y += lineHeight;
    });
}

// Upload existing photo
function uploadPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async event => {
                // Create image to get dimensions
                const img = new Image();
                img.onload = () => {
                    // Set canvas dimensions
                    photoCanvas.width = img.width;
                    photoCanvas.height = img.height;
                    
                    // Draw image to canvas
                    const ctx = photoCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    // Add overlay
                    addOverlayToCanvas(ctx);
                    
                    // Display the result
                    photoResult.src = photoCanvas.toDataURL('image/jpeg');
                    photoResult.style.display = 'block';
                    cameraView.style.display = 'none';
                    
                    // Store photo data
                    photoData.push({
                        imageData: photoCanvas.toDataURL('image/jpeg'),
                        location: currentLocation,
                        address: addressInfo,
                        timestamp: new Date()
                    });
                };
                img.src = event.target.result;
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
    
    // Create a filename with timestamp
    const dateStr = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .substring(0, 19);
    
    link.download = `geo_photo_${dateStr}.jpg`;
    link.href = latestPhoto.imageData;
    link.click();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
