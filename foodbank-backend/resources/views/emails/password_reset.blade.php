<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
  <div style="max-width: 480px; margin: auto; background: white; border-radius: 12px; padding: 32px; text-align: center;">
    <h2 style="color: #2e7d32;">Password Reset Code</h2>
    <p style="color: #555;">Hello, <strong>{{ $userName }}</strong>!</p>
    <p style="color: #555;">Use the code below to reset your password. This code expires in <strong>10 minutes</strong>.</p>
    <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2e7d32; margin: 24px 0;">
      {{ $otp }}
    </div>
    <p style="color: #999; font-size: 13px;">If you did not request a password reset, you can safely ignore this email.</p>
  </div>
</body>
</html>