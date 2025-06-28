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
    
    // Draw map thumbnail using static map image
    if (currentLocation) {
        try {
            const mapWidth = 120;
            const mapHeight = 80;
            const zoom = 15;
            
            // Create static map URL using OpenStreetMap tiles
            const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${currentLocation.lng},${currentLocation.lat})/${currentLocation.lng},${currentLocation.lat},${zoom}/${mapWidth}x${mapHeight}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;
            
            // Fallback to a different static map service if Mapbox doesn't work
            const fallbackMapUrl = `https://tile.openstreetmap.org/${zoom}/${Math.floor((currentLocation.lng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(currentLocation.lat * Math.PI / 180) + 1 / Math.cos(currentLocation.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png`;
            
            // Create and load map image
            const mapImage = new Image();
            mapImage.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                mapImage.onload = () => {
                    // Draw the map image
                    ctx.drawImage(mapImage, canvas.width - 130, 10, mapWidth, mapHeight);
                    
                    // Draw marker on top
                    ctx.font = '20px Arial';
                    ctx.fillStyle = '#ff0000';
                    ctx.fillText('📍', canvas.width - 130 + (mapWidth/2) - 10, 10 + (mapHeight/2) - 10);
                    
                    // Draw border around map
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(canvas.width - 130, 10, mapWidth, mapHeight);
                    
                    resolve();
                };
                
                mapImage.onerror = () => {
                    // Fallback: Draw a more detailed map placeholder
                    ctx.fillStyle = '#4a5568';
                    ctx.fillRect(canvas.width - 130, 10, mapWidth, mapHeight);
                    
                    // Draw grid pattern to simulate map
                    ctx.strokeStyle = '#718096';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < mapWidth; i += 20) {
                        ctx.beginPath();
                        ctx.moveTo(canvas.width - 130 + i, 10);
                        ctx.lineTo(canvas.width - 130 + i, 10 + mapHeight);
                        ctx.stroke();
                    }
                    for (let i = 0; i < mapHeight; i += 20) {
                        ctx.beginPath();
                        ctx.moveTo(canvas.width - 130, 10 + i);
                        ctx.lineTo(canvas.width - 130 + mapWidth, 10 + i);
                        ctx.stroke();
                    }
                    
                    // Draw location marker
                    ctx.fillStyle = '#ff0000';
                    ctx.font = '20px Arial';
                    ctx.fillText('📍', canvas.width - 130 + (mapWidth/2) - 10, 10 + (mapHeight/2) - 10);
                    
                    // Draw coordinates as fallback
                    ctx.fillStyle = 'white';
                    ctx.font = '10px Arial';
                    ctx.fillText(`${currentLocation.lat.toFixed(2)}, ${currentLocation.lng.toFixed(2)}`, 
                                canvas.width - 125, 25);
                    
                    // Draw border
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(canvas.width - 130, 10, mapWidth, mapHeight);
                    
                    resolve();
                };
                
                // Try to load the map image
                mapImage.src = mapUrl;
            });
            
        } catch (error) {
            console.error("Error rendering map thumbnail:", error);
            // Enhanced fallback
            drawMapFallback(ctx, canvas);
        }
    }
}

// Enhanced fallback map drawing function
function drawMapFallback(ctx, canvas) {
    const mapWidth = 120;
    const mapHeight = 80;
    const x = canvas.width - 130;
    const y = 10;
    
    // Draw background
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x, y, mapWidth, mapHeight);
    
    // Draw some roads/paths
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    
    // Horizontal roads
    ctx.beginPath();
    ctx.moveTo(x, y + 25);
    ctx.lineTo(x + mapWidth, y + 25);
    ctx.moveTo(x, y + 55);
    ctx.lineTo(x + mapWidth, y + 55);
    ctx.stroke();
    
    // Vertical roads
    ctx.beginPath();
    ctx.moveTo(x + 30, y);
    ctx.lineTo(x + 30, y + mapHeight);
    ctx.moveTo(x + 90, y);
    ctx.lineTo(x + 90, y + mapHeight);
    ctx.stroke();
    
    // Draw some building blocks
    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(x + 10, y + 10, 15, 10);
    ctx.fillRect(x + 45, y + 35, 20, 15);
    ctx.fillRect(x + 75, y + 15, 12, 8);
    ctx.fillRect(x + 35, y + 60, 18, 12);
    
    // Draw location marker
    ctx.fillStyle = '#e53e3e';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('📍', x + (mapWidth/2) - 12, y + (mapHeight/2) + 8);
    
    // Draw coordinates
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 9px Arial';
    ctx.fillText(`${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}`, 
                x + 5, y + mapHeight - 5);
    
    // Draw border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, mapWidth, mapHeight);
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
