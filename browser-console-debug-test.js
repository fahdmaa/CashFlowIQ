// BROWSER CONSOLE DEBUG TEST SCRIPT
// Paste this into your browser's developer console while on the CashFlowIQ app
// This will help identify exactly where the RLS error is occurring

console.log('🔍 Starting CashFlowIQ Profile Picture Debug Test...');

// Test 1: Check if user is authenticated
async function testAuthentication() {
  console.log('\n=== TEST 1: Authentication Status ===');
  
  // Import supabase from your app (adjust path if needed)
  const { supabase } = await import('/src/lib/supabase-auth.js');
  
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session check:', {
      hasSession: !!session,
      sessionError: sessionError,
      userId: session?.user?.id || 'No user ID',
      email: session?.user?.email || 'No email',
      accessToken: session?.access_token ? 'Present' : 'Missing'
    });
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User check:', {
      hasUser: !!user,
      userId: user?.id || 'No user ID',
      userError: userError?.message || 'No error'
    });
    
    return { session, user, authenticated: !!(session && user) };
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    return { authenticated: false, error };
  }
}

// Test 2: Check user profile in database
async function testUserProfile(userId) {
  console.log('\n=== TEST 2: User Profile Database Check ===');
  
  const { supabase } = await import('/src/lib/supabase-auth.js');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('Profile query result:', {
      success: !error,
      data: data,
      error: error?.message || 'No error'
    });
    
    return { data, error };
  } catch (error) {
    console.error('❌ Profile check failed:', error);
    return { error };
  }
}

// Test 3: Test manual profile update
async function testProfileUpdate(userId) {
  console.log('\n=== TEST 3: Manual Profile Update Test ===');
  
  const { supabase } = await import('/src/lib/supabase-auth.js');
  const testUrl = `https://test-${Date.now()}.jpg`;
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ profile_picture_url: testUrl })
      .eq('id', userId)
      .select()
      .single();
    
    console.log('Profile update test result:', {
      success: !error,
      data: data,
      error: error?.message || 'No error',
      testUrl: testUrl
    });
    
    if (error) {
      console.error('❌ Profile update failed - this is likely the RLS issue!');
      console.error('Full error:', error);
      
      if (error.message?.includes('row level security') || 
          error.message?.includes('policy') || 
          error.message?.includes('RLS')) {
        console.error('🎯 CONFIRMED: This is a Row Level Security policy error in user_profiles table');
      }
    } else {
      console.log('✅ Profile update succeeded - RLS is working for database updates');
    }
    
    return { data, error };
  } catch (error) {
    console.error('❌ Profile update test failed:', error);
    return { error };
  }
}

// Test 4: Test storage bucket access
async function testStorageBucket(userId) {
  console.log('\n=== TEST 4: Storage Bucket Access Test ===');
  
  const { supabase } = await import('/src/lib/supabase-auth.js');
  
  try {
    // Test bucket exists and is accessible
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Storage buckets:', {
      success: !bucketsError,
      buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
      error: bucketsError?.message || 'No error'
    });
    
    // Test creating a fake file upload
    const testFileName = `${userId}/test-${Date.now()}.txt`;
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatar-pictures')
      .upload(testFileName, testFile);
    
    console.log('Test file upload result:', {
      success: !uploadError,
      uploadData: uploadData,
      error: uploadError?.message || 'No error',
      fileName: testFileName
    });
    
    if (uploadError) {
      console.error('❌ Storage upload failed - this is likely a storage RLS issue!');
      console.error('Full error:', uploadError);
      
      if (uploadError.message?.includes('row level security') || 
          uploadError.message?.includes('policy') || 
          uploadError.message?.includes('RLS')) {
        console.error('🎯 CONFIRMED: This is a Row Level Security policy error in storage');
      }
    } else {
      console.log('✅ Storage upload succeeded - cleaning up test file...');
      
      // Clean up test file
      await supabase.storage.from('avatar-pictures').remove([testFileName]);
    }
    
    return { uploadData, uploadError };
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return { error };
  }
}

// Test 5: Test image file upload (the actual scenario)
async function testImageUpload(userId) {
  console.log('\n=== TEST 5: Image Upload Test ===');
  
  // Create a small test image blob
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(0, 0, 100, 100);
  
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      const testFile = new File([blob], 'test-avatar.png', { type: 'image/png' });
      const testFileName = `${userId}/test-avatar-${Date.now()}.png`;
      
      const { supabase } = await import('/src/lib/supabase-auth.js');
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatar-pictures')
          .upload(testFileName, testFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        console.log('Image upload test result:', {
          success: !uploadError,
          uploadData: uploadData,
          error: uploadError?.message || 'No error',
          fileName: testFileName,
          fileSize: testFile.size,
          fileType: testFile.type
        });
        
        if (uploadError) {
          console.error('❌ Image upload failed');
          console.error('Full error:', uploadError);
        } else {
          console.log('✅ Image upload succeeded - cleaning up...');
          await supabase.storage.from('avatar-pictures').remove([testFileName]);
        }
        
        resolve({ uploadData, uploadError });
      } catch (error) {
        console.error('❌ Image upload test failed:', error);
        resolve({ error });
      }
    }, 'image/png');
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Running all debug tests...\n');
  
  try {
    const authResult = await testAuthentication();
    
    if (!authResult.authenticated) {
      console.error('❌ User not authenticated - cannot continue with tests');
      return;
    }
    
    const userId = authResult.user.id;
    console.log(`\n📋 Running tests for user ID: ${userId}\n`);
    
    await testUserProfile(userId);
    await testProfileUpdate(userId);
    await testStorageBucket(userId);
    await testImageUpload(userId);
    
    console.log('\n🏁 All tests completed! Check the results above to identify the RLS issue.');
    console.log('💡 Look for messages starting with "🎯 CONFIRMED" to see where the error occurs.');
    
  } catch (error) {
    console.error('❌ Test runner failed:', error);
  }
}

// Export for manual testing
window.debugProfilePicture = {
  runAllTests,
  testAuthentication,
  testUserProfile,
  testProfileUpdate,
  testStorageBucket,
  testImageUpload
};

console.log('✅ Debug functions loaded! Run debugProfilePicture.runAllTests() to start, or individual tests.');
console.log('Available functions:', Object.keys(window.debugProfilePicture));

// Auto-run all tests if desired
// Uncomment the next line to auto-run:
// runAllTests();