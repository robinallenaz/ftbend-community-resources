// Simple test script for location functionality
// Run this in browser console to test geolocation features

console.log('🧪 Testing Location Features...');

// Test 1: Check if geolocation is available
function testGeolocationSupport() {
  console.log('📍 Test 1: Geolocation Support');
  const supported = 'geolocation' in navigator;
  console.log(`Geolocation supported: ${supported}`);
  
  if (!supported) {
    console.warn('❌ Geolocation not supported in this browser');
    return false;
  }
  
  console.log('✅ Geolocation is supported');
  return true;
}

// Test 2: Test location permission
async function testLocationPermission() {
  console.log('\n🔐 Test 2: Location Permission');
  
  if (!navigator.permissions) {
    console.log('⚠️ Permissions API not available, will prompt on use');
    return 'prompt';
  }
  
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    console.log(`Location permission status: ${permission.state}`);
    return permission.state;
  } catch (error) {
    console.warn('⚠️ Could not check location permission:', error);
    return 'prompt';
  }
}

// Test 3: Test getting current location
function testGetCurrentLocation() {
  console.log('\n🌍 Test 3: Get Current Location');
  
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not available');
      resolve(null);
      return;
    }

    const startTime = Date.now();
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          duration: duration
        };
        
        console.log('✅ Location obtained successfully:');
        console.log(`   Latitude: ${location.latitude}`);
        console.log(`   Longitude: ${location.longitude}`);
        console.log(`   Accuracy: ${location.accuracy} meters`);
        console.log(`   Duration: ${location.duration}ms`);
        
        resolve(location);
      },
      (error) => {
        console.error('❌ Location error:', error.message);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Error message: ${error.message}`);
        
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
}

// Test 4: Test distance calculation
function testDistanceCalculation() {
  console.log('\n📏 Test 4: Distance Calculation');
  
  // Test coordinates (Fort Bend County area)
  const point1 = { latitude: 29.5656, longitude: -95.6572 }; // Fort Bend
  const point2 = { latitude: 29.7604, longitude: -95.3698 }; // Houston
  
  function calculateDistance(coord1, coord2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(coord2.latitude - coord1.latitude);
    const dLon = toRadians(coord2.longitude - coord1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(coord1.latitude)) *
        Math.cos(toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  const distance = calculateDistance(point1, point2);
  console.log(`✅ Distance between Fort Bend and Houston: ${distance.toFixed(2)} miles`);
  
  return distance;
}

// Test 5: Test click-to-call functionality
function testClickToCall() {
  console.log('\n📞 Test 5: Click-to-Call Functionality');
  
  // Create a test phone link
  const phoneNumber = '281-555-0123';
  const telLink = `tel:${phoneNumber}`;
  
  console.log(`✅ Generated tel link: ${telLink}`);
  console.log(`   Phone number: ${phoneNumber}`);
  console.log(`   Link format: tel:${phoneNumber}`);
  
  // Test if link is valid
  const linkElement = document.createElement('a');
  linkElement.href = telLink;
  
  if (linkElement.protocol === 'tel:') {
    console.log('✅ Tel link protocol is valid');
    return true;
  } else {
    console.error('❌ Invalid tel link protocol');
    return false;
  }
}

// Test 6: Test mobile detection
function testMobileDetection() {
  console.log('\n📱 Test 6: Mobile Detection');
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  console.log(`User agent: ${navigator.userAgent}`);
  console.log(`Is mobile device: ${isMobile}`);
  console.log(`Has touch support: ${isTouchDevice}`);
  console.log(`Screen width: ${window.screen.width}`);
  console.log(`Screen height: ${window.screen.height}`);
  
  return { isMobile, isTouchDevice };
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Location Feature Tests\n');
  
  const results = {
    geolocationSupported: testGeolocationSupport(),
    locationPermission: await testLocationPermission(),
    currentLocation: await testGetCurrentLocation(),
    distanceCalculation: testDistanceCalculation(),
    clickToCall: testClickToCall(),
    mobileDetection: testMobileDetection()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, result]) => {
    if (typeof result === 'object' && result !== null) {
      console.log(`${test}: ✅ Passed`);
      Object.entries(result).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    } else if (result) {
      console.log(`${test}: ✅ Passed`);
    } else {
      console.log(`${test}: ❌ Failed or null`);
    }
  });
  
  console.log('\n🎉 Testing complete!');
  console.log('\n💡 Tips for manual testing:');
  console.log('1. Test the "Find Resources Near Me" button');
  console.log('2. Check distance display on resource cards');
  console.log('3. Test click-to-call on mobile devices');
  console.log('4. Verify error handling when location is denied');
  console.log('5. Test responsive design on different screen sizes');
  
  return results;
}

// Export for use in browser console
window.testLocationFeatures = runAllTests;
console.log('🔧 Run tests with: testLocationFeatures()');
