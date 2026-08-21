import requests

def test_google_redirect():
    url = "https://www.naripehnawa.com:7100/auth/google/login"
    try:
        # Send GET request and do not follow redirect to inspect the Location header
        res = requests.get(url, verify=False, allow_redirects=False)
        print(f"HTTP Status Code: {res.status_code}")
        
        if res.status_code in [302, 307]:
            location = res.headers.get("Location", "")
            print("Successfully Redirected to Google Consent Screen!")
            print(f"Redirect URL: {location}")
            
            # Verify parameters
            if "client_id=" in location and "redirect_uri=" in location:
                print("PASSED: Client ID and Redirect URI are successfully embedded in OAuth parameters!")
            else:
                print("FAILED: Missing OAuth query parameters in redirect location.")
        else:
            print(f"FAILED: Expected redirect status code (302/307), got {res.status_code}")
            print(f"Response Content: {res.text}")
    except Exception as e:
        print(f"FAILED: Connection error - {e}")

if __name__ == "__main__":
    test_google_redirect()
