import os
import sys

# Add server directory to path
sys.path.insert(0, "/www/wwwroot/nari_pehnawa/server")

from app.services.sms_service import send_otp_sms, get_wallet_balance

def main():
    print("=== Testing APITxT Service ===")
    
    # 1. Wallet Balance
    print("\n1. Checking wallet balance...")
    balance_res = get_wallet_balance()
    print("Balance result:", balance_res)
    
    # 2. Test OTP dispatch (test number)
    test_mobile = "9999999999"
    test_otp = "4521"
    print(f"\n2. Testing OTP dispatch to +91{test_mobile}...")
    otp_res = send_otp_sms(test_mobile, test_otp)
    print("OTP dispatch result:", otp_res)

if __name__ == "__main__":
    main()
