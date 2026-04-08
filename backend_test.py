import requests
import sys
import os
from datetime import datetime
import json

class LegalDocumentAPITester:
    def __init__(self, base_url="https://clause-analyzer-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, files=None, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    # For multipart form data with files and additional data
                    response = requests.post(url, files=files, data=data, timeout=60)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:500]}")

            self.test_results.append({
                "name": name,
                "success": success,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "response_preview": response.text[:200] if not success else "Success"
            })

            return success, response.json() if success and response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200
        )

    def test_analyze_endpoint_no_file(self):
        """Test analyze endpoint without file (should fail)"""
        return self.run_test(
            "Analyze Endpoint - No File",
            "POST",
            "api/analyze",
            422  # Unprocessable Entity for missing file
        )

    def test_analyze_endpoint_with_sample_pdf(self, user_type="student"):
        """Test analyze endpoint with a sample PDF and user_type"""
        # Create a simple test PDF content (this is a minimal PDF structure)
        pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(This is a test legal document with payment terms, liability clauses, termination conditions, and penalty fees.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF"""

        files = {'file': ('test_legal_doc.pdf', pdf_content, 'application/pdf')}
        data = {'user_type': user_type}
        
        return self.run_test(
            f"Analyze Endpoint - With PDF ({user_type})",
            "POST",
            "api/analyze",
            200,
            files=files,
            data=data
        )

    def test_analyze_endpoint_missing_user_type(self):
        """Test analyze endpoint without user_type parameter"""
        pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF"""

        files = {'file': ('test_legal_doc.pdf', pdf_content, 'application/pdf')}
        
        return self.run_test(
            "Analyze Endpoint - Missing user_type",
            "POST",
            "api/analyze",
            422,  # Should fail without user_type
            files=files
        )

    def test_download_endpoint_invalid_id(self):
        """Test download endpoint with invalid file ID"""
        return self.run_test(
            "Download Endpoint - Invalid ID",
            "GET",
            "api/download/invalid-file-id",
            404
        )

def main():
    print("🚀 Starting Legal Document API Tests...")
    print("=" * 50)
    
    # Setup
    tester = LegalDocumentAPITester()

    # Run tests
    print("\n📋 Running API Tests:")
    
    # Test 1: Root endpoint
    tester.test_root_endpoint()
    
    # Test 2: Analyze without file
    tester.test_analyze_endpoint_no_file()
    
    # Test 3: Analyze without user_type
    tester.test_analyze_endpoint_missing_user_type()
    
    # Test 4: Analyze with sample PDF for different user types
    user_types = ["student", "employee", "freelancer", "tenant"]
    file_ids = []
    
    for user_type in user_types:
        success, response = tester.test_analyze_endpoint_with_sample_pdf(user_type)
        if success and isinstance(response, dict):
            # Extract file ID from highlighted_file path
            highlighted_file = response.get('highlighted_file', '')
            if '/download/' in highlighted_file:
                file_id = highlighted_file.split('/download/')[-1]
                file_ids.append(file_id)
                print(f"📄 Extracted file ID for {user_type}: {file_id}")
                
                # Verify response structure for new features
                if 'graph_data' in response:
                    graph_data = response['graph_data']
                    nodes_count = len(graph_data.get('nodes', []))
                    edges_count = len(graph_data.get('edges', []))
                    print(f"📊 Graph data - Nodes: {nodes_count}, Edges: {edges_count}")
                else:
                    print("⚠️  Missing graph_data in response")
    
    # Test 5: Download with invalid ID
    tester.test_download_endpoint_invalid_id()
    
    # Test 6: Download with valid IDs (if we got any)
    for i, file_id in enumerate(file_ids[:2]):  # Test first 2 to avoid too many tests
        success, _ = tester.run_test(
            f"Download Endpoint - Valid ID ({user_types[i]})",
            "GET",
            f"api/download/{file_id}",
            200
        )

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())