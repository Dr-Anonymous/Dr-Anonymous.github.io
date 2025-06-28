// Initialize variables
let cameraStream = null;
let currentCamera = 'environment';
let thumbnailMap;
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
const overlayContainer = document.getElementById('overlay-container');
const addressText = document.getElementById('address-text');
const coordinatesText = document.getElementById('coordinates-text');
const timeText = document.getElementById('time-text');
const accuracyText = document.getElementById('accuracy-text');
const mapThumbnail = document.getElementById('map-thumbnail');
const savingIndicator = document.getElementById('saving-indicator');

// Initialize the application
async function initApp() {
    await initCamera();
    initThumbnailMap();
    startLocationTracking();
    
    // Set up event listeners
    captureBtn.addEventListener('click', captureAndSavePhoto);
    uploadBtn.addEventListener('click', uploadPhoto);
    toggleCameraBtn.addEventListener('click', toggleCamera);
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

// Initialize thumbnail map
function initThumbnailMap() {
    thumbnailMap = L.map(mapThumbnail, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        scrollWheelZoom: false,
        tap: false
    }).setView([0, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(thumbnailMap);
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
                updateThumbnailMap();
            },
            error => {
                console.error("Geolocation error: ", error);
                addressText.textContent = "Location: Not available";
            },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
    } else {
        addressText.textContent = "Geolocation is not supported";
    }
}

// Format address from Nominatim response
function formatAddress(data) {
    const addr = data.address;
    let parts = [];
    
    if (addr.house_number && addr.road) {
        parts.push(`${addr.house_number}, ${addr.road}`);
    } else if (addr.road) {
        parts.push(addr.road);
    }
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
        addressText.textContent = addressInfo;
        coordinatesText.textContent = `Lat ${currentLocation.lat.toFixed(6)}° Long ${currentLocation.lng.toFixed(6)}°`;
        timeText.textContent = dateStr;
        accuracyText.textContent = `Accuracy: ${currentLocation.accuracy.toFixed(0)} meters`;
    }
}

// Update thumbnail map position
function updateThumbnailMap() {
    if (currentLocation && thumbnailMap) {
        thumbnailMap.setView([currentLocation.lat, currentLocation.lng], 15);
        
        // Clear previous markers
        thumbnailMap.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                thumbnailMap.removeLayer(layer);
            }
        });
        
        // Add new marker
        L.marker([currentLocation.lat, currentLocation.lng], {
            icon: L.divIcon({
                className: 'map-marker',
                html: '📍',
                iconSize: [24, 24]
            })
        }).addTo(thumbnailMap);
    }
}

// Capture and save photo
async function captureAndSavePhoto() {
    if (!cameraStream) return;
    
    try {
        // Show saving indicator
        savingIndicator.style.display = 'block';
        
        const context = photoCanvas.getContext('2d');
        photoCanvas.width = cameraView.videoWidth;
        photoCanvas.height = cameraView.videoHeight;
        
        // Draw camera view to canvas
        context.drawImage(cameraView, 0, 0, photoCanvas.width, photoCanvas.height);
        
        // Add overlay to the canvas
        await addOverlayToCanvas(context);
        
        // Create filename with timestamp
        const dateStr = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .substring(0, 19);
        
        // Save the photo automatically
        const imageData = photoCanvas.toDataURL('image/jpeg');
        savePhotoToDevice(imageData, `geo_photo_${dateStr}.jpg`);
        
        // Store photo data
        photoData.push({
            imageData: imageData,
            location: currentLocation,
            address: addressInfo,
            timestamp: new Date()
        });
        
        // Briefly show the captured photo
        photoResult.src = imageData;
        photoResult.style.display = 'block';
        cameraView.style.display = 'none';
        
        // Hide after 1 second
        setTimeout(() => {
            photoResult.style.display = 'none';
            cameraView.style.display = 'block';
        }, 1000);
        
    } catch (error) {
        console.error("Error capturing/saving photo:", error);
        alert("Error saving photo. Please try again.");
    } finally {
        savingIndicator.style.display = 'none';
    }
}

// Add overlay information to the canvas
async function addOverlayToCanvas(ctx) {
    if (!currentLocation) return;
    
    const canvas = ctx.canvas;
    const dateStr = new Date().toLocaleString();
    
    // Draw semi-transparent background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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
    
    lines.forEach((line, i) => {
        if (i === 0) {
            ctx.font = 'bold 18px Arial';
        } else {
            ctx.font = '16px Arial';
        }
        ctx.fillText(line, 10, y);
        y += lineHeight;
    });
    
    // Draw map thumbnail if available
    if (thumbnailMap && currentLocation) {
        try {
            // Create a temporary canvas for the map
            const mapCanvas = document.createElement('canvas');
            mapCanvas.width = 120;
            mapCanvas.height = 80;
            
            // Use Leaflet's built-in method to render map to canvas
            await new Promise((resolve) => {
                // Force map redraw
                thumbnailMap.invalidateSize();
                
                // Small delay to ensure rendering completes
                setTimeout(() => {
                    // Get all map layers
                    const mapContainer = thumbnailMap.getContainer();
                    const mapLayers = mapContainer.querySelectorAll('canvas');
                    
                    // Draw each layer to our temporary canvas
                    const mapCtx = mapCanvas.getContext('2d');
                    mapLayers.forEach((layer, index) => {
                        // Clear background for first layer
                        if (index === 0) {
                            mapCtx.fillStyle = '#e0e0e0';
                            mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
                        }
                        mapCtx.drawImage(layer, 0, 0, mapCanvas.width, mapCanvas.height);
                    });
                    
                    // Add marker manually since it might not be in canvas
                    mapCtx.font = '20px Arial';
                    mapCtx.fillText('📍', 
                        (mapCanvas.width/2) - 10, 
                        (mapCanvas.height/2) - 10);
                    
                    // Draw the composed map to our main canvas
                    ctx.drawImage(mapCanvas, canvas.width - 130, 10, 120, 80);
                    
                    // Draw border around map
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(canvas.width - 130, 10, 120, 80);
                    
                    resolve();
                }, 200); // Increased delay to ensure rendering
            });
        } catch (error) {
            console.error("Error rendering map thumbnail:", error);
            // Fallback: Draw simple map placeholder
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(canvas.width - 130, 10, 120, 80);
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText('Map', canvas.width - 80, 50);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(canvas.width - 130, 10, 120, 80);
        }
    }
}

// Save photo to device
function savePhotoToDevice(dataUrl, fileName) {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    
                    // Save the photo automatically
                    const imageData = photoCanvas.toDataURL('image/jpeg');
                    savePhotoToDevice(imageData, `geo_upload_${new Date().getTime()}.jpg`);
                    
                    // Store photo data
                    photoData.push({
                        imageData: imageData,
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
