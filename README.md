# Salon-Api

## To use PayMaya Sandbox E-Wallet:

1. Go to https://developers.maya.ph/reference/sandbox-credentials-and-cards and choose your public and private api keys
2. Insert it in the .env file
   - `PAYMAYA_PUBLIC_API_KEY=your_public_api_key`
   - `PAYMAYA_PRIVATE_API_KEY=your_private_api_key`
3. Create a Paymaya Link using your prefered API clients
   - `POST your_url/v1/maya`
   - `Content-Type: application/json`
4. Input what price you want to pay
   - `{"price": "1000"}`
5. Click the link from the API client response

   - `{"checkoutId": "your_checkoutId","redirectUrl": "https://payments-web-sandbox.paymaya.com/v2/checkout?id=your_checkoutId"}`

6. Choose E-Wallet and input your PayMaya account details which is:

   - `Username: 09193890579`
   - `Password: Password@1`
   - `OTP: 123456`
