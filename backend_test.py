import requests
import sys
import json
import os
from datetime import datetime
import base64

class LegalSageAPITester:
    def __init__(self, base_url="https://legal-clarity-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.user_id = None
        self.document_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })

    def test_signin(self):
        """Test user sign in"""
        try:
            response = requests.post(f"{self.api_url}/auth/signin", 
                json={"name": "Test User", "email": "test@example.com"})
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'name' in data and 'email' in data:
                    self.user_id = data['id']
                    self.log_test("Sign In", True)
                    return True
                else:
                    self.log_test("Sign In", False, "Missing required fields in response")
            else:
                self.log_test("Sign In", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Sign In", False, str(e))
        return False

    def test_survey(self):
        """Test survey submission with scoring (0-18 points)"""
        if not self.user_id:
            self.log_test("Survey", False, "No user_id available")
            return False
            
        try:
            # Test with score 8 (intermediate level)
            response = requests.post(f"{self.api_url}/survey", 
                json={"user_id": self.user_id, "score": 8, "user_level": "intermediate"})
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user_level') == 'intermediate':
                    self.log_test("Survey", True, f"User level: {data.get('user_level')}")
                    return True
                else:
                    self.log_test("Survey", False, "Success field not true or wrong user level")
            else:
                self.log_test("Survey", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Survey", False, str(e))
        return False

    def create_sample_pdf(self):
        """Create a simple PDF for testing"""
        try:
            import fitz  # PyMuPDF
            doc = fitz.open()
            page = doc.new_page()
            text = """EMPLOYMENT AGREEMENT

This Employment Agreement is entered into between Company ABC and Employee John Doe.

TERMS AND CONDITIONS:

1. EMPLOYMENT TERM: This agreement shall commence on January 1, 2024 and continue until terminated.

2. COMPENSATION: Employee shall receive a salary of $50,000 per year.

3. TERMINATION: Either party may terminate this agreement with 30 days written notice.

4. CONFIDENTIALITY: Employee agrees to maintain confidentiality of all company information.

5. LIABILITY: Company shall not be liable for any damages exceeding $1,000.

This agreement is governed by the laws of the State of California."""
            
            page.insert_text((50, 50), text, fontsize=12)
            pdf_bytes = doc.tobytes()
            doc.close()
            return pdf_bytes
        except Exception as e:
            print(f"Error creating PDF: {e}")
            return None

    def test_upload(self):
        """Test PDF upload and analysis"""
        if not self.user_id:
            self.log_test("Upload", False, "No user_id available")
            return False
            
        try:
            pdf_bytes = self.create_sample_pdf()
            if not pdf_bytes:
                self.log_test("Upload", False, "Could not create sample PDF")
                return False
            
            files = {'file': ('test_contract.pdf', pdf_bytes, 'application/pdf')}
            data = {'user_id': self.user_id, 'user_level': 'beginner'}
            
            response = requests.post(f"{self.api_url}/upload", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if 'document_id' in result and 'doc_type' in result and 'risk_score' in result:
                    self.document_id = result['document_id']
                    self.log_test("Upload", True, f"Doc type: {result['doc_type']}, Risk: {result['risk_score']}")
                    return True
                else:
                    self.log_test("Upload", False, "Missing required fields in response")
            else:
                self.log_test("Upload", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Upload", False, str(e))
        return False

    def test_get_document(self):
        """Test document retrieval"""
        if not self.document_id:
            self.log_test("Get Document", False, "No document_id available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/document/{self.document_id}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'filename', 'doc_type', 'simplified_text', 'clauses', 'risk_score']
                if all(field in data for field in required_fields):
                    self.log_test("Get Document", True, f"Clauses count: {len(data['clauses'])}")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Get Document", False, f"Missing fields: {missing}")
            else:
                self.log_test("Get Document", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get Document", False, str(e))
        return False

    def test_get_graph(self):
        """Test graph data retrieval"""
        if not self.document_id:
            self.log_test("Get Graph", False, "No document_id available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/graph/{self.document_id}")
            
            if response.status_code == 200:
                data = response.json()
                if 'nodes' in data and 'links' in data:
                    self.log_test("Get Graph", True, f"Nodes: {len(data['nodes'])}, Links: {len(data['links'])}")
                    return True
                else:
                    self.log_test("Get Graph", False, "Missing nodes or links in response")
            else:
                self.log_test("Get Graph", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get Graph", False, str(e))
        return False

    def test_chat(self):
        """Test chatbot functionality"""
        if not self.document_id:
            self.log_test("Chat", False, "No document_id available")
            return False
            
        try:
            response = requests.post(f"{self.api_url}/chat", 
                json={"document_id": self.document_id, "message": "What are the key terms in this contract?"})
            
            if response.status_code == 200:
                data = response.json()
                if 'response' in data and data['response']:
                    self.log_test("Chat", True, f"Response length: {len(data['response'])}")
                    return True
                else:
                    self.log_test("Chat", False, "Missing or empty response")
            else:
                self.log_test("Chat", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Chat", False, str(e))
        return False

    def test_consultation_booking(self):
        """Test consultation booking with top 2 risky clauses in email"""
        if not self.document_id:
            self.log_test("Consultation Booking", False, "No document_id available")
            return False
            
        try:
            response = requests.post(f"{self.api_url}/consultation/book", 
                json={
                    "document_id": self.document_id,
                    "user_name": "Test User",
                    "user_email": "test@example.com",
                    "preferred_time": "10:00 AM",
                    "message": "I have concerns about the liability clause"
                })
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'lawyer' in data:
                    self.log_test("Consultation Booking", True, f"Lawyer: {data['lawyer']['name']}")
                    return True
                else:
                    self.log_test("Consultation Booking", False, "Missing success or lawyer in response")
            else:
                self.log_test("Consultation Booking", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Consultation Booking", False, str(e))
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting Legal Sage API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 50)
        
        # Test sequence
        self.test_signin()
        self.test_survey()
        self.test_upload()
        self.test_get_document()
        self.test_get_graph()
        self.test_chat()
        self.test_consultation_booking()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            return 1

def main():
    tester = LegalSageAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())